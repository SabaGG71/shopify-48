import type { Metadata } from "next"
import { Suspense } from "react"
import { PurchasePixel } from "@/components/site/purchase-pixel"
import { MessagePage } from "@/components/site/message-page"
import { ThemedButtonLink } from "@/components/site/themed-shell"
import { getRepo } from "@/lib/db/repo"
import { createJobFromSession } from "@/lib/jobs"
import { metaEventId } from "@/lib/meta"
import { reportSaveFailure } from "@/lib/notify"
import { isRebuildSession, retrieveCheckoutSession } from "@/lib/stripe"
import type { Job } from "@/lib/types"
import "@/app/(home)/demo.css"

export const metadata: Metadata = { title: "Slot reserved | LocalEyes", robots: { index: false, follow: false } }

/**
 * Stripe Payment Link "after payment" redirect:
 *   https://<site>/reserved?session_id={CHECKOUT_SESSION_ID}
 * Finds the job the webhook made, or makes it now if STRIPE_SECRET_KEY is set.
 */
async function Reserved({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams
  let job: Job | null = null
  if (sessionId && /^cs_(test|live)_\w+$/.test(sessionId)) {
    try {
      job = await (await getRepo()).getJobBySession(sessionId)
      if (!job) {
        const session = await retrieveCheckoutSession(sessionId)
        if (session && isRebuildSession(session) && (session.payment_status === "paid" || session.payment_status === "no_payment_required")) {
          job = (await createJobFromSession(session)).job
        }
      }
    } catch (err) {
      await reportSaveFailure("reserved page", err, { session_id: sessionId })
    }
  }

  if (!job) {
    return (
      <>
        <p>Your payment went through. We&apos;re setting up your intake now and will email you the link in a few minutes.</p>
        <p>If it hasn&apos;t arrived within the hour, reply to Kent&apos;s text or the payment receipt and we&apos;ll sort it out.</p>
      </>
    )
  }

  const value = job.payment?.amount_total != null ? job.payment.amount_total / 100 : undefined
  return (
    <>
      <PurchasePixel eventId={metaEventId.purchase(sessionId!)} value={value} currency={job.payment?.currency?.toUpperCase()} />
      <p>Payment received. Your build slot is held.</p>
      <p>
        Next is the intake: about 15 minutes, and it saves as you go. The 48 hours start once your intake, store access and payment are
        all in.
      </p>
      <div className="mt-4">
        <ThemedButtonLink theme="home" href={`/intake/${job.intake_token}`}>
          Start my intake
        </ThemedButtonLink>
      </div>
      <p className="text-[0.86rem]">We also emailed you this link, so you can finish on any device.</p>
    </>
  )
}

export default function ReservedPage(props: { searchParams: Promise<{ session_id?: string }> }) {
  return (
    <MessagePage theme="home" label="Slot reserved" title="You’re in. Let’s get your store moving.">
      <Suspense fallback={<p>Checking your payment…</p>}>
        <Reserved searchParams={props.searchParams} />
      </Suspense>
    </MessagePage>
  )
}
