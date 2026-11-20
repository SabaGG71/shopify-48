"use client"

import { useCallback, useEffect, useRef, useState, type RefObject } from "react"
import { createPortal } from "react-dom"
import type { LookbookStore, ShotKind, ShotView } from "@/lib/lookbook"
import { cn } from "@/lib/utils"
import { Framed, ShotImg, hostOf, viewWord } from "./shots"
import { prefersReduced } from "./use-media"

/* ---------- Scroll lock (counted, so a lightbox over the sheet keeps the page locked) ---------- */

let locks = 0
let saved: { html: string; body: string; pad: string } | null = null

export function lockScroll() {
  if (locks++ === 0) {
    const html = document.documentElement
    const gap = window.innerWidth - html.clientWidth
    saved = { html: html.style.overflow, body: document.body.style.overflow, pad: document.body.style.paddingRight }
    html.style.overflow = "hidden"
    document.body.style.overflow = "hidden"
    if (gap > 0) document.body.style.paddingRight = `${gap}px`
  }
  let released = false
  return () => {
    if (released) return
    released = true
    if (--locks === 0 && saved) {
      document.documentElement.style.overflow = saved.html
      document.body.style.overflow = saved.body
      document.body.style.paddingRight = saved.pad
      saved = null
    }
  }
}

/* ---------- Focus trap (a stack: only the top layer handles Tab and Escape) ---------- */

const trapStack: symbol[] = []
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean, onEscape: () => void) {
  const escRef = useRef(onEscape)
  useEffect(() => {
    escRef.current = onEscape
  })
  useEffect(() => {
    if (!active) return
    const me = Symbol("trap")
    trapStack.push(me)
    const onKey = (e: KeyboardEvent) => {
      if (trapStack[trapStack.length - 1] !== me) return
      const el = ref.current
      if (!el) return
      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        escRef.current()
        return
      }
      if (e.key !== "Tab") return
      const list = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.getClientRects().length > 0)
      if (!list.length) {
        e.preventDefault()
        return
      }
      const first = list[0]
      const last = list[list.length - 1]
      const inside = el.contains(document.activeElement)
      if (e.shiftKey && (!inside || document.activeElement === first)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", onKey, true)
    return () => {
      document.removeEventListener("keydown", onKey, true)
      const i = trapStack.lastIndexOf(me)
      if (i >= 0) trapStack.splice(i, 1)
    }
  }, [active, ref])
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
    </svg>
  )
}

function ChevronIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 16 16" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d={dir === "left" ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ---------- Bottom sheet (phones) ---------- */

const CLOSE_DISTANCE = 110
const CLOSE_SPEED = 0.55 // px per ms

/**
 * A bottom sheet at 92% of the screen: grab handle, swipe down to close, X in the corner,
 * dimmed and scroll-locked page behind, focus kept inside, Esc closes.
 */
export function Sheet({
  id,
  root,
  variant,
  titleId,
  title,
  onClose,
  children,
  actions,
}: {
  id?: string
  root: HTMLElement
  variant: "demo" | "d1"
  titleId: string
  title: React.ReactNode
  onClose: () => void
  children: React.ReactNode
  actions: React.ReactNode
}) {
  const layerRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const closing = useRef(false)
  const [shown, setShown] = useState(false)

  const setY = (y: number | null) => {
    const el = sheetRef.current
    if (el) el.style.transform = y === null ? "" : `translateY(${y}px)`
  }

  const requestClose = useCallback(() => {
    if (closing.current) return
    closing.current = true
    if (prefersReduced()) {
      onClose()
      return
    }
    sheetRef.current?.removeAttribute("data-dragging")
    setY(null)
    setShown(false)
    window.setTimeout(onClose, 300)
  }, [onClose])

  useEffect(() => lockScroll(), [])
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setShown(true)
      closeRef.current?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(id)
  }, [])
  useFocusTrap(sheetRef, true, requestClose)

  // Drag from the handle or header (pointer events: touch and mouse).
  const drag = useRef<{ y0: number; t0: number; dy: number } | null>(null)
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button, a")) return
    if (e.pointerType === "mouse" && e.button !== 0) return
    drag.current = { y0: e.clientY, t0: performance.now(), dy: 0 }
    sheetRef.current?.setAttribute("data-dragging", "")
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    d.dy = Math.max(0, e.clientY - d.y0)
    setY(d.dy)
  }
  const endDrag = () => {
    const d = drag.current
    drag.current = null
    sheetRef.current?.removeAttribute("data-dragging")
    if (!d) return
    const speed = d.dy / Math.max(1, performance.now() - d.t0)
    if (d.dy > CLOSE_DISTANCE || (d.dy > 24 && speed > CLOSE_SPEED)) requestClose()
    else setY(0)
  }

  // Drag down from the content too, once it is scrolled to the top (touch only).
  useEffect(() => {
    const area = scrollRef.current
    const sheet = sheetRef.current
    if (!area || !sheet) return
    let x0 = 0
    let y0 = 0
    let t0 = 0
    let dy = 0
    let mode: "idle" | "drag" | "scroll" = "idle"
    const start = (e: TouchEvent) => {
      x0 = e.touches[0].clientX
      y0 = e.touches[0].clientY
      t0 = performance.now()
      dy = 0
      mode = "idle"
    }
    const move = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - x0
      const y = e.touches[0].clientY - y0
      if (mode === "idle") {
        if (Math.abs(dx) > 8 || Math.abs(y) > 8) {
          mode = area.scrollTop <= 0 && y > 0 && Math.abs(y) > Math.abs(dx) ? "drag" : "scroll"
          if (mode === "drag") sheet.setAttribute("data-dragging", "")
        }
      }
      if (mode !== "drag") return
      e.preventDefault()
      dy = Math.max(0, y)
      setY(dy)
    }
    const end = () => {
      if (mode !== "drag") return
      mode = "idle"
      sheet.removeAttribute("data-dragging")
      const speed = dy / Math.max(1, performance.now() - t0)
      if (dy > CLOSE_DISTANCE || (dy > 24 && speed > CLOSE_SPEED)) requestClose()
      else setY(0)
    }
    area.addEventListener("touchstart", start, { passive: true })
    area.addEventListener("touchmove", move, { passive: false })
    area.addEventListener("touchend", end)
    area.addEventListener("touchcancel", end)
    return () => {
      area.removeEventListener("touchstart", start)
      area.removeEventListener("touchmove", move)
      area.removeEventListener("touchend", end)
      area.removeEventListener("touchcancel", end)
    }
  }, [requestClose])

  return createPortal(
    <div ref={layerRef} className="lp lp-layer" data-variant={variant} data-shown={shown ? "" : undefined}>
      <div className="lp-backdrop" onClick={requestClose} aria-hidden="true" />
      <div ref={sheetRef} id={id} className="lp-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="lp-sheet-top" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
          <span className="lp-grab" aria-hidden="true" />
          <div className="lp-sheet-head">
            <div className="min-w-0">{title}</div>
            <button ref={closeRef} type="button" className="lp-icon-btn" onClick={requestClose} aria-label="Close">
              <CloseIcon />
            </button>
          </div>
        </div>
        <div ref={scrollRef} className="lp-sheet-scroll">
          {children}
        </div>
        <div className="lp-sheet-actions">{actions}</div>
      </div>
    </div>,
    root,
  )
}

