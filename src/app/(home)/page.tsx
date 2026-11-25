/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next"
import Link from "next/link"
import { ApplyProvider } from "@/components/apply/apply-provider"
import { Wordmark } from "@/components/brand/marks"
import { HomeHero } from "@/components/home/home-hero"
import { Showcase } from "@/components/home/showcase"
import { GUARANTEES, STEPS } from "@/components/landing/copy"
import { VideoPlayer } from "@/components/video/video-player"
import { getConfig } from "@/lib/config"
import { slotsLeft } from "@/lib/slots"
import { formatPhoneForDisplay, normalizePhone } from "@/lib/url"
import { cn } from "@/lib/utils"
import { demoBody, demoDisplay } from "./fonts"
import "./demo.css"
import "./home.css"

/** The apply action checks the store live (page, then /cart.js, one retry each). Give it room. */
export const maxDuration = 60

export const metadata: Metadata = {
  title: "Your Shopify store, rebuilt in 48 hours | LocalEyes",
}

/** The lead proof: Kent's timed build, Wix to Shopify inside the 48 hour window. */
const FEATURE = { name: "Green Kettle Coffee", after: "/proof/green-kettle/after-desktop.jpg" }

const GET = [
  { title: "Full redesign", body: "Home, collection, product page, cart, nav, footer, about and contact. Plus one page your category needs." },
  { title: "Built to convert", body: "Product page layout, cart upsells, gift tiers and mobile checkout, with up to 2 apps installed and set up." },
  { title: "Zero SEO loss", body: "Every URL kept or redirected. 14 days of tweaks after launch and a 30 day report with your next 3 moves." },
]

function Plus() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M8 3v10M3 8h10" strokeLinecap="round" />
    </svg>
  )
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details>
      <summary>
        {q}
        <Plus />
      </summary>
      <div>{children}</div>
    </details>
  )
}

/**
 * "/": the pared-back landing page. Headline, the video, a six step form that fits one
 * screen, then one before and after, what you get, and the details folded into a short FAQ.
 */
export default async function HomePage() {
  const config = await getConfig()
  const perWeek = config.SLOT_COUNTER_ON && config.SLOTS_PER_WEEK ? config.SLOTS_PER_WEEK : null
  const left = await slotsLeft(perWeek, config.SLOTS_LEFT)
  const tel = normalizePhone(config.KENT_TEXT_NUMBER)
  const questionsUrl = config.QUESTIONS_CALL_URL || config.BOOKING_URL

  const video = config.VSL_URL ? (
    <div className="hx-video">
      <VideoPlayer url={config.VSL_URL} poster={config.VSL_POSTER_URL} captions={config.VSL_CAPTIONS_URL} title="How the 48 hour rebuild works" />
    </div>
  ) : (
    // Until the video is recorded, the newest rebuild holds its place.
    <figure className="hx-video">
      <img src={FEATURE.after} alt={`${FEATURE.name}'s new homepage`} width={1440} height={676} fetchPriority="high" />
      <figcaption>{FEATURE.name}, rebuilt in 48 hours</figcaption>
    </figure>
  )

  return (
    <div className={cn(demoDisplay.variable, demoBody.variable, "demo-root hx-page flex min-h-dvh flex-col")}>
      <ApplyProvider>
        <header className="hx-top relative">
          <Link href="/" aria-label="LocalEyes 48 Hour Rebuild home">
            <Wordmark className="text-[1.1rem] tracking-[0.04em]" />
            <small>48 Hour Rebuild</small>
          </Link>
          {perWeek !== null && left !== null ? (
            <p className="hx-slots">
              {left} of {perWeek} slots left this week
            </p>
          ) : null}
        </header>

        <main id="main" className="flex-1">
          <HomeHero nicheLabel={config.NICHE_LABEL} video={video} />

          <section className="hx-blk hx-band" aria-labelledby="hx-proof-title">
            <div className="hx-wrap">
              <h2 id="hx-proof-title" className="hx-h2">
                {FEATURE.name}, 48 hours apart.
              </h2>
              <p className="hx-lead">Moved from Wix to Shopify and rebuilt, start to finish, inside the window. Tap through what we built.</p>
              <Showcase domain="greenkettlecoffee.com" />
            </div>
          </section>

          <section className="hx-blk" aria-labelledby="hx-get-title">
            <div className="hx-wrap">
              <h2 id="hx-get-title" className="hx-h2">
                What you get
              </h2>
              <div className="hx-three">
                {GET.map((g) => (
                  <div key={g.title}>
                    <h3>{g.title}</h3>
                    <p>{g.body}</p>
                  </div>
                ))}
              </div>
              <p className="hx-promise">
                {GUARANTEES.slice(0, 2).map((g) => (
                  <span key={g.title}>{g.title}</span>
                ))}
              </p>
              <p className="mt-7 text-center">
                <a href="#apply-top" className="hx-btn">
                  See if I qualify
                </a>
              </p>

              <div className="hx-faq">
                <Faq q="How does it work?">
                  <ol>
                    {STEPS.map((s) => (
                      <li key={s.title}>
                        <b className="text-ink">{s.title}.</b> {s.body}
                      </li>
                    ))}
                  </ol>
                </Faq>
                {config.WHAT_YOU_GET.length ? (
                  <Faq q="What exactly is included?">
                    <ol>
                      {config.WHAT_YOU_GET.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ol>
                  </Faq>
                ) : null}
                <Faq q="What are the guarantees?">
                  <ol>
                    {GUARANTEES.map((g) => (
                      <li key={g.title}>
                        <b className="text-ink">{g.title}</b> {g.body}
                      </li>
                    ))}
                  </ol>
                </Faq>
                {config.PRICE_DISPLAY ? (
                  <Faq q="What does it cost?">
                    <p>
                      <b className="text-ink">{config.PRICE_DISPLAY}.</b> {config.PRICE_NOTE} The homepage we build before the call is free.
                    </p>
                    {config.RESERVE_URL ? (
                      <p className="mt-2">
                        Already sure?{" "}
                        <a href={config.RESERVE_URL} className="font-semibold text-ink underline underline-offset-4" data-reserve-link>
                          Skip the call and reserve a slot
                        </a>
                        .
                      </p>
                    ) : null}
                  </Faq>
                ) : null}
                {config.FINE_PRINT.map((f) => (
                  <Faq key={f.title} q={f.title}>
                    <p>{f.body}</p>
                  </Faq>
                ))}
              </div>
              {questionsUrl ? (
                <p className="hx-ask">
                  Questions?{" "}
                  <a href={questionsUrl} target="_blank" rel="noopener">
                    Book a call with Kent
                  </a>
                </p>
              ) : null}
            </div>
          </section>
        </main>

        <footer className="hx-footer">
          <div className="hx-wrap">
            <a href="https://www.localeyesgrowth.com" className="font-semibold text-ink">
              localeyesgrowth.com
            </a>
            {questionsUrl ? (
              <a href={questionsUrl} target="_blank" rel="noopener">
                Questions? Book a call with Kent
              </a>
            ) : tel ? (
              <a href={`sms:${tel}`}>Questions? Text Kent at {formatPhoneForDisplay(tel)}</a>
            ) : (
              <span>Questions? Reply to any text from Kent.</span>
            )}
            <Link href="/privacy">Privacy</Link>
            <a href="https://www.instagram.com/localeyesseo">@localeyesseo</a>
          </div>
        </footer>
      </ApplyProvider>
    </div>
  )
}
