import type { Metadata } from "next"
import { ApplyProvider } from "@/components/apply/apply-provider"
import { JumpToApply } from "@/components/apply/jump-to-apply"
import { StickyApply } from "@/components/apply/sticky-apply"
import { PROOF_DOMAINS } from "@/components/demo/demo-sections"
import { BrowseLooks } from "@/components/looks/look-picker"
import { D1ApplyForm } from "@/components/demo1/apply-form"
import { Manifesto } from "@/components/demo1/manifesto"
import {
  D1Container,
  D1FinePrint,
  D1Footer,
  D1Guarantees,
  D1Head,
  D1Header,
  D1HowItWorks,
  D1Marquee,
  D1Price,
  D1WhatYouGet,
} from "@/components/demo1/sections"
import { Scrubber, type ScrubStore } from "@/components/demo1/scrubber"
import { HeroFilms, type Film } from "@/components/demo1/films"
import { Story } from "@/components/demo1/story"
import { D1Link, Odometer } from "@/components/demo1/ui"
import { MissingConfig, shownProofStores } from "@/components/landing/sections"
import { VideoPlayer } from "@/components/video/video-player"
import { getConfig, showMissingConfig } from "@/lib/config"
import { cn } from "@/lib/utils"
import { d1Mono, d1Sans } from "./fonts"
import "./d1.css"

/** The apply action checks the store live (page, then /cart.js, one retry each). Give it room. */
export const maxDuration = 60

export const metadata: Metadata = {
  title: "Your Shopify store, rebuilt in 48 hours | LocalEyes",
  robots: { index: false, follow: false },
}

// The most dramatic change first. Only these three have films and captures in /public/demo1.
const ORDER = ["lake-effect", "lima", "boxwood"]
const rank = (slug: string) => (ORDER.includes(slug) ? ORDER.indexOf(slug) : ORDER.length)
const dl = (ms: number) => ({ ["--dl" as string]: `${ms}ms` })

