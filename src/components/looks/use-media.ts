"use client"

import { useSyncExternalStore } from "react"

const subscribers = new Map<string, (cb: () => void) => () => void>()

function subscribeTo(query: string) {
  let fn = subscribers.get(query)
  if (!fn) {
    fn = (cb: () => void) => {
      const mq = window.matchMedia(query)
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    }
    subscribers.set(query, fn)
  }
  return fn
}

/** A live media query. False on the server and during hydration, so the first paint is the phone layout. */
export function useMedia(query: string) {
  return useSyncExternalStore(
    subscribeTo(query),
    () => window.matchMedia(query).matches,
    () => false,
  )
}

export const DESKTOP = "(min-width: 768px)"
export const REDUCED = "(prefers-reduced-motion: reduce)"

export const prefersReduced = () => typeof window !== "undefined" && window.matchMedia(REDUCED).matches
