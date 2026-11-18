import "server-only"
import { cacheLife, cacheTag } from "next/cache"
import { tryGetRepo } from "@/lib/db/repo"
import { DEFAULT_CONFIG } from "./defaults"
import { CONFIG_KEYS, JSON_KEYS, configSchema, type ConfigKey, type SiteConfig } from "./schema"

export type { SiteConfig } from "./schema"

function parseEnvValue(key: ConfigKey, raw: string): unknown {
  if (JSON_KEYS.includes(key)) {
    try {
      return JSON.parse(raw)
    } catch {
      console.error(`[config] env ${key} is not valid JSON, ignored`)
      return undefined
    }
  }
  return raw
}

/** Validate one key at a time so one bad value never takes the page down. */
function pick(key: ConfigKey, value: unknown): unknown {
  const field = configSchema.shape[key]
  const res = field.safeParse(value)
  if (!res.success) {
    console.error(`[config] ${key} is invalid, falling back`, res.error.issues[0]?.message)
    return undefined
  }
  return res.data
}

export function mergeConfig(dbRows: Record<string, unknown>): SiteConfig {
  const out: Record<string, unknown> = { ...DEFAULT_CONFIG }
  for (const key of CONFIG_KEYS) {
    const env = process.env[key]
    if (env !== undefined && env !== "") {
      const v = pick(key, parseEnvValue(key, env))
      if (v !== undefined) out[key] = v
    }
    if (key in dbRows) {
      const v = pick(key, dbRows[key])
      if (v !== undefined) out[key] = v
    }
  }
  return out as SiteConfig
}

/**
 * Site config: database row, else env var of the same name, else the default.
 * Cached for a minute; /admin saves expire the "config" tag right away.
 */
export async function getConfig(): Promise<SiteConfig> {
  "use cache"
  cacheLife("minutes")
  cacheTag("config")
  const repo = await tryGetRepo()
  let rows: Record<string, unknown> = {}
  if (repo) {
    try {
      rows = await repo.getConfigRows()
    } catch (err) {
      const cause = err instanceof Error && err.cause instanceof Error ? err.cause.message : String((err as { cause?: unknown })?.cause ?? "")
      console.error("[config] could not read site_config, using env and defaults.", err instanceof Error ? err.message : err, cause ? `Cause: ${cause}` : "")
    }
  }
  return mergeConfig(rows)
}

/** Config fields that are safe to send to the browser. */
export function publicConfig(c: SiteConfig) {
  return {
    PRICE_DISPLAY: c.PRICE_DISPLAY,
    RESERVE_URL: c.RESERVE_URL,
    BOOKING_URL: c.BOOKING_URL,
    KENT_TEXT_NUMBER: c.KENT_TEXT_NUMBER,
    NICHE_LABEL: c.NICHE_LABEL,
    LOOKBOOK: c.LOOKBOOK,
  }
}
export type PublicConfig = ReturnType<typeof publicConfig>

/** Placeholders for missing config show in dev and on Vercel previews, never in production. */
export function showMissingConfig() {
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV !== "production"
  return process.env.NODE_ENV !== "production"
}
