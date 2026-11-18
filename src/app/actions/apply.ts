"use server"

import { after } from "next/server"
import { getConfig } from "@/lib/config"
import { getRepo } from "@/lib/db/repo"
import { sendMetaEvent, metaEventId } from "@/lib/meta"
import { notifyKent, reportSaveFailure } from "@/lib/notify"
import {
  LOOKS,
  NICHES,
  PHONE_CHANNELS,
  REVENUE_BANDS,
  isKey,
  labelOf,
  type Look,
  type Niche,
  type PhoneChannel,
  type RevenueBand,
} from "@/lib/options"
import { qualify, REASON_TEXT } from "@/lib/qualify"
import { currentApplication, newToken, requestInfo, setAppCookie } from "@/lib/session"
import { checkShopify } from "@/lib/shopify-check"
import type { Application, Outcome, SourceInfo } from "@/lib/types"
import { displayHost, formatPhoneForDisplay, isEmail, normalizePhone, normalizeStoreUrl } from "@/lib/url"

export type ApplyValues = {
  style_pick: Look | ""
  store_url: string
  revenue_band: RevenueBand | ""
  niche: Niche | ""
  main_problem: string
  name: string
  email: string
  phone: string
  phone_channel: PhoneChannel | ""
}

export type ApplyResume = {
  stage: "partial" | "submitted"
  values: ApplyValues
  outcome: Outcome | null
  next: string | null
}

type Fail = { ok: false; error: string; fieldErrors?: Partial<Record<keyof ApplyValues, string>> }

const SAVE_ERROR = "We couldn't save that. Please try again in a moment."
const nextFor = (o: Outcome | null) => (o === "qualified" ? "/book" : o === "review" ? "/thanks" : o === "not_fit" ? "/not-a-fit" : null)

function toValues(app: Application): ApplyValues {
  return {
    style_pick: app.style_pick ?? "",
    store_url: app.store_url ?? "",
    revenue_band: app.revenue_band ?? "",
    niche: app.niche ?? "",
    main_problem: app.main_problem ?? "",
    name: app.name ?? "",
    email: app.email ?? "",
    phone: app.phone ? formatPhoneForDisplay(app.phone) : "",
    phone_channel: app.phone_channel ?? "",
  }
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "")

function cleanSource(raw: SourceInfo | undefined, req: Awaited<ReturnType<typeof requestInfo>>): SourceInfo {
  const s = raw ?? {}
  const pickStr = (v: unknown) => (typeof v === "string" && v ? v.slice(0, 500) : null)
  return {
    utm_source: pickStr(s.utm_source),
    utm_medium: pickStr(s.utm_medium),
    utm_campaign: pickStr(s.utm_campaign),
    utm_content: pickStr(s.utm_content),
    utm_term: pickStr(s.utm_term),
    fbclid: pickStr(s.fbclid),
    fbp: pickStr(s.fbp),
    fbc: pickStr(s.fbc),
    referrer: pickStr(s.referrer),
    landing_url: pickStr(s.landing_url),
    ip: req.ip,
    user_agent: req.user_agent ? req.user_agent.slice(0, 400) : null,
  }
}

function blankApplication(token: string): Omit<Application, "id" | "created_at" | "updated_at"> {
  return {
    stage: "partial",
    resume_token: token,
    style_pick: null,
    store_url: null,
    revenue_band: null,
    niche: null,
    main_problem: null,
    name: null,
    email: null,
    phone: null,
    phone_channel: null,
    is_shopify: null,
    shopify_signal: null,
    store_checked_at: null,
    store_name: null,
    qualified: null,
    outcome: null,
    qualify_reason: null,
    needs_review: false,
    reference_stores: null,
    never_want: null,
    top_products: null,
    design_saved_at: null,
    source: null,
    submitted_at: null,
  }
}

