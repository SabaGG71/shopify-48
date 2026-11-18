/**
 * Every select in the funnel stores an option KEY, never its label.
 * Keys are kebab-case strings. Kent's build agent reads these keys, so do not
 * rename one without telling Kent first (see docs/DATA.md).
 */

export type Option<K extends string = string> = { key: K; label: string; hint?: string }

const opts = <K extends string>(list: readonly Option<K>[]) => list

/* ---------- Apply form ---------- */

export const REVENUE_BANDS = opts([
  { key: "under-5k", label: "Under 5K" },
  { key: "5k-20k", label: "5K to 20K" },
  { key: "20k-50k", label: "20K to 50K" },
  { key: "50k-150k", label: "50K to 150K" },
  { key: "over-150k", label: "Over 150K" },
] as const)
export type RevenueBand = (typeof REVENUE_BANDS)[number]["key"]
/** Bands that count as "5K or higher" for qualification. */
export const QUALIFYING_REVENUE: readonly RevenueBand[] = ["5k-20k", "20k-50k", "50k-150k", "over-150k"]

export const NICHES = opts([
  { key: "tea-and-matcha", label: "Tea and matcha" },
  { key: "chocolate-and-sweets", label: "Chocolate and sweets" },
  { key: "sauces-and-pantry", label: "Sauces and pantry" },
  { key: "bakery", label: "Bakery" },
  { key: "snacks", label: "Snacks" },
  { key: "drinks", label: "Drinks" },
  { key: "coffee", label: "Coffee" },
  { key: "other-food-and-drink", label: "Other food and drink" },
  { key: "something-else", label: "Something else" },
] as const)
export type Niche = (typeof NICHES)[number]["key"]

export const PHONE_CHANNELS = opts([
  { key: "imessage", label: "iMessage" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "sms", label: "SMS" },
] as const)
export type PhoneChannel = (typeof PHONE_CHANNELS)[number]["key"]

/* ---------- Looks ---------- */

export const LOOKS = opts([
  { key: "loud-and-bold", label: "Loud and bold", hint: "Giant type, bright color blocks" },
  { key: "editorial-and-moody", label: "Editorial and moody", hint: "Serif type, deep rich color" },
  { key: "clean-minimal", label: "Clean minimal", hint: "White space, product first" },
  { key: "playful-and-illustrated", label: "Playful and illustrated", hint: "Pastels, rounded, packaging-led" },
  { key: "warm-and-natural", label: "Warm and natural", hint: "Earthy tones, warm food photos" },
] as const)
export type Look = (typeof LOOKS)[number]["key"]

/* ---------- Style detail toggles (intake) ---------- */

export const CORNERS = opts([
  { key: "square", label: "Square" },
  { key: "slight", label: "Slight" },
  { key: "rounded", label: "Rounded" },
  { key: "pill", label: "Pill" },
] as const)
export const FONT_CHOICES = opts([
  { key: "serif", label: "Serif" },
  { key: "sans", label: "Sans" },
  { key: "keep-mine", label: "Keep mine" },
] as const)
export const BUTTON_STYLES = opts([
  { key: "solid", label: "Solid" },
  { key: "outline", label: "Outline" },
  { key: "pill", label: "Pill" },
] as const)
export const MOTION = opts([
  { key: "none", label: "None" },
  { key: "subtle", label: "Subtle" },
  { key: "lively", label: "Lively" },
] as const)
export const DENSITY = opts([
  { key: "airy", label: "Airy" },
  { key: "balanced", label: "Balanced" },
  { key: "compact", label: "Compact" },
] as const)
export const PHOTO_STYLES = opts([
  { key: "product-on-plain", label: "Product on plain" },
  { key: "lifestyle", label: "Lifestyle" },
  { key: "mixed", label: "Mixed" },
] as const)
export const COLOR_MODES = opts([
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
] as const)

export type StyleToggles = {
  corners: (typeof CORNERS)[number]["key"]
  heading_font: (typeof FONT_CHOICES)[number]["key"]
  body_font: (typeof FONT_CHOICES)[number]["key"]
  button_style: (typeof BUTTON_STYLES)[number]["key"]
  motion: (typeof MOTION)[number]["key"]
  density: (typeof DENSITY)[number]["key"]
  photo_style: (typeof PHOTO_STYLES)[number]["key"]
  color_mode: (typeof COLOR_MODES)[number]["key"]
}

