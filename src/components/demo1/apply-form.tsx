"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import { useApply } from "@/components/apply/apply-provider"
import { LookLivePreview } from "@/components/demo/look-live-preview"
import { ChoiceGroup, FormError, SelectField, TextArea, TextField } from "@/components/form/fields"
import { LookPicker } from "@/components/looks/look-picker"
import { NICHES, PHONE_CHANNELS_OFFERED, REVENUE_BANDS } from "@/lib/options"
import { useFocusFirstError } from "@/lib/use-focus-first-error"
import { cn } from "@/lib/utils"
import { D1Button } from "./ui"

/**
 * Contact first, then the look (one shared state with the main page, same server actions),
 * set in the /demo style.
 */
export function D1ApplyForm({ instance = "top", className }: { instance?: "top" | "bottom"; className?: string }) {
  const a = useApply()
  const rootRef = useRef<HTMLDivElement>(null)
  const [honeypot, setHoneypot] = useState("")
  const [submittedHere, setSubmittedHere] = useState(false)
  useFocusFirstError(submittedHere ? a.errors : null, rootRef)
  const id = (k: string) => `d1-${instance}-${k}`
  const scrollToTop = () => requestAnimationFrame(() => rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }))

  const honeypotField = (
    // Honeypot for bots. Hidden from people and screen readers.
    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label htmlFor={id("website")}>Website</label>
      <input id={id("website")} tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
    </div>
  )

  if (a.screen === "done") {
    const where =
      a.outcome === "qualified"
        ? { text: "You're in. Pick a time for your homepage call.", cta: "Book my call", href: a.next ?? "/demo/book" }
        : { text: "Thanks, your application is in. We'll be in touch by text.", cta: "See what's next", href: a.next ?? "/demo/thanks" }
    return (
      <div ref={rootRef} id={`apply-${instance}`} className={cn("scroll-mt-24", className)}>
        <p className="d1-mono text-tan">Application sent</p>
        <p className="d1-h2 mt-4 text-[2.4rem] text-ink sm:text-[3.2rem]">Your application is in.</p>
        <p className="mt-3 max-w-md text-[1.04rem] leading-relaxed text-soft">{where.text}</p>
        <Link href={where.href} className="d1-btn mt-8">
          {where.cta}
        </Link>
      </div>
    )
  }

  return (
    <div ref={rootRef} id={`apply-${instance}`} className={cn("d1-form scroll-mt-24", className)}>
      {a.screen === 1 ? (
        <form
          noValidate
          onSubmit={async (e) => {
            e.preventDefault()
            setSubmittedHere(true)
            if (await a.continueToTwo(honeypot)) scrollToTop()
          }}
        >
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
            <div>
              <p className="d1-mono text-tan">
                <span className="text-ink">Step 1 of 2</span>&nbsp;&nbsp;Two minutes
              </p>
              <h2 className="d1-h2 mt-4 max-w-[16ch] text-[2.4rem] text-ink sm:text-[3.4rem]">See if your store qualifies.</h2>
            </div>
            <p className="max-w-xs text-[1rem] leading-relaxed text-soft">If it fits, we rebuild your homepage free before we talk. Next you pick the look.</p>
          </div>

          <div className="mt-10 grid gap-10 border-t border-line pt-10 sm:mt-12 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-16">
            <div className="grid max-w-4xl gap-6">
              <TextField
                id={id("store_url")}
                label={<span className="block pb-1 text-[1.35rem] font-bold tracking-[-0.03em] text-ink sm:text-[1.6rem]">What&apos;s your store&apos;s address?</span>}
                inputClassName="h-[3.5rem] text-[1.05rem]"
                name="url"
                placeholder="yourstore.com"
                inputMode="url"
                autoComplete="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={a.values.store_url}
                onChange={(e) => a.set("store_url", e.target.value)}
                error={a.errors.store_url}
              />
              <ChoiceGroup
                id={id("revenue")}
                label="Monthly revenue"
                options={REVENUE_BANDS}
                value={a.values.revenue_band}
                onChange={(v) => a.set("revenue_band", v)}
                columns={5}
                lastFull
                error={a.errors.revenue_band}
              />
              <div className="grid gap-6 sm:grid-cols-2">
                <TextField
                  id={id("name")}
                  label="Your name"
                  name="name"
                  autoComplete="name"
                  value={a.values.name}
                  onChange={(e) => a.set("name", e.target.value)}
                  error={a.errors.name}
                />
                <TextField
                  id={id("email")}
                  label="Email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={a.values.email}
                  onChange={(e) => a.set("email", e.target.value)}
                  error={a.errors.email}
                />
              </div>
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
                <TextField
                  id={id("phone")}
                  label="Phone for texts"
                  name="tel"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(555) 123-4567"
                  value={a.values.phone}
                  onChange={(e) => a.set("phone", e.target.value)}
                  error={a.errors.phone}
                />
                <ChoiceGroup
                  id={id("channel")}
                  label="Text me on"
                  options={PHONE_CHANNELS_OFFERED}
                  value={a.values.phone_channel}
                  onChange={(v) => a.set("phone_channel", v)}
                  columns={2}
                  error={a.errors.phone_channel}
                />
              </div>

              {honeypotField}

              <div className="mt-2 grid gap-4">
                <FormError>{a.formError}</FormError>
                <D1Button type="submit" pending={a.pending === "partial"} className="w-full sm:w-auto sm:justify-self-start">
                  Continue
                </D1Button>
                <p className="max-w-2xl text-[0.76rem] leading-relaxed text-tan">
                  By applying you agree that LocalEyes may text, call or email you about your application at the details above. Message and
                  data rates may apply. Reply STOP to opt out. See our{" "}
                  <Link href="/demo/privacy" className="underline underline-offset-2 hover:text-ink">
                    privacy policy
                  </Link>
                  .
                </p>
              </div>
            </div>
            <div className="hidden lg:block">
              <LookLivePreview look={a.values.style_pick} url={a.values.store_url} emptyText="You pick the look in step 2." />
            </div>
          </div>
        </form>
      ) : (
        <form
          noValidate
          onSubmit={async (e) => {
            e.preventDefault()
            setSubmittedHere(true)
            await a.submit(honeypot)
          }}
        >
          <button
            type="button"
            onClick={() => {
              a.goTo(1)
              scrollToTop()
            }}
            className="mb-5 inline-flex min-h-11 items-center gap-2 text-[0.95rem] font-semibold text-ink underline decoration-[var(--gold)] decoration-2 underline-offset-[6px] hover:decoration-ink"
          >
            <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to step 1
          </button>
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
            <div>
              <p className="d1-mono text-tan">
                <span className="text-ink">Step 2 of 2</span>&nbsp;&nbsp;Almost done
              </p>
              <h2 className="d1-h2 mt-4 max-w-[17ch] text-[2.4rem] text-ink sm:text-[3.4rem]">Pick the look closest to what you want.</h2>
            </div>
            <p className="max-w-xs text-[1rem] leading-relaxed text-soft">Open a style to see real stores that use it. We&apos;ll make it yours.</p>
          </div>

          <LookPicker
            mode="pick"
            variant="d1"
            idPrefix={id("look")}
            value={a.values.style_pick}
            onPick={(v) => a.set("style_pick", v)}
            styleOther={a.values.style_other}
            onStyleOtherChange={(v) => a.set("style_other", v)}
            error={a.errors.style_pick}
            nextFieldId={id("niche")}
            onLookOpened={a.lookOpened}
            onStoreVisit={(slug) => a.storeVisited(slug)}
            className="mt-10"
          />

          <div className="mt-14 grid gap-10 border-t border-line pt-10 sm:mt-16 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-16">
            <div className="grid max-w-4xl gap-6">
              <SelectField
                id={id("niche")}
                label="What you sell"
                options={NICHES}
                value={a.values.niche}
                onChange={(e) => a.set("niche", e.target.value as typeof a.values.niche)}
                error={a.errors.niche}
              />
              <TextArea
                id={id("problem")}
                label="What's not working on the store?"
                placeholder="People visit but don't buy. The homepage feels dated."
                rows={3}
                maxLength={500}
                value={a.values.main_problem}
                onChange={(e) => a.set("main_problem", e.target.value)}
                error={a.errors.main_problem}
              />

              {honeypotField}

              <div className="mt-2 grid gap-4">
                <FormError>{a.formError}</FormError>
                <D1Button type="submit" pending={a.pending === "submit"} className="w-full sm:w-auto sm:justify-self-start">
                  Send my application
                </D1Button>
                <p className="text-[0.92rem] font-semibold text-ink">Kent looks at every store himself.</p>
              </div>
            </div>
            <div className="hidden lg:block">
              <LookLivePreview look={a.values.style_pick} url={a.values.store_url} emptyText="Open a look above, then pick it." />
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
