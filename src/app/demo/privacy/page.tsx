import type { Metadata } from "next"
import { D1Container, D1Footer, D1Header } from "@/components/demo1/sections"
import { PRIVACY_SECTIONS, PRIVACY_UPDATED, PrivacyText } from "@/components/legal/privacy"
import { getConfig } from "@/lib/config"
import { cn } from "@/lib/utils"
import { d1Mono, d1Sans } from "../fonts"
import "../d1.css"

export const metadata: Metadata = {
  title: "Privacy | LocalEyes 48 Hour Rebuild",
  robots: { index: false, follow: false },
}

/** Privacy in the /demo page's lime look. */
export default async function DemoPrivacyPage() {
  const config = await getConfig()
  return (
    <div className={cn(d1Sans.variable, d1Mono.variable, "d1-root flex min-h-dvh flex-col")}>
      <D1Header config={config} applyHref="/demo#apply-top" />
      <main id="main" className="flex-1 pt-14 pb-20 sm:pt-20 sm:pb-28">
        <D1Container className="max-w-[980px]">
          <p className="d1-mono text-tan">
            <span className="text-ink">Privacy</span>&nbsp;&nbsp;Last updated {PRIVACY_UPDATED}
          </p>
          <h1 className="d1-h2 mt-4 max-w-[16ch] text-[2.4rem] text-ink sm:text-[3.4rem]">How we handle your information.</h1>
          <p className="mt-4 text-[1.04rem] leading-relaxed text-soft">LocalEyes, for the 48 Hour Rebuild.</p>

          <div className="mt-12 border-t border-line sm:mt-14">
            {PRIVACY_SECTIONS.map((s) => (
              <section key={s.title} className="grid gap-3 border-b border-line py-8 md:grid-cols-[15rem_minmax(0,1fr)] md:gap-10 md:py-10">
                <h2 className="text-[1.2rem] leading-snug font-bold tracking-[-0.02em] text-ink">{s.title}</h2>
                <div className="grid gap-3">
                  {s.body.map((p) => (
                    <p key={p} className="text-[1rem] leading-relaxed text-soft">
                      <PrivacyText text={p} linkClassName="d1-link text-ink" />
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </D1Container>
      </main>
      <D1Footer kentNumber={config.KENT_TEXT_NUMBER} />
    </div>
  )
}
