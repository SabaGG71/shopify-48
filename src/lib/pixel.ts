"use client"

type Fbq = ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[] }

declare global {
  interface Window {
    fbq?: Fbq
  }
}

const STANDARD = new Set(["Lead", "Schedule", "Purchase", "PageView"])

/** Browser side of a Meta event. Pass the same eventId the server sends to CAPI. */
export function trackPixel(name: string, eventId: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !window.fbq) return
  try {
    window.fbq(STANDARD.has(name) ? "track" : "trackCustom", name, params, { eventID: eventId })
  } catch {
    /* tracking must never break the page */
  }
}

/** _fbp and _fbc cookies plus fbclid, for server-side matching. */
export function readMetaCookies() {
  if (typeof document === "undefined") return { fbp: null, fbc: null }
  const get = (name: string) => document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1] ?? null
  let fbc = get("_fbc")
  const fbclid = new URLSearchParams(window.location.search).get("fbclid")
  if (!fbc && fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`
  return { fbp: get("_fbp"), fbc }
}
