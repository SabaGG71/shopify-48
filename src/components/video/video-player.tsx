"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

type Source =
  | { kind: "file"; src: string }
  | { kind: "iframe"; embed: (autoplay: boolean) => string; thumb: string | null; provider: string }

function parse(url: string): Source | null {
  const u = url.trim()
  if (!u) return null
  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/)
  if (yt) {
    const id = yt[1]
    return {
      kind: "iframe",
      provider: "YouTube",
      thumb: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
      embed: (a) =>
        `https://www.youtube-nocookie.com/embed/${id}?autoplay=${a ? 1 : 0}&cc_load_policy=1&cc_lang_pref=en&playsinline=1&rel=0&modestbranding=1`,
    }
  }
  const vimeo = u.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/(\w+))?/)
  if (vimeo) {
    const [, id, hash] = vimeo
    return {
      kind: "iframe",
      provider: "Vimeo",
      thumb: null,
      embed: (a) =>
        `https://player.vimeo.com/video/${id}?${hash ? `h=${hash}&` : ""}autoplay=${a ? 1 : 0}&texttrack=en&playsinline=1&dnt=1&title=0&byline=0&portrait=0`,
    }
  }
  const wistia = u.match(/(?:wistia\.(?:com|net)\/(?:medias|embed\/iframe)\/|wi\.st\/medias\/)(\w+)/)
  if (wistia) {
    const id = wistia[1]
    return {
      kind: "iframe",
      provider: "Wistia",
      thumb: null,
      embed: (a) =>
        `https://fast.wistia.net/embed/iframe/${id}?autoPlay=${a}&playsinline=true&plugin%5Bcaptions-v1%5D%5BonByDefault%5D=true`,
    }
  }
  const loom = u.match(/loom\.com\/(?:share|embed)\/(\w+)/)
  if (loom) {
    const id = loom[1]
    return {
      kind: "iframe",
      provider: "Loom",
      thumb: null,
      embed: (a) => `https://www.loom.com/embed/${id}?autoplay=${a ? 1 : 0}&hide_owner=true&hideEmbedTopBar=true`,
    }
  }
  return { kind: "file", src: u }
}

function PlayBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-3 rounded-full bg-paper/95 py-1.5 pr-5 pl-1.5 text-[0.7rem] font-semibold tracking-[0.18em] text-ink uppercase backdrop-blur">
      <span className="grid size-9 place-items-center rounded-full bg-ink text-page">
        <svg viewBox="0 0 16 16" className="ml-0.5 size-3.5 fill-current" aria-hidden="true">
          <path d="M4 2.5v11l9.5-5.5z" />
        </svg>
      </span>
      {label}
    </span>
  )
}

/**
 * Brief: no autoplay with sound, captions on.
 * Files start muted with captions (a silent preview) and restart with sound on tap.
 * Hosted players load only when tapped, then play with captions on.
 */
export function VideoPlayer({
  url,
  poster,
  captions,
  title,
  className,
  missingLabel,
  aspect = "16 / 9",
}: {
  url: string
  poster?: string
  captions?: string
  title: string
  className?: string
  /** Shown instead of nothing when the URL is empty (dev and previews only). */
  missingLabel?: string | null
  aspect?: string
}) {
  const source = parse(url)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [mode, setMode] = useState<"preview" | "sound">("preview")
  const [iframeOn, setIframeOn] = useState(false)
  const [ratio, setRatio] = useState(aspect)

  useEffect(() => {
    const v = videoRef.current
    if (!v || source?.kind !== "file") return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (mode !== "preview") return
        if (e.isIntersecting) v.play().catch(() => {})
        else v.pause()
      },
      { threshold: 0.35 },
    )
    io.observe(v)
    return () => io.disconnect()
  }, [source?.kind, mode])

  if (!source) {
    if (!missingLabel) return null
    return (
      <div
        className={cn("grid place-items-center rounded-[18px] border border-dashed border-line-strong bg-paper/60 p-6 text-center", className)}
        style={{ aspectRatio: aspect }}
      >
        <p className="micro">{missingLabel}</p>
      </div>
    )
  }

  if (source.kind === "iframe") {
    const thumb = poster || source.thumb
    return (
      <div className={cn("relative overflow-hidden rounded-[18px] border border-line bg-ink", className)} style={{ aspectRatio: aspect }}>
        {iframeOn ? (
          <iframe
            src={source.embed(true)}
            title={title}
            className="absolute inset-0 size-full"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setIframeOn(true)}
            className="group absolute inset-0 grid size-full place-items-center"
            aria-label={`Play video: ${title}`}
          >
            {thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumb} alt="" className="absolute inset-0 size-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
            ) : (
              <span className="absolute inset-0 bg-[radial-gradient(80%_80%_at_70%_20%,#4a3d2c,#261f15)]" />
            )}
            <span className="relative transition-transform group-hover:scale-[1.03]">
              <PlayBadge label="Play with captions" />
            </span>
          </button>
        )}
      </div>
    )
  }

  const startWithSound = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = false
    v.currentTime = 0
    v.controls = true
    setMode("sound")
    v.play().catch(() => {})
  }

  return (
    <div className={cn("relative overflow-hidden rounded-[18px] border border-line bg-ink", className)} style={{ aspectRatio: ratio }}>
      <video
        ref={videoRef}
        className="absolute inset-0 size-full object-cover"
        src={source.src}
        poster={poster || undefined}
        muted
        playsInline
        loop={mode === "preview"}
        preload="metadata"
        crossOrigin={captions ? "anonymous" : undefined}
        aria-label={title}
        onLoadedMetadata={(e) => {
          const v = e.currentTarget
          if (v.videoWidth && v.videoHeight) setRatio(`${v.videoWidth} / ${v.videoHeight}`)
          for (const t of Array.from(v.textTracks)) t.mode = "showing"
        }}
      >
        {captions ? <track kind="captions" src={captions} srcLang="en" label="English" default /> : null}
      </video>
      {mode === "preview" ? (
        <button
          type="button"
          onClick={startWithSound}
          className="absolute inset-0 flex items-start justify-end bg-gradient-to-b from-black/25 via-transparent to-transparent p-3 sm:p-4"
          aria-label={`Play video with sound: ${title}`}
        >
          <PlayBadge label="Watch with sound" />
        </button>
      ) : null}
    </div>
  )
}
