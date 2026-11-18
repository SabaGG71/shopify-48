import { z } from "zod"
import { LOOKS, NICHES } from "@/lib/options"

const lookKeys = LOOKS.map((l) => l.key) as [string, ...string[]]
const nicheKeys = NICHES.map((n) => n.key) as [string, ...string[]]

export const proofStoreSchema = z.object({
  slug: z.string(),
  name: z.string(),
  /** Only stores with cleared: true are ever shown. */
  cleared: z.boolean(),
  caption: z.string().nullish(),
  before_desktop: z.string().nullish(),
  after_desktop: z.string().nullish(),
  before_mobile: z.string().nullish(),
  after_mobile: z.string().nullish(),
})
export type ProofStore = z.infer<typeof proofStoreSchema>

export const lookbookEntrySchema = z.object({
  name: z.string(),
  url: z.string(),
  screenshot: z.string(),
  look: z.enum(lookKeys),
  why: z.string(),
  /** Optional muted loop for the card. */
  video: z.string().nullish(),
  stills: z.array(z.string()).nullish(),
  /** Desktop set, shown on larger screens (Kent: mobile on phones, desktop on larger screens). */
  screenshot_desktop: z.string().nullish(),
  video_desktop: z.string().nullish(),
  stills_desktop: z.array(z.string()).nullish(),
})
export type LookbookEntry = z.infer<typeof lookbookEntrySchema>

export const finePrintSchema = z.object({ title: z.string(), body: z.string() })

const optionalUrl = z.string().trim().default("")
const optionalNumber = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? null : typeof v === "string" ? Number(v) : v),
  z.number().int().min(0).nullable(),
).default(null)
const boolish = z.preprocess(
  (v) => (typeof v === "string" ? ["true", "1", "on", "yes"].includes(v.trim().toLowerCase()) : v),
  z.boolean(),
).default(false)

/**
 * Every value Kent supplies. Stored as rows in the `site_config` table
 * (key = the name below, value = JSON). A row wins over an env var of the same
 * name, which wins over the default in defaults.ts.
 */
export const configSchema = z.object({
  PRICE_DISPLAY: z.string().trim().default(""),
  RESERVE_URL: optionalUrl,
  BOOKING_URL: optionalUrl,
  VSL_URL: optionalUrl,
  VSL_POSTER_URL: optionalUrl,
  VSL_CAPTIONS_URL: optionalUrl,
  CONFIRM_VIDEO_URL: optionalUrl,
  CONFIRM_CAPTIONS_URL: optionalUrl,
  INTAKE_VIDEO_URL: optionalUrl,
  INTAKE_CAPTIONS_URL: optionalUrl,
  COLLAB_HOWTO_VIDEO_URL: optionalUrl,
  STORE_SCORE_URL: optionalUrl,
  KENT_TEXT_NUMBER: z.string().trim().default(""),
  SLOT_COUNTER_ON: boolish,
  SLOTS_PER_WEEK: optionalNumber,
  SLOTS_LEFT: optionalNumber,
  NICHE_LABEL: z.string().trim().default("food and drink brands"),
  ACTIVE_NICHES: z.array(z.enum(nicheKeys)).default([]),
  PROOF_STORES: z.array(proofStoreSchema).default([]),
  LOOKBOOK: z.array(lookbookEntrySchema).default([]),
  WHAT_YOU_GET: z.array(z.string()).default([]),
  FINE_PRINT: z.array(finePrintSchema).default([]),
})

export type SiteConfig = z.infer<typeof configSchema>
export type ConfigKey = keyof SiteConfig
export const CONFIG_KEYS = Object.keys(configSchema.shape) as ConfigKey[]

/** Keys whose value is JSON (arrays/objects) rather than a plain string. */
export const JSON_KEYS: ConfigKey[] = ["ACTIVE_NICHES", "PROOF_STORES", "LOOKBOOK", "WHAT_YOU_GET", "FINE_PRINT"]
export const NUMBER_KEYS: ConfigKey[] = ["SLOTS_PER_WEEK", "SLOTS_LEFT"]
export const BOOLEAN_KEYS: ConfigKey[] = ["SLOT_COUNTER_ON"]
