"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { confirmBooking, saveDesign } from "@/app/actions/book"
import { FormError } from "@/components/form/fields"
import { LookbookDialog } from "@/components/lookbook/lookbook-dialog"
import { StylePicker } from "@/components/style/style-picker"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import type { LookbookEntry } from "@/lib/config/schema"
import { FEEL_WORDS, LIKE_TAGS, LOOKS, PREF_BUTTONS, PREF_CORNERS, PREF_THEME, labelOf, type Look } from "@/lib/options"
import { trackPixel } from "@/lib/pixel"
import type { DesignNotes } from "@/lib/types"
import { normalizeUrl } from "@/lib/url"
import "./book-steps.css"

export type BookFlowProps = {
  appId: string
  firstName: string
  name: string
  email: string
  storeHost: string
  /** Null when they chose "None of these feel right" on the apply form. They pick the closest look here. */
  stylePick: Look | null
  /** What they wrote instead of picking a look, if anything. */
  styleOther?: string | null
  initial: { reference_stores: string[]; never_want: string; top_products: string[]; design_notes: DesignNotes | null; saved: boolean }
  /** Booking link with name, email, store URL, phone and the application id already filled in. */
  bookingUrl: string
  confirmVideo: { url: string; captions: string }
  lookbook: LookbookEntry[]
  /** "" on the light blue site, "/demo" on the lime one: where /booked lives. */
  basePath?: string
}

type Stage = "questions" | "calendar"

function BookingEmbed({
  url,
  onBooked,
}: {
  url: string
  onBooked: (p: { provider: "calendly" | "google" | "other"; event_uri?: string; invitee_uri?: string }) => void
}) {
  const isCalendly = /calendly\.com\//i.test(url)
  const [height, setHeight] = useState(isCalendly ? 760 : 820)
  const done = useRef(false)

  useEffect(() => {
    if (!isCalendly) return
    const onMsg = (e: MessageEvent) => {
      if (!/^https:\/\/([\w-]+\.)?calendly\.com$/.test(e.origin)) return
      const data = e.data as { event?: string; payload?: Record<string, unknown> }
      if (data?.event === "calendly.page_height" && data.payload?.height) {
        const h = parseInt(String(data.payload.height), 10)
        if (h > 300) setHeight(h)
      }
      if (data?.event === "calendly.event_scheduled" && !done.current) {
        done.current = true
        const p = data.payload as { event?: { uri?: string }; invitee?: { uri?: string } }
        onBooked({ provider: "calendly", event_uri: p?.event?.uri, invitee_uri: p?.invitee?.uri })
      }
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [isCalendly, onBooked])

  let src = url
  try {
    const u = new URL(url)
    if (isCalendly) {
      u.searchParams.set("embed_domain", window.location.host)
      u.searchParams.set("embed_type", "Inline")
      u.searchParams.set("hide_gdpr_banner", "1")
      u.searchParams.set("background_color", "fffdf7")
      u.searchParams.set("text_color", "2a241c")
      u.searchParams.set("primary_color", "8a6c33")
    }
    src = u.toString()
  } catch {
    /* use as given */
  }

  return (
    <div>
      {/* Google's short links (calendar.app.google) refuse to load in a frame, so they open in a new tab. */}
      {/calendar\.app\.google\//i.test(url) ? (
        <a
          href={url}
          target="_blank"
          rel="noopener"
          className="flex min-h-14 items-center justify-between rounded-[18px] border border-line bg-paper px-5 text-[0.86rem] font-semibold text-ink hover:border-ink/30"
        >
          Open the calendar and pick a time
          <span aria-hidden="true">↗</span>
        </a>
      ) : (
        <div className="overflow-hidden rounded-[18px] border border-line bg-paper">
          <iframe src={src} title="Book your homepage call" className="block w-full" style={{ height }} />
        </div>
      )}
      {!isCalendly && !/calendar\.app\.google\//i.test(url) ? (
        <p className="mt-3 text-[0.8rem] text-soft">
          Calendar not loading?{" "}
          <a href={url} target="_blank" rel="noopener" className="font-semibold text-ink underline decoration-gold underline-offset-4">
            Open it in a new tab
          </a>
          .
        </p>
      ) : null}
      {!isCalendly ? (
        <div className="mt-4 flex flex-col items-start gap-3 rounded-xl border border-line bg-paper/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.88rem] text-soft">Picked a time? Let us know so Kent can start on your homepage.</p>
          <button
            type="button"
            onClick={() => onBooked({ provider: /google\./i.test(url) ? "google" : "other" })}
            className="min-h-11 rounded-full bg-ink px-5 text-[0.72rem] font-semibold tracking-[0.18em] text-page uppercase"
          >
            I booked my call
          </button>
        </div>
      ) : null}
    </div>
  )
}

