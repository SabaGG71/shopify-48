import * as React from "react"
import { cn } from "@/lib/utils"

type Tone = "berry" | "butter" | "ink"
type Size = "md" | "sm"

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" className="d-btn-arrow size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M2.5 8h11M9.5 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Tactile button: a solid lip under the face that presses down on click. */
export function DemoButton({
  tone = "berry",
  size = "md",
  pending,
  arrow = true,
  className,
  children,
  disabled,
  ...props
}: React.ComponentProps<"button"> & { tone?: Tone; size?: Size; pending?: boolean; arrow?: boolean }) {
  return (
    <button
      className={cn("d-btn", className)}
      data-tone={tone === "berry" ? undefined : tone}
      data-size={size === "md" ? undefined : size}
      aria-busy={pending || undefined}
      disabled={disabled || pending}
      {...props}
    >
      <span className={cn(pending && "opacity-75")}>{children}</span>
      {pending ? (
        <span className="size-4 shrink-0 animate-spin rounded-full border-[2.5px] border-current border-t-transparent" aria-hidden="true" />
      ) : arrow ? (
        <Arrow />
      ) : null}
    </button>
  )
}

export function DemoLink({
  tone = "berry",
  size = "md",
  arrow = true,
  className,
  children,
  ...props
}: React.ComponentProps<"a"> & { tone?: Tone; size?: Size; arrow?: boolean }) {
  return (
    <a
      className={cn("d-btn", className)}
      data-tone={tone === "berry" ? undefined : tone}
      data-size={size === "md" ? undefined : size}
      {...props}
    >
      <span>{children}</span>
      {arrow ? <Arrow /> : null}
    </a>
  )
}

/** A word set as a stack of layers that rocks slowly in 3D. The front layer is the real text. */
export function Extrude({ children, depth = 12, className }: { children: string; depth?: number; className?: string }) {
  return (
    <span className={cn("x3d", className)}>
      {Array.from({ length: depth }, (_, i) => (
        <span key={i} aria-hidden="true" className="x3d-layer" style={{ ["--i" as string]: depth - i }}>
          {children}
        </span>
      ))}
      <span className="x3d-face">{children}</span>
    </span>
  )
}
