/* eslint-disable @next/next/no-img-element */
import Link from "next/link"
import { Reveal } from "@/components/demo/reveal"
import { GUARANTEES, MissingConfig, STEPS } from "@/components/landing/sections"
import type { SiteConfig } from "@/lib/config"
import { slotsLeft } from "@/lib/slots"
import { formatPhoneForDisplay, normalizePhone } from "@/lib/url"
import { cn } from "@/lib/utils"
import { D1Link } from "./ui"

export function D1Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1260px] pr-[max(1.1rem,env(safe-area-inset-right))] pl-[max(1.1rem,env(safe-area-inset-left))] sm:px-8 lg:px-10",
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Section head: kicker and a big title; the lead sits to the right on desktop. */
export function D1Head({ kicker, title, lead, id, className }: { kicker: string; title: React.ReactNode; lead?: React.ReactNode; id: string; className?: string }) {
  return (
    <Reveal className={cn("grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:items-end lg:gap-16", className)}>
      <div className="rv">
        <p className="d1-mono d1-kicker">{kicker}</p>
        <h2 id={id} className="d1-h2 mt-5 max-w-[16ch] text-[2.6rem] text-balance text-ink sm:text-[4rem]">
          {title}
        </h2>
      </div>
      {lead ? (
        <p className="rv max-w-md text-[1.06rem] leading-relaxed text-soft lg:pb-2" style={{ ["--rv-delay" as string]: "120ms" }}>
          {lead}
        </p>
      ) : null}
    </Reveal>
  )
}

export async function d1Slots(config: SiteConfig) {
  const perWeek = config.SLOT_COUNTER_ON && config.SLOTS_PER_WEEK ? config.SLOTS_PER_WEEK : null
  const left = await slotsLeft(perWeek, config.SLOTS_LEFT)
  return perWeek !== null && left !== null ? { perWeek, left } : null
}

/* ---------- Header ---------- */

export async function D1Header({ config, applyHref = "#apply-top" }: { config: SiteConfig; applyHref?: string }) {
  const slots = await d1Slots(config)
  return (
    <header className="d1-header">
      <div className="mx-auto flex h-16 max-w-[1260px] items-center justify-between gap-4 px-[1.1rem] sm:px-8 lg:px-10">
        <Link href="/demo" className="flex items-baseline gap-3" aria-label="LocalEyes 48 Hour Rebuild home">
          <span className="text-[1.25rem] font-black tracking-[-0.045em] text-ink">LocalEyes</span>
          <span className="d1-mono hidden text-tan md:inline">48 hour rebuild</span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          {slots ? (
            <p className="d1-slots">
              <span className="d1-slot-bars" aria-hidden="true">
                {Array.from({ length: slots.perWeek }).map((_, i) => (
                  <i key={i} data-open={i >= slots.perWeek - slots.left ? "" : undefined} style={{ ["--i" as string]: i }} />
                ))}
              </span>
              <span className="d1-slots-text">
                <span className="sm:hidden">{slots.left} left</span>
                <span className="hidden sm:inline">
                  {slots.left} of {slots.perWeek} slots left this week
                </span>
              </span>
            </p>
          ) : null}
          <D1Link href={applyHref} size="sm" tone="lime" arrow={false}>
            Apply
          </D1Link>
        </div>
      </div>
    </header>
  )
}

/* ---------- Marquee ---------- */

export function D1Marquee() {
  const items = ["48 hours or it's free", "Nothing goes live without your yes", "Zero SEO loss", "Your homepage first, free"]
  const row = (key: string) => (
    <div key={key} className="flex" aria-hidden={key === "b" ? true : undefined}>
      {items.map((t) => (
        <span key={t} className="d1-marquee-item text-[1.05rem] font-bold tracking-[-0.01em] sm:text-[1.25rem]">
          <span className="d1-marquee-dot" aria-hidden="true" />
          {t}
        </span>
      ))}
    </div>
  )
  return (
    <div className="d1-marquee">
      <div className="d1-marquee-track">
        {row("a")}
        {row("b")}
        {row("c")}
        {row("d")}
      </div>
    </div>
  )
}

/* ---------- What you get: a bento ---------- */

