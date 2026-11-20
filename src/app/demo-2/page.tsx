import type { Metadata } from "next"
import { ApplyProvider } from "@/components/apply/apply-provider"
import { StickyApply } from "@/components/apply/sticky-apply"
import { PROOF_DOMAINS } from "@/components/demo/demo-sections"
import { FilmsRow, type Film } from "@/components/demo2/collection"
import { Proposal } from "@/components/demo2/proposal"
import { D2Footer, D2Header, Notes, Part, Quote, Terms, Timeline, d2Slots } from "@/components/demo2/sections"
import { shownProofStores } from "@/components/landing/sections"
import { VideoPlayer } from "@/components/video/video-player"
import { getConfig, showMissingConfig } from "@/lib/config"
import { cn } from "@/lib/utils"
import { d2Sans } from "./fonts"
import "./d2.css"

/** The apply action checks the store live (page, then /cart.js, one retry each). Give it room. */
export const maxDuration = 60

export const metadata: Metadata = {
  title: "Your Shopify store, rebuilt in 48 hours | LocalEyes",
  robots: { index: false, follow: false },
}

// The most dramatic change first. These three have films in /public/demo1.
const ORDER = ["lake-effect", "lima", "boxwood"]
const rank = (slug: string) => (ORDER.includes(slug) ? ORDER.indexOf(slug) : ORDER.length)

export default async function Demo2Page() {
  const config = await getConfig()
  const missing = showMissingConfig()
  const slots = await d2Slots(config)
  const films: Film[] = [...shownProofStores(config)]
    .filter((s) => ORDER.includes(s.slug))
    .sort((a, b) => rank(a.slug) - rank(b.slug))
    .map((s) => ({
      slug: s.slug,
      name: s.name,
      domain: PROOF_DOMAINS[s.slug] ?? null,
      film: `/demo1/${s.slug}/film.mp4`,
      poster: `/demo1/${s.slug}/film-poster.webp`,
    }))

  return (
    <div className={cn(d2Sans.variable, "d2-root flex min-h-dvh flex-col")}>
      <ApplyProvider>
        <D2Header />
        <main id="main" className="flex-1 pb-4">
          {/* The whole page is one proposal, a white sheet on soft paper. */}
          <article className="d2-sheet d2-in">
            <section className="d2-part d2-pad pt-[clamp(2.2rem,6vw,4.4rem)]">
              <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
                <dl className="d2-meta order-2 content-start lg:order-1 lg:grid-cols-1 lg:pt-1.5">
                  <dt>Prepared by</dt>
                  <dd>LocalEyes</dd>
                  <dt>For</dt>
                  <dd className="first-letter:uppercase">{config.NICHE_LABEL} on Shopify</dd>
                  <dt>Delivery</dt>
                  <dd>A preview in 48 hours</dd>
                  {slots ? (
                    <>
                      <dt>This week</dt>
                      <dd>
                        {slots.left} of {slots.perWeek} slots left
                      </dd>
                    </>
                  ) : null}
                </dl>
                <div className="order-1 min-w-0 lg:order-2">
                  <p className="d2-label">A proposal</p>
                  <h1 className="d2-h1 mt-2 max-w-[19ch] text-ink">Your Shopify store, rebuilt in 48 hours.</h1>
                  <p className="mt-4 max-w-xl text-[1.04rem] leading-relaxed text-soft">Free homepage rebuild if you qualify. It starts with your store&apos;s address.</p>
                  <div className="mt-10">
                    <Proposal instance="top" />
                  </div>
                </div>
              </div>
            </section>

            {config.VSL_URL ? (
              <Part label="Watch" id="d2-watch" title="How the 48 hour rebuild works.">
                <VideoPlayer url={config.VSL_URL} poster={config.VSL_POSTER_URL} captions={config.VSL_CAPTIONS_URL} title="How the 48 hour rebuild works" />
              </Part>
            ) : null}

            {films.length ? (
              <Part label="The work" id="d2-work" title="Same products. Same brand. New store.">
                <FilmsRow films={films} />
              </Part>
            ) : null}

            <Quote config={config} missing={missing} />
            <Terms />
            <Timeline />
            <Notes items={config.FINE_PRINT} />

            <Part label="Accept" id="d2-accept" title="Start your rebuild.">
              <Proposal instance="bottom" />
            </Part>
          </article>
        </main>
        <D2Footer kentNumber={config.KENT_TEXT_NUMBER} />
        <StickyApply variant="d2" />
      </ApplyProvider>
    </div>
  )
}
