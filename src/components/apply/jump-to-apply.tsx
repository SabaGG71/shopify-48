"use client"

import { DemoButton } from "@/components/demo/demo-ui"
import { D1Button } from "@/components/demo1/ui"

/** Back to the step one form at the top: a smooth scroll, then the first field gets focus. */
export function JumpToApply({ variant, children, className }: { variant: "demo" | "d1"; children: React.ReactNode; className?: string }) {
  const Button = variant === "demo" ? DemoButton : D1Button
  return (
    <Button
      type="button"
      className={className}
      onClick={() => {
        const form = document.getElementById("apply-top")
        if (!form) return
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        form.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
        form.querySelector<HTMLElement>("input:not([type=hidden]):not([tabindex='-1']), select, textarea")?.focus({ preventScroll: true })
      }}
    >
      {children}
    </Button>
  )
}
