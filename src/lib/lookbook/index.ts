/**
 * The "Pick a look" lookbook: five looks, each with real stores built in that style.
 *
 * Store data and image sizes come from lookbook.generated.json, written by
 * scripts/build-lookbook.mjs from Kent's playbook captures. The copy below (line and
 * chips) is hand written, so regenerating the images never touches it.
 *
 * Look ids are the LOOKS keys in src/lib/options.ts. They are what style_pick stores.
 */
import { LOOKS, type Look } from "@/lib/options"
import generated from "./lookbook.generated.json"

export type ShotView = "desktop" | "mobile"
export type ShotKind = "home" | "collection" | "product"

/** One screenshot. src is the largest width. width/height are its pixel size. blur is a tiny data URI. */
export type Shot = { src: string; srcSet: string; width: number; height: number; blur?: string }

export type LookbookStore = {
  name: string
  slug: string
  url: string
  why: string
  look: Look
  /** Small crop from the top of the phone homepage, for the strip on the closed card. */
  thumb: string
  desktop: Record<ShotKind, Shot>
  mobile: Record<ShotKind, Shot>
}

export type LookbookLook = {
  id: Look
  label: string
  line: string
  chips: string[]
  stores: LookbookStore[]
}

const COPY: Record<Look, { line: string; chips: string[] }> = {
  "loud-and-bold": {
    line: "Big type, strong color, products front and center.",
    chips: ["Heavy display type", "1 or 2 loud colors", "Product on solid color", "Big buttons", "High energy"],
  },
  "editorial-and-moody": {
    line: "Deep color, magazine type and photos with atmosphere.",
    chips: ["Elegant serif type", "One deep, rich color", "Cinematic photos", "Calm, roomy layout", "Quiet luxury"],
  },
  "clean-minimal": {
    line: "White space and the product, with nothing in the way.",
    chips: ["Simple sans type", "Soft, quiet color", "Product on plain ground", "Lots of white space", "Calm and sharp"],
  },
  "playful-and-illustrated": {
    line: "Bright color, drawings and packaging with personality.",
    chips: ["Chunky, rounded type", "Bright pastels", "Illustration and collage", "Packaging up front", "Fun and friendly"],
  },
  "warm-and-natural": {
    line: "Earthy color and real food photos that feel homemade.",
    chips: ["Friendly serif type", "Earthy, warm tones", "Food and table photos", "Relaxed layout", "Cozy and honest"],
  },
}

const stores = generated.stores as LookbookStore[]

/** The five looks in Kent's order, each with its stores in his order. */
export const LOOKBOOK: LookbookLook[] = LOOKS.map((l) => ({
  id: l.key,
  label: l.label,
  ...COPY[l.key],
  stores: stores.filter((s) => s.look === l.key),
}))

export const LOOK_IDS: ReadonlySet<string> = new Set(LOOKS.map((l) => l.key))
export const STORE_SLUGS: ReadonlySet<string> = new Set(stores.map((s) => s.slug))

export function lookById(id: string | null | undefined): LookbookLook | undefined {
  return LOOKBOOK.find((l) => l.id === id)
}
