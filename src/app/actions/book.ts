"use server"

import { recordBooking } from "@/lib/booking"
import { calendlyEventTime, isCalendlyUrl } from "@/lib/calendly"
import { getConfig } from "@/lib/config"
import { getRepo } from "@/lib/db/repo"
import { metaEventId } from "@/lib/meta"
import { reportSaveFailure } from "@/lib/notify"
import { LOOKS, isKey, type Look } from "@/lib/options"
import { currentApplication } from "@/lib/session"
import type { BookingInfo } from "@/lib/types"
import { displayHost, normalizeUrlList } from "@/lib/url"

type Fail = { ok: false; error: string; fieldErrors?: Record<string, string> }
const SAVE_ERROR = "We couldn't save that. Please try again in a moment."

const hostOf = (u: string) => {
  try {
    return new URL(u).host.replace(/^www\./, "")
  } catch {
    return ""
  }
}

export type DesignInput = {
  style_pick: string
  reference_stores: string[]
  never_want: string
  top_products: string[]
}

/** The three design questions. Required before the calendar shows. */
export async function saveDesign(input: DesignInput): Promise<{ ok: true } | Fail> {
  const app = await currentApplication().catch(() => null)
  if (!app || app.stage !== "submitted" || app.outcome !== "qualified") {
    return { ok: false, error: "We couldn't find your application. Start again from the apply form." }
  }

  const fieldErrors: Record<string, string> = {}
  if (!isKey(LOOKS, input.style_pick)) fieldErrors.style_pick = "Pick a look."
  const refs = normalizeUrlList(input.reference_stores, 3)
  if (!refs.length) fieldErrors.reference_stores = "Pick at least one store you love, or paste a link."
  const neverWant = (input.never_want ?? "").trim().slice(0, 400)
  if (neverWant.length < 2) fieldErrors.never_want = "Tell us one thing you'd never want on your store."

  const products = normalizeUrlList(input.top_products, 3)
  const storeHost = hostOf(app.store_url ?? "")
  if (!products.length) fieldErrors.top_products = "Add at least one product link from your store."
  else if (
    products.some((p) => {
      const h = hostOf(p)
      return h !== storeHost && !h.endsWith(".myshopify.com") && !p.includes("/products/")
    })
  ) {
    fieldErrors.top_products = `Use product links from your own store (${displayHost(app.store_url)}).`
  }
  if (Object.keys(fieldErrors).length) return { ok: false, error: "Check the fields marked below.", fieldErrors }

  try {
    const repo = await getRepo()
    await repo.updateApplication(app.id, {
      style_pick: input.style_pick as Look,
      reference_stores: refs,
      never_want: neverWant,
      top_products: products,
      design_saved_at: new Date().toISOString(),
    })
    return { ok: true }
  } catch (err) {
    await reportSaveFailure("design questions", err, { application_id: app.id })
    return { ok: false, error: SAVE_ERROR }
  }
}

/** Called by the page when the booking widget reports a booked time. */
export async function confirmBooking(input: {
  provider: BookingInfo["provider"]
  event_uri?: string | null
  invitee_uri?: string | null
}): Promise<{ ok: true; callTime: string | null; eventId: string } | Fail> {
  const app = await currentApplication().catch(() => null)
  if (!app || app.outcome !== "qualified") return { ok: false, error: "We couldn't find your application." }
  if (!app.design_saved_at) return { ok: false, error: "Answer the three questions above first." }

  try {
    const config = await getConfig()
    const provider: BookingInfo["provider"] = isCalendlyUrl(config.BOOKING_URL) ? "calendly" : input.provider
    const eventUri = input.event_uri && /^https:\/\/api\.calendly\.com\//.test(input.event_uri) ? input.event_uri : null
    const inviteeUri = input.invitee_uri && /^https:\/\/api\.calendly\.com\//.test(input.invitee_uri) ? input.invitee_uri : null
    const callTime = eventUri ? await calendlyEventTime(eventUri) : null
    const booking: BookingInfo = { provider, event_uri: eventUri, invitee_uri: inviteeUri, verified: Boolean(callTime) }
    const job = await recordBooking(app, booking, callTime, "browser")
    return { ok: true, callTime: job.call_time, eventId: metaEventId.schedule(job.id) }
  } catch (err) {
    await reportSaveFailure("booking", err, { application_id: app.id })
    return {
      ok: false,
      error: "Your time is booked, but we couldn't save it on our side. Kent has been told and will confirm by text.",
    }
  }
}
