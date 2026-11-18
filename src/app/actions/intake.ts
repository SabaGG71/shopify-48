"use server"

import { randomUUID } from "node:crypto"
import { getRepo } from "@/lib/db/repo"
import {
  buildIntakeDoc,
  hydrateDraft,
  MAX_UPLOAD_BYTES,
  STEP_COUNT,
  UPLOAD_FIELDS,
  validateAll,
  validateStep,
  type FileRef,
  type IntakeDraft,
  type UploadField,
} from "@/lib/intake/schema"
import { maybeStartClock } from "@/lib/jobs"
import { notifyKent, reportSaveFailure } from "@/lib/notify"
import { isOurBlobUrl, localUploadUrl, storageMode } from "@/lib/storage"
import type { Job } from "@/lib/types"
import { displayHost, normalizeStoreUrl } from "@/lib/url"

type Fail = { ok: false; error: string; errors?: Record<string, string | undefined>; step?: number }
const SAVE_ERROR = "We couldn't save that. Please try again in a moment. If it keeps happening, text Kent."

const ALLOWED_EXT = /\.(png|jpe?g|webp|gif|heic|heif|avif|svg|pdf|ttf|otf|woff2?|zip)$/i
const ALLOWED_MIME = /^(image\/|application\/pdf$|font\/|application\/(x-)?font|application\/vnd\.ms-opentype$|application\/(x-)?zip|application\/x-zip-compressed$|application\/octet-stream$|$)/i

async function loadJob(token: string): Promise<Job | null> {
  if (!token || token.length < 20 || token.length > 80) return null
  return (await getRepo()).getJobByToken(token)
}

const locked = (job: Job) => Boolean(job.clock_started_at)

/** Save the current step's answers. advance=true also moves the saved position on. */
export async function saveIntakeStep(
  token: string,
  step: number,
  draft: Partial<IntakeDraft>,
  advance: boolean,
): Promise<{ ok: true; step: number } | Fail> {
  const job = await loadJob(token).catch(() => null)
  if (!job) return { ok: false, error: "This intake link isn't valid. Use the link from your email or text Kent." }
  if (locked(job)) return { ok: false, error: "Your build has started, so the intake is locked. Text Kent with any changes." }
  const s = Math.min(Math.max(1, Math.floor(step)), STEP_COUNT)

  const merged = hydrateDraft({ ...job.intake_draft, ...draft })
  if (advance) {
    const errors = validateStep(s, merged)
    if (Object.keys(errors).length) return { ok: false, error: "Check the fields marked below.", errors, step: s }
  }

  try {
    const repo = await getRepo()
    const nextStep = advance ? Math.min(s + 1, STEP_COUNT) : s
    const prevCode = (job.intake_draft as Partial<IntakeDraft>).collab_code ?? ""
    await repo.updateJob(job.id, {
      intake_draft: merged as unknown as Record<string, unknown>,
      intake_step: nextStep,
      status: job.status === "awaiting_intake" ? "intake_in_progress" : job.status,
      store_url: normalizeStoreUrl(merged.store_url) ?? job.store_url,
    })
    // Kent can send the collaborator request while they finish the rest.
    if (advance && s === 1 && merged.collab_code.trim() && merged.collab_code.trim() !== prevCode.trim()) {
      await notifyKent(
        "access_code",
        `Collaborator code for ${displayHost(merged.store_url) || job.name}: ${merged.collab_code.trim()}. Send the access request now.`,
        { job_id: job.id, adminPath: `/admin?job=${job.id}` },
      )
    }
    return { ok: true, step: nextStep }
  } catch (err) {
    await reportSaveFailure(`intake step ${s}`, err, { job_id: job.id })
    return { ok: false, error: SAVE_ERROR }
  }
}

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  avif: "image/avif",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  ttf: "font/ttf",
  otf: "font/otf",
  woff: "font/woff",
  woff2: "font/woff2",
  zip: "application/zip",
}
const guessType = (name: string) => MIME_BY_EXT[name.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream"

export type UploadTarget =
  | { ok: true; mode: "local"; uploadUrl: string; headers: Record<string, string>; path: string }
  | { ok: true; mode: "blob"; pathname: string; clientPayload: string; contentType: string }

/** Step 1: where the browser uploads one file, straight into storage (Vercel Blob, or local files in dev). */
export async function startUpload(
  token: string,
  field: string,
  file: { name: string; size: number; type: string },
): Promise<UploadTarget | Fail> {
  const job = await loadJob(token).catch(() => null)
  if (!job) return { ok: false, error: "This intake link isn't valid." }
  if (locked(job)) return { ok: false, error: "Your build has started, so uploads are closed. Text Kent." }
  if (!UPLOAD_FIELDS.includes(field as UploadField)) return { ok: false, error: "Unknown upload." }
  if (!ALLOWED_EXT.test(file.name) || !ALLOWED_MIME.test(file.type || "")) {
    return { ok: false, error: `${file.name}: use images, SVG, PDF, font files or zip.` }
  }
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: `${file.name} is over 50 MB.` }
  const mode = storageMode()
  if (!mode) {
    await reportSaveFailure("upload", new Error("File storage is not configured (BLOB_READ_WRITE_TOKEN)"), { job_id: job.id, field })
    return { ok: false, error: SAVE_ERROR }
  }
  const safe = file.name.normalize("NFKD").replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").slice(-80) || "file"
  const contentType = file.type || guessType(file.name)
  if (mode === "blob") {
    return {
      ok: true,
      mode,
      pathname: `jobs/${job.id}/${field}/${safe}`,
      clientPayload: JSON.stringify({ token, field }),
      contentType,
    }
  }
  const path = `jobs/${job.id}/${field}/${randomUUID().slice(0, 8)}-${safe}`
  return { ok: true, mode, uploadUrl: localUploadUrl(path), headers: { "content-type": contentType }, path }
}

