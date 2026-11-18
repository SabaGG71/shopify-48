import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { AccessButton, ApproveButton, BookingLinkButton, ConfigRow, CopyButton, LoginForm, LogoutButton } from "@/components/admin/admin-client"
import { isAdmin } from "@/lib/admin-auth"
import { mergeConfig } from "@/lib/config"
import { DEFAULT_CONFIG } from "@/lib/config/defaults"
import { CONFIG_KEYS, JSON_KEYS, type ConfigKey } from "@/lib/config/schema"
import { getRepo, hasDatabase } from "@/lib/db/repo"
import { LOOKS, NICHES, labelOf } from "@/lib/options"
import { REASON_TEXT } from "@/lib/qualify"
import { siteUrl } from "@/lib/session"
import { displayHost } from "@/lib/url"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Admin | 48 Hour Rebuild", robots: { index: false, follow: false } }

const DESCRIPTIONS: Record<ConfigKey, string> = {
  PRICE_DISPLAY: "The price text shown on the page.",
  RESERVE_URL: "Stripe Payment Link for the reserve button. In Stripe, set its after-payment redirect to /reserved?session_id={CHECKOUT_SESSION_ID} on this site.",
  BOOKING_URL: "Calendly or Google booking link.",
  VSL_URL: "Main video. YouTube, Vimeo, Wistia, Loom or a direct .mp4 link.",
  VSL_POSTER_URL: "Optional still shown before the main video plays.",
  VSL_CAPTIONS_URL: "Optional .vtt captions for a direct .mp4 main video.",
  CONFIRM_VIDEO_URL: "Video at the top of the booking page.",
  CONFIRM_CAPTIONS_URL: "Optional .vtt captions for a direct .mp4 booking video.",
  INTAKE_VIDEO_URL: "Welcome video at the top of the intake.",
  INTAKE_CAPTIONS_URL: "Optional .vtt captions for a direct .mp4 intake video.",
  COLLAB_HOWTO_VIDEO_URL: "The 20 second clip on finding the collaborator request code.",
  STORE_SCORE_URL: "Store Score link on the not a fit page. Leave empty to hide it.",
  KENT_TEXT_NUMBER: "Number shown for texting Kent.",
  SLOT_COUNTER_ON: "true or false. Shows the slot counter only when true.",
  SLOTS_PER_WEEK: "Slots per week, for the counter.",
  SLOTS_LEFT: "Slots left this week, for the counter.",
  NICHE_LABEL: "The niche named under the headline.",
  ACTIVE_NICHES: `Niche keys that pass the qualifier. Keys: ${NICHES.map((n) => n.key).join(", ")}.`,
  PROOF_STORES: "Before and after pairs. Only entries with cleared: true and both images are shown.",
  LOOKBOOK: `Lookbook stores: name, url, screenshot, look, why, and optional video. Looks: ${LOOKS.map((l) => l.key).join(", ")}.`,
  WHAT_YOU_GET: "The seven line checklist.",
  FINE_PRINT: "Clock rules and what is not included. A list of { title, body }.",
}

const fmt = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : ""

