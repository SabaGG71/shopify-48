// Runs the same Drizzle query the site uses for config. Usage: node --env-file=.env.local scripts/db-check.mjs
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core"
const siteConfig = pgTable("site_config", { key: text("key").primaryKey(), value: jsonb("value").notNull(), updated_at: timestamp("updated_at", { withTimezone: true }) })
const db = drizzle(neon(process.env.DATABASE_URL))
try {
  const rows = await db.select({ key: siteConfig.key, value: siteConfig.value }).from(siteConfig)
  console.log("ok", rows)
} catch (e) {
  console.error("FAILED", e.message, "\nCAUSE:", e.cause?.message ?? e.cause)
}
