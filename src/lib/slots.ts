import "server-only"
import { cacheLife, cacheTag } from "next/cache"
import { tryGetRepo } from "@/lib/db/repo"

/** Monday 00:00 of the current week in New York time, as a UTC instant. */
function weekStartNewYork(now: Date) {
  const nyLocal = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }))
  const offset = now.getTime() - nyLocal.getTime()
  const start = new Date(nyLocal)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  return new Date(start.getTime() + offset)
}

/**
 * Builds paid since Monday (New York time). Cached for a minute and refreshed when
 * a payment clears, so the slot counter shows real numbers. Null if unknown.
 */
export async function paidThisWeek(): Promise<number | null> {
  "use cache"
  cacheLife("minutes")
  cacheTag("slots")
  const repo = await tryGetRepo()
  if (!repo) return null
  try {
    return await repo.countPaidSince(weekStartNewYork(new Date()).toISOString())
  } catch (err) {
    console.error("[slots] could not count paid builds", err)
    return null
  }
}

/** Slots left this week: Kent's manual number if set, otherwise slots per week minus paid builds. */
export async function slotsLeft(perWeek: number | null, manualLeft: number | null): Promise<number | null> {
  if (!perWeek) return null
  if (manualLeft !== null) return Math.max(0, Math.min(perWeek, manualLeft))
  const paid = await paidThisWeek()
  return paid === null ? null : Math.max(0, perWeek - paid)
}
