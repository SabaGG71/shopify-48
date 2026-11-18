import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { getRepo } from "@/lib/db/repo"
import { MAX_UPLOAD_BYTES, UPLOAD_FIELDS, type UploadField } from "@/lib/intake/schema"
import { ALLOWED_UPLOAD_TYPES, storageMode } from "@/lib/storage"

/**
 * Vercel Blob client uploads: the browser asks here for a short-lived token,
 * then uploads the file straight to Blob. We only hand out a token for a real,
 * unlocked intake, a known field, and a path inside that job's folder.
 */
export async function POST(request: Request) {
  if (storageMode() !== "blob") return Response.json({ error: "Uploads are not configured" }, { status: 503 })
  const body = (await request.json()) as HandleUploadBody
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const { token, field } = JSON.parse(clientPayload ?? "{}") as { token?: string; field?: string }
        if (!token || !field || !UPLOAD_FIELDS.includes(field as UploadField)) throw new Error("Unknown upload")
        const job = await (await getRepo()).getJobByToken(token)
        if (!job) throw new Error("This intake link isn't valid")
        if (job.clock_started_at) throw new Error("Uploads are closed for this build")
        if (!pathname.startsWith(`jobs/${job.id}/${field}/`)) throw new Error("Wrong upload path")
        return {
          allowedContentTypes: ALLOWED_UPLOAD_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ jobId: job.id, field }),
        }
      },
      // Files are recorded by finalizeUpload once the browser has the URL.
      onUploadCompleted: async () => {},
    })
    return Response.json(json)
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 400 })
  }
}
