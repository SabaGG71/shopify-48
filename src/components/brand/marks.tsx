import { cn } from "@/lib/utils"

/** The house ornament (U+2726), drawn so it renders the same on every device. */
export function Ornament({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={cn("inline-block size-[0.7em] shrink-0 fill-gold", className)}>
      <path d="M8 0c.5 4.6 2.9 7 7.6 8-4.7 1-7.1 3.4-7.6 8-.5-4.6-2.9-7-7.6-8C5.1 7 7.5 4.6 8 0Z" />
    </svg>
  )
}

export function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={cn("size-3.5", className)} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ArrowRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={cn("size-3.5", className)} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M2.5 8h11M9.5 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Check({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={cn("size-3.5", className)} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 8.5 6.5 12 13 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** LOCALEYES wordmark in the display face. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display font-extrabold tracking-[0.04em] uppercase", className)} aria-label="LocalEyes" translate="no">
      LocalEyes
    </span>
  )
}

/** Tiny caps label followed by a hairline to the edge. Optional right-hand label. */
export function LabelRule({
  children,
  right,
  className,
  as: Tag = "p",
}: {
  children: React.ReactNode
  right?: React.ReactNode
  className?: string
  as?: "p" | "h2" | "div"
}) {
  return (
    <Tag className={cn("micro label-rule", right && "two", className)}>
      <span className="inline-flex items-center gap-2">{children}</span>
      {right ? <span className="text-tan">{right}</span> : null}
    </Tag>
  )
}
