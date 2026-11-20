"use client"

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"

export type Film = { slug: string; name: string; domain: string | null; src: string; poster: string }

// Each film: the old homepage for ~2s, a wipe, then the new site scrolling (see public/demo1).
const WIPE_AT = 2.1

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const getReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
const getReducedOnServer = () => false

/** "Lake Effect Coffee Co." -> "Lake Effect", for the playlist. */
const shortName = (name: string) => name.replace(/\s+(coffee|roasters|co\.?|company).*$/i, "").trim() || name

const clock = (s: number) => `0:${String(Math.max(0, Math.round(s))).padStart(2, "0")}`

function Sources({ src }: { src: string }) {
  return (
    <>
      {/* H.264 for Safari and Chrome; WebM for browsers without H.264 (Chromium, some Firefox builds). */}
      <source src={src} type="video/mp4" />
      <source src={src.replace(/\.mp4$/, ".webm")} type="video/webm" />
    </>
  )
}

function PlayIcon({ playing }: { playing: boolean }) {
  return playing ? (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden="true">
      <rect x="3.5" y="3" width="3" height="10" rx="1" />
      <rect x="9.5" y="3" width="3" height="10" rx="1" />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden="true">
      <path d="M4.5 3.2v9.6a.6.6 0 0 0 .9.5l7.6-4.8a.6.6 0 0 0 0-1L5.4 2.7a.6.6 0 0 0-.9.5Z" />
    </svg>
  )
}

/**
 * The hero's right side: short films of real stores we rebuilt, in a player with a
 * playlist under it. Muted, plays through the list on its own; tap a film to jump.
 * Click the film (or the expand button) and it grows into a big player in the middle
 * of the screen, from the same second.
 */
