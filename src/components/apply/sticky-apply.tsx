"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { ArrowRight } from "@/components/brand/marks"
import { useApply } from "./apply-provider"

/**
 * Mobile only: an Apply bar that appears once the visitor has scrolled past the
 * first form, and hides whenever a form is on screen.
 */
export function StickyApply({ variant = "default" }: { variant?: "default" | "demo" | "d1" | "d2" }) {
  const { screen } = useApply()
  const [show, setShow] = useState(false)

  useEffect(() => {
    const top = document.getElementById("apply-top")
    const bottom = document.getElementById("apply-bottom")
    if (!top) return
    const visible = new Map<Element, boolean>()
    let pastTop = false
    const update = () => setShow(pastTop && ![...visible.values()].some(Boolean))
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set(e.target, e.isIntersecting)
        update()
      },
      { threshold: 0.12 },
    )
    io.observe(top)
    if (bottom) io.observe(bottom)
    const onScroll = () => {
      pastTop = top.getBoundingClientRect().bottom < 0
      update()
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      io.disconnect()
      window.removeEventListener("scroll", onScroll)
    }
  }, [])

  if (screen === "done") return null

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-[transform,opacity] duration-300 lg:hidden",
        "bg-gradient-to-t from-page via-page/95 to-page/0",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0",
      )}
    >
      {/* Each demo page has its own button style; the behaviour is the same. */}
      {variant === "d2" ? (
        <a href="#apply-top" tabIndex={show ? 0 : -1} aria-hidden={!show} className="d2-btn w-full">
          {screen === 2 ? "Finish your application" : "Apply for a free homepage"}
          <ArrowRight className="size-4" />
        </a>
      ) : variant === "d1" ? (
        <a href="#apply-top" tabIndex={show ? 0 : -1} aria-hidden={!show} className="d1-btn w-full">
          {screen === 2 ? "Finish your application" : "Apply for a free homepage"}
          <ArrowRight className="size-4" />
        </a>
      ) : variant === "demo" ? (
        <a href="#apply-top" tabIndex={show ? 0 : -1} aria-hidden={!show} className="d-btn w-full">
          {screen === 2 ? "Finish your application" : "Apply for a free homepage"}
          <ArrowRight className="size-4" />
        </a>
      ) : (
        <a
          href="#apply-top"
          tabIndex={show ? 0 : -1}
          aria-hidden={!show}
          className="flex min-h-12 items-center justify-between rounded-full bg-ink py-1.5 pr-1.5 pl-6 text-[0.72rem] font-semibold tracking-[0.2em] text-page uppercase"
        >
          {screen === 2 ? "Finish your application" : "Apply for a free homepage"}
          <span className="grid size-9 place-items-center rounded-full bg-page text-ink">
            <ArrowRight />
          </span>
        </a>
      )}
    </div>
  )
}
