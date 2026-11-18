"use server"

import { updateTag } from "next/cache"
import { cookies } from "next/headers"
import { ADMIN_COOKIE, isAdmin, passwordMatches, setAdminCookie } from "@/lib/admin-auth"
import { configSchema, CONFIG_KEYS, type ConfigKey } from "@/lib/config/schema"
import { getRepo } from "@/lib/db/repo"
import { maybeStartClock } from "@/lib/jobs"
import { siteUrl } from "@/lib/session"

type Res = { ok: true; message?: string; link?: string } | { ok: false; error: string }

export async function adminLogin(_: unknown, form: FormData): Promise<Res> {
  const pw = String(form.get("password") ?? "")
  if (!passwordMatches(pw)) return { ok: false, error: "Wrong password." }
  await setAdminCookie()
  return { ok: true }
}

export async function adminLogout(): Promise<Res> {
  ;(await cookies()).delete(ADMIN_COOKIE)
  return { ok: true }
}

async function guard() {
  if (!(await isAdmin())) throw new Error("Not signed in")
}

/** Save one config value. Validated with the same schema the site reads with. */
export async function saveConfigValue(key: string, raw: string): Promise<Res> {
  try {
    await guard()
    if (!CONFIG_KEYS.includes(key as ConfigKey)) return { ok: false, error: "Unknown setting." }
    const field = configSchema.shape[key as ConfigKey]
    let value: unknown = raw
    const trimmed = raw.trim()
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        value = JSON.parse(trimmed)
      } catch {
        return { ok: false, error: "That isn't valid JSON. Check commas and quotes." }
      }
    }
    const parsed = field.safeParse(value)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return { ok: false, error: `Not saved: ${issue?.path?.join(".") || key} ${issue?.message ?? "is invalid"}` }
    }
    await (await getRepo()).setConfigRow(key, parsed.data)
    updateTag("config")
    return { ok: true, message: "Saved. The site uses it now." }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not save." }
  }
}

export async function resetConfigValue(key: string): Promise<Res> {
  try {
    await guard()
    if (!CONFIG_KEYS.includes(key as ConfigKey)) return { ok: false, error: "Unknown setting." }
    await (await getRepo()).deleteConfigRow(key)
    updateTag("config")
    return { ok: true, message: "Back to the default." }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not reset." }
  }
}

/** Kent approves a flagged lead: it becomes qualified, and he gets a link to text them. */
export async function approveApplication(id: string): Promise<Res> {
  try {
    await guard()
    const repo = await getRepo()
    const app = await repo.getApplication(id)
    if (!app) return { ok: false, error: "Not found." }
    await repo.updateApplication(id, { outcome: "qualified", qualified: true, needs_review: false, qualify_reason: "approved_by_kent" })
    return { ok: true, message: "Approved.", link: `${siteUrl()}/api/resume?a=${app.id}&t=${app.resume_token}` }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not approve." }
  }
}

/** A link that reopens the applicant's booking page on any device. */
export async function bookingLinkFor(id: string): Promise<Res> {
  try {
    await guard()
    const app = await (await getRepo()).getApplication(id)
    if (!app) return { ok: false, error: "Not found." }
    return { ok: true, link: `${siteUrl()}/api/resume?a=${app.id}&t=${app.resume_token}` }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not make the link." }
  }
}

/** Kent confirms store access on his side. Starts the clock if the rest is in. */
export async function markAccessConfirmed(jobId: string): Promise<Res> {
  try {
    await guard()
    const repo = await getRepo()
    const job = await repo.getJob(jobId)
    if (!job) return { ok: false, error: "Not found." }
    const doc = job.doc ? { ...job.doc, access: { ...(job.doc.access as object), access_confirmed: true } } : null
    const updated = await maybeStartClock(
      await repo.updateJob(jobId, { access_confirmed: true, intake_draft: { ...job.intake_draft, access_confirmed: true }, doc }),
    )
    return { ok: true, message: updated.clock_started_at ? "Access confirmed. The clock started." : "Access confirmed." }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not update." }
  }
}
