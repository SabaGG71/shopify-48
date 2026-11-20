"use server"

import { after } from "next/server"
import { getConfig } from "@/lib/config"
import { getRepo } from "@/lib/db/repo"
import { LOOK_IDS, STORE_SLUGS } from "@/lib/lookbook"
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
import { prequalify, qualify, REASON_TEXT } from "@/lib/qualify"
import { currentApplication, newToken, requestInfo, setAppCookie } from "@/lib/session"
import { checkShopify, type ShopifyCheck } from "@/lib/shopify-check"
import type { Application, Outcome, SourceInfo } from "@/lib/types"
import { displayHost, formatPhoneForDisplay, isEmail, normalizePhone, normalizeStoreUrl } from "@/lib/url"

export type ApplyValues = {
  style_pick: Look | ""
  /** "None of these feel right": what they want instead, or a store they love. */
  style_other: string
  store_url: string
  revenue_band: RevenueBand | ""
  niche: Niche | ""
  main_problem: string
  name: string
  email: string
  phone: string
  phone_channel: PhoneChannel | ""
}

/** The lookbook trail from the browser (looks opened, live stores visited). Merged into the row at both steps. */
export type TrailInput = { styles_viewed?: unknown; stores_clicked?: unknown }

export type ApplyResume = {
  stage: "partial" | "submitted"
  values: ApplyValues
  outcome: Outcome | null
  next: string | null
}

type FieldErrors = Partial<Record<keyof ApplyValues, string>>
type Fail = { ok: false; error: string; fieldErrors?: FieldErrors }

const SAVE_ERROR = "We couldn't save that. Please try again in a moment."
const nextFor = (o: Outcome | null) => (o === "qualified" ? "/book" : o === "review" ? "/thanks" : o === "not_fit" ? "/not-a-fit" : null)

/** A store check this recent, for the same address, is reused instead of run again. */
const CHECK_FRESH_MS = 30 * 60 * 1000
/** Step one waits this long for the store check. A slow store finishes in the background. */
const STEP_ONE_CHECK_MS = 12_000
const TRAIL_MAX = 30

function toValues(app: Application): ApplyValues {
  return {
    style_pick: app.style_pick ?? "",
    style_other: app.style_other ?? "",
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
    style_other: null,
    styles_viewed: null,
    stores_clicked: null,
    lead_at: null,
    source: null,
    submitted_at: null,
  }
}

/** Keep what the row already has, add new known ids in order, once each, capped. */
function mergeTrail(existing: string[] | null | undefined, incoming: unknown, known: ReadonlySet<string>): string[] | null {
  const out = [...(existing ?? [])]
  if (Array.isArray(incoming)) {
    for (const v of incoming) {
      if (out.length >= TRAIL_MAX) break
      if (typeof v === "string" && known.has(v) && !out.includes(v)) out.push(v)
    }
  }
  return out.length ? out : null
}

function trailPatch(app: Application | null, trail: TrailInput | undefined) {
  return {
    styles_viewed: mergeTrail(app?.styles_viewed, trail?.styles_viewed, LOOK_IDS),
    stores_clicked: mergeTrail(app?.stores_clicked, trail?.stores_clicked, STORE_SLUGS),
  }
}

type ContactInput = {
  name?: string
  email?: string
  phone?: string
  phone_channel?: string
  store_url?: string
  revenue_band?: string
}

/** The step one fields, cleaned and checked. Both steps use it. */
function readContact(input: ContactInput) {
  const fieldErrors: FieldErrors = {}
  const name = clean(input.name, 80)
  const email = clean(input.email, 160).toLowerCase()
  const phone = normalizePhone(input.phone)
  const storeUrl = normalizeStoreUrl(input.store_url)
  if (!name) fieldErrors.name = "Add your name."
  if (!isEmail(email)) fieldErrors.email = "Enter a valid email."
  if (!phone) fieldErrors.phone = "Enter a phone number we can text."
  if (!isKey(PHONE_CHANNELS, input.phone_channel)) fieldErrors.phone_channel = "Pick how you'd like us to text you."
  if (!storeUrl) fieldErrors.store_url = "Enter your store's web address, like yourstore.com."
  if (!isKey(REVENUE_BANDS, input.revenue_band)) fieldErrors.revenue_band = "Pick your monthly revenue."
  return {
    fieldErrors,
    contact: {
      name,
      email,
      phone: phone ?? "",
      phone_channel: input.phone_channel as PhoneChannel,
      store_url: storeUrl ?? "",
      revenue_band: input.revenue_band as RevenueBand,
    },
  }
}

