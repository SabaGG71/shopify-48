import "server-only"
import { createHmac } from "node:crypto"
import path from "node:path"

/**
 * Where intake uploads go.
 * - "blob": Vercel Blob. The browser uploads straight to Blob (no 4.5 MB function
 *   limit). Files are public with a long random suffix, so links are unguessable
 *   and Kent's build agent can read them without credentials.
 * - "local": development only, files in .data/uploads served by /api/dev-upload.
 */
export type StorageMode = "blob" | "local"

export function storageMode(): StorageMode | null {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob"
  if (process.env.NODE_ENV !== "production" || process.env.ALLOW_LOCAL_DB === "1") return "local"
  return null
}

export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads")

export function localUploadSignature(p: string) {
  return createHmac("sha256", process.env.LOCAL_UPLOAD_SECRET || "dev-only-secret").update(p).digest("hex").slice(0, 32)
}

export function localUploadUrl(p: string, absolute = false) {
  const rel = `/api/dev-upload?path=${encodeURIComponent(p)}&sig=${localUploadSignature(p)}`
  return absolute ? `${(process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "")}${rel}` : rel
}

/** A real Vercel Blob URL for this job and field (blocks anything the browser could forge). */
export function isOurBlobUrl(url: string, jobId: string, field: string) {
  try {
    const u = new URL(url)
    return (
      u.protocol === "https:" &&
      /\.blob\.vercel-storage\.com$/.test(u.hostname) &&
      decodeURIComponent(u.pathname).startsWith(`/jobs/${jobId}/${field}/`)
    )
  } catch {
    return false
  }
}

/** Content types accepted for intake uploads: images, SVG, PDF, fonts and zip. */
export const ALLOWED_UPLOAD_TYPES = [
  "image/*",
  "application/pdf",
  "font/*",
  "application/font-woff",
  "application/x-font-ttf",
  "application/x-font-otf",
  "application/vnd.ms-opentype",
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
]