/* ---------- Lightbox ---------- */

const KINDS: { kind: ShotKind; label: string; alt: string }[] = [
  { kind: "home", label: "Homepage", alt: "Homepage" },
  { kind: "collection", label: "Collection page", alt: "Collection page" },
  { kind: "product", label: "Product page", alt: "Product page" },
]

/**
 * One store at full size: its homepage, a collection page and a product page stacked so the
 * view scrolls like the real site. Arrows move to the next and previous store.
 */
export function Lightbox({
  root,
  variant,
  stores,
  index,
  view,
  onIndex,
  onClose,
  onVisit,
}: {
  root: HTMLElement
  variant: "demo" | "d1"
  stores: LookbookStore[]
  index: number
  view: ShotView
  onIndex: (i: number) => void
  onClose: () => void
  onVisit: (store: LookbookStore) => void
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const store = stores[index]
  const n = stores.length
  const prev = (index - 1 + n) % n
  const next = (index + 1) % n

  useEffect(() => lockScroll(), [])
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
  }, [])
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [index])
  useFocusTrap(boxRef, true, onClose)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onIndex(prev)
      else if (e.key === "ArrowRight") onIndex(next)
      else return
      e.preventDefault()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [prev, next, onIndex])

  const host = hostOf(store.url)
  const sizes = view === "desktop" ? "(min-width: 1200px) 1100px, 94vw" : "(min-width: 768px) 400px, 86vw"

  return createPortal(
    <div ref={boxRef} className="lp lp-lightbox" data-variant={variant} role="dialog" aria-modal="true" aria-label={`${store.name}, full size on ${viewWord(view)}`}>
      <div className="lp-lb-top">
        <div className="min-w-0">
          <p className="lp-lb-name">{store.name}</p>
          <p className="lp-lb-why">{store.why}</p>
        </div>
        <div className="lp-lb-tools">
          <span className="lp-lb-count" aria-live="polite">
            {index + 1} of {n}
          </span>
          <a className="lp-visit hidden sm:inline-flex" href={store.url} target="_blank" rel="noopener" onClick={() => onVisit(store)}>
            Visit live site <span aria-hidden="true">↗</span>
          </a>
          <button ref={closeRef} type="button" className="lp-icon-btn" onClick={onClose} aria-label="Close full size view">
            <CloseIcon />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="lp-lb-scroll" data-view={view} tabIndex={0} aria-label={`${store.name} pages`}>
        {KINDS.map(({ kind, label, alt }, i) => (
          <figure key={`${store.slug}-${kind}`} className="lp-lb-figure">
            <Framed view={view} host={host}>
              <ShotImg shot={store[view][kind]} alt={`${alt} of ${store.name} on ${viewWord(view)}`} sizes={sizes} eager={i === 0} />
            </Framed>
            <figcaption className="lp-lb-caption">{label}</figcaption>
          </figure>
        ))}
        <a className="lp-visit sm:hidden" href={store.url} target="_blank" rel="noopener" onClick={() => onVisit(store)}>
          Visit live site <span aria-hidden="true">↗</span>
        </a>
      </div>

      <div className="lp-lb-nav">
        <button type="button" className={cn("lp-lb-arrow", "lp-lb-prev")} onClick={() => onIndex(prev)} aria-label={`Previous store: ${stores[prev].name}`}>
          <ChevronIcon dir="left" />
        </button>
        <button type="button" className={cn("lp-lb-arrow", "lp-lb-next")} onClick={() => onIndex(next)} aria-label={`Next store: ${stores[next].name}`}>
          <ChevronIcon dir="right" />
        </button>
      </div>
    </div>,
    root,
  )
}