/** Where this browser left off, so a returning visitor lands where they stopped. */
export async function resumeApply(): Promise<ApplyResume | null> {
  try {
    const app = await currentApplication()
    if (!app) return null
    return { stage: app.stage, values: toValues(app), outcome: app.outcome, next: nextFor(app.outcome) }
  } catch (err) {
    console.error("[resumeApply]", err)
    return null
  }
}

async function runStoreCheck(appId: string, storeUrl: string) {
  const res = await checkShopify(storeUrl)
  const repo = await getRepo()
  await repo.updateApplication(appId, {
    is_shopify: res.isShopify,
    shopify_signal: res.signal,
    store_checked_at: new Date().toISOString(),
    store_name: res.storeName,
  })
  return res
}

/**
 * Screen one: style pick and store URL. Saved the moment it is complete so Kent
 * keeps the partial lead even if screen two is never finished.
 */
export async function savePartial(input: {
  style_pick: string
  store_url: string
  source?: SourceInfo
}): Promise<{ ok: true; store_url: string } | Fail> {
  const fieldErrors: Fail["fieldErrors"] = {}
  if (!isKey(LOOKS, input.style_pick)) fieldErrors.style_pick = "Pick the look closest to your brand."
  const storeUrl = normalizeStoreUrl(input.store_url)
  if (!storeUrl) fieldErrors.store_url = "Enter your store's web address, like yourstore.com."
  if (Object.keys(fieldErrors).length) return { ok: false, error: "Check the fields marked below.", fieldErrors }

  try {
    const repo = await getRepo()
    const req = await requestInfo()
    const existing = await currentApplication()
    let app: Application
    if (existing && existing.stage === "partial") {
      app = await repo.updateApplication(existing.id, {
        style_pick: input.style_pick as Look,
        store_url: storeUrl,
        source: existing.source ?? cleanSource(input.source, req),
        ...(existing.store_url !== storeUrl ? { is_shopify: null, shopify_signal: null, store_checked_at: null } : {}),
      })
    } else {
      const token = newToken()
      app = await repo.insertApplication({
        ...blankApplication(token),
        style_pick: input.style_pick as Look,
        store_url: storeUrl,
        source: cleanSource(input.source, req),
      })
    }
    await setAppCookie(app.id, app.resume_token)
    if (!app.store_checked_at) {
      const id = app.id
      after(async () => {
        try {
          await runStoreCheck(id, storeUrl!)
        } catch (err) {
          console.error("[store check]", err)
        }
      })
    }
    return { ok: true, store_url: storeUrl! }
  } catch (err) {
    await reportSaveFailure("apply screen one", err, { store_url: storeUrl })
    return { ok: false, error: SAVE_ERROR }
  }
}

export type SubmitResult =
  | { ok: true; outcome: Outcome; next: string; events: { lead: string; qualifiedLead: string | null } }
  | Fail

