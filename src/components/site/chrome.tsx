import Link from "next/link"
import { Ornament, Wordmark } from "@/components/brand/marks"
import { formatPhoneForDisplay, normalizePhone } from "@/lib/url"

export function SiteHeader({ applyHref = "#apply-top", showApply = true }: { applyHref?: string; showApply?: boolean }) {
  return (
    <header className="relative z-20">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-4 sm:h-20 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 text-ink" aria-label="LocalEyes 48 Hour Rebuild home">
          <Wordmark className="text-[1.05rem] sm:text-[1.2rem]" />
          <Ornament className="size-2.5" />
          <span className="micro hidden pt-0.5 sm:inline">48 Hour Rebuild</span>
        </Link>
        {showApply ? (
          <a
            href={applyHref}
            className="rounded-full border border-line-strong px-4 py-2 text-[0.68rem] font-semibold tracking-[0.2em] text-ink uppercase transition-colors hover:border-ink/40 hover:bg-paper/70"
          >
            Apply
          </a>
        ) : null}
      </div>
    </header>
  )
}

export function SiteFooter({ kentNumber }: { kentNumber?: string }) {
  const tel = normalizePhone(kentNumber)
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto grid max-w-[1180px] gap-4 px-4 py-8 pb-28 text-[0.68rem] tracking-[0.2em] text-tan uppercase sm:px-8 lg:grid-cols-3 lg:items-center lg:pb-8">
        <a href="https://www.localeyesgrowth.com" className="flex items-center gap-2 hover:text-ink">
          LocalEyes <Ornament className="size-2" /> localeyesgrowth.com
        </a>
        {tel ? (
          <a href={`sms:${tel}`} className="hover:text-ink lg:text-center">
            Questions? Text Kent {formatPhoneForDisplay(tel)}
          </a>
        ) : (
          <span className="lg:text-center">Questions? Reply to any text from Kent</span>
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
