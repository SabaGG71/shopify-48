import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"

const API = "https://api.calendly.com/"
const INVITEE_URI = /^https:\/\/api\.calendly\.com\/scheduled_events\/[\w-]+\/invitees\/[\w-]+$/
const EVENT_URI = /^https:\/\/api\.calendly\.com\/scheduled_events\/[\w-]+$/

export function isCalendlyUrl(url: string) {
  return /^https:\/\/(www\.)?calendly\.com\//i.test(url.trim())
}

async function calendlyGet<T>(uri: string): Promise<T | null> {
  const token = process.env.CALENDLY_TOKEN
  if (!token) return null
  try {
    const res = await fetch(uri, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" })
    if (!res.ok) {
      console.error("[calendly] lookup failed", res.status, uri.slice(0, 80))
      return null
    }
    return ((await res.json()) as { resource?: T }).resource ?? null
  } catch (err) {
    console.error("[calendly] lookup error", err)
    return null
  }
}

/** Start time of a booked Calendly event. Needs CALENDLY_TOKEN. */
export async function calendlyEventTime(eventUri: string): Promise<string | null> {
  if (!EVENT_URI.test(eventUri)) return null
  const ev = await calendlyGet<{ start_time?: string }>(eventUri)
  return ev?.start_time ?? null
}

export type CalendlyInvitee = {
  status?: string
  email?: string
  event?: string
  tracking?: { utm_content?: string | null }
}

/** The invitee as Calendly has it, so a booking the browser reports can be checked. */
export async function calendlyInvitee(inviteeUri: string): Promise<CalendlyInvitee | null> {
  if (!INVITEE_URI.test(inviteeUri)) return null
  return calendlyGet<CalendlyInvitee>(inviteeUri)
}

const eventTypeCache = new Map<string, boolean>()

/**
 * Is this Calendly event type the homepage reveal? Kent's account has several
 * event types and a webhook cannot be limited to one, so every webhook checks.
 * Uses CALENDLY_EVENT_TYPE_URI when set, else asks Calendly once per type and
 * compares its scheduling link with BOOKING_URL.
 */
export async function isHomepageRevealType(eventTypeUri: string | null | undefined, bookingUrl: string): Promise<boolean> {
  if (!eventTypeUri) return false
  const fixed = process.env.CALENDLY_EVENT_TYPE_URI
  if (fixed) return eventTypeUri === fixed
  if (eventTypeCache.has(eventTypeUri)) return eventTypeCache.get(eventTypeUri)!
  if (!/^https:\/\/api\.calendly\.com\/event_types\/[\w-]+$/.test(eventTypeUri)) return false
  const et = await calendlyGet<{ scheduling_url?: string }>(eventTypeUri)
  if (!et?.scheduling_url) return false // unknown: do not cache, try again next time
  const clean = (u: string) => u.split("?")[0].replace(/\/$/, "").toLowerCase()
  const match = Boolean(bookingUrl) && clean(et.scheduling_url) === clean(bookingUrl)
  eventTypeCache.set(eventTypeUri, match)
  return match
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
