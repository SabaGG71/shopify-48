import { createJobFromSession } from "@/lib/jobs"
import { reportSaveFailure } from "@/lib/notify"
import { isRebuildSession, verifyStripeSignature, type StripeCheckoutSession } from "@/lib/stripe"

/**
 * Stripe webhook. Subscribe to checkout.session.completed and
 * checkout.session.async_payment_succeeded. Signing secret in STRIPE_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return new Response("STRIPE_WEBHOOK_SECRET is not set", { status: 500 })

  const raw = await request.text()
  if (!verifyStripeSignature(raw, request.headers.get("stripe-signature"), secret)) {
    return new Response("Bad signature", { status: 400 })
  }

  const event = JSON.parse(raw) as { type: string; data: { object: StripeCheckoutSession } }
  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
    return Response.json({ received: true, ignored: event.type })
  }
  const session = event.data.object
  if (!isRebuildSession(session)) return Response.json({ received: true, ignored: "other payment link" })
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    return Response.json({ received: true, waiting: "payment not cleared yet" })
  }

  try {
    const { job, created } = await createJobFromSession(session)
    return Response.json({ received: true, job_id: job.id, created })
  } catch (err) {
    await reportSaveFailure("stripe payment", err, { session_id: session.id })
    // 500 makes Stripe retry, so the payment is not lost.
    return new Response("Could not record the payment", { status: 500 })
  }
}
