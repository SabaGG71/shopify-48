#!/usr/bin/env node
/**
 * Lookbook images and data for the "Pick a look" picker, built from Kent's playbook captures.
 *
 *   node scripts/build-lookbook.mjs <path to playbook-1>
 *
 * Reads <playbook>/lookbook.json and <look>/<slug>/{desktop,mobile}/{1-home,2-collection,3-product}.png.
 * Writes, for every store:
 *   public/lookbook/<look>/<slug>/desktop/<shot>-700.webp and <shot>-1400.webp
 *   public/lookbook/<look>/<slug>/mobile/<shot>-300.webp and <shot>-600.webp
 *   public/lookbook/<look>/<slug>/thumb.webp   (top of the phone homepage, 160x200)
 * then src/lib/lookbook/lookbook.generated.json, which src/lib/lookbook/index.ts reads.
 *
 * Every image is flattened onto white and saved as WebP at quality 80, effort 6. A file over
 * 240 KiB is encoded again 5 quality points lower until it fits, so none passes 250 KB.
 * The home shot of each view also gets a tiny blurred placeholder as a data URI.
 *
 * Safe to run again (the Dec 2 recapture keeps the same file names). It only writes the names
 * above and never deletes anything. The older files in public/lookbook (1-home.webp,
 * poster.webp, desktop/1-home.webp and so on) belong to /book and /intake and are left alone.
 * It never reads or writes an mp4: the heist desktop and sanzo mobile loops are hand fixes.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const LOOKBOOK_DIR = path.join(ROOT, "public", "lookbook")
const OUT_JSON = path.join(ROOT, "src", "lib", "lookbook", "lookbook.generated.json")

/** Look ids in Kent's order. They must match LOOKS in src/lib/options.ts. */
const LOOKS = ["loud-and-bold", "editorial-and-moody", "clean-minimal", "playful-and-illustrated", "warm-and-natural"]
const SHOTS = [
  ["home", "1-home"],
  ["collection", "2-collection"],
  ["product", "3-product"],
]
/** Output widths per view, smallest first (src is the last one), and the blur placeholder width. */
const VIEWS = {
  desktop: { widths: [700, 1400], blurWidth: 16 },
  mobile: { widths: [300, 600], blurWidth: 10 },
}
const THUMB = { width: 160, height: 200, quality: 70 }
const QUALITY = 80
const EFFORT = 6
const BLUR_QUALITY = 40
const TARGET_BYTES = 240 * 1024
const HARD_LIMIT = 250_000
const MIN_QUALITY = 20
const WHITE = { r: 255, g: 255, b: 255 }
const CONCURRENCY = Math.max(1, Math.min(6, os.availableParallelism() - 1))
/** The only file names this script may write. Everything else in public/lookbook is off limits. */
const OWN_NAME = /^(?:(?:1-home|2-collection|3-product)-(?:300|600|700|1400)|thumb)\.webp$/

if (!process.argv[2]) {
  console.error("Usage: node scripts/build-lookbook.mjs <path to playbook-1>")
  process.exit(1)
}
const PLAYBOOK = path.resolve(process.argv[2])

/** Every file written this run, for the summary. */
const written = []

async function save(file, data, quality) {
  if (!OWN_NAME.test(path.basename(file))) throw new Error(`Refusing to write ${file}`)
  if (data.length > HARD_LIMIT) throw new Error(`${file} is ${data.length} bytes, over the ${HARD_LIMIT} limit`)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, data)
  written.push({ file: path.relative(ROOT, file).split(path.sep).join("/"), bytes: data.length, quality })
}

/** Encodes a fresh pipeline from `build`, stepping quality down by 5 until the file fits. */
async function encode(build, quality, label) {
  for (let q = quality; ; q -= 5) {
    const { data, info } = await build().webp({ quality: q, effort: EFFORT }).toBuffer({ resolveWithObject: true })
    if (data.length <= TARGET_BYTES) return { data, info, quality: q }
    if (q - 5 < MIN_QUALITY) {
      if (data.length <= HARD_LIMIT) return { data, info, quality: q }
      throw new Error(`${label} is ${data.length} bytes even at quality ${q}`)
    }
  }
}

const publicUrl = (...parts) => ["", "lookbook", ...parts].join("/")

