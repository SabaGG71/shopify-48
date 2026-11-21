import Link from "next/link"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { BookFlow } from "@/components/book/book-flow"
import { BookedView } from "@/components/book/booked-view"
import { ThemedContainer, ThemedShell, applyHrefFor, basePathFor, textLinkClass, type SiteTheme } from "@/components/site/themed-shell"
import { calendlyPrefill, reserveLinkFor } from "@/lib/booking"
import { getConfig } from "@/lib/config"
import { getRepo } from "@/lib/db/repo"
import { currentApplication } from "@/lib/session"
import { displayHost } from "@/lib/url"

function Skeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse">
      <div className="h-3 w-40 rounded bg-cream" />
      <div className="mt-6 h-12 w-4/5 rounded bg-cream" />
      <div className="mt-8 aspect-video rounded-[18px] bg-cream" />
    </div>
  )
}

async function BookContent({ theme }: { theme: SiteTheme }) {
  const base = basePathFor(theme)
  const app = await currentApplication().catch(() => null)
  if (!app) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <h1 className={theme === "demo" ? "d1-h2 text-[2.4rem] text-ink" : "d-display text-[2.4rem] text-ink"}>We couldn’t find your application.</h1>
        <p className="mt-4 text-soft">It may have been started on another phone or browser. It only takes two minutes to apply again.</p>
        <Link href={applyHrefFor(theme)} className={`mt-8 inline-flex ${textLinkClass(theme)}`}>
          Go to the apply form
        </Link>
      </div>
    )
  }
  if (app.stage !== "submitted") redirect(applyHrefFor(theme))
  if (app.outcome === "review") redirect(`${base}/thanks`)
  if (app.outcome !== "qualified") redirect(`${base}/not-a-fit`)

  const [config, homepageJob] = await Promise.all([getConfig(), (await getRepo()).getHomepageJobByApplication(app.id)])
  if (homepageJob && homepageJob.status === "booked") redirect(`${base}/booked`)
  return (
    <BookFlow
      appId={app.id}
      firstName={(app.name ?? "").split(" ")[0] || "there"}
      name={app.name ?? ""}
      email={app.email ?? ""}
      storeHost={displayHost(app.store_url)}
      stylePick={app.style_pick}
      styleOther={app.style_other}
      initial={{
        reference_stores: app.reference_stores ?? [],
        never_want: app.never_want ?? "",
        top_products: app.top_products ?? [],
        saved: Boolean(app.design_saved_at),
      }}
      bookingUrl={calendlyPrefill(config.BOOKING_URL, {
        name: app.name,
        email: app.email,
        storeUrl: app.store_url,
        phone: app.phone,
        applicationId: app.id,
      })}
      confirmVideo={{ url: config.CONFIRM_VIDEO_URL, captions: config.CONFIRM_CAPTIONS_URL }}
      lookbook={config.LOOKBOOK}
      basePath={base}
    />
  )
}

/** Page 2 for qualified applicants, in the design they applied from. */
export function BookPage({ theme }: { theme: SiteTheme }) {
  return (
    <ThemedShell theme={theme} mainClassName="pt-8 pb-20 sm:pt-12">
      <ThemedContainer theme={theme}>
        <Suspense fallback={<Skeleton />}>
          <BookContent theme={theme} />
        </Suspense>
      </ThemedContainer>
    </ThemedShell>
  )
}

type Params = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ""

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

/**
 * After a booking. Our own calendar step sends people here, and Kent's Calendly
 * event redirects to /booked too (turn on "pass event details").
 */
export function BookedPage({ theme, searchParams }: { theme: SiteTheme; searchParams: Promise<Params> }) {
  return (
    <ThemedShell theme={theme} mainClassName="pt-8 pb-20 sm:pt-12">
      <ThemedContainer theme={theme}>
        <Suspense
          fallback={
            <div className="mx-auto max-w-3xl animate-pulse">
              <div className="h-3 w-32 rounded bg-cream" />
              <div className="mt-6 h-12 w-4/5 rounded bg-cream" />
            </div>
          }
        >
          <Booked searchParams={searchParams} />
        </Suspense>
      </ThemedContainer>
    </ThemedShell>
  )
}