const isFresh = (app: Application, storeUrl: string) =>
  app.store_url === storeUrl &&
  app.is_shopify !== null &&
  !!app.store_checked_at &&
  Date.now() - new Date(app.store_checked_at).getTime() < CHECK_FRESH_MS

const checkPatch = (res: ShopifyCheck) => ({
  is_shopify: res.isShopify,
  shopify_signal: res.signal,
  store_checked_at: new Date().toISOString(),
  store_name: res.storeName,
})

/** Resolves with the check, or null when it takes longer than ms (the check keeps running). */
async function within(check: Promise<ShopifyCheck>, ms: number): Promise<ShopifyCheck | null> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const late = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms)
  })
  try {
    return await Promise.race([check, late])
  } finally {
    clearTimeout(timer)
  }
}

/** Where this browser left off, so a returning visitor finds their answers filled in. */
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

export type ContactResult =
  | { ok: true; store_url: string; outcome: "not_fit" | null; next: string | null; events: { lead: string | null } }
  | Fail

/**
 * Step one: name, email, phone, store and revenue. Saves the lead the moment it is complete,
 * fires Lead once per application, and checks the store. A store that is not on Shopify, or
 * revenue under 5K, ends here as not a fit. Everyone else goes on to pick a look.
 */
export async function saveContact(input: ContactInput & { website?: string; source?: SourceInfo; trail?: TrailInput }): Promise<ContactResult> {
  // Honeypot: real people never see this field. Pretend it worked and save nothing.
  if (input.website) return { ok: true, store_url: clean(input.store_url, 200), outcome: null, next: null, events: { lead: null } }

  const { fieldErrors, contact } = readContact(input)
  if (Object.keys(fieldErrors).length) return { ok: false, error: "Check the fields marked below.", fieldErrors }

  let app: Application
  let leadClaimed = false
  let slowCheck: Promise<ShopifyCheck> | null = null
  try {
    const repo = await getRepo()
    const req = await requestInfo()
    const existing = await currentApplication()
    const fields = {
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      phone_channel: contact.phone_channel,
      store_url: contact.store_url,
      revenue_band: contact.revenue_band,
    }
    if (existing && existing.stage === "partial") {
      app = await repo.updateApplication(existing.id, {
        ...fields,
        ...trailPatch(existing, input.trail),
        source: existing.source ?? cleanSource(input.source, req),
        ...(existing.store_url !== contact.store_url ? { is_shopify: null, shopify_signal: null, store_checked_at: null, store_name: null } : {}),
      })
    } else {
      app = await repo.insertApplication({
        ...blankApplication(newToken()),
        ...fields,
        ...trailPatch(null, input.trail),
        source: cleanSource(input.source, req),
      })
    }
    await setAppCookie(app.id, app.resume_token)

    let isShopify = isFresh(app, contact.store_url) ? app.is_shopify : null
    if (!isFresh(app, contact.store_url)) {
      const check = checkShopify(contact.store_url)
      const res = await within(check, STEP_ONE_CHECK_MS)
      if (res) {
        isShopify = res.isShopify
        app = await repo.updateApplication(app.id, checkPatch(res))
      } else {
        slowCheck = check
      }
    }

    const early = prequalify({ isShopify, revenueBand: contact.revenue_band })
    if (early) {
      app = await repo.updateApplication(app.id, {
        stage: "submitted",
        qualified: false,
        outcome: "not_fit",
        qualify_reason: early.reason,
        needs_review: false,
        submitted_at: new Date().toISOString(),
      })
    }

    leadClaimed = await repo.claimLead(app.id)
  } catch (err) {
    await reportSaveFailure("apply step one", err, { store_url: contact.store_url, email: contact.email })
    return { ok: false, error: SAVE_ERROR }
  }

  const leadId = leadClaimed ? metaEventId.lead(app.id) : null
  const saved = app
  after(async () => {
    if (slowCheck) {
      try {
        const res = await slowCheck
        const repo = await getRepo()
        await repo.updateApplication(saved.id, checkPatch(res))
      } catch (err) {
        console.error("[store check]", err)
      }
    }
    if (leadId) {
      await sendMetaEvent({
        name: "Lead",
        eventId: leadId,
        email: saved.email,
        phone: saved.phone,
        fullName: saved.name,
        externalId: saved.id,
        source: saved.source,
      })
    }
  })

  const notFit = saved.outcome === "not_fit"
  return { ok: true, store_url: contact.store_url, outcome: notFit ? "not_fit" : null, next: notFit ? "/not-a-fit" : null, events: { lead: leadId } }
}

