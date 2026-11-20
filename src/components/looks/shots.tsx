"use client"

import { useState } from "react"
import type { Shot, ShotView } from "@/lib/lookbook"
import { cn } from "@/lib/utils"

export const hostOf = (url: string) => url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/.*$/, "")

/** A screenshot in a fixed aspect box: blurred placeholder first, the sharp image fades in when loaded. */
export function ShotImg({ shot, alt, sizes, eager, className }: { shot: Shot; alt: string; sizes: string; eager?: boolean; className?: string }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <span className={cn("lp-shot", className)} style={{ aspectRatio: `${shot.width} / ${shot.height}` }} data-loaded={loaded ? "" : undefined}>
      {shot.blur ? <span className="lp-shot-blur" style={{ backgroundImage: `url("${shot.blur}")` }} aria-hidden="true" /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element -- plain img with srcset: the image optimizer quota is off on this team */}
      <img
        ref={(el) => {
          if (el?.complete && el.naturalWidth > 0) setLoaded(true)
        }}
        src={shot.src}
        srcSet={shot.srcSet}
        sizes={sizes}
        width={shot.width}
        height={shot.height}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
      />
    </span>
  )
}

/** A simple browser window around a desktop screenshot. */
export function BrowserFrame({ host, children, className }: { host: string; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("lp-browser", className)}>
      <span className="lp-browser-bar" aria-hidden="true">
        <span className="lp-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="lp-url">{host}</span>
        <span className="lp-dots lp-dots-ghost">
          <i />
          <i />
          <i />
        </span>
      </span>
      {children}
    </span>
  )
}

/** A light phone around a phone screenshot. */
export function PhoneFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("lp-phone", className)}>
      <span className="lp-phone-island" aria-hidden="true" />
      <span className="lp-phone-screen">{children}</span>
    </span>
  )
}

export function Framed({ view, host, children, className }: { view: ShotView; host: string; children: React.ReactNode; className?: string }) {
  return view === "desktop" ? (
    <BrowserFrame host={host} className={className}>
      {children}
    </BrowserFrame>
  ) : (
    <PhoneFrame className={className}>{children}</PhoneFrame>
  )
}

export const viewWord = (view: ShotView) => (view === "desktop" ? "desktop" : "phone")