/** Screen two. Validates, checks the store, qualifies, stores either way, alerts Kent. */
export async function submitApplication(input: ApplyValues & { website?: string; source?: SourceInfo }): Promise<SubmitResult> {
  // Honeypot: real people never see this field.
  if (input.website) return { ok: true, outcome: "review", next: "/thanks", events: { lead: "", qualifiedLead: null } }

  const fieldErrors: Fail["fieldErrors"] = {}
  const storeUrl = normalizeStoreUrl(input.store_url)
  const phone = normalizePhone(input.phone)
  const name = clean(input.name, 80)
  const email = clean(input.email, 160).toLowerCase()
  const problem = clean(input.main_problem, 500)

  if (!isKey(LOOKS, input.style_pick)) fieldErrors.style_pick = "Pick the look closest to your brand."
  if (!storeUrl) fieldErrors.store_url = "Enter your store's web address, like yourstore.com."
  if (!isKey(REVENUE_BANDS, input.revenue_band)) fieldErrors.revenue_band = "Pick your monthly revenue."
  if (!isKey(NICHES, input.niche)) fieldErrors.niche = "Pick what you sell."
  if (problem.length < 3) fieldErrors.main_problem = "Tell us in a few words what isn't working."
  if (!name) fieldErrors.name = "Add your name."
  if (!isEmail(email)) fieldErrors.email = "Enter a valid email."
  if (!phone) fieldErrors.phone = "Enter a phone number we can text."
  if (!isKey(PHONE_CHANNELS, input.phone_channel)) fieldErrors.phone_channel = "Pick how you'd like us to text you."
  if (Object.keys(fieldErrors).length) return { ok: false, error: "Check the fields marked below.", fieldErrors }

  let app: Application
  try {
    const repo = await getRepo()
    const req = await requestInfo()
    const existing = await currentApplication()
    if (existing && existing.stage === "partial") {
      app = existing
    } else {
      app = await repo.insertApplication({
        ...blankApplication(newToken()),
        source: cleanSource(input.source, req),
      })
    }

    // Reuse the screen-one check when it is fresh and for the same store.
    let isShopify = app.is_shopify
    let signal = app.shopify_signal
    let storeName = app.store_name
    const fresh = app.store_checked_at && Date.now() - new Date(app.store_checked_at).getTime() < 30 * 60 * 1000
    if (!fresh || app.store_url !== storeUrl || isShopify === null) {
      const res = await checkShopify(storeUrl!)
      isShopify = res.isShopify
      signal = res.signal
      storeName = res.storeName ?? storeName
    }

    const config = await getConfig()
    const q = qualify({
      isShopify,
      revenueBand: input.revenue_band as RevenueBand,
      niche: input.niche as Niche,
      activeNiches: config.ACTIVE_NICHES,
    })

    app = await repo.updateApplication(app.id, {
      stage: "submitted",
      style_pick: input.style_pick as Look,
      store_url: storeUrl,
      revenue_band: input.revenue_band as RevenueBand,
      niche: input.niche as Niche,
      main_problem: problem,
      name,
      email,
      phone,
      phone_channel: input.phone_channel as PhoneChannel,
      is_shopify: isShopify,
      shopify_signal: signal,
      store_checked_at: new Date().toISOString(),
      store_name: storeName,
      qualified: q.qualified,
      outcome: q.outcome,
      qualify_reason: q.reason,
      needs_review: q.needsReview,
      submitted_at: new Date().toISOString(),
    })
    await setAppCookie(app.id, app.resume_token)
  } catch (err) {
    await reportSaveFailure("apply submit", err, { store_url: storeUrl, email })
    return { ok: false, error: SAVE_ERROR }
  }

  const events = {
    lead: metaEventId.lead(app.id),
    qualifiedLead: app.outcome === "qualified" ? metaEventId.qualifiedLead(app.id) : null,
  }
  const saved = app
  after(async () => {
    const who = `${saved.name} (${displayHost(saved.store_url)})`
    const line = `${labelOf(NICHES, saved.niche)}, look: ${labelOf(LOOKS, saved.style_pick)}. Text on ${labelOf(PHONE_CHANNELS, saved.phone_channel)}: ${formatPhoneForDisplay(saved.phone)}`
    if (saved.outcome === "qualified") {
      await notifyKent("qualified_application", `Qualified application: ${who}. ${line}`, {
        application_id: saved.id,
        adminPath: `/admin?app=${saved.id}`,
      })
    } else if (saved.outcome === "review") {
      await notifyKent("review_application", `Needs your review: ${who}. ${REASON_TEXT[saved.qualify_reason as keyof typeof REASON_TEXT] ?? saved.qualify_reason}. ${line}`, {
        application_id: saved.id,
        adminPath: `/admin?app=${saved.id}`,
      })
    }
    const base = {
      email: saved.email,
      phone: saved.phone,
      fullName: saved.name,
      externalId: saved.id,
      source: saved.source,
    }
    await sendMetaEvent({ ...base, name: "Lead", eventId: events.lead })
    if (events.qualifiedLead) await sendMetaEvent({ ...base, name: "QualifiedLead", eventId: events.qualifiedLead })
  })

  return { ok: true, outcome: app.outcome!, next: nextFor(app.outcome)!, events }
}
