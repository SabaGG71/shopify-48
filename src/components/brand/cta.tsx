import * as React from "react"
import { cn } from "@/lib/utils"
import { ArrowRight, ArrowUpRight } from "./marks"

type Variant = "solid" | "outline"

const base =
  "group/cta relative inline-flex min-h-12 items-center justify-between gap-5 rounded-full py-1.5 pr-1.5 pl-6 text-[0.72rem] font-semibold tracking-[0.2em] uppercase transition-[background-color,border-color,color,transform] duration-200 select-none active:translate-y-px disabled:pointer-events-none disabled:opacity-55"

const variants: Record<Variant, string> = {
  solid: "bg-ink text-page hover:bg-[#3a3126]",
  outline: "border border-line-strong bg-transparent text-ink hover:border-ink/45 hover:bg-paper/60",
}

const circle: Record<Variant, string> = {
  solid: "bg-page text-ink",
  outline: "bg-[#3a2f22] text-page",
}

function Circle({ variant, icon }: { variant: Variant; icon: "up" | "right" }) {
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full transition-transform duration-200 group-hover/cta:translate-x-0.5",
        circle[variant],
      )}
    >
      {icon === "up" ? <ArrowUpRight /> : <ArrowRight />}
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
      <span className={cn("transition-opacity", pending && "opacity-60")}>{children}</span>
      {pending ? (
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", circle[variant])}>
          <span className="size-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
        </span>
      ) : (
        <Circle variant={variant} icon={icon} />
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
      <Circle variant={variant} icon={icon} />
    </a>
  )
}
