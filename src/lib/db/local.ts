import "server-only"
import { promises as fs } from "node:fs"
import path from "node:path"
import { randomUUID } from "node:crypto"
import type { AlertRow, Application, HomepageJob, Job } from "@/lib/types"
import type { Repo } from "./repo"

/**
 * Development-only store: one JSON file at .data/db.json, uploads in .data/uploads.
 * Never used in production unless ALLOW_LOCAL_DB=1.
 */

type Db = {
  applications: Application[]
  homepage_jobs: HomepageJob[]
  jobs: Job[]
  site_config: Record<string, unknown>
  alerts: AlertRow[]
}

const DIR = path.join(process.cwd(), ".data")
const FILE = path.join(DIR, "db.json")

let chain: Promise<unknown> = Promise.resolve()

async function load(): Promise<Db> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as Db
  } catch {
    return { applications: [], homepage_jobs: [], jobs: [], site_config: {}, alerts: [] }
  }
}

async function save(db: Db) {
  await fs.mkdir(DIR, { recursive: true })
  const tmp = FILE + ".tmp"
  await fs.writeFile(tmp, JSON.stringify(db, null, 2))
  await fs.rename(tmp, FILE)
}

/** Serialise read-modify-write so parallel requests don't clobber each other. */
function tx<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    const db = await load()
    const out = await fn(db)
    await save(db)
    return out
  })
  chain = run.catch(() => undefined)
  return run
}

const read = async <T>(fn: (db: Db) => T) => fn(await load())
const now = () => new Date().toISOString()
const byNewest = <T extends { created_at: string }>(a: T, b: T) => b.created_at.localeCompare(a.created_at)

export function createLocalRepo(): Repo {
  return {
    kind: "local",

    insertApplication: (row) =>
      tx((db) => {
        const app = { ...row, id: randomUUID(), created_at: now(), updated_at: now() } as Application
        db.applications.push(app)
        return app
      }),
    updateApplication: (id, patch) =>
      tx((db) => {
        const i = db.applications.findIndex((a) => a.id === id)
        if (i < 0) throw new Error(`application ${id} not found`)
        db.applications[i] = { ...db.applications[i], ...patch, id, updated_at: now() }
        return db.applications[i]
      }),
    getApplication: (id) => read((db) => db.applications.find((a) => a.id === id) ?? null),
    findLatestApplicationByEmail: (email) =>
      read(
        (db) =>
          db.applications
            .filter((a) => a.email?.toLowerCase() === email.toLowerCase())
            .sort(byNewest)[0] ?? null,
      ),
    listApplications: (limit) => read((db) => [...db.applications].sort(byNewest).slice(0, limit)),

    upsertHomepageJob: (row) =>
      tx((db) => {
        const i = db.homepage_jobs.findIndex((h) => h.application_id === row.application_id)
        if (i >= 0) {
          db.homepage_jobs[i] = { ...db.homepage_jobs[i], ...row, updated_at: now() }
          return db.homepage_jobs[i]
        }
        const job = { ...row, id: randomUUID(), created_at: now(), updated_at: now() } as HomepageJob
        db.homepage_jobs.push(job)
        return job
      }),
    getHomepageJobByApplication: (id) => read((db) => db.homepage_jobs.find((h) => h.application_id === id) ?? null),
    listHomepageJobs: (limit) => read((db) => [...db.homepage_jobs].sort(byNewest).slice(0, limit)),
    updateHomepageJob: (id, patch) =>
      tx((db) => {
        const i = db.homepage_jobs.findIndex((h) => h.id === id)
        if (i < 0) throw new Error(`homepage job ${id} not found`)
        db.homepage_jobs[i] = { ...db.homepage_jobs[i], ...patch, id, updated_at: now() }
        return db.homepage_jobs[i]
      }),
    findHomepageJobByBooking: (field, value) =>
      read((db) => db.homepage_jobs.filter((h) => h.booking?.[field] === value).sort(byNewest)[0] ?? null),

    insertJob: (row) =>
      tx((db) => {
        if (row.stripe_session_id && db.jobs.some((j) => j.stripe_session_id === row.stripe_session_id)) {
          throw new Error("duplicate key value violates unique constraint (stripe_session_id)")
        }
        const job = { ...row, id: randomUUID(), created_at: now(), updated_at: now() } as Job
        db.jobs.push(job)
        return job
      }),
    updateJob: (id, patch) =>
      tx((db) => {
        const i = db.jobs.findIndex((j) => j.id === id)
        if (i < 0) throw new Error(`job ${id} not found`)
        db.jobs[i] = { ...db.jobs[i], ...patch, id, updated_at: now() }
        return db.jobs[i]
      }),
    getJob: (id) => read((db) => db.jobs.find((j) => j.id === id) ?? null),
    getJobByToken: (token) => read((db) => db.jobs.find((j) => j.intake_token === token) ?? null),
    getJobBySession: (sid) => read((db) => db.jobs.find((j) => j.stripe_session_id === sid) ?? null),
    getJobByApplication: (id) =>
      read((db) => db.jobs.filter((j) => j.application_id === id).sort(byNewest)[0] ?? null),
    listJobs: (limit) => read((db) => [...db.jobs].sort(byNewest).slice(0, limit)),
    countPaidSince: (iso) => read((db) => db.jobs.filter((j) => j.paid_at && j.paid_at >= iso && j.status !== "canceled").length),

    getConfigRows: () => read((db) => ({ ...db.site_config })),
    setConfigRow: (key, value) =>
      tx((db) => {
        db.site_config[key] = value
      }),
    deleteConfigRow: (key) =>
      tx((db) => {
        delete db.site_config[key]
      }),

    insertAlert: (row) =>
      tx((db) => {
        db.alerts.push({ ...row, id: db.alerts.length + 1, created_at: now() })
      }),

  }
}
