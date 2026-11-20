import type { Metadata } from "next"
import { ApplyProvider } from "@/components/apply/apply-provider"
import { StickyApply } from "@/components/apply/sticky-apply"
import { JumpToApply } from "@/components/apply/jump-to-apply"
import { DemoApplyForm } from "@/components/demo/demo-apply-form"
import {
  DContainer,
  DemoFinePrint,
  DemoFooter,
  DemoGuarantees,
  DemoHead,
  DemoHeader,
  DemoHowItWorks,
  DemoPrice,
  DemoProof,
  DemoWhatYouGet,
  PROOF_DOMAINS,
} from "@/components/demo/demo-sections"
import { DemoLink, Extrude } from "@/components/demo/demo-ui"
import { RebuildStage, type StageStore } from "@/components/demo/rebuild-stage"
import { BrowseLooks } from "@/components/looks/look-picker"
import { shownProofStores } from "@/components/landing/sections"
import { VideoPlayer } from "@/components/video/video-player"
import { getConfig, showMissingConfig } from "@/lib/config"
import { cn } from "@/lib/utils"
import { demoBody, demoDisplay } from "./fonts"
import "./demo.css"

/** The apply action checks the store live (page, then /cart.js, one retry each). Give it room. */
export const maxDuration = 60

export const metadata: Metadata = {
  title: "Your Shopify store, rebuilt in 48 hours | LocalEyes",
}

// The most dramatic change leads the stage.
const STAGE_ORDER = ["lake-effect", "lima", "boxwood"]
const stageRank = (slug: string) => {
  const i = STAGE_ORDER.indexOf(slug)
  return i === -1 ? STAGE_ORDER.length : i
}

export default async function DemoPage() {
  const config = await getConfig()
  const missing = showMissingConfig()
  const stageStores: StageStore[] = shownProofStores(config)
    .filter((s) => s.before_desktop && s.after_desktop)
    .sort((a, b) => stageRank(a.slug) - stageRank(b.slug))
    .map((s) => ({
      slug: s.slug,
      name: s.name,
      domain: PROOF_DOMAINS[s.slug] ?? null,
      before: s.before_desktop!,
      after: s.after_desktop!,
    }))

  return (
    <div className={cn(demoDisplay.variable, demoBody.variable, "demo-root flex min-h-dvh flex-col")}>
      <ApplyProvider>
        <DemoHeader config={config} />
        <main id="main" className="flex-1">
          {/* 1. Headline, then real stores rebuilt in 3D */}
          <section className="d-hero">
            <DContainer className="pt-8 text-center sm:pt-10 lg:pt-[max(1.25rem,3.4vh)]">
              <p className="d-kicker">For {config.NICHE_LABEL} on Shopify</p>
              <h1 className="x3d-stage d-display mx-auto mt-4 text-[2.95rem] text-balance text-ink min-[400px]:text-[3.3rem] sm:text-[4.6rem] lg:mt-[1.8vh] lg:text-[min(8.4vh,5.8vw,5.6rem)]">
                <span className="lg:block lg:whitespace-nowrap">Your Shopify store,</span>{" "}
                <span className="lg:block lg:whitespace-nowrap">
                  rebuilt in <Extrude>48 hours.</Extrude>
                </span>
              </h1>
              <div className="mt-5 flex flex-col items-center gap-5 sm:mt-7 lg:mt-[2.6vh] lg:flex-row lg:justify-center lg:gap-7">
                <p className="text-[1.15rem] font-medium text-soft sm:text-[1.3rem]">Free homepage rebuild if you qualify.</p>
                <DemoLink href="#apply-top">Apply in two minutes</DemoLink>
              </div>
            </DContainer>
            {stageStores.length ? (
              <div className="d-hero-stage mt-8 pb-5 lg:mt-[3vh]">
                <RebuildStage stores={stageStores} />
              </div>
            ) : null}
          </section>

          {/* 2. The video, when Kent's VSL is ready */}
          {config.VSL_URL ? (
            <section aria-label="Video" className="pb-8">
              <DContainer className="max-w-[920px]">
                <div className="d-card overflow-hidden p-2 sm:p-3">
                  <VideoPlayer url={config.VSL_URL} poster={config.VSL_POSTER_URL} captions={config.VSL_CAPTIONS_URL} title="How the 48 hour rebuild works" />
                </div>
              </DContainer>
            </section>
          ) : null}

          {/* 3. Apply */}
          <section aria-label="Apply" className="bg-white py-20 sm:py-28">
            <DContainer>
              <DemoApplyForm instance="top" />
            </DContainer>
          </section>

          <DemoProof config={config} missing={missing} />

          {/* 5. The lookbook in browse mode: real stores in each look, before they apply */}
          <section aria-labelledby="d-looks-title" className="py-20 sm:py-28" style={{ background: "var(--sky-soft)" }}>
            <DContainer>
              <DemoHead
                id="d-looks-title"
                kicker="The lookbook"
                title="Five looks. Real stores."
                lead="Open a style to see real stores that use it. We'll make it yours."
              />
              <BrowseLooks variant="demo" idPrefix="browse" className="mt-12 sm:mt-16" />
            </DContainer>
          </section>

          <DemoWhatYouGet items={config.WHAT_YOU_GET} />
          <DemoGuarantees />
          <DemoHowItWorks />
          <DemoPrice config={config} missing={missing} />
          <DemoFinePrint items={config.FINE_PRINT} />

          {/* 10. The last call: back up to step one */}
          <section aria-labelledby="d-final-title" className="py-20 text-center sm:py-28" style={{ background: "var(--butter-soft)" }}>
            <DContainer>
              <p className="d-kicker">Two minutes</p>
              <h2 id="d-final-title" className="d-display mx-auto mt-4 max-w-[16ch] text-[2.55rem] text-balance text-ink sm:text-[3.8rem]">
                See your homepage before you pay.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-[1.04rem] leading-relaxed text-soft">
                Start with your store&apos;s address. If it fits, we rebuild your homepage free before we talk.
              </p>
              <JumpToApply variant="demo" className="mt-9">
                See if you qualify
              </JumpToApply>
            </DContainer>
          </section>
        </main>
        <DemoFooter kentNumber={config.KENT_TEXT_NUMBER} />
        <StickyApply variant="demo" />
      </ApplyProvider>
    </div>
  )
}