/** Step 2: after the browser upload succeeds, record the file on the draft. */
export async function finalizeUpload(
  token: string,
  field: string,
  ref: { path?: string; url?: string },
  meta: { name: string; type: string },
): Promise<{ ok: true; file: FileRef; files: FileRef[] } | Fail> {
  const job = await loadJob(token).catch(() => null)
  if (!job) return { ok: false, error: "This intake link isn't valid." }
  if (!UPLOAD_FIELDS.includes(field as UploadField)) return { ok: false, error: "Unknown upload." }
  const mode = storageMode()
  let url: string | null = null
  if (mode === "blob" && ref.url && isOurBlobUrl(ref.url, job.id, field)) url = ref.url
  if (mode === "local" && ref.path?.startsWith(`jobs/${job.id}/${field}/`)) url = localUploadUrl(ref.path, true)
  if (!url) return { ok: false, error: "Unknown upload." }
  try {
    const repo = await getRepo()
    const file: FileRef = { name: meta.name.slice(0, 200), url, type: meta.type || guessType(meta.name) }
    const fresh = (await repo.getJob(job.id)) ?? job
    const draft = hydrateDraft(fresh.intake_draft)
    const files = [...(draft[field as UploadField] as FileRef[]), file].slice(-20)
    await repo.updateJob(job.id, { intake_draft: { ...fresh.intake_draft, [field]: files } })
    return { ok: true, file, files }
  } catch (err) {
    await reportSaveFailure("upload", err, { job_id: job.id, field })
    return { ok: false, error: SAVE_ERROR }
  }
}

export async function removeUpload(token: string, field: string, url: string): Promise<{ ok: true; files: FileRef[] } | Fail> {
  const job = await loadJob(token).catch(() => null)
  if (!job) return { ok: false, error: "This intake link isn't valid." }
  if (!UPLOAD_FIELDS.includes(field as UploadField)) return { ok: false, error: "Unknown upload." }
  try {
    const repo = await getRepo()
    const draft = hydrateDraft(job.intake_draft)
    const files = (draft[field as UploadField] as FileRef[]).filter((f) => f.url !== url)
    await repo.updateJob(job.id, { intake_draft: { ...job.intake_draft, [field]: files } })
    return { ok: true, files }
  } catch (err) {
    await reportSaveFailure("remove upload", err, { job_id: job.id, field })
    return { ok: false, error: SAVE_ERROR }
  }
}

/** Submit the whole intake: validate every step, write the JSON document, maybe start the clock. */
export async function submitIntake(
  token: string,
  draftIn: Partial<IntakeDraft>,
): Promise<{ ok: true; clockStarted: boolean; accessConfirmed: boolean } | Fail> {
  const job = await loadJob(token).catch(() => null)
  if (!job) return { ok: false, error: "This intake link isn't valid." }
  if (locked(job)) return { ok: false, error: "Your build has started, so the intake is locked. Text Kent with any changes." }

  const draft = hydrateDraft({ ...job.intake_draft, ...draftIn })
  draft.access_confirmed = Boolean(draft.access_confirmed || job.access_confirmed)
  const all = validateAll(draft)
  const firstBad = Object.keys(all).map(Number).sort((a, b) => a - b)[0]
  if (firstBad) return { ok: false, error: "A few answers are missing.", errors: all[firstBad], step: firstBad }

  try {
    const repo = await getRepo()
    const submittedAt = job.intake_submitted_at ?? new Date().toISOString()
    const status = "intake_submitted"
    const doc = buildIntakeDoc({ id: job.id, created_at: job.created_at, clock_started_at: null, status }, draft)
    let updated = await repo.updateJob(job.id, {
      intake_draft: draft as unknown as Record<string, unknown>,
      intake_step: STEP_COUNT,
      intake_submitted_at: submittedAt,
      access_confirmed: draft.access_confirmed,
      status,
      store_url: doc.store_url,
      doc: doc as unknown as Record<string, unknown>,
    })
    updated = await maybeStartClock(updated)
    if (!updated.clock_started_at) {
      await notifyKent(
        "intake_submitted",
        `Intake submitted: ${displayHost(doc.store_url)}. ${updated.access_confirmed ? "" : "Waiting on store access approval. "}${updated.paid_at ? "" : "Payment not cleared yet."}`.trim(),
        { job_id: job.id, adminPath: `/admin?job=${job.id}` },
      )
    }
    return { ok: true, clockStarted: Boolean(updated.clock_started_at), accessConfirmed: updated.access_confirmed }
  } catch (err) {
    await reportSaveFailure("intake submit", err, { job_id: job.id })
    return { ok: false, error: SAVE_ERROR }
  }
}

/** After the intake: "I approved the access request". Starts the clock if everything else is in. */
export async function confirmAccess(token: string): Promise<{ ok: true; clockStarted: boolean } | Fail> {
  const job = await loadJob(token).catch(() => null)
  if (!job) return { ok: false, error: "This intake link isn't valid." }
  try {
    const repo = await getRepo()
    const draft = { ...job.intake_draft, access_confirmed: true }
    const doc = job.doc ? { ...job.doc, access: { ...(job.doc.access as object), access_confirmed: true } } : null
    let updated = await repo.updateJob(job.id, { access_confirmed: true, intake_draft: draft, doc })
    updated = await maybeStartClock(updated)
    return { ok: true, clockStarted: Boolean(updated.clock_started_at) }
  } catch (err) {
    await reportSaveFailure("confirm access", err, { job_id: job.id })
    return { ok: false, error: SAVE_ERROR }
  }
}
