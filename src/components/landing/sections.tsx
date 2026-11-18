import { CtaLink } from "@/components/brand/cta"
import { LabelRule, Ornament } from "@/components/brand/marks"
import { BeforeAfter } from "@/components/proof/before-after"
import type { SiteConfig } from "@/lib/config"
import { slotsLeft } from "@/lib/slots"
import { cn } from "@/lib/utils"

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1180px] pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] sm:px-8",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function MissingConfig({ name, show }: { name: string; show: boolean }) {
  if (!show) return null
  return (
    <span className="inline-flex items-center rounded-md border border-dashed border-gold/70 bg-[#fbf6ea] px-2 py-0.5 font-mono text-[0.72rem] text-gold-deep">
      {name} not set
    </span>
  )
}

/* ---------- 4. Proof ---------- */

/** Cleared stores that have a complete before and after pair. */
export function shownProofStores(config: SiteConfig) {
  return config.PROOF_STORES.filter((s) => s.cleared && ((s.before_desktop && s.after_desktop) || (s.before_mobile && s.after_mobile)))
}

export function ProofSection({ config, missing, exclude }: { config: SiteConfig; missing: boolean; exclude?: string | null }) {
  const stores = shownProofStores(config).filter((s) => s.slug !== exclude)
  if (!stores.length && !missing) return null
  return (
    <section aria-labelledby="proof-title" className="py-16 sm:py-24">
      <Container>
        <LabelRule right="Same products. Same brand.">Proof</LabelRule>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.2fr] lg:items-end">
          <h2 id="proof-title" className="display text-[2.3rem] text-ink sm:text-[3.2rem]">
            Before and after.
          </h2>
          <p className="max-w-md text-[0.95rem] leading-relaxed text-soft lg:justify-self-end">
            Real stores we rebuilt. Drag the line to compare the old homepage with the new one.
          </p>
        </div>
        {stores.length ? (
          <div className="mt-10 grid gap-14">
            {stores.map((s) => (
              <div key={s.slug}>
                <BeforeAfter
                  name={s.name}
                  desktop={{ before: s.before_desktop, after: s.after_desktop }}
                  mobile={{ before: s.before_mobile, after: s.after_mobile }}
                />
                <p className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[0.86rem] text-soft md:justify-start md:text-left">
                  <span className="font-semibold text-ink">{s.name}</span>
                  {s.caption ? (
                    <>
                      <Ornament className="size-2" />
                      <span>{s.caption}</span>
                    </>
                  ) : null}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-8">
            <MissingConfig name="PROOF_STORES images" show={missing} />
          </p>
        )}
      </Container>
    </section>
  )
}

/* ---------- 5. What you get ---------- */

export function WhatYouGet({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <section aria-labelledby="get-title" className="border-y border-line bg-panel/70 py-16 sm:py-24">
      <Container className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <LabelRule>What you get</LabelRule>
          <h2 id="get-title" className="display mt-6 text-[2.3rem] text-balance text-ink sm:text-[3.2rem]">
            Everything in the rebuild.
          </h2>
          <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-soft">
            You keep your products, your brand and your Shopify account. We rebuild how the store looks and sells.
          </p>
        </div>
        <ul className="border-t border-line">
          {items.map((item, i) => (
            <li key={i} className="flex items-baseline gap-4 border-b border-line py-4 sm:py-5">
              <span className="display w-7 shrink-0 text-[1.05rem] text-gold tabular">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-[1rem] leading-snug text-ink sm:text-[1.08rem]">
                {item.includes(": ") ? (
                  <>
                    <span className="font-semibold">{item.slice(0, item.indexOf(": "))}</span>
                    <span className="text-soft">: {item.slice(item.indexOf(": ") + 2)}</span>
                  </>
                ) : (
                  item
                )}
              </span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}

/* ---------- 6. Three guarantees ---------- */

const GUARANTEES = [
  {
    title: "48 hours or it’s free.",
    body: "Your preview is ready 48 hours after the clock starts, or you don't pay for the rebuild.",
  },
  {
    title: "Nothing goes live without your yes.",
    body: "You see the whole store on a private preview link first. It only goes live when you approve it.",
  },
  {
    title: "Zero SEO loss.",
    body: "Your page addresses, titles and descriptions carry over, and every old link is redirected to its new page.",
  },
]

export function Guarantees() {
  return (
    <section aria-labelledby="guarantees-title" className="py-16 sm:py-24">
      <Container>
        <LabelRule>Three guarantees</LabelRule>
        <h2 id="guarantees-title" className="sr-only">
          Three guarantees
        </h2>
        <div className="mt-8 grid gap-10 md:grid-cols-3 md:gap-8">
          {GUARANTEES.map((g, i) => (
            <div key={g.title} className="border-t border-line pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-7 md:first:border-l-0 md:first:pl-0">
              <span className="display text-[1.1rem] text-gold">{["I", "II", "III"][i]}</span>
              <h3 className="display mt-3 text-[1.9rem] text-balance text-ink sm:text-[2.15rem]">{g.title}</h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-soft">{g.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

/* ---------- 7. How it works ---------- */

const STEPS = [
  { title: "Apply", body: "Two minutes. Pick a look and tell us about your store.", when: "Today" },
  {
    title: "See your homepage on a call",
    body: "If you qualify, we rebuild your homepage first, free, and walk you through it on a short call.",
    when: "Free",
  },
  { title: "Fill the intake", body: "Fifteen minutes: store access, brand, best sellers, offers and apps.", when: "15 min" },
  { title: "Preview in 48 hours", body: "Your whole store on a private link. Nothing goes live until you say yes.", when: "48 hrs" },
]

export function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="border-y border-line bg-panel/70 py-16 sm:py-24">
      <Container>
        <LabelRule>How it works</LabelRule>
        <h2 id="how-title" className="display mt-6 max-w-2xl text-[2.3rem] text-balance text-ink sm:text-[3.2rem]">
          You see your homepage before you pay.
        </h2>
        <ol className="relative mt-10 grid gap-0 lg:grid-cols-4 lg:gap-8">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative grid grid-cols-[2.25rem_1fr] gap-x-4 pb-8 last:pb-0 lg:block lg:pb-0">
              <div className="relative flex flex-col items-center lg:flex-row lg:items-center">
                <span className="display relative z-10 grid size-9 place-items-center rounded-full border border-gold/60 bg-page text-[1.05rem] text-gold">
                  {i + 1}
                </span>
                {i < STEPS.length - 1 ? (
                  <span className="absolute top-9 bottom-[-2rem] w-px bg-line lg:static lg:ml-3 lg:h-px lg:w-auto lg:flex-1" aria-hidden="true" />
                ) : null}
              </div>
              <div className="lg:mt-5">
                <p className="micro">{s.when}</p>
                <h3 className="display mt-1.5 text-[1.55rem] text-balance text-ink">{s.title}</h3>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-soft">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}

/* ---------- 8. Price and reserve ---------- */

export async function PriceReserve({ config, missing }: { config: SiteConfig; missing: boolean }) {
  const perWeek = config.SLOT_COUNTER_ON && config.SLOTS_PER_WEEK ? config.SLOTS_PER_WEEK : null
  const left = await slotsLeft(perWeek, config.SLOTS_LEFT)
  const showCounter = perWeek !== null && left !== null
  if (!config.PRICE_DISPLAY && !config.RESERVE_URL && !missing) return null
  return (
    <section aria-labelledby="price-title" className="py-16 sm:py-24">
      <Container>
        <div className="mx-auto max-w-3xl rounded-[24px] border border-line bg-paper/80 px-6 py-10 text-center sm:px-14 sm:py-14">
          <LabelRule className="justify-center [&::after]:hidden">
            <Ornament /> The price <Ornament />
          </LabelRule>
          <h2 id="price-title" className="sr-only">
            The price
          </h2>
          <p className="display mt-5 text-[3.6rem] leading-none text-ink sm:text-[5rem]">
            {config.PRICE_DISPLAY || <MissingConfig name="PRICE_DISPLAY" show={missing} />}
          </p>
          {config.PRICE_NOTE ? <p className="mt-4 text-[1.02rem] font-medium text-ink">{config.PRICE_NOTE}</p> : null}
          <p className="mx-auto mt-3 max-w-md text-[0.92rem] leading-relaxed text-soft">
            {showCounter && left === 0
              ? "This week is full. Reserve now to hold a slot for next week."
              : "Already sure? Skip the call and hold your spot this week."}
          </p>
          {showCounter ? (
            <div className="mt-6 flex flex-col items-center gap-2.5">
              <div className="flex gap-1.5" aria-hidden="true">
                {Array.from({ length: perWeek }).map((_, i) => (
                  <span key={i} className={cn("h-1.5 w-6 rounded-full", i < perWeek - left ? "bg-ink/20" : "bg-gold")} />
                ))}
              </div>
              <p className="micro text-ink">
                {left} of {perWeek} slots left this week
              </p>
            </div>
          ) : null}
          <div className="mt-8 flex justify-center">
            {config.RESERVE_URL ? (
              <CtaLink href={config.RESERVE_URL} variant="outline" data-reserve-link>
                Skip the call, reserve a slot
              </CtaLink>
            ) : (
              <MissingConfig name="RESERVE_URL" show={missing} />
            )}
          </div>
        </div>
      </Container>
    </section>
  )
}

/* ---------- 9. The fine print ---------- */

export function FinePrint({ items }: { items: SiteConfig["FINE_PRINT"] }) {
  if (!items.length) return null
  return (
    <section aria-labelledby="fine-title" className="pb-16 sm:pb-24">
      <Container className="max-w-[900px]">
        <LabelRule>The fine print</LabelRule>
        <h2 id="fine-title" className="sr-only">
          The fine print
        </h2>
        <div className="mt-4">
          {items.map((f) => (
            <details key={f.title} className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left [&::-webkit-details-marker]:hidden">
                <span className="display text-[1.4rem] text-ink sm:text-[1.6rem]">{f.title}</span>
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-full border border-line-strong text-ink transition-transform duration-300 group-open:rotate-45"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M8 3v10M3 8h10" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p className="max-w-2xl pb-6 text-[0.95rem] leading-relaxed text-soft">{f.body}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  )
}
