import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"

const API = "https://api.calendly.com/"

export function isCalendlyUrl(url: string) {
  return /^https:\/\/(www\.)?calendly\.com\//i.test(url.trim())
}

/** Start time of a booked Calendly event. Needs CALENDLY_TOKEN (a personal access token). */
export async function calendlyEventTime(eventUri: string): Promise<string | null> {
  const token = process.env.CALENDLY_TOKEN
  if (!token || !eventUri.startsWith(`${API}scheduled_events/`)) return null
  try {
    const res = await fetch(eventUri, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" })
    if (!res.ok) {
      console.error("[calendly] event lookup failed", res.status)
      return null
    }
    const json = (await res.json()) as { resource?: { start_time?: string } }
    return json.resource?.start_time ?? null
  } catch (err) {
    console.error("[calendly] event lookup error", err)
    return null
  }
}

/** Calendly-Webhook-Signature: t=<ts>,v1=<hmac sha256 of "t.body">. */
export function verifyCalendlySignature(rawBody: string, header: string | null) {
  const key = process.env.CALENDLY_WEBHOOK_SIGNING_KEY
  if (!key || !header) return false
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]))
  if (!parts.t || !parts.v1) return false
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > 60 * 5) return false
  const expected = createHmac("sha256", key).update(`${parts.t}.${rawBody}`).digest("hex")
  const a = Buffer.from(expected)
  const b = Buffer.from(parts.v1)
  return a.length === b.length && timingSafeEqual(a, b)
}
