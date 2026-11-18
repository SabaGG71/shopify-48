import "server-only"
import { after } from "next/server"
import { getRepo } from "@/lib/db/repo"
import { metaEventId, sendMetaEvent } from "@/lib/meta"
import { notifyKent } from "@/lib/notify"
import { LOOKS, labelOf } from "@/lib/options"
import type { Application, BookingInfo } from "@/lib/types"
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