export default async function Demo1Page() {
  const config = await getConfig()
  const missing = showMissingConfig()
  const proof = [...shownProofStores(config)].sort((a, b) => rank(a.slug) - rank(b.slug))

  const films: Film[] = proof
    .filter((s) => ORDER.includes(s.slug))
    .map((s) => ({
      slug: s.slug,
      name: s.name,
      domain: PROOF_DOMAINS[s.slug] ?? null,
      src: `/demo1/${s.slug}/film.mp4`,
      poster: `/demo1/${s.slug}/film-poster.webp`,
    }))
  const scrub: ScrubStore[] = proof
    .filter((s) => s.before_desktop && s.after_desktop)
    .map((s) => ({
      slug: s.slug,
      name: s.name,
      domain: PROOF_DOMAINS[s.slug] ?? null,
      before: s.before_desktop!,
      after: s.after_desktop!,
    }))
  const lake = proof.find((s) => s.slug === "lake-effect" && s.before_desktop && s.after_desktop)

  return (
    <div className={cn(d1Sans.variable, d1Mono.variable, "d1-root flex min-h-dvh flex-col")}>
      <ApplyProvider>
        <D1Header config={config} />
        <main id="main" className="flex-1">
          {/* 1. Headline, beside films of the real stores we rebuilt, on a lime stage */}
          <section className="d1-frame">
            <D1Container>
              <div className="d1-hero-grid">
              <div className="d1-hero-text">
                <p className="d1-mono d1-kicker d1-fade" style={dl(0)}>
                  For {config.NICHE_LABEL} on Shopify
                </p>
                <h1 className="d1-h1 d1-hero-h1 mt-5 text-ink sm:mt-6">
                  <span className="d1-line">
                    <span style={dl(80)}>Your Shopify</span>
                  </span>
                  <span className="d1-line">
                    <span style={dl(170)}>store, rebuilt</span>
                  </span>
                  <span className="d1-line">
                    <span style={dl(260)}>
                      in <Odometer value="48" delay={520} /> hours.
                    </span>
                  </span>
                </h1>
                <p className="d1-fade mt-6 max-w-md text-[1.15rem] leading-relaxed font-medium text-ink/75 sm:text-[1.25rem]" style={dl(400)}>
                  Free homepage rebuild if you qualify. Applying takes two minutes.
                </p>
                <div className="d1-fade mt-8 flex flex-wrap items-center gap-x-7 gap-y-4" style={dl(500)}>
                  <D1Link href="#apply-top">Apply for a free homepage</D1Link>
                  {lake ? (
                    <a href="#d1-story" className="d1-link text-[0.98rem] text-ink">
                      See what changes
                    </a>
                  ) : null}
                </div>
              </div>
              {films.length ? (
                <div className="d1-fade d1-hero-films" style={dl(350)}>
                  <HeroFilms films={films} />
                </div>
              ) : null}
              </div>
            </D1Container>
          </section>

          <D1Marquee />

          {/* 2. The video, when Kent's VSL is ready */}
          {config.VSL_URL ? (
            <section aria-label="Video" className="pt-16 sm:pt-20">
              <D1Container className="max-w-[1000px]">
                <VideoPlayer url={config.VSL_URL} poster={config.VSL_POSTER_URL} captions={config.VSL_CAPTIONS_URL} title="How the 48 hour rebuild works" />
              </D1Container>
            </section>
          ) : null}

          {/* 3. Apply */}
          <section aria-label="Apply" className="py-20 sm:py-28">
            <D1Container>
              <D1ApplyForm instance="top" />
            </D1Container>
          </section>

          <section aria-label="What we do" className="pb-20 sm:pb-28">
            <D1Container>
              <Manifesto
                className="d1-h2 max-w-[19ch] text-[2.5rem] text-ink sm:text-[4.6rem]"
                text="You keep your products, your brand and your Shopify account. We rebuild how the store looks and sells. You see your new homepage before you pay, and nothing goes live without your yes."
              />
            </D1Container>
          </section>

          {/* 4. Proof: every store, then one up close */}
          {scrub.length || missing ? (
            <section aria-labelledby="d1-proof" className="pb-20 sm:pb-28">
              <D1Container>
                <D1Head
                  id="d1-proof"
                  kicker="Proof"
                  title="Same products. Same brand. New store."
                  lead="Real stores we rebuilt. Pick one, then drag the clock from 0h to 48h."
                />
                <div className="mt-10 sm:mt-14">
                  {scrub.length ? <Scrubber stores={scrub} /> : <MissingConfig name="PROOF_STORES images" show={missing} />}
                </div>
              </D1Container>
            </section>
          ) : null}

          {lake ? (
            <section id="d1-story" aria-labelledby="d1-story-title" className="scroll-mt-16 border-t border-line py-20 sm:py-28">
              <D1Container>
                <D1Head
                  id="d1-story-title"
                  kicker="One rebuild, up close"
                  title="What changed at Lake Effect."
                  lead="Same coffee, same cafe. Here is what the new homepage does differently."
                />
              </D1Container>
              {/* The markup runs wider than the rest of the page, so the homepage reads large. */}
              <D1Container className="mt-10 max-w-[1560px] sm:mt-14">
                <Story before={lake.before_desktop!} after={lake.after_desktop!} domain={PROOF_DOMAINS["lake-effect"]} />
              </D1Container>
            </section>
          ) : null}

          {/* The lookbook in browse mode: real stores in each look, before they apply */}
          <section aria-labelledby="d1-looks-title" className="border-t border-line py-20 sm:py-28">
            <D1Container>
              <D1Head
                id="d1-looks-title"
                kicker="The lookbook"
                title="Five looks. Real stores."
                lead="Open a style to see real stores that use it. We'll make it yours."
              />
              <BrowseLooks variant="d1" idPrefix="d1-browse" className="mt-12 sm:mt-16" />
            </D1Container>
          </section>

          <D1WhatYouGet items={config.WHAT_YOU_GET} image={films[0] ? `/demo1/${films[0].slug}/scroll-desktop.webp` : undefined} />
          <D1Guarantees />
          <D1HowItWorks />
          <D1Price config={config} missing={missing} />
          <D1FinePrint items={config.FINE_PRINT} />

          {/* 10. The last call: back up to step one */}
          <section aria-labelledby="d1-final-title" className="border-t border-line py-20 sm:py-28">
            <D1Container>
              <D1Head
                id="d1-final-title"
                kicker="Two minutes"
                title="See your homepage before you pay."
                lead="Start with your store's address. If it fits, we rebuild your homepage free before we talk."
              />
              <JumpToApply variant="d1" className="mt-10">
                See if you qualify
              </JumpToApply>
            </D1Container>
          </section>
        </main>
        <D1Footer kentNumber={config.KENT_TEXT_NUMBER} />
        <StickyApply variant="d1" />
      </ApplyProvider>
    </div>
  )
}
