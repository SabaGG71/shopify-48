"use client"

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import { cn } from "@/lib/utils"

export type StageStore = { slug: string; name: string; domain: string | null; before: string; after: string }

const HOLD_BEFORE = 1500
const HOLD_BEFORE_AFTER_CLICK = 650
const WIPE_MS = 1900
const HOLD_AFTER = 3200
const IDLE_AFTER_DRAG = 2600

type Phase = "before" | "wiping" | "after" | "manual"
type Slot = "center" | "left" | "right" | "hidden"

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const getReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
const getReducedOnServer = () => false

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

function Lock() {
  return (
    <svg viewBox="0 0 16 16" className="size-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
      <path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7" />
    </svg>
  )
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d={dir === "left" ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * The hero. Real stores we rebuilt stand in a 3D carousel. In the front one a line
 * sweeps across and the old homepage becomes the new one while the clock runs to 48h,
 * then the carousel turns. Visitors can drag the line themselves, click a side card
 * or use the arrows. Nothing follows the pointer on its own.
 */
export function RebuildStage({ stores }: { stores: StageStore[] }) {
  const n = stores.length
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, getReducedOnServer)
  const [front, setFront] = useState(0)
  const [phase, setPhase] = useState<Phase>("before")
  const [pos, setPos] = useState(0)
  const [quickStart, setQuickStart] = useState(false)
  const [paused, setPaused] = useState(false)
  const [onScreen, setOnScreen] = useState(true)
  const [ready, setReady] = useState<Record<string, boolean>>({})
  const [wrapping, setWrapping] = useState<number | null>(null)
  const [dragTick, setDragTick] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const dragging = useRef<number | null>(null)
  const posRef = useRef(0)

  // The timers read the line position without re-arming on every frame.
  useEffect(() => {
    posRef.current = pos
  }, [pos])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.05 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Decode each store's pair; a store only starts its sweep once both are ready. The front store
  // goes first, the others once the page has loaded, so they never slow the first paint.
  useEffect(() => {
    let alive = true
    const decode = (s: StageStore) =>
      Promise.all(
        [s.before, s.after].map((src) => {
          const img = new Image()
          img.src = src
          return img.decode().catch(() => undefined)
        }),
      ).then(() => alive && setReady((r) => ({ ...r, [s.slug]: true })))
    if (stores[0]) decode(stores[0])
    const rest = () => stores.slice(1).forEach(decode)
    if (document.readyState === "complete") rest()
    else window.addEventListener("load", rest, { once: true })
    return () => {
      alive = false
      window.removeEventListener("load", rest)
    }
  }, [stores])

  const current = stores[front]
  const currentReady = !!(current && ready[current.slug])
  const autoplay = !reduced && !paused && onScreen && n > 0

  const goTo = useCallback(
    (k: number, dir: 1 | -1, manual = false) => {
      if (n < 2) return
      const next = ((k % n) + n) % n
      if (n >= 3) {
        // The card that wraps around the back fades out and in again, so its reset is never seen.
        setWrapping(dir === 1 ? (next + 1) % n : (next - 1 + n) % n)
        window.setTimeout(() => setWrapping(null), 560)
      }
      setQuickStart(manual)
      setFront(next)
      setPos(0)
      setPhase("before")
    },
    [n],
  )

  // The autoplay clock for the holds.
  useEffect(() => {
    if (!autoplay || phase === "wiping") return
    if (phase === "before" && !currentReady) return
    const delay = phase === "before" ? (quickStart ? HOLD_BEFORE_AFTER_CLICK : HOLD_BEFORE) : phase === "manual" ? IDLE_AFTER_DRAG : HOLD_AFTER
    const t = window.setTimeout(() => {
      if (phase === "before" || phase === "manual") {
        setQuickStart(false)
        setPhase(posRef.current >= 99.5 ? "after" : "wiping")
      } else goTo(front + 1, 1)
    }, delay)
    return () => window.clearTimeout(t)
    // dragTick restarts the idle timer while someone is dragging.
  }, [autoplay, phase, currentReady, quickStart, front, goTo, dragTick])

  // The sweep itself: from wherever the line is now to the right edge.
  useEffect(() => {
    if (phase !== "wiping" || !autoplay) return
    const from = posRef.current
    const duration = Math.max(400, (WIPE_MS * (100 - from)) / 100)
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration)
      setPos(from + (100 - from) * ease(k))
      if (k < 1) raf = requestAnimationFrame(tick)
      else setPhase("after")
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase, autoplay])

  const fromPointer = (clientX: number) => {
    const el = screenRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)))
    setDragTick((t) => t + 1)
  }

  if (!n) return null
  const centerPos = reduced && phase !== "manual" ? 100 : pos
  const hours = Math.round((48 * centerPos) / 100)

  const slotFor = (k: number): Slot => {
    if (k === wrapping) return "hidden"
    const rel = (k - front + n) % n
    if (rel === 0) return "center"
    if (rel === 1) return "right"
    if (rel === n - 1) return "left"
    return "hidden"
  }

  return (
    <div ref={rootRef} className="rb-wrap relative">
      <div className="rb-stage">
        {stores.map((s, k) => {
          const slot = slotFor(k)
          const isCenter = slot === "center"
          // Side cards: the one just rebuilt shows its new homepage, the next one its old.
          const sidePos = k === wrapping || slot === "left" ? 100 : 0
          const p = isCenter ? centerPos : sidePos
          const status = isCenter
            ? p <= 0
              ? { text: "Old homepage", tone: "idle" }
              : p >= 100
                ? { text: "Rebuilt", tone: "done" }
                : { text: `Rebuilding ${hours}h`, tone: "busy" }
            : p >= 100
              ? { text: "Rebuilt", tone: "done" }
              : { text: "Up next", tone: "idle" }
          return (
            <div
              key={s.slug}
              className="rb-panel"
              data-slot={slot}
              aria-hidden="true"
              onClick={slot === "left" ? () => goTo(k, -1, true) : slot === "right" ? () => goTo(k, 1, true) : undefined}
            >
              <div className="rb-chrome">
                <span className="rb-dots">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="rb-url">
                  <Lock />
                  <span>{s.domain ?? s.name}</span>
                </span>
                <span className="rb-status" data-tone={status.tone}>
                  {status.text}
                </span>
                {isCenter ? <span className="rb-progress" style={{ transform: `scaleX(${p / 100})`, opacity: p > 0 && p < 100 ? 1 : 0 }} /> : null}
              </div>
              <div
                ref={isCenter ? screenRef : undefined}
                className={cn("rb-screen", isCenter && "rb-live")}
                onPointerDown={
                  isCenter
                    ? (e) => {
                        dragging.current = e.pointerId
                        e.currentTarget.setPointerCapture(e.pointerId)
                        setPhase("manual")
                        fromPointer(e.clientX)
                      }
                    : undefined
                }
                onPointerMove={isCenter ? (e) => dragging.current === e.pointerId && fromPointer(e.clientX) : undefined}
                onPointerUp={isCenter ? () => (dragging.current = null) : undefined}
                onPointerCancel={isCenter ? () => (dragging.current = null) : undefined}
              >
                <img src={s.after} alt="" className="rb-img" draggable={false} decoding="async" fetchPriority={k === 0 ? "high" : "low"} loading={k === 0 ? "eager" : "lazy"} />
                <div className="rb-before" style={{ clipPath: `inset(0 0 0 ${p}%)` }}>
                  <img src={s.before} alt="" className="rb-img" draggable={false} decoding="async" fetchPriority={k === 0 ? "high" : "low"} loading={k === 0 ? "eager" : "lazy"} />
                </div>
                {isCenter ? (
                  <>
                    <span className="rb-tag rb-tag-after" data-tone="done" style={{ opacity: p > 12 ? 1 : 0 }}>
                      After
                    </span>
                    <span className="rb-tag rb-tag-before" style={{ opacity: p < 88 ? 1 : 0 }}>
                      Before
                    </span>
                    <span className="rb-line" style={{ left: `${p}%`, opacity: p > 0.5 && p < 99.5 ? 1 : 0 }}>
                      <span className="rb-knob">
                        <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                          <path d="M7 5 2 10l5 5M13 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </span>
                  </>
                ) : (
                  <span className="rb-tag rb-tag-after" data-tone={p >= 100 ? "done" : undefined} style={{ opacity: 1 }}>
                    {p >= 100 ? "After" : "Before"}
                  </span>
                )}
              </div>
            </div>
          )
        })}
        <div className="rb-floor" />
      </div>

      <div className="rb-controls">
        {n > 1 ? (
          <button type="button" className="rb-arrow" onClick={() => goTo(front - 1, -1, true)} aria-label="Previous store">
            <Chevron dir="left" />
          </button>
        ) : null}
        <p className="min-w-0 text-center text-[0.98rem] leading-snug text-soft">
          <span className="font-bold text-ink">{current.name}</span>
          <span className="hidden min-[420px]:inline">, rebuilt by LocalEyes</span>
          {n > 1 ? (
            <span className="text-tan">
              {" "}
              · {front + 1}/{n}
            </span>
          ) : null}
        </p>
        {n > 1 ? (
          <button type="button" className="rb-arrow" onClick={() => goTo(front + 1, 1, true)} aria-label="Next store">
            <Chevron dir="right" />
          </button>
        ) : null}
      </div>
      <p className="rb-hint">
        Drag across the screen to compare.{" "}
        {!reduced ? (
          <button
            type="button"
            onClick={() => setPaused((v) => !v)}
            aria-pressed={paused}
            className="font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-current"
          >
            {paused ? "Play" : "Pause"}
          </button>
        ) : null}
      </p>
      <p className="sr-only" aria-live="polite">
        Showing {current.name}, a store LocalEyes rebuilt.
      </p>
    </div>
  )
}
