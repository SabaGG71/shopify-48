import { recordBooking } from "@/lib/booking"
import { verifyCalendlySignature } from "@/lib/calendly"
import { getRepo } from "@/lib/db/repo"
import { reportSaveFailure } from "@/lib/notify"

type InviteeCreated = {
  event: string
  payload: {
    uri?: string
    email?: string
    scheduled_event?: { uri?: string; start_time?: string }
    tracking?: { utm_content?: string | null }
  }
}

/**
 * Backup for the browser booking event: Calendly webhook (invitee.created).
 * The booking page passes the application id as utm_content.
 */
export async function POST(request: Request) {
  const raw = await request.text()
  if (!verifyCalendlySignature(raw, request.headers.get("calendly-webhook-signature"))) {
    return new Response("Bad signature", { status: 400 })
  }
  const body = JSON.parse(raw) as InviteeCreated
  if (body.event !== "invitee.created") return Response.json({ received: true, ignored: body.event })

  const p = body.payload
  const appId = p.tracking?.utm_content ?? null
  try {
    const repo = await getRepo()
    let app = appId && /^[0-9a-f-]{36}$/i.test(appId) ? await repo.getApplication(appId) : null
    if (!app && p.email) app = await repo.findLatestApplicationByEmail(p.email)
    if (!app || app.outcome !== "qualified" || !app.store_url || !app.style_pick) {
      return Response.json({ received: true, matched: false })
    }
    const job = await recordBooking(
      app,
      { provider: "calendly", event_uri: p.scheduled_event?.uri ?? null, invitee_uri: p.uri ?? null, verified: true },
      p.scheduled_event?.start_time ?? null,
      "webhook",
    )
    return Response.json({ received: true, homepage_job_id: job.id })
  } catch (err) {
    await reportSaveFailure("calendly booking", err, { application_id: appId })
    return new Response("Could not record the booking", { status: 500 })
  }
}
