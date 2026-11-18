import "server-only"
import { neon } from "@neondatabase/serverless"
import { desc, eq, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/neon-http"
import type { AlertRow, Application, HomepageJob, Job } from "@/lib/types"
import type { NewApplication, NewHomepageJob, NewJob, Repo } from "./repo"
import { alerts, applications, homepageJobs, jobs, siteConfig } from "./schema"

/** Columns stored as timestamptz. The app passes and reads ISO strings. */
const TIMESTAMPS = new Set([
  "created_at",
  "updated_at",
  "store_checked_at",
  "design_saved_at",
  "submitted_at",
  "call_time",
  "paid_at",
  "intake_submitted_at",
  "clock_started_at",
])

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function toDb<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    if (v === undefined || k === "id" || k === "created_at") continue
    out[k] = TIMESTAMPS.has(k) && typeof v === "string" ? new Date(v) : v
  }
  return out
}

function fromDb<T>(row: Record<string, unknown> | undefined): T | null {
  if (!row) return null
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) out[k] = v instanceof Date ? v.toISOString() : v
  return out as T
}

function many<T>(rows: Record<string, unknown>[]): T[] {
  return rows.map((r) => fromDb<T>(r)!)
}

function first<T>(rows: Record<string, unknown>[], what: string): T {
  const row = fromDb<T>(rows[0])
  if (!row) throw new Error(`${what}: no row returned`)
  return row
}

export function createNeonRepo(): Repo {
  const db = drizzle(neon(process.env.DATABASE_URL!))

  return {
    kind: "neon",

    async insertApplication(row: NewApplication) {
      return first<Application>(await db.insert(applications).values(toDb(row) as never).returning(), "insert application")
    },
    async updateApplication(id, patch) {
      return first<Application>(
        await db
          .update(applications)
          .set({ ...toDb(patch), updated_at: new Date() } as never)
          .where(eq(applications.id, id))
          .returning(),
        "update application",
      )
    },
    async getApplication(id) {
      if (!UUID.test(id)) return null
      return fromDb<Application>((await db.select().from(applications).where(eq(applications.id, id)).limit(1))[0])
    },
    async findLatestApplicationByEmail(email) {
      const rows = await db
        .select()
        .from(applications)
        .where(sql`lower(${applications.email}) = ${email.trim().toLowerCase()}`)
        .orderBy(desc(applications.created_at))
        .limit(1)
      return fromDb<Application>(rows[0])
    },
    async listApplications(limit) {
      return many<Application>(await db.select().from(applications).orderBy(desc(applications.created_at)).limit(limit))
    },

    async upsertHomepageJob(row: NewHomepageJob) {
      const values = toDb(row)
      return first<HomepageJob>(
        await db
          .insert(homepageJobs)
          .values(values as never)
          .onConflictDoUpdate({ target: homepageJobs.application_id, set: { ...values, updated_at: new Date() } as never })
          .returning(),
        "save homepage job",
      )
    },
    async getHomepageJobByApplication(applicationId) {
      if (!UUID.test(applicationId)) return null
      return fromDb<HomepageJob>(
        (await db.select().from(homepageJobs).where(eq(homepageJobs.application_id, applicationId)).limit(1))[0],
      )
    },
    async listHomepageJobs(limit) {
      return many<HomepageJob>(await db.select().from(homepageJobs).orderBy(desc(homepageJobs.created_at)).limit(limit))
    },

    async insertJob(row: NewJob) {
      return first<Job>(await db.insert(jobs).values(toDb(row) as never).returning(), "insert job")
    },
    async updateJob(id, patch) {
      return first<Job>(
        await db
          .update(jobs)
          .set({ ...toDb(patch), updated_at: new Date() } as never)
          .where(eq(jobs.id, id))
          .returning(),
        "update job",
      )
    },
    async getJob(id) {
      if (!UUID.test(id)) return null
      return fromDb<Job>((await db.select().from(jobs).where(eq(jobs.id, id)).limit(1))[0])
    },
    async getJobByToken(token) {
      return fromDb<Job>((await db.select().from(jobs).where(eq(jobs.intake_token, token)).limit(1))[0])
    },
    async getJobBySession(sessionId) {
      return fromDb<Job>((await db.select().from(jobs).where(eq(jobs.stripe_session_id, sessionId)).limit(1))[0])
    },
    async getJobByApplication(applicationId) {
      if (!UUID.test(applicationId)) return null
      return fromDb<Job>(
        (await db.select().from(jobs).where(eq(jobs.application_id, applicationId)).orderBy(desc(jobs.created_at)).limit(1))[0],
      )
    },
    async listJobs(limit) {
      return many<Job>(await db.select().from(jobs).orderBy(desc(jobs.created_at)).limit(limit))
    },

    async getConfigRows() {
      const rows = await db.select({ key: siteConfig.key, value: siteConfig.value }).from(siteConfig)
      return Object.fromEntries(rows.map((r) => [r.key, r.value]))
    },
    async setConfigRow(key, value) {
      await db
        .insert(siteConfig)
        .values({ key, value, updated_at: new Date() })
        .onConflictDoUpdate({ target: siteConfig.key, set: { value, updated_at: new Date() } })
    },
    async deleteConfigRow(key) {
      await db.delete(siteConfig).where(eq(siteConfig.key, key))
    },

    async insertAlert(row: AlertRow) {
      await db.insert(alerts).values({ kind: row.kind, message: row.message, context: row.context, delivered: row.delivered })
    },
  }
}