export type SubmitResult =
  | { ok: true; outcome: Outcome; next: string; events: { lead: string | null; qualifiedLead: string | null } }
  | Fail

/**
 * Step two: the look (or "none of these", in their words), what they sell and what isn't
 * working. Qualifies, saves the lookbook trail, alerts Kent.
 */
export async function submitApplication(input: ApplyValues & { website?: string; source?: SourceInfo; trail?: TrailInput }): Promise<SubmitResult> {
  // Honeypot: real people never see this field.
  if (input.website) return { ok: true, outcome: "review", next: "/thanks", events: { lead: null, qualifiedLead: null } }

  const { fieldErrors, contact } = readContact(input)
  const problem = clean(input.main_problem, 500)
  const other = clean(input.style_other, 300)
  const look = isKey(LOOKS, input.style_pick) ? (input.style_pick as Look) : null
  if (!look && other.length < 2) fieldErrors.style_pick = "Pick the look closest to what you want, or tell us about a store you love."
  if (!isKey(NICHES, input.niche)) fieldErrors.niche = "Pick what you sell."
  if (problem.length < 3) fieldErrors.main_problem = "Tell us in a few words what isn't working."
  if (Object.keys(fieldErrors).length) return { ok: false, error: "Check the fields marked below.", fieldErrors }

  let app: Application
  let leadClaimed = false
  try {
    const repo = await getRepo()
    const req = await requestInfo()
    const existing = await currentApplication()
    // Step one normally made the row. If the cookie went missing, start a fresh one.
    app =
      existing && existing.stage === "partial"
        ? existing
        : await repo.insertApplication({ ...blankApplication(newToken()), source: cleanSource(input.source, req) })

    let check: Pick<Application, "is_shopify" | "shopify_signal" | "store_name"> = app
    if (!isFresh(app, contact.store_url)) {
      const res = await checkShopify(contact.store_url)
      check = { is_shopify: res.isShopify, shopify_signal: res.signal, store_name: res.storeName ?? app.store_name }
    }

    const config = await getConfig()
    const q = qualify({
      isShopify: check.is_shopify,
      revenueBand: contact.revenue_band,
      niche: input.niche as Niche,
      activeNiches: config.ACTIVE_NICHES,
    })

    app = await repo.updateApplication(app.id, {
      stage: "submitted",
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      phone_channel: contact.phone_channel,
      store_url: contact.store_url,
      revenue_band: contact.revenue_band,
      style_pick: look,
      style_other: other || null,
      niche: input.niche as Niche,
      main_problem: problem,
      ...trailPatch(app, input.trail),
      is_shopify: check.is_shopify,
      shopify_signal: check.shopify_signal,
      store_checked_at: new Date().toISOString(),
      store_name: check.store_name,
      qualified: q.qualified,
      outcome: q.outcome,
      qualify_reason: q.reason,
      needs_review: q.needsReview,
      submitted_at: new Date().toISOString(),
    })
    await setAppCookie(app.id, app.resume_token)
    // Normally Lead went out at step one. This covers a row that never got it.
    leadClaimed = await repo.claimLead(app.id)
  } catch (err) {
    await reportSaveFailure("apply submit", err, { store_url: contact.store_url, email: contact.email })
    return { ok: false, error: SAVE_ERROR }
  }

  const events = {
    lead: leadClaimed ? metaEventId.lead(app.id) : null,
    qualifiedLead: app.outcome === "qualified" ? metaEventId.qualifiedLead(app.id) : null,
  }
  const saved = app
  after(async () => {
    const who = `${saved.name} (${displayHost(saved.store_url)})`
    const lookText = saved.style_pick
      ? labelOf(LOOKS, saved.style_pick)
      : `none of the five. In their words: "${saved.style_other ?? ""}"`
    const line = `${labelOf(NICHES, saved.niche)}, look: ${lookText}. Text on ${labelOf(PHONE_CHANNELS, saved.phone_channel)}: ${formatPhoneForDisplay(saved.phone)}`
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
    if (events.lead) await sendMetaEvent({ ...base, name: "Lead", eventId: events.lead })
    if (events.qualifiedLead) await sendMetaEvent({ ...base, name: "QualifiedLead", eventId: events.qualifiedLead })
  })

  return { ok: true, outcome: app.outcome!, next: nextFor(app.outcome)!, events }
}
