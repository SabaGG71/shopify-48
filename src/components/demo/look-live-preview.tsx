"use client"

import { LookPreview } from "@/components/style/look-previews"
import { LOOKS, labelOf, type Look } from "@/lib/options"

const tidy = (url: string) =>
  url
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "")

/**
 * A phone browser standing at an angle beside the address question. It shows the
 * look they picked, and the address bar fills in as they type their store's URL.
 * Turns over to the new look when the pick changes.
 */
export function LookLivePreview({ look, url }: { look: Look | ""; url: string }) {
  const address = tidy(url)
  return (
    <div className="lv-stage" aria-hidden="true">
      <div className="lv-card" key={look || "none"}>
        <div className="lv-bar">
          <svg viewBox="0 0 16 16" className="size-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
            <path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7" />
          </svg>
          <span className={address ? "truncate text-ink" : "truncate text-tan"}>{address || "yourstore.com"}</span>
          {address ? <span className="lv-caret" /> : null}
        </div>
        <div className="lv-screen @container">
          {look ? (
            <LookPreview look={look} />
          ) : (
            <div className="grid size-full place-items-center p-6 text-center">
              <p className="text-[0.95rem] font-semibold text-soft">Pick a look above to see it here.</p>
            </div>
          )}
        </div>
      </div>
      <div className="lv-shadow" />
      <p className="mt-5 text-center text-[0.9rem] text-soft">
        {look ? (
          <>
            Your homepage, <span className="font-bold text-ink">{labelOf(LOOKS, look).toLowerCase()}</span>
          </>
        ) : (
          "Your homepage starts here"
        )}
      </p>
    </div>
  )
}
