"use client"

import { useApply } from "@/components/apply/apply-provider"
import { Reveal } from "@/components/demo/reveal"
import { GUARANTEES, STEPS } from "@/components/landing/copy"

const tidy = (url: string) =>
  url
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "")

function useDomain() {
  const a = useApply()
  return tidy(a.values.store_url) || "yourstore.com"
}

function Tick() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M3 8.5 6.5 12 13 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Each guarantee with a small, true picture of what it means, on their own store. */
export function Guarantees() {
  const domain = useDomain()
  const vignettes = [
    // 48 hours or it's free
    <div key="clock" className="d2-vig">
      <p className="text-[0.78rem] font-semibold text-ink">Preview due in</p>
      <p className="mt-2 text-[1.7rem] leading-none font-semibold tracking-[-0.03em] text-ink tabular-nums">48:00:00</p>
      <div className="d2-vig-bar mt-3" aria-hidden="true">
        <span />
      </div>
      <p className="mt-2 text-[0.74rem] leading-snug text-tan">Starts when your intake is done and access is in.</p>
    </div>,
    // Nothing goes live without your yes
    <div key="preview" className="d2-vig">
      <div className="d2-vig-url" aria-hidden="true">
        <span className="size-1.5 shrink-0 rounded-full bg-[var(--tan)]" />
        <span className="min-w-0 truncate">Private preview</span>
      </div>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-[0.8rem] leading-tight">
        <span className="min-w-0">
          <span className="block text-tan">Live store</span>
          <span className="block truncate font-medium text-ink">{domain}</span>
        </span>
        <span className="d2-switch" aria-hidden="true" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <span className="d2-vig-btn">Approve</span>
        <span className="text-[0.74rem] text-tan">Only you can press this.</span>
      </div>
    </div>,
    // Zero SEO loss
    <div key="seo" className="d2-vig">
      <ul className="grid gap-2 text-[0.78rem]">
        {["/collections/all", "/pages/about-us", "/products/best-seller"].map((path) => (
          <li key={path} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <span className="min-w-0 truncate font-medium text-ink">{path}</span>
            <span className="text-[var(--green)]">
              <Tick />
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[0.74rem] leading-snug [overflow-wrap:anywhere] text-tan">Every old link on {domain} still lands.</p>
    </div>,
  ]
  return (
    <Reveal className="grid gap-10 sm:gap-8" threshold={0.2}>
      {GUARANTEES.map((g, i) => (
        <div
          key={g.title}
          className="rv grid items-center gap-5 sm:grid-cols-[16rem_minmax(0,1fr)] sm:gap-8"
          style={{ ["--rv-delay" as string]: `${i * 120}ms` }}
        >
          {vignettes[i]}
          <div className="min-w-0">
            <h3 className="text-[1.08rem] leading-snug font-semibold text-ink">{g.title}</h3>
            <p className="mt-1.5 max-w-[40ch] text-[0.95rem] leading-relaxed text-soft">{g.body}</p>
          </div>
        </div>
      ))}
    </Reveal>
  )
}

/** How it works as the proposal's schedule: four bars, and the rebuild is the long one. */
export function Schedule() {
  const domain = useDomain()
  // Where each bar starts and how long it is on the track (not to scale, the rebuild dominates).
  const bars = [
    { start: 0, width: 9 },
    { start: 9, width: 13 },
    { start: 22, width: 9 },
    { start: 31, width: 69 },
  ]
  return (
    <Reveal className="d2-gantt" threshold={0.3}>
      <p className="mb-4 text-[0.86rem] text-tan">
        Schedule for <span className="font-semibold text-ink">{domain}</span>
      </p>
      <ol className="grid gap-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="d2-row">
            <div className="min-w-0">
              <p className="text-[0.98rem] leading-snug font-semibold text-ink">{s.title}</p>
              <p className="mt-0.5 text-[0.85rem] leading-snug text-soft">{s.body}</p>
            </div>
            <div className="d2-track" aria-hidden="true">
              <span
                className="d2-bar"
                data-main={i === STEPS.length - 1 ? "" : undefined}
                style={{ left: `${bars[i].start}%`, width: `${bars[i].width}%`, ["--rv-delay" as string]: `${200 + i * 260}ms` }}
              >
                <span className="d2-bar-label">{s.when}</span>
              </span>
            </div>
          </li>
        ))}
      </ol>
    </Reveal>
  )
}