export function D1WhatYouGet({ items, image }: { items: string[]; image?: string }) {
  if (!items.length) return null
  const parts = items.map((item) => {
    const split = item.indexOf(": ")
    return split > 0 ? { title: item.slice(0, split), body: item.slice(split + 2) } : { title: item, body: "" }
  })
  // Seven items: one big card with a real rebuilt page, then smaller ones.
  const layout = ["bento-a", "bento-2", "bento-2", "bento-2", "bento-2", "bento-2", "bento-6"]
  const tone = (i: number) => (i === 4 ? "lime" : i === 6 ? "ink" : undefined)
  return (
    <section aria-labelledby="d1-get" className="py-20 sm:py-28">
      <D1Container>
        <D1Head
          id="d1-get"
          kicker="What you get"
          title="Everything in the rebuild."
          lead="You keep your products, your brand and your Shopify account. We rebuild how the store looks and sells."
        />
        <Reveal as="ul" className="bento mt-12 sm:mt-16" threshold={0.08}>
          {parts.map((p, i) => (
            <li
              key={i}
              className={cn("rv bento-card", layout[i] ?? "bento-2")}
              data-tone={tone(i)}
              style={{ ["--rv-delay" as string]: `${i * 60}ms` }}
            >
              {i === 0 && image ? (
                <div className="relative -mx-1 min-h-[12rem] flex-1 overflow-hidden rounded-[16px] bg-panel">
                  <img src={image} alt="" className="absolute inset-0 size-full object-cover object-top" loading="lazy" decoding="async" />
                </div>
              ) : null}
              <div>
                <h3 className={cn("d1-h3", i === 0 ? "text-[1.7rem] sm:text-[2.1rem]" : "text-[1.3rem]")}>{p.title}</h3>
                {p.body ? (
                  <p className={cn("mt-2 text-[0.97rem] leading-relaxed", tone(i) === "ink" ? "text-white/70" : tone(i) === "lime" ? "text-ink/75" : "text-soft")}>
                    {p.body}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </Reveal>
      </D1Container>
    </section>
  )
}

/* ---------- Guarantees: three cards ---------- */

export function D1Guarantees() {
  const caption: Record<string, string> = { "48h": "Or it's free", Yes: "Before it goes live", "0": "SEO loss" }
  const tones = ["lime", "ink", undefined] as const
  return (
    <section aria-labelledby="d1-guarantees" className="pb-20 sm:pb-28">
      <D1Container>
        <D1Head id="d1-guarantees" kicker="Three guarantees" title="The risk is on us." />
        <Reveal className="mt-12 grid gap-3 sm:mt-16 md:grid-cols-3" threshold={0.15}>
          {GUARANTEES.map((g, i) => (
            <div key={g.title} className="rv bento-card min-h-[22rem] p-7" data-tone={tones[i]} style={{ ["--rv-delay" as string]: `${i * 110}ms` }}>
              <div>
                <p className="d1-h1 text-[5.5rem] sm:text-[6.5rem]">{g.mark === "Yes" ? "Yes." : g.mark}</p>
                <p className={cn("d1-mono mt-2", tones[i] === "ink" ? "text-white/60" : "text-ink/60")}>{caption[g.mark]}</p>
              </div>
              <div>
                <h3 className="d1-h3 text-[1.4rem]">{g.title}</h3>
                <p className={cn("mt-2.5 text-[1rem] leading-relaxed", tones[i] === "ink" ? "text-white/70" : tones[i] === "lime" ? "text-ink/75" : "text-soft")}>
                  {g.body}
                </p>
              </div>
            </div>
          ))}
        </Reveal>
      </D1Container>
    </section>
  )
}

/* ---------- How it works ---------- */

export function D1HowItWorks() {
  return (
    <section aria-labelledby="d1-how" className="py-20 sm:py-28">
      <D1Container>
        <D1Head id="d1-how" kicker="How it works" title="You see your homepage before you pay." />
        <Reveal as="ol" className="relative mt-14 grid gap-10 sm:mt-20 md:grid-cols-4 md:gap-8" threshold={0.25}>
          <span className="hw-line hidden md:block" aria-hidden="true" />
          {STEPS.map((s, i) => (
            <li key={s.title} className="rv relative grid grid-cols-[1.6rem_minmax(0,1fr)] gap-x-3 md:block" style={{ ["--rv-delay" as string]: `${i * 160}ms` }}>
              <span className="hw-dot mt-1.5 md:mt-0" style={{ ["--rv-delay" as string]: `${300 + i * 380}ms` }} aria-hidden="true" />
              <div>
                <p className="d1-mono text-tan md:mt-7">{s.when}</p>
                <h3 className="d1-h3 mt-3 max-w-[16ch] text-[1.35rem] text-ink">{s.title}</h3>
                <p className="mt-2 max-w-[30ch] text-[0.98rem] leading-relaxed text-soft">{s.body}</p>
              </div>
            </li>
          ))}
        </Reveal>
      </D1Container>
    </section>
  )
}

/* ---------- Price: a lime band ---------- */

export async function D1Price({ config, missing }: { config: SiteConfig; missing: boolean }) {
  const slots = await d1Slots(config)
  if (!config.PRICE_DISPLAY && !config.RESERVE_URL && !missing) return null
  return (
    <section aria-labelledby="d1-price" className="d1-frame py-16 sm:py-24">
      <D1Container>
        <Reveal className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end lg:gap-20">
          <div className="rv">
            <p className="d1-mono d1-kicker">The price</p>
            <h2 id="d1-price" className="sr-only">
              The price
            </h2>
            <p className="d1-h1 mt-6 text-[5.4rem] text-ink sm:text-[9.5rem]">
              {config.PRICE_DISPLAY || <MissingConfig name="PRICE_DISPLAY" show={missing} />}
            </p>
            {config.PRICE_NOTE ? <p className="d1-h3 mt-5 max-w-md text-[1.4rem] text-ink">{config.PRICE_NOTE}</p> : null}
          </div>
          <div className="rv" style={{ ["--rv-delay" as string]: "140ms" }}>
            {slots ? (
              <div>
                <div className="flex gap-1.5" aria-hidden="true">
                  {Array.from({ length: slots.perWeek }).map((_, i) => (
                    <span key={i} className="pr-bar flex-1" data-taken={i < slots.perWeek - slots.left ? "" : undefined} />
                  ))}
                </div>
                <p className="d1-slots-text mt-3">
                  {slots.left} of {slots.perWeek} slots left this week
                </p>
              </div>
            ) : null}
            <p className="mt-6 max-w-sm text-[1.02rem] leading-relaxed text-ink/80">
              {slots && slots.left === 0
                ? "This week is full. Reserve now to hold a slot for next week."
                : "Already sure? Skip the call and hold your spot this week."}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-4">
              {config.RESERVE_URL ? (
                <D1Link href={config.RESERVE_URL} data-reserve-link>
                  Skip the call, reserve a slot
                </D1Link>
              ) : (
                <MissingConfig name="RESERVE_URL" show={missing} />
              )}
              <a href="#apply-top" className="d1-link text-[0.98rem] text-ink">
                Or see your homepage first
              </a>
            </div>
          </div>
        </Reveal>
      </D1Container>
    </section>
  )
}

/* ---------- Fine print ---------- */

export function D1FinePrint({ items }: { items: SiteConfig["FINE_PRINT"] }) {
  if (!items.length) return null
  return (
    <section aria-labelledby="d1-fine" className="py-20 sm:py-28">
      <D1Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <div>
            <p className="d1-mono d1-kicker">The fine print</p>
            <h2 id="d1-fine" className="d1-h2 mt-5 text-[2.6rem] text-ink sm:text-[4rem]">
              No surprises.
            </h2>
          </div>
          <div className="grid gap-3">
            {items.map((f) => (
              <details key={f.title} className="group rounded-[20px] bg-white px-6 shadow-[0_0_0_1px_var(--line)] open:bg-white sm:px-7">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-left [&::-webkit-details-marker]:hidden">
                  <span className="d1-h3 text-[1.25rem] text-ink sm:text-[1.45rem]">{f.title}</span>
                  <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-lime text-ink transition-transform duration-300 group-open:rotate-45" style={{ background: "var(--lime)" }} aria-hidden="true">
                    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M8 3v10M3 8h10" strokeLinecap="round" />
                    </svg>
                  </span>
                </summary>
                <p className="max-w-xl pb-7 text-[1.02rem] leading-relaxed text-soft">{f.body}</p>
              </details>
            ))}
          </div>
        </div>
      </D1Container>
    </section>
  )
}

/* ---------- Footer ---------- */

export function D1Footer({ kentNumber }: { kentNumber?: string }) {
  const tel = normalizePhone(kentNumber)
  return (
    <footer className="mt-auto overflow-hidden pt-16 pb-28 lg:pb-12">
      <D1Container>
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-line pt-6 text-[0.92rem] text-soft">
          {tel ? (
            <a href={`sms:${tel}`} className="hover:text-ink">
              Questions? Text Kent at {formatPhoneForDisplay(tel)}
            </a>
          ) : (
            <span>Questions? Reply to any text from Kent.</span>
          )}
          <span className="flex gap-6">
            <a href="https://www.localeyesgrowth.com" className="hover:text-ink">
              localeyesgrowth.com
            </a>
            <Link href="/demo/privacy" className="hover:text-ink">
              Privacy
            </Link>
            <a href="https://www.instagram.com/localeyesseo" className="hover:text-ink">
              @localeyesseo
            </a>
          </span>
        </div>
        <p className="d1-h1 mt-8 text-center text-[clamp(4rem,19vw,17rem)] leading-[0.78] text-ink" aria-hidden="true">
          LocalEyes
        </p>
      </D1Container>
    </footer>
  )
}
