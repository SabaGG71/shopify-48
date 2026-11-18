"use client"

import { useEffect, useRef, useState } from "react"
import { LOOKS, type Look } from "@/lib/options"
import { cn } from "@/lib/utils"
import { Check } from "@/components/brand/marks"
import { LookPreview } from "./look-previews"

/**
 * Five live preview cards. Tapping one selects it. Built on native radio inputs
 * so arrow keys, focus and screen readers work without extra code.
 */
export function StylePicker({
  name,
  value,
  onChange,
  error,
  className,
  showNote = true,
}: {
  name: string
  value: Look | ""
  onChange: (look: Look) => void
  error?: string
  className?: string
  showNote?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  // Pause the preview animations while the grid is off screen.
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
        className={cn("grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-x-4 lg:grid-cols-5", !inView && "[&_*]:[animation-play-state:paused]")}
      >
        {LOOKS.map((look) => {
          const selected = value === look.key
          const id = `${name}-${look.key}`
          return (
            <label key={look.key} htmlFor={id} className="group relative block cursor-pointer select-none">
              <input
                id={id}
                type="radio"
                name={name}
                value={look.key}
                checked={selected}
                onChange={() => onChange(look.key)}
                className="peer sr-only"
              />
              <div
                className={cn(
                  "@container relative aspect-[3/4] overflow-hidden rounded-[14px] bg-paper ring-1 ring-line transition-[box-shadow,transform] duration-300",
                  "group-hover:-translate-y-0.5 peer-focus-visible:ring-2 peer-focus-visible:ring-gold",
                  selected && "ring-2 ring-gold ring-offset-[3px] ring-offset-page",
                )}
              >
                <div className="pointer-events-none size-full" aria-hidden="true">
                  <LookPreview look={look.key} />
                </div>
                <span
                  className={cn(
                    "absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-gold text-paper transition-[opacity,transform] duration-200",
                    selected ? "scale-100 opacity-100" : "scale-75 opacity-0",
                  )}
                  aria-hidden="true"
                >
                  <Check className="size-3" />
                </span>
              </div>
              <div className="mt-2.5 flex items-start gap-2 pr-1">
                <span
                  className={cn(
                    "mt-[3px] grid size-4 shrink-0 place-items-center rounded-full border transition-colors",
                    selected ? "border-gold bg-gold" : "border-line-strong bg-paper",
                  )}
                  aria-hidden="true"
                >
                  <span className={cn("size-1.5 rounded-full bg-paper transition-opacity", selected ? "opacity-100" : "opacity-0")} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.84rem] leading-snug font-semibold text-ink">{look.label}</span>
                  <span className="mt-0.5 block text-[0.74rem] leading-snug text-soft">{look.hint}</span>
                </span>
              </div>
            </label>
          )
        })}
        {showNote ? (
          <div className="flex items-center rounded-[14px] border border-dashed border-line-strong p-4 lg:hidden">
            <p className="text-[0.8rem] leading-relaxed text-soft">
              Not an exact match? Pick the closest. You can change the details later.
            </p>
          </div>
        ) : null}
      </div>
      {error ? (
        <p id={`${name}-error`} role="alert" className="mt-3 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