export const TOGGLE_FIELDS = [
  { key: "corners", label: "Corners", options: CORNERS },
  { key: "heading_font", label: "Heading font", options: FONT_CHOICES },
  { key: "body_font", label: "Body font", options: FONT_CHOICES },
  { key: "button_style", label: "Button style", options: BUTTON_STYLES },
  { key: "motion", label: "Motion", options: MOTION },
  { key: "density", label: "Density", options: DENSITY },
  { key: "photo_style", label: "Photo style", options: PHOTO_STYLES },
  { key: "color_mode", label: "Color mode", options: COLOR_MODES },
] as const

/** Toggle defaults per look, from the brief's style table. */
export const LOOK_DEFAULTS: Record<Look, StyleToggles> = {
  "loud-and-bold": {
    corners: "slight",
    heading_font: "sans",
    body_font: "sans",
    button_style: "solid",
    motion: "lively",
    density: "compact",
    photo_style: "product-on-plain",
    color_mode: "light",
  },
  "editorial-and-moody": {
    corners: "square",
    heading_font: "serif",
    body_font: "sans",
    button_style: "outline",
    motion: "subtle",
    density: "airy",
    photo_style: "lifestyle",
    color_mode: "dark",
  },
  "clean-minimal": {
    corners: "square",
    heading_font: "sans",
    body_font: "sans",
    button_style: "solid",
    motion: "none",
    density: "airy",
    photo_style: "product-on-plain",
    color_mode: "light",
  },
  "playful-and-illustrated": {
    corners: "pill",
    heading_font: "sans",
    body_font: "sans",
    button_style: "pill",
    motion: "lively",
    density: "balanced",
    photo_style: "mixed",
    color_mode: "light",
  },
  "warm-and-natural": {
    corners: "rounded",
    heading_font: "serif",
    body_font: "sans",
    button_style: "solid",
    motion: "subtle",
    density: "balanced",
    photo_style: "lifestyle",
    color_mode: "light",
  },
}

/* ---------- Intake selects ---------- */

export const COLORS_MODES = opts([
  { key: "keep", label: "Keep my colors" },
  { key: "change", label: "Change them" },
  { key: "not-sure", label: "Not sure" },
] as const)
export const COLOR_ROLES = opts([
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "accent", label: "Accent" },
  { key: "background", label: "Background" },
  { key: "text", label: "Text" },
] as const)
export const FONTS_MODES = opts([
  { key: "keep", label: "Keep my fonts" },
  { key: "change", label: "Pick new ones for me" },
  { key: "upload", label: "I'll upload mine" },
] as const)
export const SUBSCRIPTION_STATUS = opts([
  { key: "none", label: "None" },
  { key: "have-it", label: "Have it" },
  { key: "want-it", label: "Want it" },
] as const)
export const WHOLESALE_STATUS = SUBSCRIPTION_STATUS

export const EMAIL_PLATFORMS = opts([
  { key: "klaviyo", label: "Klaviyo" },
  { key: "shopify-email", label: "Shopify Email" },
  { key: "mailchimp", label: "Mailchimp" },
  { key: "omnisend", label: "Omnisend" },
  { key: "attentive", label: "Attentive" },
  { key: "none", label: "None yet" },
  { key: "other", label: "Other" },
] as const)
export const REVIEWS_APPS = opts([
  { key: "judge-me", label: "Judge.me" },
  { key: "okendo", label: "Okendo" },
  { key: "yotpo", label: "Yotpo" },
  { key: "loox", label: "Loox" },
  { key: "stamped", label: "Stamped" },
  { key: "junip", label: "Junip" },
  { key: "shopify-reviews", label: "Shopify Product Reviews" },
  { key: "none", label: "None yet" },
  { key: "other", label: "Other" },
] as const)

export function labelOf(list: readonly Option[], key: string | null | undefined) {
  if (!key) return ""
  return list.find((o) => o.key === key)?.label ?? key
}

export function isKey<K extends string>(list: readonly Option<K>[], v: unknown): v is K {
  return typeof v === "string" && list.some((o) => o.key === v)
}
