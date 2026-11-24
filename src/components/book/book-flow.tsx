"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { confirmBooking, saveDesign } from "@/app/actions/book"
import { CtaButton } from "@/components/brand/cta"
import { LabelRule, Ornament } from "@/components/brand/marks"
import { FieldShell, FormError, TextField, inputBase } from "@/components/form/fields"
import { LookbookDialog } from "@/components/lookbook/lookbook-dialog"
import { LookPreview } from "@/components/style/look-previews"
import { StylePicker } from "@/components/style/style-picker"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video/video-player"
import type { LookbookEntry } from "@/lib/config/schema"
import { LOOKS, labelOf, type Look } from "@/lib/options"
import { trackPixel } from "@/lib/pixel"
import { normalizeUrl } from "@/lib/url"
import { useFocusFirstError } from "@/lib/use-focus-first-error"
import { cn } from "@/lib/utils"

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
  initial: { reference_stores: string[]; never_want: string; top_products: string[]; saved: boolean }
  /** Booking link with name, email, store URL, phone and the application id already filled in. */
  bookingUrl: string
  confirmVideo: { url: string; captions: string }
  lookbook: LookbookEntry[]
  /** Path prefix for /booked ("" on the main site). */
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

export function BookFlow(props: BookFlowProps) {
  const router = useRouter()
  const basePath = props.basePath ?? ""
  const [stage, setStage] = useState<Stage>(props.initial.saved ? "calendar" : "questions")
  const [look, setLook] = useState<Look | "">(props.stylePick ?? "")
  const [lookOpen, setLookOpen] = useState(false)
  const [lookbookOpen, setLookbookOpen] = useState(false)
  const [refs, setRefs] = useState<string[]>(props.initial.reference_stores)
  const [neverWant, setNeverWant] = useState(props.initial.never_want)
  const [products, setProducts] = useState<string[]>(props.initial.top_products.length ? props.initial.top_products : [""])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const calRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  useFocusFirstError(errors, formRef)

  const nameOf = (url: string) => props.lookbook.find((e) => normalizeUrl(e.url) === url)?.name ?? url.replace(/^https:\/\//, "")

  const submitQuestions = async (e: React.FormEvent) => {
    e.preventDefault()
    setPending(true)
    setFormError(null)
    try {
      const res = await saveDesign({ style_pick: look, reference_stores: refs, never_want: neverWant, top_products: products.filter(Boolean) })
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {})
        setFormError(res.fieldErrors ? "Check the fields marked below." : res.error)
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

  return (
    <div className="mx-auto max-w-3xl">
      <LabelRule right="Step 2 of 2">
        <Ornament /> You qualify
      </LabelRule>
      <h1 className="display mt-6 text-[2.6rem] text-balance text-ink sm:text-[3.6rem]">
        Good news, {props.firstName}. Let’s design your homepage.
      </h1>
      <p className="mt-4 max-w-xl text-[1rem] leading-relaxed text-soft">
        Three quick questions, then pick a time. Kent builds your homepage before the call.
      </p>

      <VideoPlayer
        url={props.confirmVideo.url}
        captions={props.confirmVideo.captions}
        title="What happens next"
        className="mt-8"
      />

      <form ref={formRef} onSubmit={submitQuestions} noValidate className="mt-10">
        <div
          className={cn(
            "flex items-center gap-4 rounded-[18px] border bg-paper/80 p-3 pr-4",
            errors.style_pick ? "border-destructive" : "border-line",
          )}
        >
          <div
            className={cn(
              "@container relative aspect-[3/4] w-[74px] shrink-0 overflow-hidden rounded-[10px]",
              look ? "ring-1 ring-line" : "border-2 border-dashed border-line-strong",
            )}
            aria-hidden="true"
          >
            {look ? <LookPreview look={look} /> : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="micro">Your look</p>
            {look ? (
              <p className="display mt-1 text-[1.5rem] text-ink">{labelOf(LOOKS, look)}</p>
            ) : (
              <>
                <p className="display mt-1 text-[1.5rem] text-ink">Pick the closest look</p>
                {props.styleOther ? (
                  <p className="mt-1 line-clamp-2 text-[0.88rem] text-soft">You told us: &ldquo;{props.styleOther}&rdquo;. We use the look as a starting point.</p>
                ) : null}
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setLookOpen(true)}
            className="min-h-11 text-[0.72rem] font-semibold tracking-[0.16em] text-ink uppercase underline decoration-gold underline-offset-4"
          >
            {look ? "Change" : "Pick a look"}
          </button>
        </div>
        {errors.style_pick ? (
          <p className="mt-2 text-[0.88rem] text-destructive" role="alert">
            Pick the look closest to what you want. It is only a starting point.
          </p>
        ) : null}

        <div className="mt-8 grid gap-8">
          <FieldShell id="refs" label="1. Stores you love" error={errors.reference_stores} hint="Pick up to three from our lookbook, or paste your own.">
            <div className={cn("rounded-xl border bg-paper p-3", errors.reference_stores ? "border-destructive" : "border-line-strong")}>
              {refs.length ? (
                <ul className="mb-3 flex flex-wrap gap-2">
                  {refs.map((u) => (
                    <li key={u} className="flex items-center gap-2 rounded-full border border-gold/60 bg-[#fbf6ea] py-1 pr-1 pl-3 text-[0.82rem] text-ink">
                      {nameOf(u)}
                      <button
                        type="button"
                        onClick={() => setRefs(refs.filter((x) => x !== u))}
                        className="grid size-6 place-items-center rounded-full hover:bg-cream"
                        aria-label={`Remove ${nameOf(u)}`}
                      >
                        <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                          <path d="m4 4 8 8M12 4l-8 8" strokeLinecap="round" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <button
                type="button"
                onClick={() => setLookbookOpen(true)}
                className="flex min-h-11 w-full items-center justify-between rounded-lg bg-cream/70 px-4 text-[0.86rem] font-semibold text-ink hover:bg-cream"
              >
                {refs.length ? "Open the lookbook again" : "Open the lookbook"}
                <span className="text-tan">{refs.length}/3</span>
              </button>
            </div>
          </FieldShell>

          <TextField
            id="never"
            label="2. One thing you would never want on your store"
            placeholder="Pop-ups the second someone lands"
            value={neverWant}
            onChange={(e) => {
              setNeverWant(e.target.value)
              setErrors((x) => ({ ...x, never_want: "" }))
            }}
            maxLength={400}
            error={errors.never_want}
          />

          <FieldShell
            id="products-0"
            label="3. What makes you the most money"
            hint={`Up to three product links from ${props.storeHost}.`}
            error={errors.top_products}
          >
            <div className="grid gap-2.5">
              {products.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    id={`products-${i}`}
                    aria-label={`Product link ${i + 1}`}
                    value={p}
                    onChange={(e) => {
                      const next = [...products]
                      next[i] = e.target.value
                      setProducts(next)
                      setErrors((x) => ({ ...x, top_products: "" }))
                    }}
                    placeholder={`${props.storeHost}/products/...`}
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-invalid={errors.top_products ? true : undefined}
                    className={cn(inputBase, "h-[52px]")}
                  />
                  {products.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setProducts(products.filter((_, j) => j !== i))}
                      className="grid size-[52px] shrink-0 place-items-center rounded-xl border border-line-strong text-soft hover:text-ink"
                      aria-label={`Remove product link ${i + 1}`}
                    >
                      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                        <path d="m4 4 8 8M12 4l-8 8" strokeLinecap="round" />
                      </svg>
                    </button>
                  ) : null}
                </div>
              ))}
              {products.length < 3 ? (
                <button
                  type="button"
                  onClick={() => setProducts([...products, ""])}
                  className="justify-self-start text-[0.74rem] font-semibold tracking-[0.16em] text-ink uppercase underline decoration-gold underline-offset-4"
                >
                  Add another
                </button>
              ) : null}
            </div>
          </FieldShell>
        </div>

        <div className="mt-6">
          <FormError>{stage === "questions" ? formError : null}</FormError>
        </div>
        {stage === "questions" ? (
          <CtaButton type="submit" pending={pending} className="mt-6 w-full sm:w-auto sm:min-w-[240px]">
            Show me times
          </CtaButton>
        ) : (
          <button
            type="submit"
            className="mt-6 text-[0.74rem] font-semibold tracking-[0.16em] text-ink uppercase underline decoration-gold underline-offset-4"
          >
            {pending ? "Saving…" : "Save my changes"}
          </button>
        )}
      </form>

      {stage === "calendar" ? (
        <div ref={calRef} className="mt-14 scroll-mt-6">
          <LabelRule>
            <Ornament /> Pick a time
          </LabelRule>
          <h2 className="display mt-5 text-[2.1rem] text-ink sm:text-[2.6rem]">Book your homepage call.</h2>
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
      ) : null}

      <Dialog open={lookOpen} onOpenChange={setLookOpen}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto bg-page p-5 sm:max-w-[min(1100px,calc(100%-3rem))] sm:p-8">
          <DialogTitle className="display text-[1.9rem] font-normal text-ink">Change your look</DialogTitle>
          <DialogDescription className="text-[0.88rem] text-soft">Pick the look closest to your brand.</DialogDescription>
          <StylePicker
            name="book-style"
            value={look}
            onChange={(next) => {
              setLook(next)
              setErrors((prev) => {
                const rest = { ...prev }
                delete rest.style_pick
                return rest
              })
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
          setErrors((x) => ({ ...x, reference_stores: "" }))
        }}
        firstLook={look}
      />
    </div>
  )
}
