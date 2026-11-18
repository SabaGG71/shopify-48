import { NextResponse } from "next/server"
import { applicationFromLink, setAppCookie } from "@/lib/session"

/**
 * /api/resume?a=<application id>&t=<token>
 * Reopens an application on any device (Kent texts this link after approving a lead).
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const app = await applicationFromLink(url.searchParams.get("a"), url.searchParams.get("t")).catch(() => null)
  if (!app) return NextResponse.redirect(new URL("/#apply-top", url))
  await setAppCookie(app.id, app.resume_token)
  const to = app.outcome === "qualified" ? "/book" : app.outcome === "review" ? "/thanks" : app.outcome === "not_fit" ? "/not-a-fit" : "/#apply-top"
  return NextResponse.redirect(new URL(to, url))
}
