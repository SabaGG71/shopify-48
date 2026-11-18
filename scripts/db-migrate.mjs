// Applies the SQL migrations in ./drizzle to the Neon database.
// Usage: npm run db:migrate   (reads DATABASE_URL from .env.local)
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { migrate } from "drizzle-orm/neon-http/migrator"

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set")
  process.exit(1)
}
const db = drizzle(neon(process.env.DATABASE_URL))
await migrate(db, { migrationsFolder: "./drizzle" })
console.log("Migrations applied")
