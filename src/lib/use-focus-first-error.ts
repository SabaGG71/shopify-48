"use client"

import { useEffect, type RefObject } from "react"

const FOCUSABLE = "input:not([type=hidden]):not([tabindex='-1']), select, textarea, button"

/** After a failed submit, move focus to the first field marked invalid (or the first error message's field). */
export function useFocusFirstError(errors: Record<string, unknown> | null | undefined, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!errors || !Object.values(errors).some(Boolean)) return
    const root = ref.current
    if (!root) return
    const frame = requestAnimationFrame(() => {
      let target: HTMLElement | null = root.querySelector<HTMLElement>('[aria-invalid="true"]')
      if (target && !target.matches(FOCUSABLE)) target = target.querySelector<HTMLElement>(FOCUSABLE)
      if (!target) {
        const alert = root.querySelector<HTMLElement>('[role="alert"]')
        target = alert?.closest("fieldset, div")?.querySelector<HTMLElement>(FOCUSABLE) ?? null
      }
      if (!target) return
      target.focus({ preventScroll: true })
      target.scrollIntoView({ block: "center", behavior: "smooth" })
    })
    return () => cancelAnimationFrame(frame)
  }, [errors, ref])
}