const STEPS = ["Inspiration", "The feel", "Optional", "Never want", "Best sellers"] as const
const TOTAL = STEPS.length
/** Which step holds each field the server can reject. */
const STEP_OF: Record<string, number> = { style_pick: 1, reference_stores: 1, never_want: 4, top_products: 5 }
const REFS_MAX = 12
const FEEL_MAX = 3

function X() {
  return (
    <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="m4 4 8 8M12 4l-8 8" strokeLinecap="round" />
    </svg>
  )
}

/** One row of single-choice chips where "No preference" is a real answer. */
function PrefRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly { key: string; label: string }[]
  value: string | undefined
  onChange: (v: string | undefined) => void
}) {
  return (
    <div className="bk-pref">
      <span id={`bk-pref-${label}`}>{label}</span>
      <div className="bk-chips" role="radiogroup" aria-labelledby={`bk-pref-${label}`}>
        <button type="button" role="radio" aria-checked={!value} className="bk-chip" onClick={() => onChange(undefined)}>
          No preference
        </button>
        {options.map((o) => (
          <button key={o.key} type="button" role="radio" aria-checked={value === o.key} className="bk-chip" onClick={() => onChange(o.key)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function BookFlow(props: BookFlowProps) {
  const router = useRouter()
  const basePath = props.basePath ?? ""
  const notes = props.initial.design_notes
  const [stage, setStage] = useState<Stage>(props.initial.saved ? "calendar" : "questions")
  const [step, setStep] = useState(1)
  const [look, setLook] = useState<Look | "">(props.stylePick ?? "")
  const [lookOpen, setLookOpen] = useState(false)
  const [lookbookOpen, setLookbookOpen] = useState(false)
  const [refs, setRefs] = useState<string[]>(props.initial.reference_stores)
  const [likes, setLikes] = useState<Record<string, string[]>>(notes?.reference_likes ?? {})
  const [feel, setFeel] = useState<string[]>(notes?.feel ?? [])
  const [prefs, setPrefs] = useState<NonNullable<DesignNotes["prefs"]>>(notes?.prefs ?? {})
  const [paste, setPaste] = useState("")
  const [neverWant, setNeverWant] = useState(props.initial.never_want)
  const [products, setProducts] = useState<string[]>(props.initial.top_products.length ? props.initial.top_products : [""])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const calRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const lookbookUrls = new Set(props.lookbook.map((e) => normalizeUrl(e.url)))
  const nameOf = (url: string) => props.lookbook.find((e) => normalizeUrl(e.url) === url)?.name ?? url.replace(/^https:\/\//, "")
  const clear = (key: string) => setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev))

  const go = (n: number) => {
    setStep(n)
    requestAnimationFrame(() => {
      const card = cardRef.current
      if (!card) return
      const r = card.getBoundingClientRect()
      if (r.top < 0 || r.bottom > window.innerHeight) card.scrollIntoView({ block: "start", behavior: "smooth" })
      card.querySelector<HTMLElement>('[aria-invalid="true"], input[data-first]')?.focus({ preventScroll: true })
    })
  }

  const addPasted = () => {
    const n = normalizeUrl(paste)
    if (!n) return setErrors((prev) => ({ ...prev, paste: "That doesn't look like a web address. Try something like graza.co." }))
    if (!refs.includes(n)) {
      if (refs.length >= REFS_MAX) return setErrors((prev) => ({ ...prev, paste: `That's the most we can take (${REFS_MAX}). Remove one first.` }))
      setRefs([...refs, n])
    }
    setPaste("")
    setErrors((prev) => ({ ...prev, paste: "", reference_stores: "" }))
  }
  const toggleLike = (url: string, tag: string) =>
    setLikes((prev) => {
      const cur = prev[url] ?? []
      return { ...prev, [url]: cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag] }
    })

  /** What each step needs before moving on. The server checks everything again on save. */
  const check = (n: number): Record<string, string> => {
    const e: Record<string, string> = {}
    if (n === 1) {
      if (!look) e.style_pick = "Pick the look closest to what you want. It is only a starting point."
      if (!refs.length) e.reference_stores = "Add at least one site you love, from the lookbook or your own."
    }
    if (n === 4 && neverWant.trim().length < 2) e.never_want = "Tell us one thing you'd never want on your store."
    if (n === 5 && !products.some((p) => p.trim())) e.top_products = "Add at least one product link from your store."
    return e
  }

  const save = async () => {
    setPending(true)
    setFormError(null)
    try {
      const res = await saveDesign({
        style_pick: look,
        reference_stores: refs,
        never_want: neverWant,
        top_products: products.filter(Boolean),
        design_notes: { reference_likes: likes, feel, prefs },
      })
      if (!res.ok) {
        const fe = res.fieldErrors ?? {}
        setErrors(fe)
        const steps = Object.keys(fe).map((k) => STEP_OF[k]).filter(Boolean)
        if (steps.length) go(Math.min(...steps))
        else setFormError(res.error)
        return
      }
      setErrors({})
      setStage("calendar")
      requestAnimationFrame(() => calRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }))
    } catch {
      setFormError("We couldn't reach the server. Check your connection and try again.")
    } finally {
      setPending(false)
    }
  }

  const next = (e?: React.FormEvent) => {
    e?.preventDefault()
    const found = check(step)
    if (Object.keys(found).length) return setErrors((prev) => ({ ...prev, ...found }))
    if (step === TOTAL) void save()
    else go(step + 1)
  }

  const onBooked = useCallback(async (p: { provider: "calendly" | "google" | "other"; event_uri?: string; invitee_uri?: string }) => {
    setFormError(null)
    try {
      const res = await confirmBooking(p)
      if (!res.ok) {
        setFormError(res.error)
        return
      }
      trackPixel("Schedule", res.eventId)
      router.push(`${basePath}/booked`)
    } catch {
      setFormError("Your time is booked, but we couldn't confirm it here. Kent will text you to confirm.")
    }
  }, [router, basePath])

  const back = (
    <button type="button" className="bk-back" onClick={() => go(step - 1)}>
      ← Back
    </button>
  )
  const forward = (label = "Continue") => (
    <button type="submit" className="bk-btn" disabled={pending} aria-busy={pending || undefined}>
      {label}
      {pending ? <span className="size-4 animate-spin rounded-full border-[2.5px] border-current border-t-transparent" aria-hidden="true" /> : null}
    </button>
  )

  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="micro">You qualify</p>
      <h1 className="display mt-2 text-[2.1rem] text-balance text-ink sm:text-[2.5rem]">Good news, {props.firstName}. Show us what you love.</h1>
      <p className="mx-auto mt-2 max-w-2xl text-[1rem] leading-relaxed text-soft">
        This is the part that shapes your homepage. A few quick taps, then pick a time. Kent builds it before the call.
      </p>

      {stage === "questions" ? (
        <div ref={cardRef} className="bk-card">
          <div className="bk-prog">
            <ol aria-hidden="true">
              {STEPS.map((s, i) => (
                <li key={s} data-on={i < step ? "" : undefined} />
              ))}
            </ol>
            <span>
              <span className="sr-only">Step </span>
              {step} of {TOTAL} · {STEPS[step - 1]}
            </span>
          </div>

          <form noValidate onSubmit={next}>
            {step === 1 ? (
              <>
                <h2 className="bk-q">Sites you love, and what you love about them.</h2>
                <p className="bk-look">
                  {look ? (
                    <>
                      Your direction: <b>{labelOf(LOOKS, look)}</b>
                    </>
                  ) : (
                    <span>{props.styleOther ? "None of our looks fit, so pick the closest one as a starting point." : "Pick the closest look as a starting point."}</span>
                  )}
                  <button type="button" className="bk-link" onClick={() => setLookOpen(true)}>
                    {look ? "change" : "Pick a look"}
                  </button>
                </p>
                {errors.style_pick ? (
                  <p role="alert" className="bk-err text-center">
                    {errors.style_pick}
                  </p>
                ) : null}
                <div className="bk-body">
                  {refs.length ? (
                    <div className="bk-refs">
                      {refs.map((u) => (
                        <div key={u} className="bk-ref">
                          <header>
                            {nameOf(u)}
                            <small>{lookbookUrls.has(u) ? "from the lookbook" : "added by you"}</small>
                            <button
                              type="button"
                              aria-label={`Remove ${nameOf(u)}`}
                              onClick={() => {
                                setRefs(refs.filter((x) => x !== u))
                                setLikes((prev) => {
                                  const rest = { ...prev }
                                  delete rest[u]
                                  return rest
                                })
                              }}
                            >
                              <X />
                            </button>
                          </header>
                          <div className="bk-chips" role="group" aria-label={`What you like about ${nameOf(u)}`}>
                            {LIKE_TAGS.map((t) => (
                              <button
                                key={t.key}
                                type="button"
                                data-sm=""
                                className="bk-chip"
                                aria-pressed={(likes[u] ?? []).includes(t.key)}
                                onClick={() => toggleLike(u, t.key)}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="bk-row">
                    <input
                      className="bk-in"
                      aria-label="A site you love"
                      placeholder="Paste a site you love, any brand"
                      inputMode="url"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      value={paste}
                      onChange={(e) => {
                        setPaste(e.target.value)
                        clear("paste")
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && paste.trim()) {
                          e.preventDefault()
                          addPasted()
                        }
                      }}
                      aria-invalid={errors.paste || errors.reference_stores ? true : undefined}
                    />
                    <button type="button" className="bk-btn" data-ghost="" onClick={addPasted}>
                      Add
                    </button>
                    <button type="button" className="bk-btn" data-ghost="" onClick={() => setLookbookOpen(true)}>
                      Browse the lookbook
                    </button>
                  </div>
                  {errors.paste || errors.reference_stores ? (
                    <p role="alert" className="bk-err">
                      {errors.paste || errors.reference_stores}
                    </p>
                  ) : null}
                  <div className="bk-foot">
                    <span>Tap what you like about each one. Skip any you&apos;re not sure about.</span>
                    {forward()}
                  </div>
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <h2 className="bk-q" id="bk-feel">
                  How should your store feel?
                </h2>
                <p className="bk-qsub">Pick up to three words. Go with your gut.</p>
                <div className="bk-body">
                  <div className="bk-chips justify-center" role="group" aria-labelledby="bk-feel">
                    {FEEL_WORDS.map((w) => {
                      const on = feel.includes(w.key)
                      return (
                        <button
                          key={w.key}
                          type="button"
                          data-lg=""
                          className="bk-chip"
                          aria-pressed={on}
                          disabled={!on && feel.length >= FEEL_MAX}
                          onClick={() => setFeel((prev) => (prev.includes(w.key) ? prev.filter((k) => k !== w.key) : prev.length >= FEEL_MAX ? prev : [...prev, w.key]))}
                        >
                          {w.label}
                        </button>
                      )
                    })}
                  </div>
                  <div className="bk-foot">
                    {back}
                    <div>
                      <span>{feel.length} of 3 picked</span>
                      {forward(feel.length ? "Continue" : "Skip")}
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <h2 className="bk-q">Any strong preferences?</h2>
                <p className="bk-qsub">Not needed. Kent designs what he thinks is best for your brand. Only answer one if you feel strongly.</p>
                <div className="bk-body">
                  <PrefRow label="Corners" options={PREF_CORNERS} value={prefs.corners} onChange={(v) => setPrefs({ ...prefs, corners: v })} />
                  <PrefRow label="Buttons" options={PREF_BUTTONS} value={prefs.buttons} onChange={(v) => setPrefs({ ...prefs, buttons: v })} />
                  <PrefRow label="Theme" options={PREF_THEME} value={prefs.theme} onChange={(v) => setPrefs({ ...prefs, theme: v })} />
                  <div className="bk-foot">
                    {back}
                    {forward(prefs.corners || prefs.buttons || prefs.theme ? "Continue" : "Skip")}
                  </div>
                </div>
              </>
            ) : null}

            {step === 4 ? (
              <>
                <h2 className="bk-q">
                  <label htmlFor="bk-never">One thing you would never want on your store?</label>
                </h2>
                <div className="bk-body">
                  <input
                    id="bk-never"
                    data-first=""
                    className="bk-in"
                    placeholder="Pop-ups the second someone lands"
                    maxLength={400}
                    value={neverWant}
                    onChange={(e) => {
                      setNeverWant(e.target.value)
                      clear("never_want")
                    }}
                    aria-invalid={errors.never_want ? true : undefined}
                  />
                  {errors.never_want ? (
                    <p role="alert" className="bk-err">
                      {errors.never_want}
                    </p>
                  ) : null}
                  <div className="bk-foot">
                    {back}
                    {forward()}
                  </div>
                </div>
              </>
            ) : null}

            {step === 5 ? (
              <>
                <h2 className="bk-q">What makes you the most money?</h2>
                <p className="bk-qsub">Up to three product links from {props.storeHost}.</p>
                <div className="bk-body">
                  <div className="grid gap-2">
                    {products.map((p, i) => (
                      <div key={i} className="bk-row">
                        <input
                          className="bk-in"
                          data-first={i === 0 ? "" : undefined}
                          aria-label={`Product link ${i + 1}`}
                          value={p}
                          onChange={(e) => {
                            const nextList = [...products]
                            nextList[i] = e.target.value
                            setProducts(nextList)
                            clear("top_products")
                          }}
                          placeholder={`${props.storeHost}/products/...`}
                          inputMode="url"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          aria-invalid={errors.top_products ? true : undefined}
                        />
                        {products.length > 1 ? (
                          <button
                            type="button"
                            className="bk-btn"
                            data-ghost=""
                            onClick={() => setProducts(products.filter((_, j) => j !== i))}
                            aria-label={`Remove product link ${i + 1}`}
                          >
                            <X />
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  {products.length < 3 ? (
                    <button type="button" className="bk-link mt-1" onClick={() => setProducts([...products, ""])}>
                      Add another
                    </button>
                  ) : null}
                  {errors.top_products ? (
                    <p role="alert" className="bk-err">
                      {errors.top_products}
                    </p>
                  ) : null}
                  {formError ? (
                    <div className="mt-3">
                      <FormError>{formError}</FormError>
                    </div>
                  ) : null}
                  <div className="bk-foot">
                    {back}
                    {forward("Show me times")}
                  </div>
                </div>
              </>
            ) : null}
          </form>
        </div>
      ) : (
        <div ref={calRef} className="mt-10 scroll-mt-6 text-left">
          <p className="text-center text-[0.95rem] text-soft">
            Your answers are saved.{" "}
            <button
              type="button"
              className="bk-link"
              onClick={() => {
                setStage("questions")
                setStep(1)
              }}
            >
              Edit my answers
            </button>
          </p>
          <h2 className="display mt-6 text-center text-[1.9rem] text-ink sm:text-[2.3rem]">Book your homepage call.</h2>
          <div className="mt-6">
            {props.bookingUrl ? (
              <BookingEmbed url={props.bookingUrl} onBooked={onBooked} />
            ) : (
              <div className="rounded-[18px] border border-dashed border-line-strong p-8 text-center">
                <p className="micro">Kent will text you to set a time.</p>
              </div>
            )}
          </div>
          <div className="mt-4">
            <FormError>{formError}</FormError>
          </div>
        </div>
      )}

      <Dialog open={lookOpen} onOpenChange={setLookOpen}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto bg-page p-5 text-left sm:max-w-[min(1100px,calc(100%-3rem))] sm:p-8">
          <DialogTitle className="display text-[1.9rem] font-normal text-ink">Change your look</DialogTitle>
          <DialogDescription className="text-[0.88rem] text-soft">Pick the look closest to your brand.</DialogDescription>
          <StylePicker
            name="book-style"
            value={look}
            onChange={(picked) => {
              setLook(picked)
              clear("style_pick")
            }}
            showNote={false}
            className="mt-2"
          />
          <button
            type="button"
            onClick={() => setLookOpen(false)}
            className="mt-2 min-h-11 justify-self-start rounded-full bg-ink px-6 text-[0.72rem] font-semibold tracking-[0.2em] text-page uppercase"
          >
            Done
          </button>
        </DialogContent>
      </Dialog>

      <LookbookDialog
        open={lookbookOpen}
        onOpenChange={setLookbookOpen}
        entries={props.lookbook}
        selected={refs}
        onChange={(urls) => {
          setRefs(urls)
          clear("reference_stores")
        }}
        firstLook={look}
        max={REFS_MAX}
      />
    </div>
  )
}
