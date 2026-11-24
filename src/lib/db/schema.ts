import { sql } from "drizzle-orm"
import { bigserial, boolean, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import type { BookingInfo, DesignNotes, PaymentInfo, SourceInfo } from "@/lib/types"

/**
 * Neon Postgres schema (Drizzle). Column names are snake_case and match the
 * keys in docs/DATA.md, which Kent's build agent reads.
 */

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" })

/** Every application, partial (screen one only) or submitted, qualified or not. */
export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    created_at: ts("created_at").notNull().defaultNow(),
    updated_at: ts("updated_at").notNull().defaultNow(),
    stage: text("stage").notNull().default("partial"),
    resume_token: text("resume_token").notNull(),
    style_pick: text("style_pick"),
    store_url: text("store_url"),
    revenue_band: text("revenue_band"),
    niche: text("niche"),
    main_problem: text("main_problem"),
    name: text("name"),
    email: text("email"),
    phone: text("phone"),
    phone_channel: text("phone_channel"),
    is_shopify: boolean("is_shopify"),
    shopify_signal: text("shopify_signal"),
    store_checked_at: ts("store_checked_at"),
    store_name: text("store_name"),
    qualified: boolean("qualified"),
    outcome: text("outcome"),
    qualify_reason: text("qualify_reason"),
    needs_review: boolean("needs_review").notNull().default(false),
    reference_stores: jsonb("reference_stores").$type<string[]>(),
    never_want: text("never_want"),
    top_products: jsonb("top_products").$type<string[]>(),
    design_saved_at: ts("design_saved_at"),
    source: jsonb("source").$type<SourceInfo>(),
    submitted_at: ts("submitted_at"),
    // The lookbook ("Pick a look"): free text when no look fits, and what they opened and visited.
    style_other: text("style_other"),
    styles_viewed: jsonb("styles_viewed").$type<string[]>(),
    stores_clicked: jsonb("stores_clicked").$type<string[]>(),
    /** When the Meta Lead event went out. Set once, so Lead fires once per application. */
    lead_at: ts("lead_at"),
    /** Page 2: what they like about each reference store, and optional preferences. */
    design_notes: jsonb("design_notes").$type<DesignNotes>(),
  },
  (t) => [index("applications_created_idx").on(t.created_at), index("applications_email_idx").on(sql`lower(${t.email})`)],
)

/** The record Kent's agent reads to build the free homepage. One per application. */
export const homepageJobs = pgTable("homepage_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  created_at: ts("created_at").notNull().defaultNow(),
  updated_at: ts("updated_at").notNull().defaultNow(),
  application_id: uuid("application_id")
    .notNull()
    .unique()
    .references(() => applications.id, { onDelete: "cascade" }),
  store_url: text("store_url").notNull(),
  style_pick: text("style_pick").notNull(),
  reference_stores: jsonb("reference_stores").$type<string[]>().notNull().default([]),
  never_want: text("never_want"),
  top_products: jsonb("top_products").$type<string[]>().notNull().default([]),
  design_notes: jsonb("design_notes").$type<DesignNotes>(),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  phone_channel: text("phone_channel"),
  call_time: ts("call_time"),
  booking: jsonb("booking").$type<BookingInfo>(),
  status: text("status").notNull().default("booked"),
})

/**
 * A paid 48 hour rebuild: the intake draft while it is filled, and the final
 * document in `doc`. doc.baseline holds client numbers: never show them on LE HQ.
 */
export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    created_at: ts("created_at").notNull().defaultNow(),
    updated_at: ts("updated_at").notNull().defaultNow(),
    application_id: uuid("application_id").references(() => applications.id, { onDelete: "set null" }),
    intake_token: text("intake_token").notNull().unique(),
    email: text("email"),
    name: text("name"),
    store_url: text("store_url"),
    status: text("status").notNull().default("awaiting_intake"),
    paid_at: ts("paid_at"),
    stripe_session_id: text("stripe_session_id").unique(),
    payment: jsonb("payment").$type<PaymentInfo>(),
    intake_step: integer("intake_step").notNull().default(1),
    intake_draft: jsonb("intake_draft").$type<Record<string, unknown>>().notNull().default({}),
    intake_submitted_at: ts("intake_submitted_at"),
    access_confirmed: boolean("access_confirmed").notNull().default(false),
    clock_started_at: ts("clock_started_at"),
    doc: jsonb("doc").$type<Record<string, unknown>>(),
  },
  (t) => [index("jobs_created_idx").on(t.created_at)],
)

/** Kent's settings (prices, links, videos, lookbook, proof stores), edited in /admin. */
export const siteConfig = pgTable("site_config", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updated_at: ts("updated_at").notNull().defaultNow(),
})

/** Every alert sent or attempted to Kent, with delivery results. */
export const alerts = pgTable("alerts", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  created_at: ts("created_at").notNull().defaultNow(),
  kind: text("kind").notNull(),
  message: text("message").notNull(),
  context: jsonb("context").$type<Record<string, unknown>>(),
  delivered: jsonb("delivered").$type<Record<string, unknown>>(),
})
