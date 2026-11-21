import type { Metadata } from "next"
import { Suspense } from "react"
import { IntakeFlow } from "@/components/intake/intake-flow"
import { ThemedContainer, ThemedShell } from "@/components/site/themed-shell"
import { getConfig, showMissingConfig } from "@/lib/config"
import { getRepo } from "@/lib/db/repo"
import { hydrateDraft } from "@/lib/intake/schema"
import "@/app/(home)/demo.css"

export const metadata: Metadata = {
  title: "Your intake | LocalEyes 48 Hour Rebuild",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}

async function Intake({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const job = token && token.length >= 20 ? await (await getRepo()).getJobByToken(token).catch(() => null) : null
  if (!job) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <h1 className="display text-[2.4rem] text-ink">This intake link doesn’t work.</h1>
        <p className="mt-4 text-soft">Use the link from your payment email, or text Kent and he&apos;ll send a fresh one.</p>
      </div>
    )
  }
  const config = await getConfig()
  return (
    <IntakeFlow
      token={token}
      initialDraft={hydrateDraft(job.intake_draft)}
      initialStep={job.intake_step || 1}
      submitted={Boolean(job.intake_submitted_at)}
      accessConfirmed={job.access_confirmed}
      clockStarted={Boolean(job.clock_started_at)}
      firstName={(job.name ?? "").split(" ")[0] || "there"}
      video={{ url: config.INTAKE_VIDEO_URL, captions: config.INTAKE_CAPTIONS_URL }}
      collabVideo={config.COLLAB_HOWTO_VIDEO_URL}
      lookbook={config.LOOKBOOK}
      missing={showMissingConfig()}
    />
  )
}

export default function IntakePage(props: { params: Promise<{ token: string }> }) {
  return (
    <ThemedShell theme="home" mainClassName="pt-4 pb-16">
      <ThemedContainer theme="home">
        <Suspense
          fallback={
              <div className="mx-auto max-w-2xl animate-pulse pt-6">
                <div className="h-1 rounded bg-cream" />
                <div className="mt-8 h-12 w-3/4 rounded bg-cream" />
                <div className="mt-6 aspect-video rounded-[18px] bg-cream" />
              </div>
            }
        >
          <Intake params={props.params} />
        </Suspense>
      </ThemedContainer>
    </ThemedShell>
  )
}
