import { promises as fs } from "node:fs"
import path from "node:path"
import { LOCAL_UPLOAD_DIR, localUploadSignature, storageMode } from "@/lib/storage"

/** Local-only stand-in for file storage in development. Off when Vercel Blob is configured, and in production. */

function resolve(request: Request) {
  if (storageMode() !== "local") return null
  const url = new URL(request.url)
  const p = url.searchParams.get("path") ?? ""
  const sig = url.searchParams.get("sig") ?? ""
  if (!p || p.includes("..") || sig !== localUploadSignature(p)) return null
  const full = path.join(LOCAL_UPLOAD_DIR, p)
  if (!full.startsWith(LOCAL_UPLOAD_DIR)) return null
  return full
}

export async function PUT(request: Request) {
  const full = resolve(request)
  if (!full) return new Response("Not allowed", { status: 403 })
  const body = Buffer.from(await request.arrayBuffer())
  if (body.byteLength > 50 * 1024 * 1024) return new Response("Too large", { status: 413 })
  await fs.mkdir(/*turbopackIgnore: true*/ path.dirname(full), { recursive: true })
  await fs.writeFile(/*turbopackIgnore: true*/ full, body)
  await fs.writeFile(/*turbopackIgnore: true*/ `${full}.type`, request.headers.get("content-type") ?? "application/octet-stream")
  return Response.json({ ok: true })
}

export async function GET(request: Request) {
  const full = resolve(request)
  if (!full) return new Response("Not found", { status: 404 })
  try {
    const [data, type] = await Promise.all([fs.readFile(/*turbopackIgnore: true*/ full), fs.readFile(/*turbopackIgnore: true*/ `${full}.type`, "utf8").catch(() => "application/octet-stream")])
    return new Response(data, { headers: { "content-type": type, "cache-control": "private, max-age=60" } })
  } catch {
    return new Response("Not found", { status: 404 })
  }
}
