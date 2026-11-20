"use client"

import { useEffect, useRef, useState } from "react"
import { DemoButton } from "@/components/demo/demo-ui"
import { D1Button } from "@/components/demo1/ui"
import type { LookbookLook, LookbookStore, ShotView } from "@/lib/lookbook"
import { cn } from "@/lib/utils"
import { Framed, ShotImg, hostOf, viewWord } from "./shots"
import { prefersReduced } from "./use-media"

export type Variant = "demo" | "d1"

/** sizes for a home shot in the open look, matching the CSS below. */
export function sizesFor(view: ShotView, wide: boolean, count: number) {
  if (!wide) return view === "desktop" ? "92vw" : "min(70vw, 300px)"
  if (view === "desktop") return count >= 4 ? "(min-width: 1180px) 520px, 44vw" : "(min-width: 1180px) 350px, 29vw"
  return "(min-width: 1180px) 250px, 21vw"
}

function StoreItem({
  store,
  view,
  sizes,
  eager,
  onOpen,
  onVisit,
}: {
  store: LookbookStore
  view: ShotView
  sizes: string
  eager: boolean
  onOpen: (opener: HTMLElement) => void
  onVisit: (store: LookbookStore) => void
}) {
  return (
    <figure className="lp-store" data-view={view}>
      <button type="button" className="lp-shot-btn" onClick={(e) => onOpen(e.currentTarget)}>
        <Framed view={view} host={hostOf(store.url)}>
          <ShotImg shot={store[view].home} alt={`Homepage of ${store.name} on ${viewWord(view)}`} sizes={sizes} eager={eager} />
        </Framed>
        <span className="sr-only">Open full size</span>
      </button>
      <figcaption className="lp-store-cap">
        <span className="lp-store-name">{store.name}</span>
        <span className="lp-store-why">{store.why}</span>
        <a className="lp-visit" href={store.url} target="_blank" rel="noopener" onClick={() => onVisit(store)}>
          Visit live site <span aria-hidden="true">↗</span>
        </a>
      </figcaption>
    </figure>
  )
}

