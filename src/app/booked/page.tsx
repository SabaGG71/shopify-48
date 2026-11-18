import type { Metadata } from "next"
import { Suspense } from "react"
import { BookedView } from "@/components/book/booked-view"
import { Container } from "@/components/landing/sections"
import { SiteFooter, SiteHeader } from "@/components/site/chrome"
import { reserveLinkFor } from "@/lib/booking"
import { getConfig } from "@/lib/config"
import { getRepo } from "@/lib/db/repo"
import { currentApplication } from "@/lib/session"

export const metadata: Metadata = { title: "You’re booked | LocalEyes", robots: { index: false, follow: false } }

type Params = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ""

/**
 * After a booking. Our own calendar step sends people here, and Kent's Calendly
 * event redirects here too: https://<site>/booked (turn on "pass event details").
 */
async function Booked({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams
  const app = await currentApplication().catch(() => null)
  const config = await getConfig()
  const job = app ? await (await getRepo()).getHomepageJobByApplication(app.id).catch(() => null) : null
  const fromCalendly = one(sp.event_start_time)
  const callTime = job?.call_time ?? (fromCalendly && !Number.isNaN(Date.parse(fromCalendly)) ? fromCalendly : null)
  const name = app?.name || one(sp.invitee_first_name) || one(sp.invitee_full_name)
  return (
    <BookedView
      firstName={name.split(" ")[0] ?? ""}
      callTime={callTime}
      confirmVideo={{ url: config.CONFIRM_VIDEO_URL, captions: config.CONFIRM_CAPTIONS_URL }}
      reserveHref={reserveLinkFor(app, config.RESERVE_URL)}
      priceDisplay={config.PRICE_DISPLAY}
      priceNote={config.PRICE_NOTE}
    />
  )
}

export default async function BookedPage(props: { searchParams: Promise<Params> }) {
  const config = await getConfig()
  return (
    <>
      <SiteHeader showApply={false} />
      <main id="main" className="flex-1 pt-4 pb-20 sm:pt-10">
        <Container>
          <Suspense
            fallback={
              <div className="mx-auto max-w-3xl animate-pulse">
                <div className="h-3 w-32 rounded bg-cream" />
                <div className="mt-6 h-12 w-4/5 rounded bg-cream" />
              </div>
            }
          >
            <Booked searchParams={props.searchParams} />
          </Suspense>
        </Container>
      </main>
      <SiteFooter kentNumber={config.KENT_TEXT_NUMBER} />
    </>
  )
}
