import type { Metadata } from "next"
import { DContainer, DemoFooter, DemoHeader } from "@/components/demo/demo-sections"
import { PRIVACY_SECTIONS, PRIVACY_UPDATED, PrivacyText } from "@/components/legal/privacy"
import { getConfig } from "@/lib/config"
import { cn } from "@/lib/utils"
import { demoBody, demoDisplay } from "../fonts"
import "../demo.css"

export const metadata: Metadata = { title: "Privacy | LocalEyes 48 Hour Rebuild" }

/** Privacy in the main page's light blue look. */
export default async function PrivacyPage() {
  const config = await getConfig()
  return (
    <div className={cn(demoDisplay.variable, demoBody.variable, "demo-root flex min-h-dvh flex-col")}>
      <DemoHeader config={config} applyHref="/#apply-top" />
      <main id="main" className="flex-1 pt-14 pb-20 sm:pt-20 sm:pb-28">
        <DContainer className="max-w-[860px]">
          <p className="d-kicker">Privacy</p>
          <h1 className="d-display mt-4 max-w-[16ch] text-[2.55rem] text-balance text-ink sm:text-[3.8rem]">How we handle your information.</h1>
          <p className="mt-4 text-[1rem] leading-relaxed text-soft">LocalEyes, for the 48 Hour Rebuild. Last updated {PRIVACY_UPDATED}.</p>

          <div className="d-card mt-10 divide-y divide-line px-6 sm:mt-12 sm:px-10">
            {PRIVACY_SECTIONS.map((s) => (
              <section key={s.title} className="py-7 sm:py-9">
                <h2 className="d-display text-[1.5rem] text-ink sm:text-[1.8rem]">{s.title}</h2>
                {s.body.map((p) => (
                  <p key={p} className="mt-3 text-[1rem] leading-relaxed text-soft">
                    <PrivacyText text={p} linkClassName="font-semibold text-gold underline decoration-2 underline-offset-4" />
                  </p>
                ))}
              </section>
            ))}
          </div>
        </DContainer>
      </main>
      <DemoFooter kentNumber={config.KENT_TEXT_NUMBER} />
    </div>
  )
}
