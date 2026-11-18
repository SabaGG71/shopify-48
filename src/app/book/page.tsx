import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { BookFlow } from "@/components/book/book-flow"
import { Container } from "@/components/landing/sections"
import { SiteFooter, SiteHeader } from "@/components/site/chrome"
import { calendlyPrefill } from "@/lib/booking"
import { getConfig } from "@/lib/config"
import { getRepo } from "@/lib/db/repo"
import { currentApplication } from "@/lib/session"
import { displayHost } from "@/lib/url"

export const metadata: Metadata = {
  title: "Book your homepage call | LocalEyes",
  robots: { index: false, follow: false },
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse">
      <div className="h-3 w-40 rounded bg-cream" />
      <div className="mt-6 h-12 w-4/5 rounded bg-cream" />
      <div className="mt-8 aspect-video rounded-[18px] bg-cream" />
    </div>
  )
}

async function BookContent() {
  const app = await currentApplication().catch(() => null)
  if (!app) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <h1 className="display text-[2.4rem] text-ink">We couldn’t find your application.</h1>
        <p className="mt-4 text-soft">It may have been started on another phone or browser. It only takes two minutes to apply again.</p>
        <Link
          href="/#apply-top"
          className="mt-8 inline-flex text-[0.78rem] font-semibold tracking-[0.18em] text-ink uppercase underline decoration-gold underline-offset-4"
        >
          Go to the apply form
        </Link>
      </div>
    )
  }
  if (app.stage !== "submitted") redirect("/#apply-top")
  if (app.outcome === "review") redirect("/thanks")
  if (app.outcome !== "qualified") redirect("/not-a-fit")

  const [config, homepageJob] = await Promise.all([getConfig(), (await getRepo()).getHomepageJobByApplication(app.id)])
  if (homepageJob && homepageJob.status === "booked") redirect("/booked")
  return (
    <BookFlow
      appId={app.id}
      firstName={(app.name ?? "").split(" ")[0] || "there"}
      name={app.name ?? ""}
      email={app.email ?? ""}
      storeHost={displayHost(app.store_url)}
      stylePick={app.style_pick!}
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
    />
  )
}

export default async function BookPage() {
  const config = await getConfig()
  return (
    <>
      <SiteHeader showApply={false} />
      <main id="main" className="flex-1 pt-4 pb-20 sm:pt-10">
        <Container>
          <Suspense fallback={<Skeleton />}>
            <BookContent />
          </Suspense>
        </Container>
      </main>
      <SiteFooter kentNumber={config.KENT_TEXT_NUMBER} />
    </>
  )
}
