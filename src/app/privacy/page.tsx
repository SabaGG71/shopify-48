import type { Metadata } from "next"
import { LabelRule, Ornament } from "@/components/brand/marks"
import { Container } from "@/components/landing/sections"
import { SiteFooter, SiteHeader } from "@/components/site/chrome"
import { getConfig } from "@/lib/config"

export const metadata: Metadata = { title: "Privacy | LocalEyes 48 Hour Rebuild" }

const SECTIONS = [
  {
    title: "What we collect",
    body: [
      "When you apply: the look you pick, your store's web address, your monthly revenue band, what you sell, what isn't working, your name, email and phone number.",
      "If you book a call or reserve a slot: the answers you give about your store's design, your booking time, and payment confirmation from Stripe. We never see your card details.",
      "If you fill the intake: store access details, brand files, product links, offers, apps, your last 30 days of store numbers and the files you upload.",
    ],
  },
  {
    title: "Why we collect it",
    body: [
      "To review your store, decide if the rebuild is a fit, contact you by text or email, and build your store. Your store numbers are used only to measure the change 30 days after launch.",
    ],
  },
  {
    title: "Cookies and ads",
    body: [
      "This site uses a cookie to remember your application, so you can come back where you left off. It also uses the Meta pixel to measure our ads, which means Meta may receive details of your visit and, in a hashed form, your email and phone number when you apply, book or pay.",
    ],
  },
  {
    title: "Who we share it with",
    body: [
      "Only the services that run this process: our database and file storage, Stripe for payments, our booking calendar, our email and text providers, and Meta for ad measurement. We don't sell your information.",
    ],
  },
  {
    title: "Your choices",
    body: ["Ask us to see, correct or delete your information at any time by emailing hello@localeyesgrowth.com."],
  },
]

export default async function PrivacyPage() {
  const config = await getConfig()
  return (
    <>
      <SiteHeader showApply={false} />
      <main id="main" className="flex-1 pt-6 pb-24 sm:pt-14">
        <Container className="max-w-[760px]">
          <LabelRule>
            <Ornament /> Privacy
          </LabelRule>
          <h1 className="display mt-6 text-[2.6rem] text-ink sm:text-[3.4rem]">How we handle your information.</h1>
          <p className="mt-4 text-[0.92rem] text-soft">LocalEyes, for the 48 Hour Rebuild. Last updated November 18, 2026.</p>
          <div className="mt-10 grid gap-9">
            {SECTIONS.map((s) => (
              <section key={s.title}>
                <h2 className="display text-[1.6rem] text-ink">{s.title}</h2>
                {s.body.map((p) => (
                  <p key={p} className="mt-3 text-[0.98rem] leading-relaxed text-soft">
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </Container>
      </main>
      <SiteFooter kentNumber={config.KENT_TEXT_NUMBER} />
    </>
  )
}
