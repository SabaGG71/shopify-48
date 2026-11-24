"use client"

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Check, Ornament } from "@/components/brand/marks"
import type { LookbookEntry } from "@/lib/config/schema"
import { LOOKS, type Look } from "@/lib/options"
import { normalizeUrl } from "@/lib/url"
import { cn } from "@/lib/utils"

const MAX = 3

const WIDE_QUERY = "(min-width: 768px)"
function subscribeWide(cb: () => void) {
  const mq = window.matchMedia(WIDE_QUERY)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
/** Kent: the mobile set on phones, the desktop set on larger screens. */
function useWide() {
  return useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE_QUERY).matches,
    () => false,
  )
}

/** A muted loop that only plays while it is on screen. */
function LoopCard({ entry, wide }: { entry: LookbookEntry; wide: boolean }) {
  const ref = useRef<HTMLVideoElement>(null)
  const video = (wide && entry.video_desktop) || entry.video
  const poster = (wide && entry.screenshot_desktop) || entry.screenshot
  useEffect(() => {
    const v = ref.current
    if (!v || !video) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.4 })
    io.observe(v)
    return () => io.disconnect()
  }, [video])
  return video ? (
    <video
      key={video}
      ref={ref}
      src={video}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      className="absolute inset-0 size-full object-cover object-top"
      aria-hidden="true"
    />
  ) : (
    <img src={poster} alt="" loading="lazy" className="absolute inset-0 size-full object-cover object-top" />
  )
}