async function buildStore(store) {
  const { look, slug } = store
  const out = {
    name: store.name,
    slug,
    url: store.url,
    why: store.why,
    look,
    thumb: publicUrl(look, slug, "thumb.webp"),
    desktop: {},
    mobile: {},
  }
  for (const [view, { widths, blurWidth }] of Object.entries(VIEWS)) {
    for (const [kind, file] of SHOTS) {
      const png = await readFile(path.join(PLAYBOOK, look, slug, view, `${file}.png`))
      const base = () => sharp(png).flatten({ background: WHITE })

      const sizes = []
      for (const width of widths) {
        const name = `${file}-${width}.webp`
        const res = await encode(() => base().resize({ width }), QUALITY, `${look}/${slug}/${view}/${name}`)
        await save(path.join(LOOKBOOK_DIR, look, slug, view, name), res.data, res.quality)
        sizes.push({ src: publicUrl(look, slug, view, name), width: res.info.width, height: res.info.height })
      }
      const largest = sizes[sizes.length - 1]
      const shot = {
        src: largest.src,
        srcSet: sizes.map((s) => `${s.src} ${s.width}w`).join(", "),
        width: largest.width,
        height: largest.height,
      }

      if (kind === "home") {
        const tiny = await base().resize({ width: blurWidth }).webp({ quality: BLUR_QUALITY, effort: EFFORT }).toBuffer()
        shot.blur = `data:image/webp;base64,${tiny.toString("base64")}`
      }
      if (view === "mobile" && kind === "home") {
        const res = await encode(
          () => base().resize({ width: THUMB.width, height: THUMB.height, fit: "cover", position: "top" }),
          THUMB.quality,
          `${look}/${slug}/thumb.webp`,
        )
        await save(path.join(LOOKBOOK_DIR, look, slug, "thumb.webp"), res.data, res.quality)
      }
      out[view][kind] = shot
    }
  }
  return out
}

const manifest = JSON.parse(await readFile(path.join(PLAYBOOK, "lookbook.json"), "utf8"))
const stores = manifest.stores
if (!Array.isArray(stores) || stores.length === 0) throw new Error("lookbook.json has no stores")
const seen = new Set()
for (const s of stores) {
  for (const key of ["name", "slug", "url", "why", "look"]) {
    if (typeof s[key] !== "string" || !s[key].trim()) throw new Error(`Store ${s.slug ?? s.name} has no ${key}`)
  }
  if (!LOOKS.includes(s.look)) throw new Error(`${s.slug} has an unknown look "${s.look}"`)
  if (!/^[a-z0-9-]+$/.test(s.slug)) throw new Error(`Bad slug "${s.slug}"`)
  if (seen.has(s.slug)) throw new Error(`Duplicate slug "${s.slug}"`)
  seen.add(s.slug)
}

console.log(`Building ${stores.length} stores from ${PLAYBOOK} (${CONCURRENCY} at a time)`)
const results = new Array(stores.length)
let next = 0
await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, stores.length) }, async () => {
    while (next < stores.length) {
      const i = next++
      results[i] = await buildStore(stores[i])
      console.log(`  done ${stores[i].look}/${stores[i].slug}`)
    }
  }),
)

const unique = (key) => [...new Set(stores.map((s) => s[key]).filter(Boolean))].join(", ")
const data = {
  source: `${path.basename(PLAYBOOK)}/lookbook.json, captured ${unique("captured")}, recapture after ${unique("recapture_after")}`,
  stores: results,
}
await mkdir(path.dirname(OUT_JSON), { recursive: true })
await writeFile(OUT_JSON, JSON.stringify(data, null, 2) + "\n")

const total = written.reduce((n, w) => n + w.bytes, 0)
const kb = (n) => `${(n / 1024).toFixed(1)} KiB`
const groups = {}
for (const w of written) {
  const group = w.file.endsWith("thumb.webp") ? "thumb" : w.file.split("/").at(-2)
  groups[group] = (groups[group] ?? 0) + 1
}
console.log(`\nWrote ${written.length} images, ${kb(total)} in all:`, groups)
console.log("Largest:")
for (const w of [...written].sort((a, b) => b.bytes - a.bytes).slice(0, 5)) {
  console.log(`  ${kb(w.bytes).padStart(10)}  q${w.quality}  ${w.file}`)
}
const stepped = written.filter((w) => w.quality < (w.file.endsWith("thumb.webp") ? THUMB.quality : QUALITY))
console.log(stepped.length ? "Quality stepped down:" : "No file needed a lower quality.")
for (const w of stepped) console.log(`  q${w.quality}  ${kb(w.bytes)}  ${w.file}`)
console.log(`\nWrote ${path.relative(ROOT, OUT_JSON).split(path.sep).join("/")}`)