/** Phones: one store per slide, swipe or use the dots or the arrow keys. */
function Carousel({
  look,
  view,
  onOpen,
  onVisit,
}: {
  look: LookbookLook
  view: ShotView
  onOpen: (index: number, opener: HTMLElement) => void
  onVisit: (store: LookbookStore) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const n = look.stores.length

  // A new look starts on its first store.
  useEffect(() => {
    ref.current?.scrollTo({ left: 0 })
  }, [look.id])

  const go = (i: number) => {
    const el = ref.current
    const slide = el?.children[Math.max(0, Math.min(n - 1, i))] as HTMLElement | undefined
    if (!el || !slide) return
    el.scrollTo({ left: slide.offsetLeft - el.offsetLeft - parseFloat(getComputedStyle(el).paddingLeft || "0"), behavior: prefersReduced() ? "auto" : "smooth" })
  }

  return (
    <div className="lp-carousel-wrap">
      <div
        ref={ref}
        className="lp-carousel"
        role="region"
        aria-roledescription="carousel"
        aria-label={`${look.label} stores`}
        tabIndex={0}
        onScroll={(e) => {
          const el = e.currentTarget
          const w = el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetWidth : el.clientWidth
          const i = Math.round(el.scrollLeft / Math.max(1, w + 14))
          if (i !== active) setActive(Math.max(0, Math.min(n - 1, i)))
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(active + 1)
          else if (e.key === "ArrowLeft") go(active - 1)
          else return
          e.preventDefault()
        }}
      >
        {look.stores.map((s, i) => (
          <div key={s.slug} className="lp-slide" role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${n}: ${s.name}`}>
            <StoreItem store={s} view={view} sizes={sizesFor(view, false, n)} eager={i < 2} onOpen={(el) => onOpen(i, el)} onVisit={onVisit} />
          </div>
        ))}
      </div>
      <div className="lp-dots-nav">
        {look.stores.map((s, i) => (
          <button key={s.slug} type="button" className="lp-dot" aria-label={`Show ${s.name}`} aria-current={i === active ? "true" : undefined} onClick={() => go(i)} />
        ))}
      </div>
    </div>
  )
}

/** The open look: name, line, chips, the Desktop / Phone toggle and the stores. */
export function LookPanelBody({
  look,
  variant,
  view,
  wide,
  titleId,
  inSheet,
  onView,
  onOpenShot,
  onVisit,
}: {
  look: LookbookLook
  variant: Variant
  view: ShotView
  wide: boolean
  titleId: string
  inSheet?: boolean
  onView: (v: ShotView) => void
  onOpenShot: (index: number, opener: HTMLElement) => void
  onVisit: (store: LookbookStore) => void
}) {
  const n = look.stores.length
  return (
    <div className="lp-body">
      <div className="lp-head">
        <div className="min-w-0">
          {inSheet ? null : (
            <h3 id={titleId} data-lp-title tabIndex={-1} className={cn("lp-title", variant === "demo" ? "d-display" : "d1-h2")}>
              {look.label}
            </h3>
          )}
          <p className="lp-line">{look.line}</p>
          <ul className="lp-chips" aria-label="What makes this look">
            {look.chips.map((c) => (
              <li key={c} className={cn("lp-chip", variant === "d1" && "d1-mono")}>
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="lp-gallery-head">
        <p className="lp-gallery-label">
          {n} real stores in this look. Tap one to see it full size.
        </p>
        <div className="lp-toggle" role="group" aria-label="Show the stores on">
          <button type="button" aria-pressed={view === "desktop"} onClick={() => onView("desktop")}>
            <svg viewBox="0 0 20 16" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <rect x="1.5" y="1.5" width="17" height="10.5" rx="1.5" />
              <path d="M7 14.5h6" strokeLinecap="round" />
            </svg>
            Desktop
          </button>
          <button type="button" aria-pressed={view === "mobile"} onClick={() => onView("mobile")}>
            <svg viewBox="0 0 12 18" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <rect x="1.5" y="1" width="9" height="16" rx="2" />
              <path d="M5 14h2" strokeLinecap="round" />
            </svg>
            Phone
          </button>
        </div>
      </div>

      {wide ? (
        <ul className="lp-grid" data-view={view} data-count={n} style={{ ["--lp-n" as string]: n }}>
          {look.stores.map((s, i) => (
            <li key={s.slug}>
              <StoreItem store={s} view={view} sizes={sizesFor(view, true, n)} eager={i < 2} onOpen={(el) => onOpenShot(i, el)} onVisit={onVisit} />
            </li>
          ))}
        </ul>
      ) : (
        <Carousel look={look} view={view} onOpen={onOpenShot} onVisit={onVisit} />
      )}
    </div>
  )
}

/** Pick mode: "Pick this look" and "Keep looking". Browse mode: "See if you qualify". */
export function LookActions({
  mode,
  variant,
  look,
  picked,
  onPick,
  onKeepLooking,
  onQualify,
}: {
  mode: "pick" | "browse"
  variant: Variant
  look: LookbookLook
  picked: boolean
  onPick: () => void
  onKeepLooking: () => void
  onQualify: () => void
}) {
  const Button = variant === "demo" ? DemoButton : D1Button
  if (mode === "browse") {
    return (
      <>
        <Button type="button" onClick={onQualify} className="lp-primary">
          See if you qualify
        </Button>
        <button type="button" className="lp-keep" onClick={onKeepLooking}>
          Keep looking
        </button>
      </>
    )
  }
  return (
    <>
      <Button type="button" onClick={onPick} className="lp-primary">
        {picked ? "Keep this look" : "Pick this look"}
      </Button>
      <button type="button" className="lp-keep" onClick={onKeepLooking}>
        Keep looking
      </button>
      <span className="sr-only" aria-live="polite">
        {picked ? `${look.label} is your pick.` : ""}
      </span>
    </>
  )
}
