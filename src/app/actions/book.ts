"use server"

import { after } from "next/server"
import { recordBooking } from "@/lib/booking"
import { calendlyEventTime, isCalendlyUrl } from "@/lib/calendly"
import { getConfig } from "@/lib/config"
import { getRepo } from "@/lib/db/repo"
import { metaEventId } from "@/lib/meta"
import { reportSaveFailure } from "@/lib/notify"
import { FEEL_WORDS, LIKE_TAGS, LOOKS, PREF_BUTTONS, PREF_CORNERS, PREF_THEME, isKey, type Look } from "@/lib/options"
import { currentApplication } from "@/lib/session"
import { syncLeadToSheet } from "@/lib/sheets"
import type { BookingInfo, DesignNotes } from "@/lib/types"
import { displayHost, normalizeUrl, normalizeUrlList } from "@/lib/url"

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
  /** Optional: what they like about each reference, how the store should feel, any strong preferences. */
  design_notes?: DesignNotes | null
}

/** Most references one application keeps (lookbook hearts plus pasted sites). */
const REFS_MAX = 12

/** Keep only known keys, and only notes about references that were kept. Null when nothing was given. */
function cleanNotes(input: DesignNotes | null | undefined, refs: string[]): DesignNotes | null {
  if (!input || typeof input !== "object") return null
  const out: DesignNotes = {}
  const likes: Record<string, string[]> = {}
  for (const [url, tags] of Object.entries(input.reference_likes ?? {})) {
    const n = normalizeUrl(url)
    if (!n || !refs.includes(n) || !Array.isArray(tags)) continue
    const kept = LIKE_TAGS.map((t) => t.key as string).filter((k) => tags.includes(k))
    if (kept.length) likes[n] = kept
  }
  if (Object.keys(likes).length) out.reference_likes = likes
  const feel = Array.isArray(input.feel) ? FEEL_WORDS.map((w) => w.key as string).filter((k) => input.feel!.includes(k)).slice(0, 3) : []
  if (feel.length) out.feel = feel
  const prefs: NonNullable<DesignNotes["prefs"]> = {}
  if (isKey(PREF_CORNERS, input.prefs?.corners)) prefs.corners = input.prefs.corners
  if (isKey(PREF_BUTTONS, input.prefs?.buttons)) prefs.buttons = input.prefs.buttons
  if (isKey(PREF_THEME, input.prefs?.theme)) prefs.theme = input.prefs.theme
  if (Object.keys(prefs).length) out.prefs = prefs
  return Object.keys(out).length ? out : null
}

/** The design questions on page 2. Required before the calendar shows. */
export async function saveDesign(input: DesignInput): Promise<{ ok: true } | Fail> {
  const app = await currentApplication().catch(() => null)
  if (!app || app.stage !== "submitted" || app.outcome !== "qualified") {
    return { ok: false, error: "We couldn't find your application. Start again from the apply form." }
  }

  const fieldErrors: Record<string, string> = {}
  if (!isKey(LOOKS, input.style_pick)) fieldErrors.style_pick = "Pick a look."
  const refs = normalizeUrlList(input.reference_stores, REFS_MAX)
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
    const updated = await repo.updateApplication(app.id, {
      style_pick: input.style_pick as Look,
      reference_stores: refs,
      never_want: neverWant,
      top_products: products,
      design_notes: cleanNotes(input.design_notes, refs),
      design_saved_at: new Date().toISOString(),
    })
    after(() => syncLeadToSheet(updated).then(() => {}))
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
  if (!app.design_saved_at) return { ok: false, error: "Answer the questions above first." }

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
