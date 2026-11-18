import { createJobFromSession } from "@/lib/jobs"
import { currentApplication } from "@/lib/session"

/**
 * DEV ONLY. Pretends Stripe sent checkout.session.completed for this browser's
 * application, so the intake can be tested without a real payment.
 * Disabled in production unless ALLOW_TEST_TOOLS=1.
 */
export async function POST() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_TEST_TOOLS !== "1") {
    return new Response("Not found", { status: 404 })
  }
  const app = await currentApplication()
  if (!app) return Response.json({ ok: false, error: "No application cookie in this browser" }, { status: 400 })
  const { job, created } = await createJobFromSession({
    id: `cs_test_sim${Date.now()}`,
    object: "checkout.session",
    client_reference_id: app.id,
    customer_details: { email: app.email, name: app.name, phone: app.phone },
    customer_email: app.email,
    amount_total: null,
    currency: "usd",
    payment_status: "paid",
    payment_link: null,
    status: "complete",
  })
  return Response.json({ ok: true, created, job_id: job.id, intake: `/intake/${job.intake_token}` })
}
