import {
  BUTTON_STYLES,
  COLOR_MODES,
  COLOR_ROLES,
  COLORS_MODES,
  CORNERS,
  DENSITY,
  EMAIL_PLATFORMS,
  FONT_CHOICES,
  FONTS_MODES,
  LOOKS,
  MOTION,
  PHONE_CHANNELS,
  PHOTO_STYLES,
  REVIEWS_APPS,
  SUBSCRIPTION_STATUS,
  WHOLESALE_STATUS,
  isKey,
  type Option,
} from "@/lib/options"
import type { UploadedFile } from "@/lib/types"
import { isEmail, normalizeHex, normalizePhone, normalizeStoreUrl, normalizeUrl, normalizeUrlList } from "@/lib/url"

export const INTAKE_STEPS = [
  { key: "access", title: "Access", lead: "Let us into the store so we can build in a copy of your theme." },
  { key: "brand", title: "Brand", lead: "Logo, colors, fonts and the look you picked." },
  { key: "sells", title: "What sells", lead: "Your best sellers and what we should push." },
  { key: "customer", title: "Customer", lead: "Who buys, what they ask, and what stops them." },
  { key: "offers", title: "Offers", lead: "Shipping, gifts, bundles and subscriptions." },
  { key: "apps", title: "Apps", lead: "What stays and what goes." },
  { key: "numbers", title: "Numbers", lead: "Last 30 days from Shopify, so we can measure the change." },
  { key: "contact", title: "Contact and timing", lead: "Who approves the preview, and when not to launch." },
] as const
export const STEP_COUNT = INTAKE_STEPS.length

export type FileRef = UploadedFile
export type ColorEntry = { hex: string; role: string }
export type DateRange = { start: string; end: string }
export type YesNo = { enabled: boolean | null; details: string }

/** Everything the intake form holds while it is being filled (and saved as the draft). */
export type IntakeDraft = {
  store_url: string
  collab_code: string
  access_confirmed: boolean

  logo_files: FileRef[]
  colors_mode: string
  colors: ColorEntry[]
  colors_from_store: boolean
  fonts_mode: string
  font_files: FileRef[]
  style_pick: string
  corners: string
  heading_font: string
  body_font: string
  button_style: string
  motion: string
  density: string
  photo_style: string
  color_mode: string
  reference_stores: string[]
  never_want: string

  top_products: string[]
  margin_products: string[]
  push_products: string[]
  photo_link: string
  photo_files: FileRef[]
  locked_pages: string[]

  customer: string
  faqs: string[]
  objection: string
  best_review: string

  free_ship_mode: string
  free_ship_threshold: string
  gift_tiers: YesNo
  bundles: YesNo
  subscriptions_status: string
  subscriptions_app: string
  wholesale: string
  no_discounts: string

  email_platform: string
  email_platform_other: string
  reviews_app: string
  reviews_app_other: string
  keep_apps: string
  remove_apps: string

  base_cvr: string
  base_aov: string
  base_sessions: string
  base_revenue: string
  base_screenshot: FileRef[]

  phone: string
  phone_channel: string
  approver_name: string
  approver_email: string
  blackout_dates: DateRange[]
  notes: string
}

export const UPLOAD_FIELDS = ["logo_files", "font_files", "photo_files", "base_screenshot"] as const
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024
export const UPLOAD_ACCEPT = "image/*,.svg,.pdf,.ttf,.otf,.woff,.woff2,.zip"
export type UploadField = (typeof UPLOAD_FIELDS)[number]

export const EMPTY_DRAFT: IntakeDraft = {
  store_url: "",
  collab_code: "",
  access_confirmed: false,
  logo_files: [],
  colors_mode: "",
  colors: [],
  colors_from_store: false,
  fonts_mode: "",
  font_files: [],
  style_pick: "",
  corners: "",
  heading_font: "",
  body_font: "",
  button_style: "",
  motion: "",
  density: "",
  photo_style: "",
  color_mode: "",
  reference_stores: [],
  never_want: "",
  top_products: [],
  margin_products: [],
  push_products: [],
  photo_link: "",
  photo_files: [],
  locked_pages: [],
  customer: "",
  faqs: ["", "", ""],
  objection: "",
  best_review: "",
  free_ship_mode: "",
  free_ship_threshold: "",
  gift_tiers: { enabled: null, details: "" },
  bundles: { enabled: null, details: "" },
  subscriptions_status: "",
  subscriptions_app: "",
  wholesale: "",
  no_discounts: "",
  email_platform: "",
  email_platform_other: "",
  reviews_app: "",
  reviews_app_other: "",
  keep_apps: "",
  remove_apps: "",
  base_cvr: "",
  base_aov: "",
  base_sessions: "",
  base_revenue: "",
  base_screenshot: [],
  phone: "",
  phone_channel: "",
  approver_name: "",
  approver_email: "",
  blackout_dates: [],
  notes: "",
}

