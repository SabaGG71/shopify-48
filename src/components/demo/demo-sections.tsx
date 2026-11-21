import Link from "next/link"
import { Wordmark } from "@/components/brand/marks"
import { GUARANTEES, MissingConfig, STEPS, shownProofStores } from "@/components/landing/sections"
import type { SiteConfig } from "@/lib/config"
import { slotsLeft } from "@/lib/slots"
import { formatPhoneForDisplay, normalizePhone } from "@/lib/url"
import { cn } from "@/lib/utils"
import { DemoProof as DemoProofWindow, type ProofTab } from "./demo-proof"
import { DemoLink, Extrude } from "./demo-ui"
import { Reveal } from "./reveal"

type Tone = "berry" | "butter" | "mint" | "sky"
const TONES: Tone[] = ["berry", "butter", "mint", "sky"]

/** Real domains of the cleared proof stores, shown in the browser bars. */
export const PROOF_DOMAINS: Record<string, string> = {
  lima: "limacoffeeroasters.com",
  boxwood: "boxwoodcoffee.com",
  "lake-effect": "lakeeffectcoffeeco.com",
}

export function DContainer({ className, children }: { className?: string; children: React.ReactNode }) {
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

export function DemoHead({ kicker, title, lead, id }: { kicker: string; title: React.ReactNode; lead?: React.ReactNode; id: string }) {
  return (
    <Reveal className="text-center">
      <p className="d-kicker rv">{kicker}</p>
      <h2 id={id} className="d-display rv mx-auto mt-3 max-w-[20ch] text-[2.3rem] text-balance text-ink sm:text-[3.3rem]" style={{ ["--rv-delay" as string]: "80ms" }}>
        {title}
      </h2>
      {lead ? (
        <p className="rv mx-auto mt-4 max-w-xl text-[1.04rem] leading-relaxed text-soft" style={{ ["--rv-delay" as string]: "160ms" }}>
          {lead}
        </p>
      ) : null}
    </Reveal>
  )
}

async function slotState(config: SiteConfig) {
  const perWeek = config.SLOT_COUNTER_ON && config.SLOTS_PER_WEEK ? config.SLOTS_PER_WEEK : null
  const left = await slotsLeft(perWeek, config.SLOTS_LEFT)
  return perWeek !== null && left !== null ? { perWeek, left } : null
}

/* ---------- Header: one berry bar, as on the reference page ---------- */

export async function DemoHeader({ config, applyHref = "#apply-top", showApply = true }: { config: SiteConfig; applyHref?: string; showApply?: boolean }) {
  const slots = await slotState(config)
  return (
    <header className="demo-header relative z-20">
      <div className="mx-auto flex h-14 max-w-[1180px] items-center justify-between gap-3 px-4 sm:h-16 sm:px-8">
        <Link href="/" className="flex items-baseline gap-3" aria-label="LocalEyes 48 Hour Rebuild home">
          <Wordmark className="text-[1.15rem] tracking-[0.02em] sm:text-[1.3rem]" />
          <span className="hidden text-[0.8rem] font-semibold text-white/75 md:inline">48 Hour Rebuild</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-5">
          {slots ? (
            <p className="text-[0.78rem] font-semibold whitespace-nowrap text-white/90 sm:text-[0.86rem]">
              {slots.left} of {slots.perWeek} slots left<span className="hidden sm:inline">&nbsp;this week</span>
            </p>
          ) : null}
          {showApply ? (
            <DemoLink href={applyHref} tone="butter" size="sm" arrow={false}>
              Apply
            </DemoLink>
          ) : null}
        </div>
      </div>
    </header>
  )
}

/* ---------- Proof ---------- */

export function DemoProof({ config, missing }: { config: SiteConfig; missing: boolean }) {
  const stores = shownProofStores(config)
  if (!stores.length && !missing) return null
  // Same order as the hero: the most dramatic change first.
  const order = ["lake-effect", "lima", "boxwood"]
  const rank = (slug: string) => (order.includes(slug) ? order.indexOf(slug) : order.length)
  const tabs: ProofTab[] = [...stores]
    .sort((a, b) => rank(a.slug) - rank(b.slug))
    .map((s) => ({
      slug: s.slug,
      name: s.name,
      domain: PROOF_DOMAINS[s.slug] ?? null,
      desktop: { before: s.before_desktop, after: s.after_desktop },
      mobile: { before: s.before_mobile, after: s.after_mobile },
    }))
  return (
    <section aria-labelledby="d-proof-title" className="py-16 sm:py-24">
      <DContainer>
        <DemoHead
          id="d-proof-title"
          kicker="Proof"
          title={
            <>
              Same products. Same brand. <span className="text-gold">New store.</span>
            </>
          }
          lead="Real stores we rebuilt. Pick a tab, then drag the line to compare."
        />
        {stores.length ? (
          <Reveal className="mt-10 sm:mt-12" threshold={0.15}>
            <div className="rv">
              <DemoProofWindow stores={tabs} />
            </div>
          </Reveal>
        ) : (
          <p className="mt-8 text-center">
            <MissingConfig name="PROOF_STORES images" show={missing} />
          </p>
        )}
      </DContainer>
    </section>
  )
}

/* ---------- What you get ---------- */

export function DemoWhatYouGet({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <section aria-labelledby="d-get-title" className="bg-white py-16 sm:py-24">
      <DContainer>
        <DemoHead
          id="d-get-title"
          kicker="What you get"
          title="Everything in the rebuild."
          lead="You keep your products, your brand and your Shopify account. We rebuild how the store looks and sells."
        />
        <Reveal as="ol" className="mx-auto mt-8 grid max-w-5xl gap-3 sm:mt-10 sm:gap-4 lg:grid-cols-2" threshold={0.1}>
          {items.map((item, i) => {
            const split = item.indexOf(": ")
            return (
              <li
                key={i}
                className={cn(
                  "rv d-card flex items-center gap-4 px-4 py-4 sm:gap-7 sm:p-7",
                  i === items.length - 1 && items.length % 2 === 1 && "lg:col-span-2",
                )}
                style={{ ["--rv-delay" as string]: `${i * 70}ms` }}
              >
                <span className="x-num w-11 shrink-0 text-center text-[2.7rem] sm:w-16 sm:text-[3.9rem]" data-tone={TONES[i % TONES.length]} aria-hidden="true">
                  {i + 1}
                </span>
                <span className="min-w-0 text-[1rem] leading-snug text-ink sm:text-[1.1rem]">
                  {split > 0 ? (
                    <>
                      <span className="block font-bold">{item.slice(0, split)}</span>
                      <span className="mt-0.5 block text-[0.92rem] text-soft sm:mt-1 sm:text-[0.97rem]">{item.slice(split + 2)}</span>
                    </>
                  ) : (
                    <span className="font-bold">{item}</span>
                  )}
                </span>
              </li>
            )
          })}
        </Reveal>
      </DContainer>
    </section>
  )
}

/* ---------- Guarantees: three 3D coins ---------- */

const RING: Record<string, string> = {
  "48h": "48 HOURS OR IT'S FREE · 48 HOURS OR IT'S FREE · ",
  Yes: "YOUR YES FIRST · YOUR YES FIRST · YOUR YES FIRST · ",
  "0": "ZERO SEO LOSS · ZERO SEO LOSS · ZERO SEO LOSS · ",
}
const UNDER: Record<string, string> = { "48h": "or it's free", Yes: "before it's live", "0": "SEO loss" }

function CoinFace({ mark, uid, ink }: { mark: string; uid: string; ink: string }) {
  const display = { fontFamily: "var(--font-demo-display), Arial, sans-serif" }
  return (
    <svg viewBox="0 0 200 200" className="size-full" aria-hidden="true">
      <defs>
        <path id={uid} d="M100,100 m-82,0 a82,82 0 1,1 164,0 a82,82 0 1,1 -164,0" />
      </defs>
      <circle cx="100" cy="100" r="100" style={{ fill: "var(--tone)" }} />
      <circle cx="100" cy="100" r="93" fill="none" stroke={ink} strokeOpacity="0.22" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="68" fill="none" stroke={ink} strokeOpacity="0.22" strokeWidth="1.5" />
      <text fill={ink} fontSize="12.5" fontWeight="800" letterSpacing="1" style={display}>
        <textPath href={`#${uid}`} textLength="508" lengthAdjust="spacing">
          {RING[mark] ?? mark}
        </textPath>
      </text>
      <text x="100" y={mark === "0" ? 116 : 112} textAnchor="middle" fill={ink} fontSize={mark === "48h" ? 52 : 60} fontWeight="900" style={display}>
        {mark === "Yes" ? "YES" : mark}
      </text>
      <text x="100" y="138" textAnchor="middle" fill={ink} fillOpacity="0.8" fontSize="11.5" fontWeight="700" letterSpacing="0.6" style={display}>
        {UNDER[mark]?.toUpperCase()}
      </text>
    </svg>
  )
}

function Coin({ mark, tone, index }: { mark: string; tone: Tone; index: number }) {
  const ink = "#0e1b33"
  return (
    <div data-tone={tone} aria-hidden="true" className="shrink-0">
      <div className="coin mx-auto" style={{ ["--coin-delay" as string]: `${index * -3}s` }}>
        <div className="coin-spin">
          {Array.from({ length: 14 }, (_, i) => (
            <span key={i} className="coin-edge" style={{ ["--i" as string]: i }} />
          ))}
          <span className="coin-face coin-front">
            <CoinFace mark={mark} uid={`coin-${index}-f`} ink={ink} />
          </span>
          <span className="coin-face coin-back">
            <CoinFace mark={mark} uid={`coin-${index}-b`} ink={ink} />
          </span>
        </div>
      </div>
      <div className="coin-shadow" />
    </div>
  )
}

export function DemoGuarantees() {
  const tones: Tone[] = ["berry", "butter", "mint"]
  return (
    <section aria-labelledby="d-guarantees-title" className="demo-dark py-16 sm:py-24">
      <DContainer>
        <DemoHead id="d-guarantees-title" kicker="Three guarantees" title="The risk is on us." />
        <Reveal className="mx-auto mt-10 grid max-w-5xl gap-8 md:mt-12 md:grid-cols-3 md:gap-8" threshold={0.15}>
          {GUARANTEES.map((g, i) => (
            <div key={g.title} className="rv flex items-center gap-5 md:block md:text-center" style={{ ["--rv-delay" as string]: `${i * 120}ms` }}>
              <Coin mark={g.mark} tone={tones[i]} index={i} />
              <div className="min-w-0">
                <h3 className="d-display max-w-[14ch] text-[1.45rem] text-balance text-ink md:mx-auto md:mt-7 md:text-[1.9rem]">{g.title}</h3>
                <p className="mt-2 max-w-xs text-[0.95rem] leading-relaxed text-soft md:mx-auto md:mt-3 md:text-[1rem]">{g.body}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </DContainer>
    </section>
  )
}

/* ---------- How it works: four 3D steps rising like stairs ---------- */

export function DemoHowItWorks() {
  const tones: Tone[] = ["sky", "mint", "butter", "berry"]
  const heights = ["3.6rem", "5.4rem", "7.2rem", "9rem"]
  return (
    <section aria-labelledby="d-how-title" className="overflow-hidden bg-white py-16 sm:py-24">
      <DContainer>
        <DemoHead id="d-how-title" kicker="How it works" title="You see your homepage before you pay." />
        <Reveal as="ol" className="mx-auto mt-8 grid max-w-5xl gap-5 sm:mt-6 sm:grid-cols-2 sm:gap-10 lg:grid-cols-4 lg:gap-6" threshold={0.15}>
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex items-center gap-4 text-left sm:block sm:text-center">
              <div className="blk-wrap" aria-hidden="true">
                <div className="blk-rise" style={{ ["--rv-delay" as string]: `${i * 140}ms` }}>
                  <div className="blk" data-tone={tones[i]} style={{ ["--hb" as string]: heights[i] }}>
                    <span className="blk-right" />
                    <span className="blk-top" />
                    <span className={cn("blk-front", tones[i] === "berry" && "text-white")}>{i + 1}</span>
                  </div>
                </div>
              </div>
              <div className="min-w-0">
                <p className="d-kicker sm:mt-8">{s.when}</p>
                <h3 className="d-display mt-1 max-w-[14ch] text-[1.35rem] text-balance text-ink sm:mx-auto sm:mt-2 sm:text-[1.6rem]">{s.title}</h3>
                <p className="mt-1.5 max-w-[30ch] text-[0.95rem] leading-relaxed text-soft sm:mx-auto sm:mt-2 sm:text-[0.98rem]">{s.body}</p>
              </div>
            </li>
          ))}
        </Reveal>
      </DContainer>
    </section>
  )
}

/* ---------- Price ---------- */

export async function DemoPrice({ config, missing }: { config: SiteConfig; missing: boolean }) {
  const slots = await slotState(config)
  if (!config.PRICE_DISPLAY && !config.RESERVE_URL && !missing) return null
  return (
    <section aria-labelledby="d-price-title" className="demo-dark py-16 sm:py-24">
      <DContainer>
        <Reveal className="mx-auto max-w-3xl">
          <div className="rv d-card relative overflow-hidden px-6 py-12 text-center sm:px-14 sm:py-16">
            <p className="d-kicker">The price</p>
            <h2 id="d-price-title" className="sr-only">
              The price
            </h2>
            <p className="x3d-stage d-display mt-6 text-[4.6rem] leading-none sm:text-[7.6rem]">
              {config.PRICE_DISPLAY ? <Extrude depth={14}>{config.PRICE_DISPLAY}</Extrude> : <MissingConfig name="PRICE_DISPLAY" show={missing} />}
            </p>
            {config.PRICE_NOTE ? <p className="mx-auto mt-6 max-w-md text-[1.15rem] font-bold text-balance text-ink">{config.PRICE_NOTE}</p> : null}
            <p className="mx-auto mt-3 max-w-md text-[1rem] leading-relaxed text-soft">
              {slots && slots.left === 0
                ? "This week is full. Reserve now to hold a slot for next week."
                : "Already sure? Skip the call and hold your spot this week."}
            </p>
            {slots ? (
              <div className="mt-8 flex flex-col items-center gap-4">
                <div className="flex max-w-full flex-wrap justify-center gap-2" aria-hidden="true">
                  {Array.from({ length: slots.perWeek }).map((_, i) => {
                    const taken = i < slots.perWeek - slots.left
                    return (
                      <span key={i} className="slot" data-taken={taken ? "" : undefined}>
                        {taken ? "✓" : ""}
                      </span>
                    )
                  })}
                </div>
                <p className="text-[0.98rem] font-bold text-ink">
                  {slots.left} of {slots.perWeek} slots left this week
                </p>
              </div>
            ) : null}
            <div className="mt-9">
              {config.RESERVE_URL ? (
                <DemoLink href={config.RESERVE_URL} className="w-full max-w-md" data-reserve-link>
                  Skip the call, reserve a slot
                </DemoLink>
              ) : (
                <MissingConfig name="RESERVE_URL" show={missing} />
              )}
            </div>
          </div>
        </Reveal>
      </DContainer>
    </section>
  )
}

/* ---------- Fine print ---------- */

export function DemoFinePrint({ items }: { items: SiteConfig["FINE_PRINT"] }) {
  if (!items.length) return null
  return (
    <section aria-labelledby="d-fine-title" className="bg-white py-16 sm:py-24">
      <DContainer className="max-w-[860px]">
        <DemoHead id="d-fine-title" kicker="The fine print" title="No surprises." />
        <div className="mt-10 grid gap-4">
          {items.map((f) => (
            <details key={f.title} className="group d-card overflow-hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 text-left sm:px-8 sm:py-6 [&::-webkit-details-marker]:hidden">
                <span className="d-display text-[1.45rem] text-ink sm:text-[1.7rem]">{f.title}</span>
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-gold transition-transform duration-300 group-open:rotate-45"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M8 3v10M3 8h10" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p className="max-w-2xl px-6 pb-7 text-[1.02rem] leading-relaxed text-soft sm:px-8">{f.body}</p>
            </details>
          ))}
        </div>
      </DContainer>
    </section>
  )
}

/* ---------- Footer ---------- */

export function DemoFooter({ kentNumber }: { kentNumber?: string }) {
  const tel = normalizePhone(kentNumber)
  return (
    <footer className="demo-dark mt-auto overflow-hidden pt-16 pb-28 lg:pb-12">
      <DContainer>
        <p className="d-wordmark text-center text-[clamp(3.6rem,17vw,13.5rem)]" aria-hidden="true">
          LocalEyes
        </p>
        <div className="mt-10 grid gap-4 text-[0.9rem] text-soft lg:grid-cols-3 lg:items-center">
          <a href="https://www.localeyesgrowth.com" className="font-semibold text-ink hover:text-gold">
            localeyesgrowth.com
          </a>
          {tel ? (
            <a href={`sms:${tel}`} className="font-medium hover:text-ink lg:text-center">
              Questions? Text Kent at {formatPhoneForDisplay(tel)}
            </a>
          ) : (
            <span className="lg:text-center">Questions? Reply to any text from Kent.</span>
          )}
          <div className="flex gap-5 lg:justify-end">
            <Link href="/privacy" className="hover:text-ink">
              Privacy
            </Link>
            <a href="https://www.instagram.com/localeyesseo" className="hover:text-ink">
              @localeyesseo
            </a>
          </div>
        </div>
      </DContainer>
    </footer>
  )
}
