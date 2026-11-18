/**
 * URL rules from the brief: every URL is stored with https and no trailing slash.
 * Tracking params and #fragments are dropped. Host is lowercased.
 */

const TRACKING = /^(utm_|fbclid$|gclid$|msclkid$|_ga$|_gl$|mc_|igshid$|_pos$|_sid$|_ss$|_psq$)/i

export function normalizeUrl(input: string | null | undefined): string | null {
  if (!input) return null
  let raw = input.trim()
  if (!raw) return null
  raw = raw.replace(/^[<("'\s]+|[>)"'\s]+$/g, "")
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = `https://${raw.replace(/^\/+/, "")}`
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return null
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null
  const host = u.hostname.toLowerCase().replace(/\.$/, "")
  if (!host.includes(".") || /\s/.test(host)) return null
  for (const key of [...u.searchParams.keys()]) if (TRACKING.test(key)) u.searchParams.delete(key)
  const path = u.pathname.replace(/\/+$/, "")
  const query = u.searchParams.toString()
  const port = u.port && u.port !== "443" && u.port !== "80" ? `:${u.port}` : ""
  return `https://${host}${port}${path}${query ? `?${query}` : ""}`
}

/** A store URL is the store's origin: https://host, no path. */
export function normalizeStoreUrl(input: string | null | undefined): string | null {
  const n = normalizeUrl(input)
  if (!n) return null
  const u = new URL(n)
  return `https://${u.host}`
}

export function normalizeUrlList(list: (string | null | undefined)[] | null | undefined, max = 10): string[] {
  const out: string[] = []
  for (const item of list ?? []) {
    const n = normalizeUrl(item)
    if (n && !out.includes(n)) out.push(n)
    if (out.length >= max) break
  }
  return out
}

export function displayHost(url: string | null | undefined) {
  if (!url) return ""
  try {
    return new URL(url).host.replace(/^www\./, "")
  } catch {
    return url
  }
}

/** Uppercase hex with the hash, 6 digits. Returns null if it is not a colour. */
export function normalizeHex(input: string | null | undefined): string | null {
  if (!input) return null
  let h = input.trim().replace(/^#/, "")
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.split("").map((c) => c + c).join("")
  if (!/^[0-9a-f]{6}$/i.test(h)) return null
  return `#${h.toUpperCase()}`
}

/** Digits with a leading + when we can tell the country. US 10 digit numbers get +1. */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null
  const trimmed = input.trim()
  const digits = trimmed.replace(/\D/g, "")
  if (digits.length < 7 || digits.length > 15) return null
  if (trimmed.startsWith("+")) return `+${digits}`
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`
  return `+${digits}`
}

export function formatPhoneForDisplay(e164: string | null | undefined) {
  if (!e164) return ""
  const m = e164.match(/^\+1(\d{3})(\d{3})(\d{4})$/)
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : e164
}

export function isEmail(v: string | null | undefined) {
  return !!v && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
}
