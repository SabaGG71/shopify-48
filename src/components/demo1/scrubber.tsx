"use client"

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export type ScrubStore = { slug: string; name: string; domain: string | null; before: string; after: string }

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const TICKS = [0, 6, 12, 18, 24, 30, 36, 42, 48]

/**
 * Proof, compact: one window per store and a 0h to 48h timeline under it. Drag the
 * knob (or the page itself) and the new store sweeps in exactly where the knob is.
 * The first time it comes into view it plays once on its own.
 */
export function Scrubber({ stores }: { stores: ScrubStore[] }) {
  const [active, setActive] = useState(0)
  const [t, setT] = useState(0)
  const [dragging, setDragging] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const areaRef = useRef<HTMLDivElement>(null)
  const raf = useRef(0)
  const touched = useRef(false)
  const s = stores[active]

  const play = useCallback(() => {
    cancelAnimationFrame(raf.current)
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setT(55)
      return
    }
    const start = performance.now()
    const run = (now: number) => {
      if (touched.current) return
      const k = (now - start) / 2600
      // up to 48h, then settle back to the middle so both sides show
      const v = k < 0.7 ? ease(k / 0.7) * 100 : 100 - ease(Math.min(1, (k - 0.7) / 0.3)) * 45
      setT(v)
      if (k < 1) raf.current = requestAnimationFrame(run)
    }
    raf.current = requestAnimationFrame(run)
  }, [])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          io.disconnect()
          play()
        }
      },
      { threshold: 0.45 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf.current)
    }
  }, [play])

  const pick = (i: number) => {
    touched.current = false
    setActive(i)
    setT(0)
    play()
  }

  const fromX = (clientX: number) => {
    const el = areaRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setT(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)))
  }
  const onDown = (e: React.PointerEvent) => {
    touched.current = true
    cancelAnimationFrame(raf.current)
    setDragging(true)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    fromX(e.clientX)
  }
  const onMove = (e: React.PointerEvent) => dragging && fromX(e.clientX)
  const onUp = () => setDragging(false)

  if (!s) return null
  const hours = Math.round((t / 100) * 48)

  return (
    <div ref={wrapRef} className="sb">
      <div className="sb-list" role="group" aria-label="Pick a store">
        {stores.map((st, i) => (
          <button key={st.slug} type="button" className="sb-store" aria-pressed={i === active} onClick={() => pick(i)}>
            <span className="min-w-0">
              <span className="block truncate text-[1.02rem] font-bold">{st.name}</span>
              <span className="sb-domain d1-mono mt-0.5 block truncate normal-case text-tan">{st.domain}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="min-w-0">
        <div className="sb-frame">
          <div className="sc-bar">
            <span className="sc-dots">
              <i />
              <i />
              <i />
            </span>
            <span className="sc-url d1-mono normal-case">{s.domain ?? s.name}</span>
            <span className="d1-mono tabular-nums" style={{ color: t >= 99.5 ? "var(--signal)" : "var(--soft)" }}>
              {t <= 0.5 ? "Before" : t >= 99.5 ? "After" : `${hours}h`}
            </span>
          </div>
          <div
            ref={areaRef}
            className={cn("sb-screen", dragging && "cursor-grabbing")}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <img src={s.after} alt={`${s.name} after the rebuild`} className="sb-img" draggable={false} decoding="async" key={`a-${s.slug}`} />
            <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${t}%)` }}>
              <img src={s.before} alt={`${s.name} before the rebuild`} className="sb-img" draggable={false} decoding="async" key={`b-${s.slug}`} />
            </div>
            <span className="sb-line" style={{ left: `${t}%`, opacity: t > 0.5 && t < 99.5 ? 1 : 0 }} aria-hidden="true" />
          </div>
        </div>

        <div className="sb-track" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <span className="sb-rail" aria-hidden="true">
            <span className="sb-fill" style={{ width: `${t}%` }} />
          </span>
          {TICKS.map((h) => (
            <span key={h} className="sb-tick" style={{ left: `${(h / 48) * 100}%` }} data-major={h % 12 === 0 ? "" : undefined} aria-hidden="true">
              {h % 12 === 0 ? <span className="d1-mono sb-tick-label">{h}h</span> : null}
            </span>
          ))}
          <button
            type="button"
            role="slider"
            aria-label={`Rebuild clock for ${s.name}`}
            aria-valuemin={0}
            aria-valuemax={48}
            aria-valuenow={hours}
            aria-valuetext={`${hours} hours`}
            className="sb-knob"
            style={{ left: `${t}%` }}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault()
                touched.current = true
                cancelAnimationFrame(raf.current)
                setT((v) => Math.min(100, Math.max(0, v + (e.key === "ArrowLeft" ? -100 / 48 : 100 / 48))))
              }
            }}
          >
            <span className="sb-readout d1-mono tabular-nums">{hours}h</span>
          </button>
        </div>
        <p className="d1-mono mt-9 text-tan">Drag the clock, or the page, to rebuild it</p>
      </div>
    </div>
  )
}
