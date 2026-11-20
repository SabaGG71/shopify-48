"use client"

import { useRouter } from "next/navigation"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { resumeApply, saveContact, submitApplication, type ApplyValues } from "@/app/actions/apply"
import type { Look } from "@/lib/options"
import { readMetaCookies, trackPixel } from "@/lib/pixel"
import type { Outcome, SourceInfo } from "@/lib/types"

type FieldErrors = Partial<Record<keyof ApplyValues, string>>

/** What someone looked at in the lookbook, in the order they first opened it. Saved with the application. */
export type LookTrail = { styles_viewed: Look[]; stores_clicked: string[] }

type Ctx = {
  values: ApplyValues
  set: <K extends keyof ApplyValues>(key: K, v: ApplyValues[K]) => void
  /** Record that a look was opened (browse or pick mode). */
  lookOpened: (look: Look) => void
  /** Record that a store's live site was visited from the lookbook. */
  storeVisited: (slug: string) => void
  screen: 1 | 2 | "done"
  goTo: (s: 1 | 2) => void
  errors: FieldErrors
  formError: string | null
  pending: "partial" | "submit" | null
  /** Step one: save the contact details (and fire Lead once). True when step two should show. */
  continueToTwo: (honeypot: string) => Promise<boolean>
  /** Step two: the look, what they sell, what isn't working. */
  submit: (honeypot: string) => Promise<void>
  outcome: Outcome | null
  next: string | null
  ready: boolean
}

const EMPTY: ApplyValues = {
  style_pick: "",
  style_other: "",
  store_url: "",
  revenue_band: "",
  niche: "",
  main_problem: "",
  name: "",
  email: "",
  phone: "",
  phone_channel: "",
}

const DRAFT_KEY = "le48:apply-draft"
const SOURCE_KEY = "le48:source"
const TRAIL_KEY = "le48:look-trail"
const TRAIL_MAX = 30

function readTrail(): LookTrail {
  const raw = safeStorage(() => JSON.parse(localStorage.getItem(TRAIL_KEY) || "null") as Partial<LookTrail> | null)
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, TRAIL_MAX) : [])
  return { styles_viewed: list(raw?.styles_viewed) as Look[], stores_clicked: list(raw?.stores_clicked) }
}

/** Add once, keep first-seen order, cap the length. */
const addOnce = <T,>(list: T[], item: T) => (list.includes(item) || list.length >= TRAIL_MAX ? list : [...list, item])

const ApplyContext = createContext<Ctx | null>(null)

export function useApply() {
  const ctx = useContext(ApplyContext)
  if (!ctx) throw new Error("useApply must be used inside <ApplyProvider>")
  return ctx
}

function safeStorage<T>(fn: () => T): T | null {
  try {
    return fn()
  } catch {
    return null
  }
}

/** First-touch attribution: the ad click that brought them, even after they navigate. */
function captureSource(): SourceInfo {
  const stored = safeStorage(() => JSON.parse(sessionStorage.getItem(SOURCE_KEY) || "null") as SourceInfo | null)
  const p = new URLSearchParams(window.location.search)
  const fresh: SourceInfo = {
    utm_source: p.get("utm_source"),
    utm_medium: p.get("utm_medium"),
    utm_campaign: p.get("utm_campaign"),
    utm_content: p.get("utm_content"),
    utm_term: p.get("utm_term"),
    fbclid: p.get("fbclid"),
    referrer: document.referrer || null,
    landing_url: window.location.href,
  }
  const base = stored ?? fresh
  if (!stored) safeStorage(() => sessionStorage.setItem(SOURCE_KEY, JSON.stringify(fresh)))
  return { ...base, ...readMetaCookies() }
}

