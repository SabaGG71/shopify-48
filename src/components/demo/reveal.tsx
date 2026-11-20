"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Marks itself with data-in the first time it scrolls into view. Children with the
 * .rv or .blk-rise classes animate in from CSS. Without JavaScript nothing is hidden.
 */
export function Reveal({
  as: Tag = "div",
  className,
  children,
  threshold = 0.2,
  ...rest
}: {
  as?: "div" | "ol" | "ul" | "section"
  className?: string
  children: React.ReactNode
  threshold?: number
} & Omit<React.HTMLAttributes<HTMLElement>, "children" | "className">) {
  const ref = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])

  return (
    <Tag ref={ref as React.Ref<never>} className={className} data-in={inView ? "" : undefined} {...rest}>
      {children}
    </Tag>
  )
}
