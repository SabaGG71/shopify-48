import { ApplyForm } from "@/components/apply/apply-form"
import { ApplyProvider } from "@/components/apply/apply-provider"
import { StickyApply } from "@/components/apply/sticky-apply"
import {
  Container,
  FinePrint,
  Guarantees,
  HowItWorks,
  PriceReserve,
  ProofSection,
  WhatYouGet,
  shownProofStores,
} from "@/components/landing/sections"
import { HeroStage, WipeCard } from "@/components/landing/hero-stage"
import { SiteFooter, SiteHeader } from "@/components/site/chrome"
import { VideoPlayer } from "@/components/video/video-player"
import { getConfig, showMissingConfig } from "@/lib/config"

/** The apply action checks the store live (page, then /cart.js, one retry each). Give it room. */
export const maxDuration = 60

export default async function LandingPage() {
  const config = await getConfig()
  const missing = showMissingConfig()
  // Real rebuilds for the moving hero. Until Kent's VSL is ready, one of them takes the video's spot.
  const heroStores = shownProofStores(config)
    .filter((s) => s.before_desktop && s.after_desktop)
    .map((s) => ({ name: s.name, before: s.before_desktop!, after: s.after_desktop! }))
  const centerStore = config.VSL_URL ? null : (heroStores[0] ?? null)
  const sideStores = config.VSL_URL ? heroStores.slice(0, 2) : heroStores.slice(1, 3)

  return (
    <ApplyProvider>
      <SiteHeader />
      <main id="main" className="flex-1">
        {/* 1. Headline + 2. Video, on a moving stage of real rebuilds */}
        {/* One screen: the stage takes the height left under the headline and sizes itself to it. */}
        <section className="relative flex min-h-[calc(100svh-3.5rem)] flex-col overflow-hidden pt-8 pb-6 sm:min-h-[calc(100svh-4rem)] sm:pt-10 lg:pt-[max(1.25rem,3.4vh)]">
          <Container className="text-center">
            <p className="eyebrow">For {config.NICHE_LABEL} on Shopify</p>
            <h1 className="display mx-auto mt-5 text-[3.05rem] text-balance text-ink min-[400px]:text-[3.4rem] sm:text-[4.6rem] lg:mt-[2.2vh] lg:text-[min(8.4vh,5.8vw,5.6rem)]">
              <span className="lg:block lg:whitespace-nowrap">Your Shopify store,</span>{" "}
              <span className="lg:block lg:whitespace-nowrap">
                rebuilt in <span className="text-gold">48&nbsp;hours.</span>
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[1.15rem] font-medium text-soft sm:mt-5 sm:text-[1.3rem]">Free homepage rebuild if you qualify.</p>
          </Container>
          {centerStore || config.VSL_URL ? (
            <div className="mt-8 flex min-h-[20rem] flex-[1_1_0px] flex-col justify-center [container-type:size] lg:mt-[3.6vh]">
              <HeroStage
                className="sm:max-w-[min(900px,calc((100cqh_-_44px)*2.42))]"
                side={sideStores}
                center={
                  config.VSL_URL ? (
                    <VideoPlayer
                      url={config.VSL_URL}
                      poster={config.VSL_POSTER_URL}
                      captions={config.VSL_CAPTIONS_URL}
                      title="How the 48 hour rebuild works"
                      className="shadow-[0_40px_80px_-40px_rgba(19,19,22,0.55)]"
                    />
                  ) : centerStore ? (
                    <WipeCard store={centerStore} delay={0} large priority />
                  ) : null
                }
              />
            </div>
          ) : null}
        </section>

        {/* 3. Apply form, straight under the video */}
        <section aria-label="Apply" className="pt-14 pb-16 sm:pt-20 sm:pb-24">
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
        <section aria-label="Apply again" className="border-t border-line bg-panel py-16 sm:py-24">
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
