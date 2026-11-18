"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

/** PageView on first load and on every client-side navigation. */
export function PixelPageViews() {
  const pathname = usePathname()
  useEffect(() => {
    if (pathname.startsWith("/admin")) return
    let tries = 0
    const fire = () => {
      if (window.fbq) window.fbq("track", "PageView")
      else if (tries++ < 20) setTimeout(fire, 250)
    }
    fire()
  }, [pathname])
  return null
}