/** Merge a saved draft (possibly older or partial) over the empty shape. */
export function hydrateDraft(saved: Record<string, unknown> | null | undefined): IntakeDraft {
  const d = { ...EMPTY_DRAFT } as Record<string, unknown>
  for (const [k, v] of Object.entries(saved ?? {})) {
    if (!(k in EMPTY_DRAFT) || v === null || v === undefined) continue
    d[k] = v
  }
  const out = d as IntakeDraft
  if (!Array.isArray(out.faqs) || out.faqs.length < 3) out.faqs = [...(out.faqs ?? []), "", "", ""].slice(0, 3)
  return out
}

/* ---------------- validation ---------------- */

const NUMBER = /^\d+(\.\d+)?$/
export const toNumber = (v: string) => {
  const s = (v ?? "").toString().replace(/[$,%\s]/g, "")
  return NUMBER.test(s) ? Number(s) : null
}

export type StepErrors = Partial<Record<string, string>>

function validSelect(list: readonly Option[], v: string) {
  return isKey(list, v)
}

/** Required fields per step. Optional fields only get format checks. */
export function validateStep(step: number, d: IntakeDraft): StepErrors {
  const e: StepErrors = {}
  switch (step) {
    case 1: {
      if (!normalizeStoreUrl(d.store_url)) e.store_url = "Enter your store's web address."
      const code = d.collab_code.trim()
      if (!code) e.collab_code = "Add your collaborator request code."
      else if (!/^\d{4,8}$/.test(code.replace(/\s/g, ""))) e.collab_code = "The code is a short number, usually 4 digits."
      break
    }
    case 2: {
      if (!validSelect(COLORS_MODES, d.colors_mode)) e.colors_mode = "Pick one."
      d.colors.forEach((c, i) => {
        if (c.hex && !normalizeHex(c.hex)) e[`colors.${i}`] = "Use a hex code like #1A2B3C."
      })
      if (!validSelect(FONTS_MODES, d.fonts_mode)) e.fonts_mode = "Pick one."
      if (d.fonts_mode === "upload" && !d.font_files.length) e.font_files = "Upload your font files, or pick another option."
      if (!validSelect(LOOKS, d.style_pick)) e.style_pick = "Pick a look."
      break
    }
    case 3: {
      if (!normalizeUrlList(d.top_products).length) e.top_products = "Add at least one product link."
      if (d.photo_link && !normalizeUrl(d.photo_link)) e.photo_link = "That link doesn't look right."
      break
    }
    case 4: {
      if (d.customer.trim().length < 3) e.customer = "Tell us who buys from you."
      break
    }
    case 5: {
      if (d.free_ship_mode !== "amount" && d.free_ship_mode !== "none") e.free_ship_threshold = "Pick an amount or no free shipping."
      else if (d.free_ship_mode === "amount" && toNumber(d.free_ship_threshold) === null) e.free_ship_threshold = "Enter the amount, like 50."
      if (d.gift_tiers.enabled === null) e.gift_tiers = "Pick yes or no."
      if (d.bundles.enabled === null) e.bundles = "Pick yes or no."
      if (!validSelect(SUBSCRIPTION_STATUS, d.subscriptions_status)) e.subscriptions = "Pick one."
      if (!validSelect(WHOLESALE_STATUS, d.wholesale)) e.wholesale = "Pick one."
      break
    }
    case 6: {
      if (!validSelect(EMAIL_PLATFORMS, d.email_platform)) e.email_platform = "Pick one."
      else if (d.email_platform === "other" && !d.email_platform_other.trim()) e.email_platform = "Which one?"
      if (!validSelect(REVIEWS_APPS, d.reviews_app)) e.reviews_app = "Pick one."
      else if (d.reviews_app === "other" && !d.reviews_app_other.trim()) e.reviews_app = "Which one?"
      break
    }
    case 7: {
      const hasShot = d.base_screenshot.length > 0
      const fields = ["base_cvr", "base_aov", "base_sessions", "base_revenue"] as const
      for (const f of fields) {
        const v = d[f].trim()
        if (v && toNumber(v) === null) e[f] = "Numbers only."
        else if (!v && !hasShot) e[f] = "Add this, or upload the analytics screenshot below."
      }
      break
    }
    case 8: {
      if (!normalizePhone(d.phone)) e.phone = "Enter a number we can text."
      if (!validSelect(PHONE_CHANNELS, d.phone_channel)) e.phone_channel = "Pick one."
      if (!d.approver_name.trim()) e.approver_name = "Who signs off on the preview?"
      if (!isEmail(d.approver_email)) e.approver_email = "Enter a valid email."
      d.blackout_dates.forEach((r, i) => {
        if ((r.start && !r.end) || (!r.start && r.end) || (r.start && r.end && r.end < r.start)) e[`blackout.${i}`] = "Check these dates."
      })
      break
    }
  }
  return e
}

export function validateAll(d: IntakeDraft) {
  const all: Record<number, StepErrors> = {}
  for (let s = 1; s <= STEP_COUNT; s++) {
    const e = validateStep(s, d)
    if (Object.keys(e).length) all[s] = e
  }
  return all
}

/* ---------------- final document ---------------- */

