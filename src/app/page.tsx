import { ApplyForm } from "@/components/apply/apply-form"
import { ApplyProvider } from "@/components/apply/apply-provider"
import { StickyApply } from "@/components/apply/sticky-apply"
import { LabelRule, Ornament } from "@/components/brand/marks"
import {
  Container,
  FinePrint,
  Guarantees,
  HowItWorks,
  PriceReserve,
  ProofSection,
  WhatYouGet,
} from "@/components/landing/sections"
import { SiteFooter, SiteHeader } from "@/components/site/chrome"
import { VideoPlayer } from "@/components/video/video-player"
import { getConfig, showMissingConfig } from "@/lib/config"

/** The apply action checks the store live (page, then /cart.js, one retry each). Give it room. */
export const maxDuration = 60

export default async function LandingPage() {
  const config = await getConfig()
  const missing = showMissingConfig()

  return (
    <ApplyProvider>
      <SiteHeader />
      <main id="main" className="flex-1">
        {/* 1. Headline + 2. Video */}
        <section className="pt-4 sm:pt-8">
          <Container>
            <LabelRule as="p">
              <Ornament /> For {config.NICHE_LABEL} on Shopify
            </LabelRule>
            <div className="mt-6 grid gap-8 lg:mt-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-14">
              <div>
                <h1 className="display text-[2.95rem] text-balance text-ink min-[400px]:text-[3.3rem] sm:text-[4.4rem] lg:text-[4.9rem]">
                  Your Shopify store, rebuilt in <span className="text-gold">48&nbsp;hours.</span>
                </h1>
                <p className="mt-4 text-[1.08rem] text-soft sm:mt-6 sm:text-[1.2rem]">Free homepage rebuild if you qualify.</p>
              </div>
              <VideoPlayer
                url={config.VSL_URL}
                poster={config.VSL_POSTER_URL}
                captions={config.VSL_CAPTIONS_URL}
                title="How the 48 hour rebuild works"
                missingLabel={missing ? "VSL_URL not set" : null}
              />
            </div>
          </Container>
        </section>

        {/* 3. Apply form, straight under the video */}
        <section aria-label="Apply" className="pt-12 pb-16 sm:pt-16 sm:pb-24">
          <Container>
            <ApplyForm instance="top" />
          </Container>
        </section>

        <ProofSection config={config} missing={missing} />
        <WhatYouGet items={config.WHAT_YOU_GET} />
        <Guarantees />
        <HowItWorks />
        <PriceReserve config={config} missing={missing} />
        <FinePrint items={config.FINE_PRINT} />

        {/* 10. Apply form again */}
        <section aria-label="Apply again" className="border-t border-line bg-panel/70 py-16 sm:py-24">
          <Container>
            <ApplyForm instance="bottom" />
          </Container>
        </section>
      </main>
      <SiteFooter kentNumber={config.KENT_TEXT_NUMBER} />
      <StickyApply />
    </ApplyProvider>
  )
}
