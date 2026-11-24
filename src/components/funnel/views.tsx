import Link from "next/link"
import { MessagePage } from "@/components/site/message-page"
import { ThemedButtonLink, homeHrefFor, textLinkClass, type SiteTheme } from "@/components/site/themed-shell"
import { getConfig } from "@/lib/config"
import { formatPhoneForDisplay, normalizePhone } from "@/lib/url"

/** Not a fit right now: shown at /not-a-fit. */
export async function NotAFitView({ theme }: { theme: SiteTheme }) {
  const config = await getConfig()
  return (
    <MessagePage theme={theme} label="Thanks for applying" title="Not a fit right now.">
      <p>
        We read every application. Right now the 48 hour rebuild only fits a narrow set of stores, and yours isn&apos;t one of
        them yet. We&apos;d rather tell you today than take your money for something that won&apos;t pay off.
      </p>
      <p>Your application is saved. If that changes, we&apos;ll reach out.</p>
      {config.STORE_SCORE_URL ? (
        <div className="mt-4 rounded-[22px] bg-paper p-6 ring-1 ring-line sm:p-8">
          <p className="text-[0.85rem] font-semibold text-tan">Free in the meantime</p>
          <p className="d-display mt-2 text-[1.9rem] text-ink">See your Store Score.</p>
          <p className="mt-2 text-[0.95rem] text-soft">A quick check of what is holding your store back, with the fixes that matter most.</p>
          <ThemedButtonLink theme={theme} href={config.STORE_SCORE_URL} className="mt-6">
            Get my Store Score
          </ThemedButtonLink>
        </div>
      ) : null}
      <p className="mt-4">
        <Link href={homeHrefFor(theme)} className={textLinkClass(theme)}>
          Back to the start
        </Link>
      </p>
    </MessagePage>
  )
}

/** Flagged for Kent to review by hand: shown at /thanks. */
export async function ThanksView({ theme }: { theme: SiteTheme }) {
  const config = await getConfig()
  const tel = normalizePhone(config.KENT_TEXT_NUMBER)
  return (
    <MessagePage theme={theme} label="Application in" title="Thanks. Kent is looking at your store himself.">
      <p>Your store needs a closer look before we book a homepage call, so Kent is reviewing it by hand.</p>
      <p>You&apos;ll hear back by text. Nothing else to do for now.</p>
      {tel ? (
        <p>
          Questions in the meantime?{" "}
          <a href={`sms:${tel}`} className={textLinkClass(theme)}>
            Text Kent at {formatPhoneForDisplay(tel)}
          </a>
          .
        </p>
      ) : null}
    </MessagePage>
  )
}