export function HeroFilms({ films }: { films: Film[] }) {
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, getReducedOnServer)
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [after, setAfter] = useState(false)
  const [time, setTime] = useState({ now: 0, total: 12 })
  const [expanded, setExpanded] = useState(false)
  const [portalTo, setPortalTo] = useState<Element | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const bigRef = useRef<HTMLVideoElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)
  const bigBarRef = useRef<HTMLSpanElement>(null)
  const thumbBarRef = useRef<HTMLSpanElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const expandRef = useRef<HTMLButtonElement>(null)
  const visible = useRef(true)
  const handoff = useRef(0)
  const film = films[active]

  // The big player lives inside the page's root so it keeps the page's fonts and colours.
  useEffect(() => {
    setPortalTo(boxRef.current?.closest(".d1-root") ?? document.body)
  }, [])

  const live = useCallback(() => (expanded ? bigRef.current : videoRef.current), [expanded])

  // Progress without re-rendering every frame.
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const v = live()
      if (v && v.duration) {
        const p = String(v.currentTime / v.duration)
        barRef.current?.style.setProperty("--p", p)
        bigBarRef.current?.style.setProperty("--p", p)
        thumbBarRef.current?.style.setProperty("--p", p)
        const isAfter = v.currentTime >= WIPE_AT
        setAfter((a) => (a === isAfter ? a : isAfter))
        setTime((t) => (Math.round(t.now) === Math.round(v.currentTime) && t.total === v.duration ? t : { now: v.currentTime, total: v.duration }))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [live])

  // Pause the small player off screen; play again when back (unless paused by hand).
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        visible.current = e.isIntersecting
        const v = videoRef.current
        if (!v || expanded) return
        if (!e.isIntersecting) v.pause()
        else if (playing && !reduced) v.play().catch(() => {})
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [playing, reduced, expanded])

  const go = useCallback(
    (i: number) => {
      setPlaying(true)
      setActive((i + films.length) % films.length)
    },
    [films.length],
  )

  const open = () => {
    handoff.current = videoRef.current?.currentTime ?? 0
    const from = playerRef.current?.getBoundingClientRect() ?? null
    videoRef.current?.pause()
    setExpanded(true)
    requestAnimationFrame(() => {
      const big = bigRef.current
      if (big) {
        big.currentTime = handoff.current
        if (playing && !reduced) big.play().catch(() => {})
      }
      const frame = frameRef.current
      if (frame && from && !reduced) {
        const to = frame.getBoundingClientRect()
        frame.animate(
          [
            { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})` },
            { transform: "none" },
          ],
          { duration: 560, easing: "cubic-bezier(0.2, 0.85, 0.2, 1)" },
        )
      }
      closeRef.current?.focus()
    })
  }

  const close = useCallback(() => {
    handoff.current = bigRef.current?.currentTime ?? 0
    const finish = () => {
      setExpanded(false)
      requestAnimationFrame(() => {
        const v = videoRef.current
        if (v) {
          v.currentTime = handoff.current
          if (playing && !reduced && visible.current) v.play().catch(() => {})
        }
      })
    }
    const frame = frameRef.current
    const to = playerRef.current?.getBoundingClientRect()
    if (frame && to && !reduced) {
      const from = frame.getBoundingClientRect()
      frame
        .animate(
          [
            { transform: "none" },
            { transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.width / from.width}, ${to.height / from.height})` },
          ],
          { duration: 420, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" },
        )
        .finished.then(finish, finish)
    } else finish()
  }, [playing, reduced])

  // After closing, focus goes back to the button that opened it.
  const wasOpen = useRef(false)
  useEffect(() => {
    if (expanded) wasOpen.current = true
    else if (wasOpen.current) {
      wasOpen.current = false
      expandRef.current?.focus()
    }
  }, [expanded])

  // While open: Esc closes and the page underneath does not scroll.
  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      html.style.overflow = prev
    }
  }, [expanded, close])

  if (!film) return null

  const toggle = () => {
    const v = live()
    if (!v) return
    if (v.paused) {
      setPlaying(true)
      v.play().catch(() => {})
    } else {
      setPlaying(false)
      v.pause()
    }
  }
  const isPlaying = playing && !reduced

  return (
    <div ref={boxRef} className="fv">
      <div ref={playerRef} className="fv-player" style={{ visibility: expanded ? "hidden" : undefined }}>
        <video
          key={film.slug}
          ref={videoRef}
          poster={film.poster}
          muted
          playsInline
          autoPlay={!reduced}
          preload="auto"
          onClick={open}
          onEnded={() => go(active + 1)}
          className="cursor-zoom-in"
          aria-label={`Film: ${film.name}, its old homepage, then the store we rebuilt`}
        >
          <Sources src={film.src} />
        </video>
        <div className="fv-top">
          <span className="fv-chip d1-mono" data-after={after ? "" : undefined}>
            {after ? "After · rebuilt by LocalEyes" : "Before"}
          </span>
          <span className="fv-chip fv-chip-domain d1-mono normal-case">{film.domain ?? film.name}</span>
        </div>
        <div className="fv-bottom">
          <button type="button" className="fv-play" onClick={toggle} aria-label={isPlaying ? "Pause film" : "Play film"}>
            <PlayIcon playing={isPlaying} />
          </button>
          <span className="truncate text-[0.92rem] font-bold">{film.name}</span>
          <span className="fv-progress" aria-hidden="true">
            <span ref={barRef} />
          </span>
          <span className="d1-mono shrink-0 tabular-nums text-white/75">
            {clock(time.now)} / {clock(time.total)}
          </span>
          <button ref={expandRef} type="button" className="fv-icon" onClick={open} aria-label="Watch bigger">
            <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M9.5 2.5h4v4M6.5 13.5h-4v-4M13.5 2.5 9 7M2.5 13.5 7 9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="fv-list" role="group" aria-label="Films">
        {films.map((f, i) => (
          <button key={f.slug} type="button" className="fv-thumb" aria-pressed={i === active} onClick={() => go(i)}>
            <span className="relative block">
              <img src={f.poster} alt="" loading="lazy" decoding="async" />
              {i === active ? (
                <span className="fv-thumb-bar" aria-hidden="true">
                  <span ref={thumbBarRef} />
                </span>
              ) : null}
            </span>
            <span className="fv-thumb-meta">
              <span className="truncate text-[0.88rem] font-bold text-ink">{shortName(f.name)}</span>
              <span className="d1-mono shrink-0 text-tan">0:12</span>
            </span>
          </button>
        ))}
      </div>

      {expanded && portalTo
        ? createPortal(
            <div
              className="fv-modal"
              role="dialog"
              aria-modal="true"
              aria-label={`${film.name}, before and after`}
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) close()
              }}
            >
              <div ref={frameRef} className="fv-modal-frame">
                <video key={`big-${film.slug}`} ref={bigRef} poster={film.poster} muted playsInline autoPlay={!reduced} preload="auto" onEnded={() => go(active + 1)}>
                  <Sources src={film.src} />
                </video>
                <div className="fv-top">
                  <span className="fv-chip d1-mono" data-after={after ? "" : undefined}>
                    {after ? "After · rebuilt by LocalEyes" : "Before"}
                  </span>
                </div>
                <button ref={closeRef} type="button" className="fv-close" onClick={close} aria-label="Close">
                  <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="m4 4 8 8M12 4l-8 8" strokeLinecap="round" />
                  </svg>
                </button>
                <div className="fv-bottom">
                  <button type="button" className="fv-icon" onClick={() => go(active - 1)} aria-label="Previous film">
                    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                      <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button type="button" className="fv-play" onClick={toggle} aria-label={isPlaying ? "Pause film" : "Play film"}>
                    <PlayIcon playing={isPlaying} />
                  </button>
                  <button type="button" className="fv-icon" onClick={() => go(active + 1)} aria-label="Next film">
                    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                      <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <span className="truncate text-[1rem] font-bold">{film.name}</span>
                  <span className="fv-progress" aria-hidden="true">
                    <span ref={bigBarRef} />
                  </span>
                  <span className="d1-mono shrink-0 tabular-nums text-white/75">
                    {clock(time.now)} / {clock(time.total)}
                  </span>
                </div>
              </div>
            </div>,
            portalTo,
          )
        : null}
    </div>
  )
}
