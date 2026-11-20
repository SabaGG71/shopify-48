"use client"

import { useEffect, useRef } from "react"

/**
 * A big statement whose words go from faint to full ink as it scrolls through the
 * screen. One CSS variable (--p) moves; the browser does the rest. Reads normally
 * with reduced motion or without JavaScript.
 */
export function Manifesto({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const words = text.split(" ")

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let raf = 0
    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      // 0 when the top of the paragraph reaches 85% of the screen, 1 when its bottom reaches 45%.
      const start = vh * 0.85
      const end = vh * 0.45
      const p = (start - r.top) / (start - end + r.height)
      el.style.setProperty("--p", String(Math.min(1, Math.max(0, p))))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <p ref={ref} className={className} style={{ ["--n" as string]: words.length }}>
      {words.map((w, i) => (
        <span key={i} className="mf-w" style={{ ["--i" as string]: i }}>
          {w}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  )
}
