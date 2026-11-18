import type { Metadata } from "next"
import Link from "next/link"
import { CtaLink } from "@/components/brand/cta"
import { MessagePage } from "@/components/site/message-page"
import { getConfig } from "@/lib/config"

export const metadata: Metadata = { title: "Not a fit right now | LocalEyes", robots: { index: false, follow: false } }

export default async function NotAFitPage() {
  const config = await getConfig()
  return (
    <MessagePage label="Thanks for applying" title="Not a fit right now." kentNumber={config.KENT_TEXT_NUMBER}>
      <p>
        We read every application. Right now the 48 hour rebuild only fits a narrow set of stores, and yours isn&apos;t one of
        them yet. We&apos;d rather tell you today than take your money for something that won&apos;t pay off.
      </p>
      <p>Your application is saved. If that changes, we&apos;ll reach out.</p>
      {config.STORE_SCORE_URL ? (
        <div className="mt-4 rounded-[22px] border border-line bg-paper/80 p-6 sm:p-8">
          <p className="micro">Free in the meantime</p>
          <p className="display mt-3 text-[1.9rem] text-ink">See your Store Score.</p>
          <p className="mt-2 text-[0.95rem] text-soft">A quick check of what is holding your store back, with the fixes that matter most.</p>
          <CtaLink href={config.STORE_SCORE_URL} variant="outline" className="mt-6">
            Get my Store Score
          </CtaLink>
        </div>
      ) : null}
      <p className="mt-4">
        <Link href="/" className="text-[0.78rem] font-semibold tracking-[0.18em] text-ink uppercase underline decoration-gold underline-offset-4">
          Back to the start
        </Link>
      </p>
    </MessagePage>
  )
}
