import "server-only"
import { FEEL_WORDS, LIKE_TAGS, LOOKS, NICHES, PHONE_CHANNELS, PREF_BUTTONS, PREF_CORNERS, PREF_THEME, REVENUE_BANDS, labelOf } from "@/lib/options"
import type { Application } from "@/lib/types"
import { displayHost, formatPhoneForDisplay } from "@/lib/url"

/**
 * Kent's Google Sheet: one row per application, kept up to date as the lead moves along
 * (applied, design answers saved, call booked). The sheet side is a small Apps Script web
 * app (docs/google-sheet-sync.gs) that finds the row by ID and writes it, so sending the
 * same lead twice is safe. The database stays the source of truth; the sheet is a readable copy.
 *
 * Off until SHEETS_WEBHOOK_URL is set. Never throws.
 */

const et = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" }) : ""

const labels = (list: Parameters<typeof labelOf>[0], keys: readonly string[] | null | undefined) =>
  (keys ?? []).map((k) => labelOf(list, k)).join(", ")

function statusOf(app: Application, callTime: string | null | undefined, booked: boolean) {
  if (booked) return "Call booked"
  if (app.outcome === "qualified") return app.design_saved_at ? "Qualified, design answers in" : "Qualified"
  if (app.outcome === "review") return "Needs review"
  if (app.outcome) return "Not a fit"
  return callTime ? "Call booked" : "Started"
}

/** Column order in the sheet. The script writes these as the header row. */
export function sheetRow(app: Application, extra: { callTime?: string | null; booked?: boolean } = {}): [string, string][] {
  const notes = app.design_notes
  const likes = Object.entries(notes?.reference_likes ?? {})
    .filter(([, tags]) => tags.length)
    .map(([url, tags]) => `${displayHost(url)}: ${labels(LIKE_TAGS, tags)}`)
    .join("\n")
  const prefs = [
    notes?.prefs?.corners ? `Corners: ${labelOf(PREF_CORNERS, notes.prefs.corners)}` : "",
    notes?.prefs?.buttons ? `Buttons: ${labelOf(PREF_BUTTONS, notes.prefs.buttons)}` : "",
    notes?.prefs?.theme ? `Theme: ${labelOf(PREF_THEME, notes.prefs.theme)}` : "",
  ]
    .filter(Boolean)
    .join(", ")
  const src = app.source
  const site = (process.env.SITE_URL || "").replace(/\/$/, "")

  return [
    ["Updated (ET)", et(new Date().toISOString())],
    ["Applied (ET)", et(app.submitted_at ?? app.created_at)],
    ["Status", statusOf(app, extra.callTime, Boolean(extra.booked))],
    ["Call time (ET)", et(extra.callTime)],
    ["Name", app.name ?? ""],
    ["Email", app.email ?? ""],
    ["Phone", formatPhoneForDisplay(app.phone) ?? ""],
    ["Text on", labelOf(PHONE_CHANNELS, app.phone_channel) ?? ""],
    ["Store", app.store_url ?? ""],
    ["Monthly revenue", labelOf(REVENUE_BANDS, app.revenue_band) ?? ""],
    ["Sells", labelOf(NICHES, app.niche) ?? ""],
    ["What's not working", app.main_problem ?? ""],
    ["Direction", app.style_pick ? (labelOf(LOOKS, app.style_pick) ?? "") : "None of the five"],
    ["Direction, their words", app.style_other ?? ""],
    ["Sites they love", (app.reference_stores ?? []).join("\n")],
    ["What they like about them", likes],
    ["Feel", labels(FEEL_WORDS, notes?.feel)],
    ["Preferences", prefs],
    ["Never want", app.never_want ?? ""],
    ["Top products", (app.top_products ?? []).join("\n")],
    ["Source", [src?.utm_source, src?.utm_campaign, src?.utm_content].filter(Boolean).join(" / ")],
    ["Admin link", site ? `${site}/admin?app=${app.id}` : ""],
    ["ID", app.id],
  ]
}

export async function syncLeadToSheet(app: Application, extra: { callTime?: string | null; booked?: boolean } = {}): Promise<string> {
  const url = process.env.SHEETS_WEBHOOK_URL
  if (!url) return "off"
  try {
    const row = sheetRow(app, extra)
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: process.env.SHEETS_WEBHOOK_SECRET ?? "",
        id: app.id,
        columns: row.map(([k]) => k),
        values: row.map(([, v]) => v),
        // Call time and status only move forward: a later design save must not blank a booked call.
        keep_if_blank: ["Call time (ET)"],
      }),
      signal: AbortSignal.timeout(8000),
    })
    const text = await res.text()
    if (!res.ok || !text.includes('"ok":true')) {
      console.error("[sheets] sync failed", res.status, text.slice(0, 200))
      return "error"
    }
    return "sent"
  } catch (err) {
    console.error("[sheets] sync failed", err)
    return "error"
  }
}
