"use client"

/* eslint-disable @next/next/no-img-element */
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import type { ApplyValues } from "@/app/actions/apply"
import { useApply } from "@/components/apply/apply-provider"
import { lookEvents } from "@/components/looks/look-events"
import { LOOKBOOK, lookById } from "@/lib/lookbook"
import { LOOKS, NICHES, PHONE_CHANNELS_OFFERED, REVENUE_BANDS, isKey, type Look } from "@/lib/options"
import { isEmail } from "@/lib/url"
import { DirectionExplorer } from "./direction-explorer"

const TOTAL = 6
type Field = keyof ApplyValues
type Errors = Partial<Record<Field, string>>

/** Which step holds each field, so a server error sends them to the right one. */
const STEP_OF: Record<Field, number> = {
  store_url: 1,
  revenue_band: 2,
  name: 3,
  email: 3,
  phone: 4,
  phone_channel: 4,
  style_pick: 5,
  style_other: 5,
  niche: 6,
  main_problem: 6,
}
const HINT: Record<string, string> = Object.fromEntries(LOOKS.map((l) => [l.key, l.hint ?? ""]))

function Spinner() {
  return <span className="hx-spin" aria-hidden="true" />
}

function FieldError({ id, children }: { id: string; children?: string }) {
  return children ? (
    <p id={id} role="alert" className="hx-err">
      {children}
    </p>
  ) : null
}

/**
 * The top of the landing page: headline, the video, and the apply form as six short steps.
 * Past step one the video steps aside, so each step fits one laptop screen without scrolling.
 * Step four saves the lead (and rules out clear no's), step six sends the application.
 */
