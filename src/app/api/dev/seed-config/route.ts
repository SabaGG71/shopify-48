import { revalidateTag } from "next/cache"
import { DEFAULT_CONFIG } from "@/lib/config/defaults"
import type { ConfigKey } from "@/lib/config/schema"
import { getRepo } from "@/lib/db/repo"

/** The content Kent edits in /admin. Prices, links and videos stay empty until Kent fills them. */
const SEED_KEYS: ConfigKey[] = ["NICHE_LABEL", "ACTIVE_NICHES", "SLOT_COUNTER_ON", "PROOF_STORES", "LOOKBOOK", "WHAT_YOU_GET", "FINE_PRINT"]

/**
 * DEV ONLY. Writes the default content into the database's site_config table,
 * so every editable setting lives in the database. Overwrites those keys.
 * Disabled in production unless ALLOW_TEST_TOOLS=1.
 */
export async function POST() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_TEST_TOOLS !== "1") {
    return new Response("Not found", { status: 404 })
  }
  const repo = await getRepo()
  for (const key of SEED_KEYS) await repo.setConfigRow(key, DEFAULT_CONFIG[key])
  revalidateTag("config", "max")
  return Response.json({ ok: true, repo: repo.kind, keys: SEED_KEYS })
}
