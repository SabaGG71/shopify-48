import * as React from "react"
import { cn } from "@/lib/utils"
import { ArrowRight, ArrowUpRight } from "./marks"

type Variant = "solid" | "outline"

const base =
  "group/cta relative inline-flex min-h-14 items-center justify-center gap-3 rounded-xl px-7 font-display text-[1.02rem] font-extrabold tracking-[0.03em] uppercase transition-[background-color,border-color,color,box-shadow,transform] duration-200 select-none active:translate-y-px disabled:pointer-events-none disabled:opacity-55"

const variants: Record<Variant, string> = {
  solid: "bg-gold text-white shadow-[0_14px_32px_-14px_rgba(238,74,18,0.85)] hover:bg-[#d93f0b] hover:shadow-[0_18px_36px_-14px_rgba(238,74,18,0.95)]",
  outline: "border-2 border-ink bg-transparent text-ink hover:bg-ink hover:text-page",
}

function Arrow({ icon }: { icon: "up" | "right" }) {
  return (
    <span className="grid shrink-0 place-items-center transition-transform duration-200 group-hover/cta:translate-x-1">
      {icon === "up" ? <ArrowUpRight className="size-4" /> : <ArrowRight className="size-4" />}
    </span>
  )
}

export function CtaButton({
  variant = "solid",
  icon = "right",
  className,
  children,
  pending,
  disabled,
  ...props
}: React.ComponentProps<"button"> & { variant?: Variant; icon?: "up" | "right"; pending?: boolean }) {
  return (
    <button
      className={cn(base, variants[variant], pending && "disabled:opacity-100", className)}
      aria-busy={pending || undefined}
      disabled={disabled || pending}
      {...props}
    >
      <span className={cn("transition-opacity", pending && "opacity-70")}>{children}</span>
      {pending ? (
        <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      ) : (
        <Arrow icon={icon} />
      )}
    </button>
  )
}

export function CtaLink({
  variant = "solid",
  icon = "up",
  className,
  children,
  ...props
}: React.ComponentProps<"a"> & { variant?: Variant; icon?: "up" | "right" }) {
  return (
    <a className={cn(base, variants[variant], className)} {...props}>
      <span>{children}</span>
      <Arrow icon={icon} />
    </a>
  )
}
