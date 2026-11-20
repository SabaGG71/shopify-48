"use client"

import { useEffect, useRef } from "react"

export type Film = { slug: string; name: string; domain: string | null; film: string; poster: string }

function FilmWin({ f }: { f: Film }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) v.play().catch(() => {})
        else v.pause()
      },
      { threshold: 0.4 },
    )
    io.observe(v)
    return () => io.disconnect()
  }, [])
  return (
    <figure>
      <div className="d2-film-win">
        <div className="d2-winbar" aria-hidden="true">
          <i />
          <i />
          <i />
          <span>{f.domain ?? f.name}</span>
        </div>
        <video ref={ref} poster={f.poster} muted loop playsInline preload="metadata" aria-label={`Film: ${f.name}, the old homepage, then the store we rebuilt`}>
          <source src={f.film} type="video/mp4" />
          <source src={f.film.replace(/\.mp4$/, ".webm")} type="video/webm" />
        </video>
      </div>
      <figcaption className="mt-3 text-[0.92rem]">
        <span className="font-semibold text-ink">{f.name}</span>
        <span className="text-soft">. Old homepage, then ours.</span>
      </figcaption>
    </figure>
  )
}

/** Three real rebuilds, each a short film that plays while it is on screen. */
export function FilmsRow({ films }: { films: Film[] }) {
  return (
    <div className="d2-films">
      {films.map((f) => (
        <FilmWin key={f.slug} f={f} />
      ))}
    </div>
  )
}
