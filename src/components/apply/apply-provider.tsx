"use client"

import { useRouter } from "next/navigation"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { resumeApply, savePartial, submitApplication, type ApplyValues } from "@/app/actions/apply"
import { readMetaCookies, trackPixel } from "@/lib/pixel"
import type { Outcome, SourceInfo } from "@/lib/types"

type FieldErrors = Partial<Record<keyof ApplyValues, string>>

type Ctx = {
  values: ApplyValues
  set: <K extends keyof ApplyValues>(key: K, v: ApplyValues[K]) => void
  screen: 1 | 2 | "done"
  goTo: (s: 1 | 2) => void
  errors: FieldErrors
  formError: string | null
  pending: "partial" | "submit" | null
  continueToTwo: () => Promise<boolean>
  submit: (honeypot: string) => Promise<void>
  outcome: Outcome | null
  next: string | null
  ready: boolean
}

const EMPTY: ApplyValues = {
  style_pick: "",
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
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
  }, [])

  const continueToTwo = useCallback(async () => {
    const local: FieldErrors = {}
    if (!values.style_pick) local.style_pick = "Pick the look closest to your brand."
    if (!values.store_url.trim()) local.store_url = "Enter your store's web address, like yourstore.com."
    if (Object.keys(local).length) {
      setErrors(local)
      return false
    }
    setPending("partial")
    setFormError(null)
    try {
      const res = await savePartial({ style_pick: values.style_pick, store_url: values.store_url, source: captureSource() })
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {})
        if (!res.fieldErrors) setFormError(res.error)
        return false
      }
      touched.current = true
      setValues((prev) => ({ ...prev, store_url: res.store_url.replace(/^https:\/\//, "") }))
      setScreen(2)
      return true
    } catch {
      setFormError("We couldn't reach the server. Check your connection and try again.")
      return false
    } finally {
      setPending(null)
    }
  }, [values.style_pick, values.store_url])

  const submit = useCallback(
    async (honeypot: string) => {
      setPending("submit")
      setFormError(null)
      try {
        const res = await submitApplication({ ...values, website: honeypot, source: captureSource() })
        if (!res.ok) {
          setErrors(res.fieldErrors ?? {})
          setFormError(res.fieldErrors ? "Check the fields marked in red." : res.error)
          if (res.fieldErrors?.style_pick || res.fieldErrors?.store_url) setScreen(1)
          return
        }
        if (res.events.lead) trackPixel("Lead", res.events.lead)
        if (res.events.qualifiedLead) trackPixel("QualifiedLead", res.events.qualifiedLead)
        safeStorage(() => localStorage.removeItem(DRAFT_KEY))
        setOutcome(res.outcome)
        setNext(res.next)
        setScreen("done")
        router.push(res.next)
      } catch {
        setFormError("We couldn't reach the server. Check your connection and try again.")
      } finally {
        setPending(null)
      }
    },
    [values, router],
  )

  const goTo = useCallback((s: 1 | 2) => {
    setFormError(null)
    setScreen(s)
  }, [])

  const ctx = useMemo<Ctx>(
    () => ({ values, set, screen, goTo, errors, formError, pending, continueToTwo, submit, outcome, next, ready }),
    [values, set, screen, goTo, errors, formError, pending, continueToTwo, submit, outcome, next, ready],
  )

  return <ApplyContext.Provider value={ctx}>{children}</ApplyContext.Provider>
}
