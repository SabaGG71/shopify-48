import { CtaLink } from "@/components/brand/cta"
import { BeforeAfter } from "@/components/proof/before-after"
import type { SiteConfig } from "@/lib/config"
import { slotsLeft } from "@/lib/slots"
import { cn } from "@/lib/utils"
import { GUARANTEES, STEPS } from "./copy"

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
    <span className="inline-flex items-center rounded-md border border-dashed border-gold/70 bg-brand-soft px-2 py-0.5 font-mono text-[0.72rem] text-gold-deep">
      {name} not set
    </span>
  )
}

function SectionHead({ eyebrow, title, lead, id }: { eyebrow: string; title: React.ReactNode; lead?: React.ReactNode; id: string }) {
  return (
    <div className="text-center">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="display mx-auto mt-5 max-w-[18ch] text-[2.5rem] text-balance text-ink sm:text-[3.9rem]">
        {title}
      </h2>
      {lead ? <p className="mx-auto mt-4 max-w-xl text-[1.05rem] leading-relaxed text-soft">{lead}</p> : null}
    </div>
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
    <section aria-labelledby="proof-title" className="border-y border-line bg-white py-20 sm:py-28">
      <Container>
        <SectionHead
          id="proof-title"
          eyebrow="Proof"
          title={
            <>
              Same products. Same brand. <span className="text-gold">New store.</span>
            </>
          }
          lead="Real stores we rebuilt. Drag the line to compare the old homepage with the new one."
        />
        {stores.length ? (
          <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-8">
            {stores.map((s) => (
              <div key={s.slug}>
                <BeforeAfter
                  name={s.name}
                  desktop={{ before: s.before_desktop, after: s.after_desktop }}
                  mobile={{ before: s.before_mobile, after: s.after_mobile }}
                />
                <p className="mt-4 text-center text-[0.95rem] font-semibold text-ink lg:text-left">
                  {s.name}
                  {s.caption ? <span className="font-normal text-soft"> · {s.caption}</span> : null}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-8 text-center">
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
    <section aria-labelledby="get-title" className="py-20 sm:py-28">
      <Container>
        <SectionHead
          id="get-title"
          eyebrow="What you get"
          title="Everything in the rebuild."
          lead="You keep your products, your brand and your Shopify account. We rebuild how the store looks and sells."
        />
        <ol className="mx-auto mt-12 grid max-w-5xl gap-3 sm:grid-cols-2">
          {items.map((item, i) => {
            const split = item.indexOf(": ")
            return (
              <li
                key={i}
                className={cn(
                  "flex gap-4 rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6",
                  i === items.length - 1 && items.length % 2 === 1 && "sm:col-span-2",
                )}
              >
                <span className="display w-9 shrink-0 text-[1.5rem] leading-none text-gold tabular">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[1.02rem] leading-snug text-ink">
                  {split > 0 ? (
                    <>
                      <span className="font-semibold">{item.slice(0, split)}</span>
                      <span className="text-soft">: {item.slice(split + 2)}</span>
                    </>
                  ) : (
                    <span className="font-semibold">{item}</span>
                  )}
                </span>
              </li>
            )
          })}
        </ol>
      </Container>
    </section>
  )
}

/* ---------- 6. Three guarantees ---------- */

export { GUARANTEES, STEPS }

export function Guarantees() {
  return (
    <section aria-labelledby="guarantees-title" className="border-y border-line bg-white py-20 sm:py-28">
      <Container>
        <SectionHead id="guarantees-title" eyebrow="Three guarantees" title="The risk is on us." />
        <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-3">
          {GUARANTEES.map((g) => (
            <div key={g.title} className="rounded-2xl bg-page p-6 ring-1 ring-line sm:p-7">
              <span className="display grid h-14 min-w-14 place-items-center justify-self-start rounded-xl bg-gold px-3 text-[1.5rem] text-white">
                {g.mark}
              </span>
              <h3 className="display mt-5 text-[1.7rem] text-balance text-ink">{g.title}</h3>
              <p className="mt-3 text-[0.98rem] leading-relaxed text-soft">{g.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

/* ---------- 7. How it works ---------- */

export function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="py-20 sm:py-28">
      <Container>
        <SectionHead id="how-title" eyebrow="How it works" title="You see your homepage before you pay." />
        <ol className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl bg-white p-6 ring-1 ring-line">
              <div className="flex items-center justify-between">
                <span className="display grid size-11 place-items-center rounded-full bg-ink text-[1.2rem] text-white">{i + 1}</span>
                <span className="micro">{s.when}</span>
              </div>
              <h3 className="display mt-5 text-[1.45rem] text-balance text-ink">{s.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-soft">{s.body}</p>
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
    <section aria-labelledby="price-title" className="border-y border-line bg-white py-20 sm:py-28">
      <Container>
        <div className="mx-auto max-w-2xl rounded-3xl bg-page px-6 py-10 text-center ring-1 ring-line sm:px-14 sm:py-14">
          <p className="eyebrow">The price</p>
          <h2 id="price-title" className="sr-only">
            The price
          </h2>
          <p className="display mt-6 text-[4.4rem] leading-none text-ink sm:text-[6.4rem]">
            {config.PRICE_DISPLAY || <MissingConfig name="PRICE_DISPLAY" show={missing} />}
          </p>
          {config.PRICE_NOTE ? <p className="mx-auto mt-4 max-w-md text-[1.1rem] font-semibold text-balance text-ink">{config.PRICE_NOTE}</p> : null}
          <p className="mx-auto mt-3 max-w-md text-[0.98rem] leading-relaxed text-soft">
            {showCounter && left === 0
              ? "This week is full. Reserve now to hold a slot for next week."
              : "Already sure? Skip the call and hold your spot this week."}
          </p>
          {showCounter ? (
            <div className="mt-7 flex flex-col items-center gap-3">
              <div className="flex max-w-full flex-wrap justify-center gap-1.5" aria-hidden="true">
                {Array.from({ length: perWeek }).map((_, i) => (
                  <span key={i} className={cn("h-2 w-8 rounded-full", i < perWeek - left ? "bg-ink/15" : "bg-gold")} />
                ))}
              </div>
              <p className="text-[0.92rem] font-semibold text-ink">
                {left} of {perWeek} slots left this week
              </p>
            </div>
          ) : null}
          <div className="mt-8">
            {config.RESERVE_URL ? (
              <CtaLink href={config.RESERVE_URL} className="w-full text-[0.9rem] sm:text-[1.02rem]" data-reserve-link>
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
    <section aria-labelledby="fine-title" className="py-20 sm:py-28">
      <Container className="max-w-[860px]">
        <SectionHead id="fine-title" eyebrow="The fine print" title="No surprises." />
        <div className="mt-10 overflow-hidden rounded-2xl bg-white ring-1 ring-line">
          {items.map((f) => (
            <details key={f.title} className="group border-b border-line last:border-b-0">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-5 py-5 text-left sm:px-7 [&::-webkit-details-marker]:hidden">
                <span className="display text-[1.35rem] text-ink sm:text-[1.5rem]">{f.title}</span>
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-page text-ink ring-1 ring-line transition-transform duration-300 group-open:rotate-45"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3v10M3 8h10" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p className="max-w-2xl px-5 pb-6 text-[1rem] leading-relaxed text-soft sm:px-7">{f.body}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  )
}
