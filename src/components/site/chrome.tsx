import Link from "next/link"
import { Wordmark } from "@/components/brand/marks"
import { getConfig } from "@/lib/config"
import { slotsLeft } from "@/lib/slots"
import { formatPhoneForDisplay, normalizePhone } from "@/lib/url"

/** Ink top bar, as on the reference page, with the real slot counter. */
export async function SiteHeader({ applyHref = "#apply-top", showApply = true }: { applyHref?: string; showApply?: boolean }) {
  const config = await getConfig()
  const perWeek = config.SLOT_COUNTER_ON && config.SLOTS_PER_WEEK ? config.SLOTS_PER_WEEK : null
  const left = await slotsLeft(perWeek, config.SLOTS_LEFT)
  return (
    <header className="relative z-20 bg-ink text-white">
      <div className="mx-auto flex h-14 max-w-[1180px] items-center justify-between gap-3 px-4 sm:h-16 sm:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="LocalEyes 48 Hour Rebuild home">
          <Wordmark className="text-[1.05rem] sm:text-[1.15rem]" />
          <span className="hidden text-[0.68rem] font-semibold tracking-[0.16em] text-white/55 uppercase md:inline">48 Hour Rebuild</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-5">
          {perWeek !== null && left !== null ? (
            <p className="flex items-center gap-2 text-[0.74rem] font-semibold whitespace-nowrap text-white/85 sm:text-[0.8rem]">
              <span className="size-2 shrink-0 rounded-full bg-gold" aria-hidden="true" />
              {left} of {perWeek} slots left<span className="hidden sm:inline">&nbsp;this week</span>
            </p>
          ) : null}
          {showApply ? (
            <a
              href={applyHref}
              className="rounded-lg bg-gold px-3.5 py-2 font-display text-[0.78rem] font-extrabold tracking-[0.04em] text-white uppercase transition-colors hover:bg-[#d93f0b]"
            >
              Apply
            </a>
          ) : null}
        </div>
      </div>
    </header>
  )
}

export function SiteFooter({ kentNumber }: { kentNumber?: string }) {
  const tel = normalizePhone(kentNumber)
  return (
    <footer className="mt-auto border-t border-line bg-white">
      <div className="mx-auto grid max-w-[1180px] gap-4 px-4 py-9 pb-28 text-[0.84rem] text-soft sm:px-8 lg:grid-cols-3 lg:items-center lg:pb-9">
        <a href="https://www.localeyesgrowth.com" className="flex items-center gap-3 text-ink hover:text-gold-deep">
          <Wordmark className="text-[1rem]" />
          <span className="text-soft">localeyesgrowth.com</span>
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
    </footer>
  )
}
