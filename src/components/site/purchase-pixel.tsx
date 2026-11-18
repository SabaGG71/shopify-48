"use client"

import { useEffect } from "react"
import { trackPixel } from "@/lib/pixel"

/** Browser half of Purchase. Same event id as the server's CAPI call, so Meta counts it once. */
export function PurchasePixel({ eventId, value, currency }: { eventId: string; value?: number; currency?: string }) {
  useEffect(() => {
    const key = `le48:${eventId}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, "1")
    } catch {
      /* fire anyway */
    }
    let tries = 0
    const fire = () => {
      if (window.fbq) trackPixel("Purchase", eventId, value != null ? { value, currency: currency ?? "USD" } : {})
      else if (tries++ < 20) setTimeout(fire, 250)
    }
    fire()
  }, [eventId, value, currency])
  return null
}
