import "server-only"
import { revalidateTag } from "next/cache"
import { getRepo } from "@/lib/db/repo"
import { metaEventId, sendMetaEvent } from "@/lib/meta"
import { notifyKent, sendEmail } from "@/lib/notify"
import { LOOK_DEFAULTS } from "@/lib/options"
import { newToken, siteUrl } from "@/lib/session"
import type { StripeCheckoutSession } from "@/lib/stripe"
import type { Application, Job } from "@/lib/types"
import { displayHost, formatPhoneForDisplay } from "@/lib/url"

export const intakeUrl = (job: Pick<Job, "intake_token">) => `${siteUrl()}/intake/${job.intake_token}`

const isUuid = (v: string | null | undefined) => !!v && /^[0-9a-f-]{36}$/i.test(v)

/** Answers we already have, so the intake opens prefilled and editable. */
async function prefillFrom(app: Application | null): Promise<Record<string, unknown>> {
  if (!app) return {}
  const repo = await getRepo()
  const hj = await repo.getHomepageJobByApplication(app.id)
  const look = hj?.style_pick ?? app.style_pick
  return {
    store_url: app.store_url,
    style_pick: look,
    ...(look ? LOOK_DEFAULTS[look] : {}),
    reference_stores: hj?.reference_stores ?? app.reference_stores ?? [],
    never_want: hj?.never_want ?? app.never_want ?? "",
    top_products: hj?.top_products ?? app.top_products ?? [],
    phone: app.phone ? formatPhoneForDisplay(app.phone) : "",
    phone_channel: app.phone_channel,
    approver_name: app.name ?? "",
    approver_email: app.email ?? "",
  }
}

/**
 * Payment cleared: create the job (once per Checkout Session), email the intake
 * link, alert Kent, send Purchase to Meta. Safe to call twice for the same session.
 */
export async function createJobFromSession(session: StripeCheckoutSession): Promise<{ job: Job; created: boolean }> {
  const repo = await getRepo()
  const existing = await repo.getJobBySession(session.id)
  if (existing) return { job: existing, created: false }

  const email = (session.customer_details?.email ?? session.customer_email ?? "").toLowerCase() || null
  let app: Application | null = null
  if (isUuid(session.client_reference_id)) app = await repo.getApplication(session.client_reference_id!)
  if (!app && email) app = await repo.findLatestApplicationByEmail(email)

  let job: Job
  try {
    job = await repo.insertJob({
      application_id: app?.id ?? null,
      intake_token: newToken(24),
      email: email ?? app?.email ?? null,
      name: session.customer_details?.name ?? app?.name ?? null,
      store_url: app?.store_url ?? null,
      status: "awaiting_intake",
      paid_at: new Date().toISOString(),
      stripe_session_id: session.id,
      payment: {
        provider: "stripe",
        session_id: session.id,
        amount_total: session.amount_total,
        currency: session.currency,
        email,
        payment_status: session.payment_status,
      },
      intake_step: 1,
      intake_draft: await prefillFrom(app),
      intake_submitted_at: null,
      access_confirmed: false,
      clock_started_at: null,
      doc: null,
    })
  } catch (err) {
    // Two deliveries at once (webhook and the thank-you page): the unique session id wins.
    const again = await repo.getJobBySession(session.id)
    if (again) return { job: again, created: false }
    throw err
  }

  try {
    // Slot counter shows real numbers. Not allowed while rendering a page, so ignore that case.
    revalidateTag("slots", "max")
  } catch {
    /* the counter refreshes within a minute anyway */
  }

  const link = intakeUrl(job)
  const first = (job.name ?? "").split(" ")[0]
  const to = job.email
  const emailStatus = to
    ? await sendEmail({
        to,
        subject: "Your 48 hour rebuild: start your intake",
        text: [
          `Hi${first ? ` ${first}` : ""},`,
          "",
          "Payment received, thank you. Your build slot is held.",
          "",
          "Next step: the intake. It takes about 15 minutes and saves as you go, so you can stop and come back.",
          link,
          "",
          "The 48 hours start once three things are in: your intake, your approval of our store access, and your payment. We'll text you the moment it starts.",
          "",
          "Kent, LocalEyes",
        ].join("\n"),
      })
    : "no email on the payment"

  await notifyKent(
    "payment_cleared",
    `Payment cleared: ${job.name ?? "unknown"} (${job.store_url ? displayHost(job.store_url) : job.email ?? "no store yet"}). Intake link ${emailStatus === "sent" ? "emailed" : `NOT emailed (${emailStatus}), send it`}: ${link}`,
    { job_id: job.id, adminPath: `/admin?job=${job.id}` },
  )

  await sendMetaEvent({
    name: "Purchase",
    eventId: metaEventId.purchase(session.id),
    email: job.email,
    phone: app?.phone ?? session.customer_details?.phone ?? null,
    fullName: job.name,
    externalId: app?.id ?? job.id,
    source: app?.source ?? null,
    customData: {
      value: session.amount_total != null ? session.amount_total / 100 : undefined,
      currency: session.currency ? session.currency.toUpperCase() : undefined,
      content_name: "48 Hour Rebuild",
    },
  })

  return { job, created: true }
}

/**
 * The clock starts when three things are true: intake submitted, store access
 * confirmed, payment cleared. Stamps clock_started_at once and texts Kent.
 */
export async function maybeStartClock(job: Job): Promise<Job> {
  if (job.clock_started_at || !job.intake_submitted_at || !job.access_confirmed || !job.paid_at) return job
  const repo = await getRepo()
  const startedAt = new Date().toISOString()
  const doc = job.doc ? { ...job.doc, clock_started_at: startedAt, status: "clock_started" } : null
  const updated = await repo.updateJob(job.id, { clock_started_at: startedAt, status: "clock_started", doc })
  const due = new Date(Date.now() + 48 * 3600 * 1000).toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  })
  await notifyKent("clock_started", `Clock started: ${displayHost(job.store_url) || job.name}. Preview due ${due} ET.`, {
    job_id: job.id,
    adminPath: `/admin?job=${job.id}`,
  })
  return updated
}