export function ApplyProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [values, setValues] = useState<ApplyValues>(EMPTY)
  const [screen, setScreen] = useState<1 | 2 | "done">(1)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState<Ctx["pending"]>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [next, setNext] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const touched = useRef(false)
  // The lookbook trail never renders, so a ref is enough. Loaded lazily on the client.
  const trailRef = useRef<LookTrail | null>(null)
  const getTrail = useCallback((): LookTrail => (trailRef.current ??= readTrail()), [])
  const saveTrail = useCallback((next: LookTrail) => {
    trailRef.current = next
    safeStorage(() => localStorage.setItem(TRAIL_KEY, JSON.stringify(next)))
  }, [])
  const lookOpened = useCallback<Ctx["lookOpened"]>(
    (look) => {
      const t = getTrail()
      const styles_viewed = addOnce(t.styles_viewed, look)
      if (styles_viewed !== t.styles_viewed) saveTrail({ ...t, styles_viewed })
    },
    [getTrail, saveTrail],
  )
  const storeVisited = useCallback<Ctx["storeVisited"]>(
    (slug) => {
      const t = getTrail()
      const stores_clicked = addOnce(t.stores_clicked, slug)
      if (stores_clicked !== t.stores_clicked) saveTrail({ ...t, stores_clicked })
    },
    [getTrail, saveTrail],
  )

  // Fill in what they already gave us: server state first, then the local draft for anything unsaved.
  // An unfinished application always reopens on step 1 (filled in), never mid-form.
  useEffect(() => {
    let alive = true
    captureSource()
    const draft = safeStorage(() => JSON.parse(localStorage.getItem(DRAFT_KEY) || "null") as Partial<ApplyValues> | null)
    resumeApply()
      .then((res) => {
        if (!alive || touched.current) return
        if (res?.stage === "submitted") {
          setValues(res.values)
          setOutcome(res.outcome)
          setNext(res.next)
          setScreen("done")
        } else if (res?.stage === "partial") {
          const merged = { ...res.values }
          if (draft) for (const k of Object.keys(EMPTY) as (keyof ApplyValues)[]) if (!merged[k] && draft[k]) (merged[k] as string) = draft[k] as string
          setValues(merged)
        } else if (draft) {
          setValues({ ...EMPTY, ...draft })
        }
      })
      .finally(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [])

  // Keep an unsent draft in this browser.
  useEffect(() => {
    if (!touched.current) return
    const t = setTimeout(() => safeStorage(() => localStorage.setItem(DRAFT_KEY, JSON.stringify(values))), 300)
    return () => clearTimeout(t)
  }, [values])

  const set = useCallback<Ctx["set"]>((key, v) => {
    touched.current = true
    setValues((prev) => ({ ...prev, [key]: v }))
    // Writing your own answer also settles the "pick a look" message.
    const also: keyof ApplyValues = key === "style_other" ? "style_pick" : key
    setErrors((prev) => (prev[key] || prev[also] ? { ...prev, [key]: undefined, [also]: undefined } : prev))
  }, [])

  /** The application is finished (not a fit at step one, or submitted at step two). */
  const finish = useCallback(
    (outcome: Outcome | null, nextPath: string) => {
      safeStorage(() => localStorage.removeItem(DRAFT_KEY))
      safeStorage(() => localStorage.removeItem(TRAIL_KEY))
      trailRef.current = null
      setOutcome(outcome)
      setNext(nextPath)
      setScreen("done")
      router.push(nextPath)
    },
    [router],
  )

  const continueToTwo = useCallback(
    async (honeypot: string) => {
      const local: FieldErrors = {}
      if (!values.name.trim()) local.name = "Add your name."
      if (!values.email.trim()) local.email = "Enter a valid email."
      if (!values.phone.trim()) local.phone = "Enter a phone number we can text."
      if (!values.phone_channel) local.phone_channel = "Pick how you'd like us to text you."
      if (!values.store_url.trim()) local.store_url = "Enter your store's web address, like yourstore.com."
      if (!values.revenue_band) local.revenue_band = "Pick your monthly revenue."
      if (Object.keys(local).length) {
        setErrors(local)
        return false
      }
      setPending("partial")
      setFormError(null)
      try {
        const res = await saveContact({
          name: values.name,
          email: values.email,
          phone: values.phone,
          phone_channel: values.phone_channel,
          store_url: values.store_url,
          revenue_band: values.revenue_band,
          website: honeypot,
          source: captureSource(),
          trail: getTrail(),
        })
        if (!res.ok) {
          setErrors(res.fieldErrors ?? {})
          if (!res.fieldErrors) setFormError(res.error)
          return false
        }
        touched.current = true
        if (res.events.lead) trackPixel("Lead", res.events.lead)
        setValues((prev) => ({ ...prev, store_url: res.store_url.replace(/^https:\/\//, "") }))
        if (res.next) {
          finish(res.outcome, res.next)
          return false
        }
        setScreen(2)
        return true
      } catch {
        setFormError("We couldn't reach the server. Check your connection and try again.")
        return false
      } finally {
        setPending(null)
      }
    },
    [values, getTrail, finish],
  )

  const submit = useCallback(
    async (honeypot: string) => {
      setPending("submit")
      setFormError(null)
      try {
        const res = await submitApplication({ ...values, website: honeypot, source: captureSource(), trail: getTrail() })
        if (!res.ok) {
          const fe = res.fieldErrors ?? {}
          setErrors(fe)
          setFormError(res.fieldErrors ? "Check the fields marked in red." : res.error)
          // A step one answer went bad (rare: a stale tab). Send them back to fix it.
          if (fe.name || fe.email || fe.phone || fe.phone_channel || fe.store_url || fe.revenue_band) setScreen(1)
          return
        }
        if (res.events.lead) trackPixel("Lead", res.events.lead)
        if (res.events.qualifiedLead) trackPixel("QualifiedLead", res.events.qualifiedLead)
        finish(res.outcome, res.next)
      } catch {
        setFormError("We couldn't reach the server. Check your connection and try again.")
      } finally {
        setPending(null)
      }
    },
    [values, getTrail, finish],
  )

  const goTo = useCallback((s: 1 | 2) => {
    setFormError(null)
    setScreen(s)
  }, [])

  const ctx = useMemo<Ctx>(
    () => ({ values, set, lookOpened, storeVisited, screen, goTo, errors, formError, pending, continueToTwo, submit, outcome, next, ready }),
    [values, set, lookOpened, storeVisited, screen, goTo, errors, formError, pending, continueToTwo, submit, outcome, next, ready],
  )

  return <ApplyContext.Provider value={ctx}>{children}</ApplyContext.Provider>
}
