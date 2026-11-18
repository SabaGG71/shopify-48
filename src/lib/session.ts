import "server-only"
import { randomBytes, timingSafeEqual } from "node:crypto"
import { cookies, headers } from "next/headers"
import { getRepo } from "@/lib/db/repo"
import type { Application } from "@/lib/types"

export const APP_COOKIE = "le48_app"
const MAX_AGE = 60 * 60 * 24 * 120

export const newToken = (bytes = 24) => randomBytes(bytes).toString("base64url")

export function tokensMatch(a: string, b: string) {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export async function setAppCookie(id: string, token: string) {
  const jar = await cookies()
  jar.set(APP_COOKIE, `${id}.${token}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  })
}

export async function clearAppCookie() {
  const jar = await cookies()
  jar.delete(APP_COOKIE)
}

/** The application this browser started, if its token checks out. */
export async function currentApplication(): Promise<Application | null> {
  const raw = (await cookies()).get(APP_COOKIE)?.value
  if (!raw) return null
  const [id, token] = raw.split(".")
  if (!id || !token) return null
  const app = await (await getRepo()).getApplication(id)
  if (!app || !tokensMatch(app.resume_token, token)) return null
  return app
}

/** Load an application from a link like /book?a=<id>&t=<token> (sent to Kent or the applicant). */
export async function applicationFromLink(id?: string | null, token?: string | null) {
  if (!id || !token) return null
  const app = await (await getRepo()).getApplication(id)
  if (!app || !tokensMatch(app.resume_token, token)) return null
  return app
}

export async function requestInfo() {
  const h = await headers()
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || h.get("x-real-ip") || null
  return { ip, user_agent: h.get("user-agent"), referer: h.get("referer") }
}

export function siteUrl() {
  return (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "")
}