export function HomeHero({ nicheLabel, video }: { nicheLabel: string; video: React.ReactNode }) {
  const a = useApply()
  const [step, setStep] = useState(1)
  const [local, setLocal] = useState<Errors>({})
  const [honeypot, setHoneypot] = useState("")
  const [explorer, setExplorer] = useState<Look | null>(null)
  const [otherOpen, setOtherOpen] = useState(false)
  const heroRef = useRef<HTMLElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const mounted = useRef(false)
  // True while a save is in flight: if the server marks fields, go to the first step that has one.
  const [awaiting, setAwaiting] = useState(false)
  const [seenErrors, setSeenErrors] = useState(a.errors)
  if (a.errors !== seenErrors) {
    setSeenErrors(a.errors)
    const steps = (Object.keys(a.errors) as Field[]).filter((k) => a.errors[k]).map((k) => STEP_OF[k])
    if (awaiting && steps.length) {
      setAwaiting(false)
      setStep(Math.min(...steps))
    }
  }

  const v = a.values
  const err = (k: Field) => local[k] ?? a.errors[k]
  const set = <K extends Field>(k: K, value: ApplyValues[K]) => {
    a.set(k, value)
    setLocal((prev) => (prev[k] ? { ...prev, [k]: undefined } : prev))
  }
  const channel = isKey(PHONE_CHANNELS_OFFERED, v.phone_channel) ? v.phone_channel : ""

  // On each new step: keep the form on screen and put the cursor in its first field.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    const card = cardRef.current
    if (!card) return
    const frame = requestAnimationFrame(() => {
      const r = card.getBoundingClientRect()
      if (r.top < 0 || r.bottom > window.innerHeight) {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        heroRef.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" })
      }
      const target =
        card.querySelector<HTMLElement>('[aria-invalid="true"]') ??
        card.querySelector<HTMLElement>("input:not([tabindex='-1']), select")
      target?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [step])

  const check = (n: number): Errors => {
    const e: Errors = {}
    if (n === 1 && !/[^\s.]\.[^\s.]/.test(v.store_url.trim())) e.store_url = "Enter your store's web address, like yourstore.com."
    if (n === 2 && !v.revenue_band) e.revenue_band = "Pick your monthly revenue."
    if (n === 3) {
      if (!v.name.trim()) e.name = "Add your name."
      if (!isEmail(v.email)) e.email = "Enter a valid email."
    }
    if (n === 4) {
      if (v.phone.replace(/\D/g, "").length < 7) e.phone = "Enter a phone number we can text."
      if (!channel) e.phone_channel = "Pick how you'd like us to text you."
    }
    if (n === 5 && !v.style_pick && v.style_other.trim().length < 2) {
      e.style_pick = "Pick the direction closest to what you want, or tell us about a store you love."
    }
    if (n === 6) {
      if (!v.niche) e.niche = "Pick what you sell."
      if (v.main_problem.trim().length < 3) e.main_problem = "Tell us in a few words what isn't working."
    }
    return e
  }

  const next = async () => {
    const e = check(step)
    setLocal(e)
    if (Object.keys(e).length) return
    if (step === 4) {
      setAwaiting(true)
      if (await a.continueToTwo(honeypot)) {
        setAwaiting(false)
        setStep(5)
      }
      return
    }
    if (step === 6) {
      setAwaiting(true)
      await a.submit(honeypot)
      return
    }
    setStep(step + 1)
  }
  const back = () => {
    setLocal({})
    setStep(Math.max(1, step - 1))
  }
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void next()
  }

  const done = a.screen === "done"
  // Someone who already qualified and comes back goes straight to where they left off
  // (the design questions, the open calendar, or their booked page). No button to press.
  // Add ?preview to the address to stay on this page, for looking at it after a test run.
  const router = useRouter()
  const jumpTo = done && a.outcome === "qualified" ? a.next : null
  useEffect(() => {
    if (!jumpTo || new URLSearchParams(window.location.search).has("preview")) return
    router.replace(jumpTo)
  }, [jumpTo, router])
  const going = step > 1 && !done
  // The video hides once the form is under way, so stop it or the sound plays on unseen.
  useEffect(() => {
    if (going) heroRef.current?.querySelectorAll("video").forEach((v) => v.pause())
  }, [going])
  const picked = lookById(v.style_pick)
  const busy = a.pending !== null

  const backButton = (
    <button type="button" className="hx-back" onClick={back}>
      ← Back
    </button>
  )

  return (
    <section ref={heroRef} className="hx-hero" data-going={going ? "" : undefined} aria-label="Apply">
      <div className="hx-wrap">
        <p className="hx-pill">
          <i aria-hidden="true" />
          For {nicheLabel} on Shopify
        </p>
        <h1>
          Your Shopify store,
          <br />
          rebuilt in <em>48 hours.</em>
        </h1>
        <p className="hx-sub">We rebuild your homepage free before we talk. See if your store qualifies.</p>
        {video}

        {done ? (
          <div ref={cardRef} id="apply-top" className="hx-card" data-boxed="">
            <h2 className="hx-q">Your application is in.</h2>
            <p className="hx-qsub">
              {a.outcome === "qualified" ? "You're in. Taking you to your homepage call." : "Thanks. We'll be in touch by text."}
            </p>
            <p className="mt-4 text-center">
              <Link href={a.next ?? "/thanks"} className="hx-btn">
                {a.outcome === "qualified" ? "Book my call" : "See what's next"}
              </Link>
            </p>
          </div>
        ) : (
          <div ref={cardRef} id="apply-top" className="hx-card" data-grow={step === 5 ? "" : undefined}>
            <div className="hx-prog">
              <ol aria-hidden="true">
                {Array.from({ length: TOTAL }, (_, i) => (
                  <li key={i} data-on={i < step ? "" : undefined} />
                ))}
              </ol>
              <span>
                <span className="sr-only">Step </span>
                {step} of {TOTAL}
              </span>
            </div>

            <form noValidate onSubmit={onSubmit}>
              {/* Honeypot for bots. Hidden from people and screen readers. */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="hx-website">Website</label>
                <input id="hx-website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              </div>

              {step === 1 ? (
                <>
                  <h2 className="hx-q">
                    <label htmlFor="hx-store">What&apos;s your store&apos;s address?</label>
                  </h2>
                  <div className="hx-body">
                    <div className="hx-row">
                      <input
                        id="hx-store"
                        className="hx-in"
                        style={{ flex: 1.6 }}
                        name="url"
                        placeholder="yourstore.com"
                        inputMode="url"
                        autoComplete="url"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        value={v.store_url.replace(/^https?:\/\//, "")}
                        onChange={(e) => set("store_url", e.target.value)}
                        aria-invalid={err("store_url") ? true : undefined}
                        aria-describedby={err("store_url") ? "hx-store-err" : undefined}
                      />
                      <button type="submit" className="hx-btn" style={{ flex: "none" }}>
                        See if I qualify
                      </button>
                    </div>
                    <FieldError id="hx-store-err">{err("store_url")}</FieldError>
                    <p className="hx-fine">Takes two minutes. Kent looks at every store himself.</p>
                  </div>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <h2 className="hx-q" id="hx-rev-label">
                    What does the store make a month?
                  </h2>
                  <div className="hx-body">
                    <div className="hx-chips" data-stack="" role="radiogroup" aria-labelledby="hx-rev-label">
                      {REVENUE_BANDS.map((b) => (
                        <button
                          key={b.key}
                          type="button"
                          role="radio"
                          aria-checked={v.revenue_band === b.key}
                          className="hx-chip"
                          onClick={() => {
                            set("revenue_band", b.key)
                            setStep(3)
                          }}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                    <FieldError id="hx-rev-err">{err("revenue_band")}</FieldError>
                    <div className="hx-foot">
                      {backButton}
                      {v.revenue_band ? (
                        <button type="submit" className="hx-btn" data-sm="">
                          Continue
                        </button>
                      ) : (
                        <span>A rough number is fine.</span>
                      )}
                    </div>
                  </div>
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <h2 className="hx-q">Who are we building this for?</h2>
                  <div className="hx-body">
                    <div className="hx-row">
                      <div>
                        <input
                          className="hx-in"
                          name="name"
                          aria-label="Your name"
                          placeholder="Your name"
                          autoComplete="name"
                          value={v.name}
                          onChange={(e) => set("name", e.target.value)}
                          aria-invalid={err("name") ? true : undefined}
                          aria-describedby={err("name") ? "hx-name-err" : undefined}
                        />
                        <FieldError id="hx-name-err">{err("name")}</FieldError>
                      </div>
                      <div>
                        <input
                          className="hx-in"
                          name="email"
                          type="email"
                          aria-label="Email"
                          placeholder="Email"
                          inputMode="email"
                          autoComplete="email"
                          autoCapitalize="none"
                          spellCheck={false}
                          value={v.email}
                          onChange={(e) => set("email", e.target.value)}
                          aria-invalid={err("email") ? true : undefined}
                          aria-describedby={err("email") ? "hx-email-err" : undefined}
                        />
                        <FieldError id="hx-email-err">{err("email")}</FieldError>
                      </div>
                    </div>
                    <div className="hx-foot">
                      {backButton}
                      <button type="submit" className="hx-btn" data-sm="">
                        Continue
                      </button>
                    </div>
                  </div>
                </>
              ) : null}

              {step === 4 ? (
                <>
                  <h2 className="hx-q">Where can Kent text you?</h2>
                  <div className="hx-body">
                    <div className="hx-row">
                      <div>
                        <input
                          className="hx-in"
                          name="tel"
                          type="tel"
                          aria-label="Phone for texts"
                          placeholder="(555) 123-4567"
                          inputMode="tel"
                          autoComplete="tel"
                          value={v.phone}
                          onChange={(e) => set("phone", e.target.value)}
                          aria-invalid={err("phone") ? true : undefined}
                          aria-describedby={err("phone") ? "hx-phone-err" : undefined}
                        />
                        <FieldError id="hx-phone-err">{err("phone")}</FieldError>
                      </div>
                      <div>
                        <div className="hx-chips" role="radiogroup" aria-label="Text me on">
                          {PHONE_CHANNELS_OFFERED.map((c) => (
                            <button
                              key={c.key}
                              type="button"
                              role="radio"
                              aria-checked={channel === c.key}
                              className="hx-chip"
                              onClick={() => set("phone_channel", c.key)}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                        <FieldError id="hx-channel-err">{err("phone_channel")}</FieldError>
                      </div>
                    </div>
                    {a.formError ? (
                      <p role="alert" className="hx-alert">
                        {a.formError}
                      </p>
                    ) : null}
                    <div className="hx-foot">
                      {backButton}
                      <button type="submit" className="hx-btn" data-sm="" disabled={busy} aria-busy={busy || undefined}>
                        {a.pending === "partial" ? "Checking your store" : "Continue"}
                        {a.pending === "partial" ? <Spinner /> : null}
                      </button>
                    </div>
                    <p className="hx-fine">
                      By continuing you agree that LocalEyes may text, call or email you about your application at the details above. Message
                      and data rates may apply. Reply STOP to opt out. See our <Link href="/privacy">privacy policy</Link>.
                    </p>
                  </div>
                </>
              ) : null}

              {step === 5 ? (
                <>
                  <h2 className="hx-q">Pick the direction closest to what you want.</h2>
                  <p className="hx-qsub">Tap one to see real stores in that style. We make it yours.</p>
                  <div className="hx-body">
                    <div className="hx-tiles">
                      {LOOKBOOK.map((l) => {
                        const shot = l.stores[0]?.desktop.home
                        return (
                          <button
                            key={l.id}
                            type="button"
                            className="hx-tile"
                            aria-pressed={v.style_pick === l.id}
                            onClick={() => {
                              setExplorer(l.id)
                              a.lookOpened(l.id)
                              lookEvents.opened(l.id, "pick")
                            }}
                          >
                            {shot ? <img src={shot.src} srcSet={shot.srcSet} sizes="(min-width: 761px) 180px, 46vw" alt="" /> : null}
                            <b>{l.label}</b>
                            <small>{HINT[l.id]}</small>
                            <span className="hx-tick" aria-hidden="true">
                              <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4">
                                <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                            <span className="sr-only">{v.style_pick === l.id ? " (your pick)" : " (see stores in this style)"}</span>
                          </button>
                        )
                      })}
                    </div>
                    {otherOpen && !picked ? (
                      <div className="mt-3">
                        <input
                          className="hx-in"
                          data-sm=""
                          aria-label="What you want instead"
                          placeholder="Tell us what you want instead, or name a store you love"
                          maxLength={300}
                          value={v.style_other}
                          onChange={(e) => set("style_other", e.target.value)}
                          aria-invalid={err("style_pick") ? true : undefined}
                        />
                      </div>
                    ) : (
                      <p className="hx-picked" aria-live="polite">
                        {picked ? (
                          <>
                            Picked <b>{picked.label}</b>
                            {a.liked.length ? (
                              <>
                                {" "}
                                · <b>{a.liked.length}</b> {a.liked.length === 1 ? "store" : "stores"} liked
                              </>
                            ) : null}{" "}
                            ·{" "}
                            <button type="button" className="hx-linkish" onClick={() => setExplorer(picked.id)}>
                              change
                            </button>
                          </>
                        ) : (
                          <button type="button" className="hx-linkish" onClick={() => setOtherOpen(true)}>
                            None of these feel right
                          </button>
                        )}
                      </p>
                    )}
                    <FieldError id="hx-look-err">{err("style_pick")}</FieldError>
                    <div className="hx-foot">
                      {backButton}
                      <button type="submit" className="hx-btn" data-sm="">
                        Continue
                      </button>
                    </div>
                  </div>
                </>
              ) : null}

              {step === 6 ? (
                <>
                  <h2 className="hx-q">Last one. What do you sell?</h2>
                  <div className="hx-body">
                    <div className="hx-row">
                      <div style={{ flex: 0.8 }}>
                        <select
                          className="hx-in"
                          aria-label="What you sell"
                          value={v.niche}
                          onChange={(e) => set("niche", e.target.value as ApplyValues["niche"])}
                          aria-invalid={err("niche") ? true : undefined}
                          aria-describedby={err("niche") ? "hx-niche-err" : undefined}
                        >
                          <option value="" disabled>
                            Choose one
                          </option>
                          {NICHES.map((n) => (
                            <option key={n.key} value={n.key}>
                              {n.label}
                            </option>
                          ))}
                        </select>
                        <FieldError id="hx-niche-err">{err("niche")}</FieldError>
                      </div>
                      <div style={{ flex: 1.4 }}>
                        <input
                          className="hx-in"
                          aria-label="What's not working on the store?"
                          placeholder="What's not working on the store?"
                          maxLength={500}
                          value={v.main_problem}
                          onChange={(e) => set("main_problem", e.target.value)}
                          aria-invalid={err("main_problem") ? true : undefined}
                          aria-describedby={err("main_problem") ? "hx-problem-err" : undefined}
                        />
                        <FieldError id="hx-problem-err">{err("main_problem")}</FieldError>
                      </div>
                    </div>
                    {a.formError ? (
                      <p role="alert" className="hx-alert">
                        {a.formError}
                      </p>
                    ) : null}
                    <div className="hx-foot">
                      {backButton}
                      <button type="submit" className="hx-btn" data-sm="" disabled={busy} aria-busy={busy || undefined}>
                        Send my application
                        {a.pending === "submit" ? <Spinner /> : null}
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </form>
          </div>
        )}
      </div>

      <DirectionExplorer
        open={explorer}
        onOpen={(look) => {
          setExplorer(look)
          a.lookOpened(look)
        }}
        onClose={() => setExplorer(null)}
        value={v.style_pick}
        onPick={(look) => {
          set("style_pick", look)
          setLocal((prev) => ({ ...prev, style_pick: undefined }))
        }}
        liked={a.liked}
        onToggleLike={a.toggleLiked}
        onStoreVisit={a.storeVisited}
      />
    </section>
  )
}
