"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import { useApply } from "@/components/apply/apply-provider"
import { ChoiceGroup, FormError, SelectField, TextArea, TextField } from "@/components/form/fields"
import { LOOKS, NICHES, PHONE_CHANNELS, REVENUE_BANDS, labelOf } from "@/lib/options"
import { useFocusFirstError } from "@/lib/use-focus-first-error"
import { cn } from "@/lib/utils"
import { DemoButton } from "./demo-ui"
import { DemoStylePicker } from "./demo-style-picker"
import { LookLivePreview } from "./look-live-preview"

/**
 * The same seven fields and the same two screens as the main page (one shared state,
 * same server actions), laid out as a conversation: one big question at a time.
 */
export function DemoApplyForm({ instance, className }: { instance: "top" | "bottom"; className?: string }) {
  const a = useApply()
  const rootRef = useRef<HTMLDivElement>(null)
  const [honeypot, setHoneypot] = useState("")
  const [submittedHere, setSubmittedHere] = useState(false)
  useFocusFirstError(submittedHere ? a.errors : null, rootRef)
  const id = (k: string) => `demo-${instance}-${k}`

  const scrollToTop = () => requestAnimationFrame(() => rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }))

  if (a.screen === "done") {
    const where =
      a.outcome === "qualified"
        ? { text: "You're in. Pick a time for your homepage call.", cta: "Book my call", href: a.next ?? "/book" }
        : { text: "Thanks, your application is in. We'll be in touch by text.", cta: "See what's next", href: a.next ?? "/thanks" }
    return (
      <div ref={rootRef} id={`apply-${instance}`} className={cn("scroll-mt-24 text-center", className)}>
        <p className="d-kicker">Application sent</p>
        <p className="d-display mt-4 text-[2.4rem] text-ink sm:text-[3.2rem]">Your application is in.</p>
        <p className="mx-auto mt-3 max-w-md text-[1.02rem] leading-relaxed text-soft">{where.text}</p>
        <Link href={where.href} className="d-btn mt-8">
          {where.cta}
        </Link>
      </div>
    )
  }

  return (
    <div ref={rootRef} id={`apply-${instance}`} className={cn("d-form scroll-mt-24", className)}>
      {a.screen === 1 ? (
        <form
          noValidate
          onSubmit={async (e) => {
            e.preventDefault()
            setSubmittedHere(true)
            if (await a.continueToTwo()) scrollToTop()
          }}
        >
          <div className="text-center">
            <p className="d-kicker">Step 1 of 2 · Two minutes</p>
            <h2 className="d-display mx-auto mt-4 max-w-[16ch] text-[2.55rem] text-balance text-ink sm:text-[3.8rem]">
              Pick the look closest to your brand.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[1.04rem] leading-relaxed text-soft">Tap one. It sets the starting point for your free homepage.</p>
          </div>

          <DemoStylePicker
            name={id("style")}
            value={a.values.style_pick}
            onChange={(v) => a.set("style_pick", v)}
            error={a.errors.style_pick}
            className="mt-10 sm:mt-14"
          />

          <div className="mx-auto mt-14 grid max-w-4xl items-center gap-10 sm:mt-16 sm:grid-cols-[minmax(0,1fr)_17.5rem] sm:gap-14">
            <div className="grid gap-5">
              <TextField
                id={id("store_url")}
                label={
                  <span className="d-display block pb-3 text-center text-[2rem] text-balance text-ink sm:pb-4 sm:text-left sm:text-[2.6rem]">
                    What&apos;s your store&apos;s address?
                  </span>
                }
                inputClassName="h-[64px] text-center text-[1.1rem] sm:text-left"
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
              <DemoButton type="submit" pending={a.pending === "partial"} className="mt-2 w-full">
                Continue
              </DemoButton>
              <FormError>{a.formError}</FormError>
            </div>
            <div className="hidden sm:block">
              <LookLivePreview look={a.values.style_pick} url={a.values.store_url} />
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
          <div className="text-center">
            <p className="d-kicker">Step 2 of 2 · Almost done</p>
            <h2 className="d-display mt-4 text-[2.55rem] text-ink sm:text-[3.8rem]">A few quick questions.</h2>
          </div>

          <div className="d-card mx-auto mt-10 max-w-4xl p-5 sm:p-9">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-brand-soft px-4 py-3 text-[0.92rem] text-soft">
              <span className="font-bold text-ink">{labelOf(LOOKS, a.values.style_pick)}</span>
              <span aria-hidden="true">·</span>
              <span className="min-w-0 truncate">{a.values.store_url}</span>
              <button
                type="button"
                onClick={() => {
                  a.goTo(1)
                  scrollToTop()
                }}
                className="ml-auto text-[0.86rem] font-bold text-gold underline decoration-2 underline-offset-4"
              >
                Change
              </button>
            </div>

            <div className="mt-7 grid gap-6">
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
                rows={2}
                maxLength={500}
                value={a.values.main_problem}
                onChange={(e) => a.set("main_problem", e.target.value)}
                error={a.errors.main_problem}
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
                  options={PHONE_CHANNELS}
                  value={a.values.phone_channel}
                  onChange={(v) => a.set("phone_channel", v)}
                  columns={3}
                  error={a.errors.phone_channel}
                />
              </div>
            </div>

            {/* Honeypot for bots. Hidden from people and screen readers. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label htmlFor={id("website")}>Website</label>
              <input id={id("website")} tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            </div>

            <div className="mt-8 grid gap-4">
              <FormError>{a.formError}</FormError>
              <DemoButton type="submit" pending={a.pending === "submit"} className="w-full">
                Send my application
              </DemoButton>
              <p className="text-center text-[0.9rem] font-semibold text-ink">Kent looks at every store himself.</p>
              <p className="text-center text-[0.74rem] leading-relaxed text-tan">
                By applying you agree that LocalEyes may text, call or email you about your application at the details above. Message and
                data rates may apply. Reply STOP to opt out. See our{" "}
                <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
                  privacy policy
                </Link>
                .
              </p>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
