// Lists tables in the Neon database (read only). Usage: node --env-file=.env.local scripts/db-inspect.mjs
import { neon } from "@neondatabase/serverless"
const sql = neon(process.env.DATABASE_URL)
const rows = await sql`select table_schema, table_name from information_schema.tables where table_schema not in ('pg_catalog','information_schema') order by 1,2`
console.log(rows.length ? rows.map((r) => `${r.table_schema}.${r.table_name}`).join("\n") : "(no tables)")
const v = await sql`select version()`
console.log(v[0].version.split(",")[0])
