"use client"

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

type Region = { x: number; y: number; w: number; h: number }
type Note = { key: string; side: "left" | "right"; title: string; body: string; region: Region }

/**
 * What changed, measured on Lake Effect's real homepage (1600 x 1000 capture, in %).
 * Every note describes something you can see on the page; nothing is a result claim.
 */
const NOTES: Note[] = [
  {
    key: "headline",
    side: "left",
    title: "Says what they are, and where",
    body: "One headline: a West Allis coffee roaster, cafe and catering.",
    region: { x: 9.2, y: 19, w: 38.6, h: 33.6 },
  },
  {
    key: "paths",
    side: "left",
    title: "Two clear paths",
    body: "Shop coffee or book catering, side by side.",
    region: { x: 9.6, y: 66.3, w: 27.6, h: 8 },
  },
  {
    key: "offers",
    side: "left",
    title: "Reasons to buy, up front",
    body: "Free pickup, free shipping, subscribe and save, giving back.",
    region: { x: 9.6, y: 74.6, w: 33.8, h: 16 },
  },
  {
    key: "nav",
    side: "right",
    title: "Catering gets its own door",
    body: "Its own menu, and a booking button in the header.",
    region: { x: 23.8, y: 5, w: 64.2, h: 8 },
  },
  {
    key: "photos",
    side: "right",
    title: "Their cafe, their coffee",
    body: "Real photos of their own cafe and their own bag.",
    region: { x: 53.2, y: 28.6, w: 38.2, h: 51.4 },
  },
]

type Line = { key: string; d: string; dot: [number, number]; end: [number, number] }

/**
 * One rebuild, marked up like a designer's proof: the new homepage in the middle,
 * the changes as notes in the margins, and thin lines that draw themselves from each
 * note to its spot. Point at a note (or tap it on a phone) to light up its spot.
 */
export function Story({ before, after, domain }: { before: string; after: string; domain: string }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const noteRefs = useRef<Record<string, HTMLElement | null>>({})
  const [lines, setLines] = useState<Line[]>([])
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [active, setActive] = useState<string | null>(null)
  const [inView, setInView] = useState(false)

  const measure = useCallback(() => {
    const root = rootRef.current
    const screen = screenRef.current
    if (!root || !screen) return
    const R = root.getBoundingClientRect()
    const S = screen.getBoundingClientRect()
    setSize({ w: R.width, h: R.height })
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setLines([])
      return
    }
    const next: Line[] = []
    for (const n of NOTES) {
      const el = noteRefs.current[n.key]
      if (!el) continue
      const N = el.getBoundingClientRect()
      const ry = S.top - R.top + ((n.region.y + n.region.h / 2) / 100) * S.height
      const ny = N.top - R.top + 14
      if (n.side === "left") {
        const x1 = N.right - R.left + 14
        const x2 = S.left - R.left + (n.region.x / 100) * S.width - 6
        const dx = Math.max(30, (x2 - x1) * 0.55)
        next.push({ key: n.key, d: `M${x1},${ny} C${x1 + dx},${ny} ${x2 - dx},${ry} ${x2},${ry}`, dot: [x1, ny], end: [x2, ry] })
      } else {
        const x1 = N.left - R.left - 14
        const x2 = S.left - R.left + ((n.region.x + n.region.w) / 100) * S.width + 6
        const dx = Math.max(30, (x1 - x2) * 0.55)
        next.push({ key: n.key, d: `M${x1},${ny} C${x1 - dx},${ny} ${x2 + dx},${ry} ${x2},${ry}`, dot: [x1, ny], end: [x2, ry] })
      }
    }
    setLines(next)
  }, [])

  useLayoutEffect(() => {
    measure()
    const ro = new ResizeObserver(measure)
    if (rootRef.current) ro.observe(rootRef.current)
    window.addEventListener("resize", measure)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [measure])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const note = (n: Note, i: number) => (
    <button
      key={n.key}
      type="button"
      ref={(el) => {
        noteRefs.current[n.key] = el
      }}
      className="rl-note"
      data-side={n.side}
      data-on={active === n.key ? "" : undefined}
      data-dim={active && active !== n.key ? "" : undefined}
      style={{ ["--rl-delay" as string]: `${300 + i * 220}ms` }}
      onMouseEnter={() => setActive(n.key)}
      onMouseLeave={() => setActive(null)}
      onFocus={() => setActive(n.key)}
      onBlur={() => setActive(null)}
      onClick={() => setActive((a) => (a === n.key ? null : n.key))}
    >
      <span className="block text-[1.02rem] leading-snug font-bold text-ink">{n.title}</span>
      <span className="mt-1 block text-[0.9rem] leading-snug text-soft">{n.body}</span>
    </button>
  )

  const on = NOTES.find((n) => n.key === active)?.region

  return (
    <div ref={rootRef} className="rl" data-in={inView ? "" : undefined}>
      <div className="rl-grid">
        <div className="rl-col rl-left">{NOTES.filter((n) => n.side === "left").map((n, i) => note(n, i))}</div>

        <div className="rl-figure">
          <div className="rl-frame">
            <div className="sc-bar">
              <span className="sc-dots">
                <i />
                <i />
                <i />
              </span>
              <span className="sc-url d1-mono normal-case">{domain}</span>
              <span className="w-10" aria-hidden="true" />
            </div>
            <div ref={screenRef} className="rl-screen">
              <img src={after} alt={`Lake Effect Coffee Co. homepage after the rebuild`} className="rl-img" onLoad={measure} decoding="async" loading="lazy" />
              {NOTES.map((n) => (
                <span
                  key={n.key}
                  className="rl-box"
                  data-on={active === n.key ? "" : undefined}
                  style={{ left: `${n.region.x}%`, top: `${n.region.y}%`, width: `${n.region.w}%`, height: `${n.region.h}%` }}
                  onMouseEnter={() => setActive(n.key)}
                  onMouseLeave={() => setActive(null)}
                  aria-hidden="true"
                />
              ))}
              <span
                className="rl-dim"
                style={
                  on
                    ? { left: `${on.x}%`, top: `${on.y}%`, width: `${on.w}%`, height: `${on.h}%`, opacity: 1 }
                    : { left: "0%", top: "0%", width: "100%", height: "100%", opacity: 0 }
                }
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        <div className="rl-col rl-right">
          {NOTES.filter((n) => n.side === "right").map((n, i) => note(n, i + 3))}
          <figure className="rl-before">
            <img src={before} alt="Lake Effect Coffee Co. homepage before the rebuild" loading="lazy" decoding="async" />
            <figcaption className="mt-2.5">
              <span className="block text-[1.02rem] font-bold text-ink">Before</span>
              <span className="mt-1 block text-[0.9rem] leading-snug text-soft">Three icons and a latte photo, the details in small print.</span>
            </figcaption>
          </figure>
        </div>
      </div>

      {lines.length ? (
        <svg className="rl-lines" width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`} aria-hidden="true">
          {lines.map((l, i) => (
            <g key={l.key} className={cn("rl-line", active === l.key && "is-on", active && active !== l.key && "is-dim")} style={{ ["--rl-delay" as string]: `${250 + i * 220}ms` }}>
              <path d={l.d} pathLength={1} />
              <circle cx={l.dot[0]} cy={l.dot[1]} r={3} />
              <rect x={l.end[0] - 3.5} y={l.end[1] - 3.5} width={7} height={7} />
            </g>
          ))}
        </svg>
      ) : null}
    </div>
  )
}