const text = (v: string | null | undefined) => {
  const t = (v ?? "").trim()
  return t ? t : null
}
const list = <T>(v: T[] | null | undefined) => (v && v.length ? v : null)
const urls = (v: string[]) => list(normalizeUrlList(v, 20))
const files = (v: FileRef[]) => list((v ?? []).filter((f) => f?.url).map((f) => ({ name: f.name, url: f.url, type: f.type })))
const key = (opts: readonly Option[], v: string) => (isKey(opts, v) ? v : null)
const selectOrOther = (opts: readonly Option[], v: string, other: string) => (v === "other" ? text(other) : key(opts, v))

/**
 * The JSON document Kent's build agent reads. Keys exactly as in the brief,
 * grouped by step. URLs https with no trailing slash, hex uppercase with #,
 * selects as option keys, empty optional fields null, files as {name, url, type}.
 */
export function buildIntakeDoc(
  job: { id: string; created_at: string; clock_started_at: string | null; status: string },
  d: IntakeDraft,
) {
  const storeUrl = normalizeStoreUrl(d.store_url)
  const colors = d.colors
    .map((c) => ({ hex: normalizeHex(c.hex), role: key(COLOR_ROLES, c.role) }))
    .filter((c): c is { hex: string; role: string | null } => !!c.hex)
  const blackout = d.blackout_dates.filter((r) => r.start && r.end).map((r) => ({ start: r.start, end: r.end }))
  const sessions = toNumber(d.base_sessions)

  return {
    job_id: job.id,
    store_url: storeUrl,
    created_at: job.created_at,
    clock_started_at: job.clock_started_at,
    status: job.status,
    access: {
      store_url: storeUrl,
      collab_code: text(d.collab_code.replace(/\s/g, "")),
      access_confirmed: Boolean(d.access_confirmed),
    },
    brand: {
      logo_files: files(d.logo_files),
      colors_mode: key(COLORS_MODES, d.colors_mode),
      colors: list(colors),
      colors_from_store: Boolean(d.colors_from_store),
      fonts_mode: key(FONTS_MODES, d.fonts_mode),
      font_files: files(d.font_files),
      style_pick: key(LOOKS, d.style_pick),
      corners: key(CORNERS, d.corners),
      heading_font: key(FONT_CHOICES, d.heading_font),
      body_font: key(FONT_CHOICES, d.body_font),
      button_style: key(BUTTON_STYLES, d.button_style),
      motion: key(MOTION, d.motion),
      density: key(DENSITY, d.density),
      photo_style: key(PHOTO_STYLES, d.photo_style),
      color_mode: key(COLOR_MODES, d.color_mode),
      reference_stores: urls(d.reference_stores),
      never_want: text(d.never_want),
    },
    sells: {
      top_products: urls(d.top_products),
      margin_products: urls(d.margin_products),
      push_products: urls(d.push_products),
      photo_link: normalizeUrl(d.photo_link),
      photo_files: files(d.photo_files),
      locked_pages: urls(d.locked_pages),
    },
    customer: {
      customer: text(d.customer),
      faqs: list(d.faqs.map((f) => f.trim()).filter(Boolean)),
      objection: text(d.objection),
      best_review: text(d.best_review),
    },
    offers: {
      free_ship_threshold: d.free_ship_mode === "amount" ? toNumber(d.free_ship_threshold) : null,
      gift_tiers: d.gift_tiers.enabled === null ? null : { enabled: d.gift_tiers.enabled, details: d.gift_tiers.enabled ? text(d.gift_tiers.details) : null },
      bundles: d.bundles.enabled === null ? null : { enabled: d.bundles.enabled, details: d.bundles.enabled ? text(d.bundles.details) : null },
      subscriptions: key(SUBSCRIPTION_STATUS, d.subscriptions_status)
        ? { status: d.subscriptions_status, app: d.subscriptions_status === "none" ? null : text(d.subscriptions_app) }
        : null,
      wholesale: key(WHOLESALE_STATUS, d.wholesale),
      no_discounts: text(d.no_discounts),
    },
    apps: {
      email_platform: selectOrOther(EMAIL_PLATFORMS, d.email_platform, d.email_platform_other),
      reviews_app: selectOrOther(REVIEWS_APPS, d.reviews_app, d.reviews_app_other),
      keep_apps: text(d.keep_apps),
      remove_apps: text(d.remove_apps),
    },
    baseline: {
      base_cvr: toNumber(d.base_cvr),
      base_aov: toNumber(d.base_aov),
      base_sessions: sessions === null ? null : Math.round(sessions),
      base_revenue: toNumber(d.base_revenue),
      base_screenshot: files(d.base_screenshot),
    },
    contact: {
      phone: normalizePhone(d.phone),
      phone_channel: key(PHONE_CHANNELS, d.phone_channel),
      approver_name: text(d.approver_name),
      approver_email: text(d.approver_email)?.toLowerCase() ?? null,
      blackout_dates: list(blackout),
      notes: text(d.notes),
    },
  }
}
export type IntakeDoc = ReturnType<typeof buildIntakeDoc>
