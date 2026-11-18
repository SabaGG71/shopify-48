import "server-only"
import { after } from "next/server"
import { getRepo } from "@/lib/db/repo"
import { metaEventId, sendMetaEvent } from "@/lib/meta"
import { notifyKent, sendEmail, sendSms } from "@/lib/notify"
import { LOOKS, labelOf } from "@/lib/options"
import type { Application, BookingInfo, HomepageJob } from "@/lib/types"
import { displayHost } from "@/lib/url"

/**
 * Creates (or updates) the homepage_job for a booked call. This record is what
 * Kent's agent reads to build the free homepage. Used by the page and the webhook.
 */
export async function recordBooking(app: Application, booking: BookingInfo, callTime: string | null, via: "browser" | "webhook") {
  const repo = await getRepo()
  const existing = await repo.getHomepageJobByApplication(app.id)
  const job = await repo.upsertHomepageJob({
    application_id: app.id,
    store_url: app.store_url!,
    style_pick: app.style_pick!,
    reference_stores: app.reference_stores ?? [],
    never_want: app.never_want,
    top_products: app.top_products ?? [],
    name: app.name,
    email: app.email,
    phone: app.phone,
    phone_channel: app.phone_channel,
    call_time: callTime ?? existing?.call_time ?? null,
    booking: existing?.booking?.verified && !booking.verified ? existing.booking : booking,
    status: "booked",
  })

  const isNew = !existing || (booking.event_uri && existing.booking?.event_uri !== booking.event_uri)
  if (isNew) {
    const when = job.call_time
      ? new Date(job.call_time).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" }) + " ET"
      : "time not confirmed yet"
    after(async () => {
      await notifyKent(
        "call_booked",
        `Call booked: ${app.name} (${displayHost(app.store_url)}), ${when}. Look: ${labelOf(LOOKS, app.style_pick)}. Homepage job is ready.`,
        { application_id: app.id, homepage_job_id: job.id, via, adminPath: `/admin?app=${app.id}` },
      )
      await sendMetaEvent({
        name: "Schedule",
        eventId: metaEventId.schedule(job.id),
        email: app.email,
        phone: app.phone,
        fullName: app.name,
        externalId: app.id,
        source: app.source,
      })
    })
  }
  return job
}

/** Reserve link that ties the Stripe payment back to this application. */
export function reserveLinkFor(app: Pick<Application, "id" | "email"> | null, reserveUrl: string) {
  if (!reserveUrl) return ""
  if (!app) return reserveUrl
  try {
    const u = new URL(reserveUrl)
    u.searchParams.set("client_reference_id", app.id)
    if (app.email) u.searchParams.set("prefilled_email", app.email)
    return u.toString()
  } catch {
    return reserveUrl
  }
}

/**
 * Calendly link with everything we already know filled in. The event asks for the
 * store URL (question 1) and a number to text (question 2). utm_content carries
 * the application id so bookings match their lead.
 */
export function calendlyPrefill(
  bookingUrl: string,
  info: { name?: string | null; email?: string | null; storeUrl?: string | null; phone?: string | null; applicationId?: string | null },
  extra: Record<string, string> = {},
) {
  if (!bookingUrl) return ""
  try {
    const u = new URL(bookingUrl)
    if (!/calendly\.com$/i.test(u.hostname.replace(/^www\./, ""))) return bookingUrl
    if (info.name) u.searchParams.set("name", info.name)
    if (info.email) u.searchParams.set("email", info.email)
    if (info.storeUrl) u.searchParams.set("a1", info.storeUrl)
    if (info.phone) u.searchParams.set("a2", info.phone)
    u.searchParams.set("utm_source", "le48")
    if (info.applicationId) u.searchParams.set("utm_content", info.applicationId)
    for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, v)
    return u.toString()
  } catch {
    return bookingUrl
  }
}

const callTimeEt = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" }) + " ET"
    : "time unknown"

/** Calendly invitee.canceled. A reschedule is not a cancel: the new booking arrives as invitee.created. */
export async function recordCancel(job: HomepageJob, rescheduled: boolean) {
  if (rescheduled) return job
  const repo = await getRepo()
  const updated = await repo.updateHomepageJob(job.id, {
    status: "canceled",
    booking: { ...(job.booking ?? { provider: "calendly", verified: false }), canceled_at: new Date().toISOString() },
  })
  await notifyKent("call_canceled", `Call canceled: ${job.name} (${displayHost(job.store_url)}), was ${callTimeEt(job.call_time)}.`, {
    application_id: job.application_id,
    homepage_job_id: job.id,
    adminPath: `/admin?tab=homepage`,
  })
  return updated
}

/**
 * Calendly invitee_no_show.created: one rebook message to the lead, never more.
 * A text when Twilio is set up, otherwise an email. Kent is told either way.
 */
export async function recordNoShow(job: HomepageJob, bookingUrl: string) {
  const repo = await getRepo()
  const booking = job.booking ?? { provider: "calendly" as const, verified: false }
  if (booking.rebook_sent_at) return { job, channel: booking.rebook_channel ?? null, skipped: true }

  const link = calendlyPrefill(bookingUrl, {
    name: job.name,
    email: job.email,
    storeUrl: job.store_url,
    phone: job.phone,
    applicationId: job.application_id,
  })
  const first = (job.name ?? "").split(" ")[0] || "there"
  const text = `Hi ${first}, sorry we missed you today. Your new homepage is ready to show you. Pick a new time here: ${link} Kent, LocalEyes`

  let channel: "sms" | "email" | null = null
  if (link && job.phone && process.env.TWILIO_ACCOUNT_SID) {
    if ((await sendSms(job.phone, text).catch(() => "error")) === "sent") channel = "sms"
  }
  if (!channel && link && job.email) {
    const status = await sendEmail({
      to: job.email,
      subject: "Your new homepage is ready when you are",
      text: `Hi ${first},\n\nSorry we missed you today. Your new homepage is built and ready to show you.\n\nPick a new time here:\n${link}\n\nKent, LocalEyes`,
    }).catch(() => "error")
    if (status === "sent") channel = "email"
  }

  const now = new Date().toISOString()
  const updated = await repo.updateHomepageJob(job.id, {
    booking: { ...booking, no_show_at: now, rebook_sent_at: channel ? now : null, rebook_channel: channel },
  })
  await notifyKent(
    "no_show",
    `No-show: ${job.name} (${displayHost(job.store_url)}). Rebook ${channel ? `${channel === "sms" ? "text" : "email"} sent` : "NOT sent (no Twilio or email set up)"}.`,
    { application_id: job.application_id, homepage_job_id: job.id, adminPath: `/admin?tab=homepage` },
  )
  return { job: updated, channel, skipped: false }
}