function Badge({ tone, children }: { tone: "blue" | "green" | "amber" | "gray" | "red"; children: React.ReactNode }) {
  const tones = {
    blue: "bg-[#eef1ff] text-[#1a37ff]",
    green: "bg-[#e8f6ee] text-[#1d7a46]",
    amber: "bg-[#fff4e0] text-[#8a5a00]",
    gray: "bg-[#f1f2f5] text-[#5b6075]",
    red: "bg-[#fdecec] text-[#b42318]",
  }
  return <span className={cn("inline-flex rounded px-1.5 py-0.5 text-[12px] font-medium whitespace-nowrap", tones[tone])}>{children}</span>
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#e3e5ec] bg-white">
      <table className="w-full min-w-[860px] border-collapse text-left text-[13px] text-[#14161f]">
        <thead>
          <tr className="border-b border-[#e3e5ec] bg-[#fafbfc] text-[12px] text-[#5b6075]">
            {head.map((h) => (
              <th key={h} className="px-3 py-2.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_td]:px-3 [&_td]:py-2.5 [&_td]:align-top [&_tr]:border-b [&_tr]:border-[#eceef3] [&_tr:last-child]:border-0">{children}</tbody>
      </table>
    </div>
  )
}

async function Leads({ highlight }: { highlight?: string }) {
  const apps = await (await getRepo()).listApplications(200)
  if (!apps.length) return <p className="text-[14px] text-[#5b6075]">No applications yet.</p>
  return (
    <Table head={["When", "Name", "Store", "Look", "Sells", "Status", "Reason", ""]}>
      {apps.map((a) => {
        const status =
          a.stage === "partial" ? (
            <Badge tone="gray">Partial</Badge>
          ) : a.outcome === "qualified" ? (
            <Badge tone="green">Qualified</Badge>
          ) : a.outcome === "review" ? (
            <Badge tone="amber">Review</Badge>
          ) : (
            <Badge tone="red">Not a fit</Badge>
          )
        return (
          <tr key={a.id} className={cn(highlight === a.id && "bg-[#f5f7ff]")}>
            <td className="whitespace-nowrap text-[#5b6075]">{fmt(a.created_at)}</td>
            <td>
              <div className="font-medium">{a.name || "Not given yet"}</div>
              <div className="text-[12px] text-[#5b6075]">{a.email}</div>
            </td>
            <td>
              {a.store_url ? (
                <a href={a.store_url} target="_blank" rel="noreferrer" className="text-[#1a37ff] hover:underline">
                  {displayHost(a.store_url)}
                </a>
              ) : null}
              <div className="text-[12px] text-[#5b6075]">{a.is_shopify === true ? "Shopify" : a.is_shopify === false ? "Not Shopify" : "Unchecked"}</div>
            </td>
            <td>{labelOf(LOOKS, a.style_pick)}</td>
            <td>{labelOf(NICHES, a.niche)}</td>
            <td>{status}</td>
            <td className="max-w-[220px] text-[12px] text-[#5b6075]">
              {a.qualify_reason ? (REASON_TEXT[a.qualify_reason as keyof typeof REASON_TEXT] ?? a.qualify_reason) : ""}
              {a.main_problem ? <div className="mt-1 text-[#14161f]">&ldquo;{a.main_problem}&rdquo;</div> : null}
            </td>
            <td className="whitespace-nowrap">
              {a.outcome === "review" ? <ApproveButton id={a.id} /> : a.outcome === "qualified" ? <BookingLinkButton id={a.id} /> : null}
            </td>
          </tr>
        )
      })}
    </Table>
  )
}

async function HomepageJobs() {
  const jobs = await (await getRepo()).listHomepageJobs(200)
  if (!jobs.length) return <p className="text-[14px] text-[#5b6075]">No booked calls yet.</p>
  return (
    <Table head={["Booked", "Name", "Store", "Look", "Call", "Stores they love", "Best sellers", ""]}>
      {jobs.map((h) => (
        <tr key={h.id}>
          <td className="whitespace-nowrap text-[#5b6075]">{fmt(h.created_at)}</td>
          <td className="font-medium">{h.name}</td>
          <td>{displayHost(h.store_url)}</td>
          <td>{labelOf(LOOKS, h.style_pick)}</td>
          <td className="whitespace-nowrap">{h.call_time ? `${fmt(h.call_time)} ET` : <Badge tone="amber">Time not confirmed</Badge>}</td>
          <td className="text-[12px]">{h.reference_stores.map(displayHost).join(", ")}</td>
          <td className="text-[12px]">{h.top_products.length} links</td>
          <td>
            <a className="text-[#1a37ff] hover:underline" href={`/api/admin/json?homepage=${h.id}`}>
              JSON
            </a>
          </td>
        </tr>
      ))}
    </Table>
  )
}

async function Builds({ highlight }: { highlight?: string }) {
  const jobs = await (await getRepo()).listJobs(200)
  if (!jobs.length) return <p className="text-[14px] text-[#5b6075]">No paid builds yet.</p>
  const base = siteUrl()
  return (
    <Table head={["Paid", "Name", "Store", "Status", "Intake", "Access", "Clock", ""]}>
      {jobs.map((j) => (
        <tr key={j.id} className={cn(highlight === j.id && "bg-[#f5f7ff]")}>
          <td className="whitespace-nowrap text-[#5b6075]">{fmt(j.paid_at)}</td>
          <td>
            <div className="font-medium">{j.name}</div>
            <div className="text-[12px] text-[#5b6075]">{j.email}</div>
          </td>
          <td>{displayHost(j.store_url)}</td>
          <td>
            <Badge tone={j.clock_started_at ? "blue" : j.intake_submitted_at ? "green" : "gray"}>{j.status.replace(/_/g, " ")}</Badge>
          </td>
          <td className="whitespace-nowrap">{j.intake_submitted_at ? "Submitted" : `Step ${j.intake_step} of 8`}</td>
          <td>{j.access_confirmed ? <Badge tone="green">Confirmed</Badge> : <AccessButton jobId={j.id} />}</td>
          <td className="whitespace-nowrap">{j.clock_started_at ? `${fmt(j.clock_started_at)} ET` : ""}</td>
          <td className="flex flex-wrap gap-2">
            <CopyButton text={`${base}/intake/${j.intake_token}`} label="Intake link" />
            {j.doc ? (
              <a className="inline-flex h-8 items-center text-[13px] text-[#1a37ff] hover:underline" href={`/api/admin/json?job=${j.id}`}>
                JSON
              </a>
            ) : null}
          </td>
        </tr>
      ))}
    </Table>
  )
}

async function Settings() {
  const repo = await getRepo()
  const rows = await repo.getConfigRows()
  const effective = mergeConfig(rows)
  return (
    <div className="rounded-lg border border-[#e3e5ec] bg-white px-5">
      {CONFIG_KEYS.map((key) => {
        const v = effective[key]
        const isJson = JSON_KEYS.includes(key)
        const text = isJson ? JSON.stringify(v, null, 2) : v === null || v === undefined ? "" : String(v)
        const source = key in rows ? "saved" : process.env[key] ? "env" : "default"
        return <ConfigRow key={key} name={key} description={DESCRIPTIONS[key]} value={text} source={source} multiline={isJson} />
      })}
      <p className="py-4 text-[12px] text-[#8a8fa3]">Defaults live in code (src/lib/config/defaults.ts). {Object.keys(DEFAULT_CONFIG).length} settings.</p>
    </div>
  )
}

function Warnings() {
  const items: string[] = []
  if (!hasDatabase()) items.push("The database is not connected (DATABASE_URL). Data is saved to a local file (.data/db.json), for testing only.")
  if (!process.env.BLOB_READ_WRITE_TOKEN) items.push("File storage is not connected (BLOB_READ_WRITE_TOKEN). Intake uploads only work on this computer.")
  if (!process.env.KENT_ALERT_PHONE && !process.env.KENT_ALERT_EMAIL) items.push("Alerts to Kent are not set up (KENT_ALERT_PHONE with Twilio, or KENT_ALERT_EMAIL with Resend). They are only logged.")
  if (!process.env.RESEND_API_KEY) items.push("Email is not set up (RESEND_API_KEY, EMAIL_FROM). Intake links are not emailed after payment.")
  if (!process.env.STRIPE_WEBHOOK_SECRET) items.push("Stripe webhook secret is missing (STRIPE_WEBHOOK_SECRET). Payments will not create intakes.")
  if (!process.env.NEXT_PUBLIC_META_PIXEL_ID || !process.env.META_CAPI_TOKEN) items.push("Meta pixel or Conversions API token is missing.")
  if (!items.length) return null
  return (
    <ul className="mb-6 grid gap-1.5 rounded-lg border border-[#f3d9a4] bg-[#fffaf0] p-4 text-[13px] text-[#6b4a00]">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  )
}

const TABS = [
  { key: "leads", label: "Applications" },
  { key: "homepage", label: "Homepage jobs" },
  { key: "builds", label: "Paid builds" },
  { key: "settings", label: "Settings" },
] as const

async function AdminContent({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!(await isAdmin())) return <LoginForm />
  const sp = await searchParams
  const tab = (TABS.find((t) => t.key === sp.tab)?.key ?? (sp.job ? "builds" : "leads")) as (typeof TABS)[number]["key"]
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-md bg-[#1a37ff] text-[13px] font-bold text-white">LE</span>
          <span className="text-[15px] font-semibold text-[#14161f]">48 Hour Rebuild</span>
        </div>
        <LogoutButton />
      </div>
      <nav className="mb-6 flex gap-1 border-b border-[#e3e5ec]">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin?tab=${t.key}`}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-[14px] font-medium",
              tab === t.key ? "border-[#1a37ff] text-[#1a37ff]" : "border-transparent text-[#5b6075] hover:text-[#14161f]",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <Warnings />
      {tab === "leads" ? <Leads highlight={sp.app} /> : null}
      {tab === "homepage" ? <HomepageJobs /> : null}
      {tab === "builds" ? <Builds highlight={sp.job} /> : null}
      {tab === "settings" ? <Settings /> : null}
    </div>
  )
}

export default function AdminPage(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  return (
    <div id="main" className="min-h-dvh w-full bg-[#f6f7f9] font-sans">
      <Suspense fallback={<p className="p-8 text-[14px] text-[#5b6075]">Loading…</p>}>
        <AdminContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  )
}
