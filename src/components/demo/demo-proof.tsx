"use client"

import { useState } from "react"
import { BeforeAfter } from "@/components/proof/before-after"
import { cn } from "@/lib/utils"

export type ProofTab = {
  slug: string
  name: string
  domain: string | null
  desktop: { before?: string | null; after?: string | null }
  mobile: { before?: string | null; after?: string | null }
}

/** "Lake Effect Coffee Co." -> "Lake Effect", for tabs on phones. */
const shortName = (name: string) => name.replace(/\s+(coffee|roasters|co\.?|company)\b.*$/i, "").trim() || name

/**
 * One browser window. Each real store we rebuilt is a tab; the page inside is the
 * before and after slider. Switching tabs turns the page over to the next store.
 */
export function DemoProof({ stores }: { stores: ProofTab[] }) {
  const [active, setActive] = useState(0)
  const s = stores[active]
  if (!s) return null
  return (
    <div className="pf-window">
      <div className="pf-tabs" role="tablist" aria-label="Stores we rebuilt">
        <span className="rb-dots mr-1 hidden sm:flex" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        {stores.map((t, i) => (
          <button
            key={t.slug}
            type="button"
            role="tab"
            id={`pf-tab-${t.slug}`}
            aria-selected={i === active}
            aria-controls="pf-panel"
            tabIndex={i === active ? 0 : -1}
            className="pf-tab"
            onClick={() => setActive(i)}
            onKeyDown={(e) => {
              if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
              e.preventDefault()
              const next = (active + (e.key === "ArrowRight" ? 1 : -1) + stores.length) % stores.length
              setActive(next)
              document.getElementById(`pf-tab-${stores[next].slug}`)?.focus()
            }}
          >
            <span className="pf-fav" data-tone={["berry", "butter", "mint", "sky"][i % 4]} aria-hidden="true" />
            <span className="truncate sm:hidden">{shortName(t.name)}</span>
            <span className="hidden truncate sm:inline">{t.name}</span>
          </button>
        ))}
      </div>
      <div className="pf-bar">
        <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
          <path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7" />
        </svg>
        <span className="truncate">{s.domain ?? s.name}</span>
        <span className="ml-auto hidden shrink-0 text-tan sm:inline">Drag the line to compare</span>
      </div>
      <div id="pf-panel" role="tabpanel" aria-labelledby={`pf-tab-${s.slug}`} className={cn("pf-page")} key={s.slug}>
        <BeforeAfter name={s.name} desktop={s.desktop} mobile={s.mobile} />
      </div>
    </div>
  )
}
