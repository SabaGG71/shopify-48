import type { Metadata } from "next"
import { MessagePage } from "@/components/site/message-page"
import { getConfig } from "@/lib/config"
import { formatPhoneForDisplay, normalizePhone } from "@/lib/url"

export const metadata: Metadata = { title: "Application received | LocalEyes", robots: { index: false, follow: false } }

/** Shown to applications flagged for Kent to review by hand (coffee, something else, unverified store). */
export default async function ThanksPage() {
  const config = await getConfig()
  const tel = normalizePhone(config.KENT_TEXT_NUMBER)
  return (
    <MessagePage label="Application in" title="Thanks. Kent is looking at your store himself." kentNumber={config.KENT_TEXT_NUMBER}>
      <p>Your store needs a closer look before we book a homepage call, so Kent is reviewing it by hand.</p>
      <p>You&apos;ll hear back by text. Nothing else to do for now.</p>
      {tel ? (
        <p>
          Questions in the meantime?{" "}
          <a href={`sms:${tel}`} className="font-semibold text-ink underline decoration-gold underline-offset-4">
            Text Kent at {formatPhoneForDisplay(tel)}
          </a>
          .
        </p>
      ) : null}
    </MessagePage>
  )
}
