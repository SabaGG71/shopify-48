import { recordBooking, recordCancel, recordNoShow } from "@/lib/booking"
import { verifyCalendlySignature } from "@/lib/calendly"
import { getConfig } from "@/lib/config"
import { getRepo } from "@/lib/db/repo"
import { notifyKent, reportSaveFailure } from "@/lib/notify"
import type { Application } from "@/lib/types"

type Invitee = {
  uri?: string
  email?: string
  event?: string
  rescheduled?: boolean
  cancel_url?: string
  reschedule_url?: string
  scheduled_event?: { uri?: string; start_time?: string }
  tracking?: { utm_content?: string | null }
}

type Body =
  | { event: "invitee.created" | "invitee.canceled"; payload: Invitee }
  | { event: "invitee_no_show.created"; payload: { uri?: string; invitee?: string } }
  | { event: string; payload: Record<string, unknown> }

const UUID = /^[0-9a-f-]{36}$/i

async function applicationFor(p: Invitee): Promise<Application | null> {
  const repo = await getRepo()
  const id = p.tracking?.utm_content
  let app = id && UUID.test(id) ? await repo.getApplication(id) : null
  if (!app && p.email) app = await repo.findLatestApplicationByEmail(p.email)
  return app
}

/**
 * Calendly webhook (subscribe with scripts/calendly-webhook.mjs):
 * - invitee.created: mark booked, Schedule to Meta, email Kent (a backup for the page's own event)
 * - invitee.canceled: mark canceled, email Kent (reschedules are skipped: a new invitee.created follows)
 * - invitee_no_show.created: one rebook text (or email) to the lead, email Kent
 * The booking page passes the application id as utm_content.
 */
export async function POST(request: Request) {
  const raw = await request.text()
  if (!verifyCalendlySignature(raw, request.headers.get("calendly-webhook-signature"))) {
    return new Response("Bad signature", { status: 400 })
  }
  const body = JSON.parse(raw) as Body

  try {
    const repo = await getRepo()

    if (body.event === "invitee.created") {
      const p = body.payload as Invitee
      const app = await applicationFor(p)
      if (!app || app.outcome !== "qualified" || !app.store_url || !app.style_pick) {
        await notifyKent("call_booked", `Calendly booking that doesn't match a qualified application: ${p.email ?? "no email"}.`, {
          invitee: p.uri,
        })
        return Response.json({ received: true, matched: false })
      }
      const job = await recordBooking(
        app,
        {
          provider: "calendly",
          event_uri: p.scheduled_event?.uri ?? null,
          invitee_uri: p.uri ?? null,
          cancel_url: p.cancel_url ?? null,
          reschedule_url: p.reschedule_url ?? null,
          verified: true,
        },
        p.scheduled_event?.start_time ?? null,
        "webhook",
      )
      return Response.json({ received: true, homepage_job_id: job.id })
    }

    if (body.event === "invitee.canceled") {
      const p = body.payload as Invitee
      let job = p.uri ? await repo.findHomepageJobByBooking("invitee_uri", p.uri) : null
      if (!job && p.event) job = await repo.findHomepageJobByBooking("event_uri", p.event)
      if (!job) {
        const app = await applicationFor(p)
        job = app ? await repo.getHomepageJobByApplication(app.id) : null
      }
      if (!job) return Response.json({ received: true, matched: false })
      await recordCancel(job, Boolean(p.rescheduled))
      return Response.json({ received: true, homepage_job_id: job.id, rescheduled: Boolean(p.rescheduled) })
    }

    if (body.event === "invitee_no_show.created") {
      const p = body.payload as { invitee?: string }
      const job = p.invitee ? await repo.findHomepageJobByBooking("invitee_uri", p.invitee) : null
      if (!job) {
        await notifyKent("no_show", `No-show on Calendly that doesn't match a booking here: ${p.invitee ?? "unknown invitee"}.`)
        return Response.json({ received: true, matched: false })
      }
      const config = await getConfig()
      const res = await recordNoShow(job, config.BOOKING_URL)
      return Response.json({ received: true, homepage_job_id: job.id, rebook: res.channel, skipped: res.skipped })
    }

    return Response.json({ received: true, ignored: body.event })
  } catch (err) {
    await reportSaveFailure(`calendly ${body.event}`, err, {})
    return new Response("Could not record the event", { status: 500 })
  }
}
