import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

export const ADMIN_COOKIE = "le48_admin"

function sign(value: string) {
  const secret = process.env.ADMIN_PASSWORD || ""
  return createHmac("sha256", `le48-admin:${secret}`).update(value).digest("hex")
}

export function adminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD) || process.env.NODE_ENV !== "production"
}

/** In development without ADMIN_PASSWORD the admin is open, so the funnel can be tested. */
export async function isAdmin() {
  // Read the cookie first in every case, so admin routes are always rendered per request.
  const raw = (await cookies()).get(ADMIN_COOKIE)?.value
  if (!process.env.ADMIN_PASSWORD) return process.env.NODE_ENV !== "production"
  if (!raw) return false
  const [issued, mac] = raw.split(".")
  if (!issued || !mac) return false
  if (Date.now() - Number(issued) > 1000 * 60 * 60 * 24 * 30) return false
  const expected = sign(issued)
  const a = Buffer.from(mac)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function passwordMatches(input: string) {
  const pw = process.env.ADMIN_PASSWORD || ""
  if (!pw) return false
  const a = Buffer.from(input)
  const b = Buffer.from(pw)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function setAdminCookie() {
  const issued = String(Date.now())
  ;(await cookies()).set(ADMIN_COOKIE, `${issued}.${sign(issued)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
}
