import * as React from "react"
import { cn } from "@/lib/utils"

export function D1Arrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("d1-arrow size-4 shrink-0", className)} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M2.5 8h11M9.5 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function D1Button({
  pending,
  tone = "ink",
  size = "md",
  arrow = true,
  className,
  children,
  disabled,
  ...props
}: React.ComponentProps<"button"> & { pending?: boolean; tone?: "ink" | "lime"; size?: "md" | "sm"; arrow?: boolean }) {
  return (
    <button
      className={cn("d1-btn", className)}
      data-tone={tone === "lime" ? "lime" : undefined}
      data-size={size === "sm" ? "sm" : undefined}
      aria-busy={pending || undefined}
      disabled={disabled || pending}
      {...props}
    >
      <span className={cn(pending && "opacity-70")}>{children}</span>
      {pending ? (
        <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      ) : arrow ? (
        <D1Arrow />
      ) : null}
    </button>
  )
}

export function D1Link({
  tone = "ink",
  size = "md",
  arrow = true,
  className,
  children,
  ...props
}: React.ComponentProps<"a"> & { tone?: "ink" | "lime"; size?: "md" | "sm"; arrow?: boolean }) {
  return (
    <a className={cn("d1-btn", className)} data-tone={tone === "lime" ? "lime" : undefined} data-size={size === "sm" ? "sm" : undefined} {...props}>
      <span>{children}</span>
      {arrow ? <D1Arrow /> : null}
    </a>
  )
}

/** A number that rolls up digit by digit on load. Screen readers get the plain number. */
export function Odometer({ value, delay = 0 }: { value: string; delay?: number }) {
  return (
    <>
      <span className="sr-only">{value}</span>
      <span className="odo" aria-hidden="true">
        {value.split("").map((ch, i) => {
          const n = Number(ch)
          if (Number.isNaN(n)) return <span key={i}>{ch}</span>
          return (
            <span key={i} className="odo-cell">
              <span className="odo-col" style={{ ["--n" as string]: n + 10, ["--dl" as string]: `${delay + i * 140}ms` }}>
                {Array.from({ length: 20 }, (_, d) => (
                  <span key={d}>{d % 10}</span>
                ))}
              </span>
            </span>
          )
        })}
      </span>
    </>
  )
}

export function Kicker({ index, children, className }: { index?: string; children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("d1-mono d1-kicker", className)}>
      {index ? <span className="text-ink">{index}</span> : null}
      <span>{children}</span>
    </p>
  )
}
