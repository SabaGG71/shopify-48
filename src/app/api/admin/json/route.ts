import { isAdmin } from "@/lib/admin-auth"
import { getRepo } from "@/lib/db/repo"

/** Admin only: download a job's intake document or a homepage job, exactly as stored. */
export async function GET(request: Request) {
  if (!(await isAdmin())) return new Response("Not found", { status: 404 })
  const url = new URL(request.url)
  const repo = await getRepo()
  const jobId = url.searchParams.get("job")
  const homepageId = url.searchParams.get("homepage")
  let body: unknown = null
  let name = "record"
  if (jobId) {
    const job = await repo.getJob(jobId)
    body = job?.doc ?? null
    name = `intake-${jobId}`
  } else if (homepageId) {
    const list = await repo.listHomepageJobs(500)
    body = list.find((h) => h.id === homepageId) ?? null
    name = `homepage-job-${homepageId}`
  }
  if (!body) return new Response("Not found", { status: 404 })
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${name}.json"`,
      "cache-control": "no-store",
    },
  })
}
