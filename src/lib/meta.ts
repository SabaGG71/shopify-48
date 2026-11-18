import "server-only"
import { createHash } from "node:crypto"
import type { SourceInfo } from "@/lib/types"

export type MetaEventName = "Lead" | "QualifiedLead" | "Schedule" | "Purchase"

const sha = (v: string) => createHash("sha256").update(v.trim().toLowerCase()).digest("hex")

/**
 * Conversions API. Same event_id as the browser pixel so Meta dedupes the pair.
 * Never throws: a tracking failure must not break the funnel.
 */
export async function sendMetaEvent(opts: {
  name: MetaEventName
  eventId: string
  email?: string | null
  phone?: string | null
  fullName?: string | null
  externalId?: string | null
  source?: SourceInfo | null
  sourceUrl?: string | null
  customData?: Record<string, unknown>
}) {
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const token = process.env.META_CAPI_TOKEN
  if (!pixel || !token) return { ok: false, skipped: "not configured" as const }

  const [first, ...rest] = (opts.fullName ?? "").trim().split(/\s+/)
  const user_data: Record<string, unknown> = {
    em: opts.email ? [sha(opts.email)] : undefined,
    ph: opts.phone ? [sha(opts.phone.replace(/\D/g, ""))] : undefined,
    fn: first ? [sha(first)] : undefined,
    ln: rest.length ? [sha(rest.join(" "))] : undefined,
    external_id: opts.externalId ? [sha(opts.externalId)] : undefined,
    client_ip_address: opts.source?.ip ?? undefined,
    client_user_agent: opts.source?.user_agent ?? undefined,
    fbp: opts.source?.fbp ?? undefined,
    fbc: opts.source?.fbc ?? undefined,
  }

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: opts.name,
        event_time: Math.floor(Date.now() / 1000),
        event_id: opts.eventId,
        action_source: "website",
        event_source_url: opts.sourceUrl ?? opts.source?.landing_url ?? process.env.SITE_URL ?? undefined,
        user_data,
        custom_data: opts.customData ?? {},
      },
    ],
  }
  if (process.env.META_TEST_EVENT_CODE) body.test_event_code = process.env.META_TEST_EVENT_CODE

  const version = process.env.META_GRAPH_VERSION || "v24.0"
  try {
    const res = await fetch(`https://graph.facebook.com/${version}/${pixel}/events?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    })
    if (!res.ok) {
      console.error(`[meta] ${opts.name} failed`, res.status, (await res.text()).slice(0, 300))
      return { ok: false }
    }
    return { ok: true }
  } catch (err) {
    console.error(`[meta] ${opts.name} error`, err)
    return { ok: false }
  }
}

export const metaEventId = {
  lead: (applicationId: string) => `lead_${applicationId}`,
  qualifiedLead: (applicationId: string) => `qlead_${applicationId}`,
  schedule: (homepageJobId: string) => `schedule_${homepageJobId}`,
  purchase: (sessionId: string) => `purchase_${sessionId}`,
}
