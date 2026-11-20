import Link from "next/link"
import { Reveal } from "@/components/demo/reveal"
import { MissingConfig } from "@/components/landing/sections"
import type { SiteConfig } from "@/lib/config"
import { slotsLeft } from "@/lib/slots"
import { formatPhoneForDisplay, normalizePhone } from "@/lib/url"
import { Guarantees, Schedule } from "./proposal-parts"

export async function d2Slots(config: SiteConfig) {
  const perWeek = config.SLOT_COUNTER_ON && config.SLOTS_PER_WEEK ? config.SLOTS_PER_WEEK : null
  const left = await slotsLeft(perWeek, config.SLOTS_LEFT)
  return perWeek !== null && left !== null ? { perWeek, left } : null
}

export function SlotMarks({ perWeek, left }: { perWeek: number; left: number }) {
  return (
    <span className="d2-slots">
      <span className="d2-slot-marks" aria-hidden="true">
        {Array.from({ length: perWeek }).map((_, i) => (
          <i key={i} data-taken={i < perWeek - left ? "" : undefined} />
        ))}
      </span>
      {left} of {perWeek} slots left this week
    </span>
  )
}

/** A part of the proposal: a small label, a calm title, then its content. */
export function Part({ label, title, id, children, className }: { label: string; title?: React.ReactNode; id: string; children: React.ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={`d2-part d2-pad ${className ?? ""}`}>
      <Reveal className="grid gap-x-12 gap-y-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <p id={id} className="rv d2-label lg:pt-1.5">
          {label}
        </p>
        <div className="rv min-w-0" style={{ ["--rv-delay" as string]: "80ms" }}>
          {title ? <h2 className="d2-h2 max-w-[24ch] text-ink">{title}</h2> : null}
          <div className={title ? "mt-7" : ""}>{children}</div>
        </div>
      </Reveal>
    </section>
  )
}

/* ---------- Header ---------- */

export function D2Header() {
  return (
    <header className="relative z-20">
      <div className="mx-auto flex h-16 w-[min(100%-1.5rem,64rem)] items-center justify-between gap-4">
        <Link href="/demo-2" className="flex items-baseline gap-2.5" aria-label="LocalEyes 48 Hour Rebuild home">
          <span className="text-[1.05rem] font-semibold tracking-[-0.03em] text-ink">LocalEyes</span>
          <span className="hidden text-[0.86rem] text-tan sm:inline">The 48 Hour Rebuild</span>
        </Link>
        <a href="#apply-top" className="d2-btn" data-size="sm">
          Apply
        </a>
      </div>
    </header>
  )
}

/* ---------- The quote ---------- */

export async function Quote({ config, missing }: { config: SiteConfig; missing: boolean }) {
  const slots = await d2Slots(config)
  if (!config.WHAT_YOU_GET.length && !config.PRICE_DISPLAY && !missing) return null
  return (
    <Part label="The quote" id="d2-quote" title="Everything in the rebuild, on one page.">
      <p className="max-w-xl text-[1rem] leading-relaxed text-soft">You keep your products, your brand and your Shopify account. We rebuild how the store looks and sells.</p>
      <table className="d2-quote mt-7">
        <tbody>
          {config.WHAT_YOU_GET.map((item, i) => {
            const split = item.indexOf(": ")
            return (
              <tr key={i}>
                <td>
                  <span className="block font-semibold text-ink">{split > 0 ? item.slice(0, split) : item}</span>
                  {split > 0 ? <span className="mt-0.5 block text-[0.9rem] text-soft">{item.slice(split + 2)}</span> : null}
                </td>
                <td>Included</td>
              </tr>
            )
          })}
          <tr className="d2-total">
            <td>
              Total
              {config.PRICE_NOTE ? <span className="mt-1 block text-[0.92rem] font-medium text-soft">{config.PRICE_NOTE}</span> : null}
            </td>
            <td>{config.PRICE_DISPLAY || <MissingConfig name="PRICE_DISPLAY" show={missing} />}</td>
          </tr>
        </tbody>
      </table>
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
        {config.RESERVE_URL ? (
          <a href={config.RESERVE_URL} className="d2-btn" data-reserve-link>
            Skip the call, reserve a slot
          </a>
        ) : (
          <MissingConfig name="RESERVE_URL" show={missing} />
        )}
        {slots ? <SlotMarks perWeek={slots.perWeek} left={slots.left} /> : null}
      </div>
      <p className="mt-4 text-[0.9rem] text-soft">
        {slots && slots.left === 0 ? "This week is full. Reserve now to hold a slot for next week. " : ""}
        Not sure yet?{" "}
        <a href="#apply-top" className="d2-link">
          See your homepage first, free
        </a>
        .
      </p>
    </Part>
  )
}

/* ---------- Terms and schedule (client parts that use their store's address) ---------- */

export function Terms() {
  return (
    <Part label="The terms" id="d2-terms" title="The risk is on us.">
      <Guarantees />
    </Part>
  )
}

export function Timeline() {
  return (
    <Part label="How it works" id="d2-how" title="You see your homepage before you pay.">
      <Schedule />
    </Part>
  )
}

/* ---------- Notes: the fine print ---------- */

export function Notes({ items }: { items: SiteConfig["FINE_PRINT"] }) {
  if (!items.length) return null
  return (
    <Part label="Notes" id="d2-notes">
      <dl className="grid gap-6 md:grid-cols-3 md:gap-8">
        {items.map((f) => (
          <div key={f.title}>
            <dt className="text-[1rem] font-semibold text-ink">{f.title}</dt>
            <dd className="mt-1.5 text-[0.93rem] leading-relaxed text-soft">{f.body}</dd>
          </div>
        ))}
      </dl>
    </Part>
  )
}

/* ---------- Footer ---------- */

export function D2Footer({ kentNumber }: { kentNumber?: string }) {
  const tel = normalizePhone(kentNumber)
  return (
    <footer className="mt-auto pt-10 pb-28 lg:pb-12">
      <div className="mx-auto flex w-[min(100%-1.5rem,64rem)] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-1 text-[0.88rem] text-soft">
        <span className="font-semibold tracking-[-0.02em] text-ink">LocalEyes</span>
        {tel ? (
          <a href={`sms:${tel}`} className="hover:text-ink">
            Questions? Text Kent at {formatPhoneForDisplay(tel)}
          </a>
        ) : (
          <span>Questions? Reply to any text from Kent.</span>
        )}
        <span className="flex gap-5">
          <a href="https://www.localeyesgrowth.com" className="hover:text-ink">
            localeyesgrowth.com
          </a>
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
          <a href="https://www.instagram.com/localeyesseo" className="hover:text-ink">
            @localeyesseo
          </a>
        </span>
      </div>
    </footer>
  )
}
