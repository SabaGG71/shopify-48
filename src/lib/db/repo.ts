import "server-only"
import type { AlertRow, Application, HomepageJob, Job } from "@/lib/types"

export type NewApplication = Omit<Application, "id" | "created_at" | "updated_at">
export type NewHomepageJob = Omit<HomepageJob, "id" | "created_at" | "updated_at">
export type NewJob = Omit<Job, "id" | "created_at" | "updated_at">

export interface Repo {
  kind: "neon" | "local"

  insertApplication(row: NewApplication): Promise<Application>
  updateApplication(id: string, patch: Partial<Application>): Promise<Application>
  getApplication(id: string): Promise<Application | null>
  findLatestApplicationByEmail(email: string): Promise<Application | null>
  listApplications(limit: number): Promise<Application[]>

  /** One homepage job per application. Creates it, or updates the existing one. */
  upsertHomepageJob(row: NewHomepageJob): Promise<HomepageJob>
  getHomepageJobByApplication(applicationId: string): Promise<HomepageJob | null>
  listHomepageJobs(limit: number): Promise<HomepageJob[]>
  updateHomepageJob(id: string, patch: Partial<HomepageJob>): Promise<HomepageJob>
  /** Find the homepage job a Calendly webhook refers to. */
  findHomepageJobByBooking(field: "event_uri" | "invitee_uri", value: string): Promise<HomepageJob | null>

  insertJob(row: NewJob): Promise<Job>
  updateJob(id: string, patch: Partial<Job>): Promise<Job>
  getJob(id: string): Promise<Job | null>
  getJobByToken(token: string): Promise<Job | null>
  getJobBySession(sessionId: string): Promise<Job | null>
  getJobByApplication(applicationId: string): Promise<Job | null>
  listJobs(limit: number): Promise<Job[]>
  /** Paid builds since an ISO time (for the slot counter). */
  countPaidSince(iso: string): Promise<number>

  getConfigRows(): Promise<Record<string, unknown>>
  setConfigRow(key: string, value: unknown): Promise<void>
  deleteConfigRow(key: string): Promise<void>

  insertAlert(row: AlertRow): Promise<void>
}

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("The database is not configured. Set DATABASE_URL (Neon).")
  }
}

let cached: Repo | null = null

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL)
}

/**
 * Neon (Postgres, via Drizzle) when DATABASE_URL is set. Without it, a local
 * JSON file in .data/ so the funnel can be tested on a laptop. Production never
 * falls back silently.
 */
export async function getRepo(): Promise<Repo> {
  if (cached) return cached
  if (hasDatabase()) {
    const { createNeonRepo } = await import("./neon")
    cached = createNeonRepo()
    return cached
  }
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_LOCAL_DB !== "1") {
    throw new DatabaseNotConfiguredError()
  }
  const { createLocalRepo } = await import("./local")
  cached = createLocalRepo()
  return cached
}

/** For reads that may run during the build (config): null instead of throwing. */
export async function tryGetRepo(): Promise<Repo | null> {
  try {
    return await getRepo()
  } catch {
    return null
  }
}