export function LookbookDialog({
  open,
  onOpenChange,
  entries,
  selected,
  onChange,
  firstLook,
  max = MAX,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  entries: LookbookEntry[]
  /** Normalized URLs currently picked (lookbook stores and pasted ones). */
  selected: string[]
  onChange: (urls: string[]) => void
  /** How many they can pick. Page 2 allows more than the intake does. */
  max?: number
  /** Show this look's group first (the applicant's style pick). */
  firstLook?: Look | ""
}) {
  const wide = useWide()
  const [paste, setPaste] = useState("")
  const [pasteError, setPasteError] = useState<string | null>(null)

  const groups = useMemo(() => {
    const order = [...LOOKS].sort((a, b) => (a.key === firstLook ? -1 : b.key === firstLook ? 1 : 0))
    return order
      .map((look) => ({ look, items: entries.filter((e) => e.look === look.key) }))
      .filter((g) => g.items.length)
  }, [entries, firstLook])

  const lookbookUrls = new Set(entries.map((e) => normalizeUrl(e.url)))
  const own = selected.filter((u) => !lookbookUrls.has(u))
  const full = selected.length >= max

  const toggle = (url: string) => {
    const n = normalizeUrl(url)
    if (!n) return
    if (selected.includes(n)) onChange(selected.filter((u) => u !== n))
    else if (!full) onChange([...selected, n])
  }

  const addOwn = () => {
    const n = normalizeUrl(paste)
    if (!n) return setPasteError("That doesn't look like a web address.")
    if (selected.includes(n)) return setPaste("")
    if (full) return setPasteError(`You can pick up to ${max}. Remove one first.`)
    onChange([...selected, n])
    setPaste("")
    setPasteError(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-0 left-0 flex h-[100dvh] max-h-none w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none bg-page p-0 ring-0 sm:top-1/2 sm:left-1/2 sm:h-[90vh] sm:max-w-[min(1100px,calc(100%-3rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[22px] sm:ring-1 sm:ring-line"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 pt-5 pb-4 sm:px-8 sm:pt-7">
          <div>
            <p className="micro flex items-center gap-2">
              <Ornament /> Lookbook
            </p>
            <DialogTitle className="display mt-2 text-[1.9rem] font-normal text-ink sm:text-[2.3rem]">Stores you love</DialogTitle>
            <DialogDescription className="mt-1 text-[0.88rem] text-soft">
              Pick up to {max}. All food and drink brands on Shopify.
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-line-strong text-ink hover:bg-paper"
            aria-label="Close lookbook"
          >
            <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="m4 4 8 8M12 4l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6 sm:px-8">
          {groups.map(({ look, items }) => (
            <section key={look.key} className="pt-7" aria-label={look.label}>
              <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
                <h3 className="display text-[1.35rem] text-ink">
                  {look.label}
                  {look.key === firstLook ? <span className="micro ml-3 align-middle text-gold">Your pick</span> : null}
                </h3>
                <p className="hidden text-[0.8rem] text-soft sm:block">{look.hint}</p>
              </div>
              <div className={cn("mt-4 grid gap-x-3 gap-y-5", wide ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-2")}>
                {items.map((entry) => {
                  const n = normalizeUrl(entry.url)!
                  const isOn = selected.includes(n)
                  const disabled = !isOn && full
                  return (
                    <button
                      key={entry.url}
                      type="button"
                      onClick={() => toggle(entry.url)}
                      aria-pressed={isOn}
                      disabled={disabled}
                      className={cn("group text-left disabled:cursor-not-allowed", disabled && "opacity-45")}
                    >
                      <div
                        className={cn(
                          "relative overflow-hidden rounded-[14px] bg-cream ring-1 ring-line transition-[box-shadow,transform] duration-200 group-hover:-translate-y-0.5",
                          wide && entry.video_desktop ? "aspect-[16/10]" : "aspect-[2/3]",
                          isOn && "ring-2 ring-gold ring-offset-[3px] ring-offset-page",
                        )}
                      >
                        <LoopCard entry={entry} wide={wide} />
                        <span
                          className={cn(
                            "absolute top-2 right-2 grid size-7 place-items-center rounded-full border transition-colors",
                            isOn ? "border-gold bg-gold text-paper" : "border-white/70 bg-black/25 text-transparent backdrop-blur",
                          )}
                          aria-hidden="true"
                        >
                          <Check className="size-3.5" />
                        </span>
                      </div>
                      <p className="mt-2.5 text-[0.88rem] font-semibold text-ink">{entry.name}</p>
                      <p className="mt-0.5 text-[0.78rem] leading-snug text-soft">{entry.why}</p>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}

          <section className="mt-9 rounded-2xl border border-line bg-paper/70 p-4 sm:p-5" aria-label="Paste your own">
            <label htmlFor="lookbook-paste" className="text-[0.86rem] font-semibold text-ink">
              Paste your own
            </label>
            <p className="mt-1 text-[0.78rem] text-soft">Any store you love, on Shopify or not.</p>
            <div className="mt-3 flex gap-2">
              <input
                id="lookbook-paste"
                value={paste}
                onChange={(e) => {
                  setPaste(e.target.value)
                  setPasteError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addOwn()
                  }
                }}
                placeholder="favoritestore.com"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="h-12 min-w-0 flex-1 rounded-xl border border-line-strong bg-paper px-4 text-base text-ink outline-none placeholder:text-tan/80 focus:border-gold focus:ring-3 focus:ring-gold/20"
              />
              <button
                type="button"
                onClick={addOwn}
                className="h-12 shrink-0 rounded-xl bg-ink px-5 text-[0.72rem] font-semibold tracking-[0.18em] text-page uppercase"
              >
                Add
              </button>
            </div>
            {pasteError ? (
              <p role="alert" className="mt-2 text-[0.8rem] font-medium text-destructive">
                {pasteError}
              </p>
            ) : null}
            {own.length ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {own.map((u) => (
                  <li key={u} className="flex items-center gap-2 rounded-full border border-line-strong bg-paper py-1 pr-1 pl-3 text-[0.8rem] text-ink">
                    {u.replace(/^https:\/\//, "")}
                    <button
                      type="button"
                      onClick={() => onChange(selected.filter((x) => x !== u))}
                      className="grid size-6 place-items-center rounded-full hover:bg-cream"
                      aria-label={`Remove ${u}`}
                    >
                      <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path d="m4 4 8 8M12 4l-8 8" strokeLinecap="round" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-line bg-page px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8">
          <p className="text-[0.84rem] text-soft">
            <span className="font-semibold text-ink tabular">{selected.length}</span> of {max} picked
          </p>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="min-h-11 rounded-full bg-ink px-6 text-[0.72rem] font-semibold tracking-[0.2em] text-page uppercase"
          >
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
