"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

type Pair = { before?: string | null; after?: string | null }

/**
 * Before and after slider. Drag anywhere (mouse or finger), or use the arrow keys
 * on the handle. Mobile captures on phones, desktop captures from md up.
 */
export function BeforeAfter({
  name,
  desktop,
  mobile,
  className,
}: {
  name: string
  desktop: Pair
  mobile: Pair
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState(50)
  const [dragging, setDragging] = useState(false)
  const interacted = useRef(false)

  const hasDesktop = !!(desktop.before && desktop.after)
  const hasMobile = !!(mobile.before && mobile.after)
  const m = hasMobile ? mobile : desktop
  const d = hasDesktop ? desktop : mobile

  const fromEvent = useCallback((clientX: number) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)))
  }, [])

  // A gentle sweep the first time it comes into view, so people see it moves.
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let raf = 0
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || interacted.current) return
        io.disconnect()
        const start = performance.now()
        const tick = (t: number) => {
          if (interacted.current) return
          const k = Math.min(1, (t - start) / 1800)
          setPos(50 + Math.sin(k * Math.PI * 2) * 22 * (1 - k * 0.35) * (k < 1 ? 1 : 0))
          if (k < 1) raf = requestAnimationFrame(tick)
          else setPos(50)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])

  // A plain render helper (not a component) so images are never remounted while dragging.
  const renderImg = (which: "before" | "after") => (
    <picture>
      {hasMobile && hasDesktop ? <source media="(min-width: 768px)" srcSet={d[which]!} /> : null}
      <img
        src={(hasMobile ? m[which] : d[which])!}
        alt={`${name} ${which === "before" ? "before" : "after"} the rebuild`}
        className="absolute inset-0 size-full object-cover object-top"
        draggable={false}
        loading="lazy"
        decoding="async"
      />
    </picture>
  )

  return (
    <figure className={cn("w-full", className)}>
      <div
        ref={ref}
        className={cn(
          "relative mx-auto w-full touch-pan-y overflow-hidden rounded-[18px] border border-line bg-cream select-none",
          hasMobile ? "aspect-[390/720] max-w-[360px] md:aspect-[16/10] md:max-w-none" : "aspect-[16/10]",
          !hasDesktop && "md:aspect-[390/720] md:max-w-[420px]",
          dragging ? "cursor-grabbing" : "cursor-ew-resize",
        )}
        onPointerDown={(e) => {
          interacted.current = true
          setDragging(true)
          ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
          fromEvent(e.clientX)
        }}
        onPointerMove={(e) => dragging && fromEvent(e.clientX)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        {renderImg("after")}
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          {renderImg("before")}
        </div>
        <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-ink/80 px-3 py-1 text-[0.62rem] font-semibold tracking-[0.2em] text-page uppercase backdrop-blur">
          Before
        </span>
        <span className="pointer-events-none absolute top-3 right-3 rounded-full bg-paper/90 px-3 py-1 text-[0.62rem] font-semibold tracking-[0.2em] text-ink uppercase backdrop-blur">
          After
        </span>
        <div className="pointer-events-none absolute inset-y-0 w-px bg-paper shadow-[0_0_0_1px_rgba(42,36,28,0.15)]" style={{ left: `${pos}%` }} />
        <button
          type="button"
          role="slider"
          aria-label={`Compare ${name} before and after`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          aria-valuetext={`${Math.round(pos)}% before`}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault()
              interacted.current = true
              setPos((p) => Math.min(100, Math.max(0, p + (e.key === "ArrowLeft" ? -5 : 5))))
            }
          }}
          className="absolute top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-line bg-paper text-ink shadow-[0_4px_18px_rgba(42,36,28,0.18)]"
          style={{ left: `${pos}%` }}
        >
          <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M7 5 2 10l5 5M13 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </figure>
  )
}
