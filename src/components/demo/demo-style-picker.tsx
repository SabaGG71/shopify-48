"use client"

import { useEffect, useRef, useState } from "react"
import { LookPreview } from "@/components/style/look-previews"
import { LOOKS, type Look } from "@/lib/options"
import { cn } from "@/lib/utils"

/**
 * The five live previews on a curved 3D shelf (desktop). Picking one turns it to face
 * you and lifts it off the shelf. Native radio inputs underneath, so keyboard and
 * screen readers work as usual.
 */
export function DemoStylePicker({
  name,
  value,
  onChange,
  error,
  className,
}: {
  name: string
  value: Look | ""
  onChange: (look: Look) => void
  error?: string
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  // Pause the preview animations while the shelf is off screen.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div className={className}>
      <div
        ref={ref}
        role="radiogroup"
        aria-label="Pick the look closest to your brand"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={cn("sp-shelf", !inView && "[&_*]:[animation-play-state:paused]")}
      >
        {LOOKS.map((look, i) => {
          const selected = value === look.key
          const id = `${name}-${look.key}`
          return (
            <label key={look.key} htmlFor={id} className="sp-card" data-pos={i}>
              <input
                id={id}
                type="radio"
                name={name}
                value={look.key}
                checked={selected}
                onChange={() => onChange(look.key)}
                className="sr-only"
              />
              <div className="sp-face @container">
                <div className="pointer-events-none size-full" aria-hidden="true">
                  <LookPreview look={look.key} inView={inView} />
                </div>
              </div>
              <div className="mt-4 px-1 text-center">
                <span className={cn("block text-[0.98rem] leading-tight font-bold transition-colors", selected ? "text-gold" : "text-ink")}>
                  {look.label}
                </span>
                <span className="mt-1 block text-[0.78rem] leading-snug text-soft">{look.hint}</span>
              </div>
            </label>
          )
        })}
        <div className="flex items-center justify-center rounded-[18px] border-2 border-dashed border-line-strong p-4 text-center lg:hidden">
          <p className="text-[0.84rem] leading-relaxed text-soft">Not an exact match? Pick the closest. You can change the details later.</p>
        </div>
      </div>
      {error ? (
        <p id={`${name}-error`} role="alert" className="mt-4 text-center text-sm font-semibold text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
