"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import { CtaButton } from "@/components/brand/cta"
import { LabelRule, Ornament } from "@/components/brand/marks"
import { ChoiceGroup, FormError, SelectField, TextArea, TextField } from "@/components/form/fields"
import { StylePicker } from "@/components/style/style-picker"
import { LOOKS, NICHES, PHONE_CHANNELS, REVENUE_BANDS, labelOf } from "@/lib/options"
import { useFocusFirstError } from "@/lib/use-focus-first-error"
import { cn } from "@/lib/utils"
import { useApply } from "./apply-provider"

/**
 * Seven fields, two short screens. Screen one is the style pick and the store URL
 * (saved the moment it is complete). Screen two is the rest.
 * Rendered twice on the landing page; both copies share one state.
 */
export function ApplyForm({ instance, className }: { instance: "top" | "bottom"; className?: string }) {
  const a = useApply()
  const rootRef = useRef<HTMLDivElement>(null)
  const [honeypot, setHoneypot] = useState("")
  // Both copies of the form share state; only the one that was submitted moves focus to an error.
  const [submittedHere, setSubmittedHere] = useState(false)
  useFocusFirstError(submittedHere ? a.errors : null, rootRef)
  const id = (k: string) => `${instance}-${k}`

  const scrollToTop = () =>
    requestAnimationFrame(() => rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }))

  if (a.screen === "done") {
    const where =
      a.outcome === "qualified"
        ? { text: "You're in. Pick a time for your homepage call.", cta: "Book my call", href: a.next ?? "/book" }
        : { text: "Thanks, your application is in. We'll be in touch by text.", cta: "See what's next", href: a.next ?? "/thanks" }
    return (
      <div ref={rootRef} id={`apply-${instance}`} className={cn("scroll-mt-24", className)}>
        <LabelRule>
          Apply <Ornament /> Done
        </LabelRule>
        <p className="display mt-5 text-[2rem] text-ink sm:text-[2.4rem]">Your application is in.</p>
        <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-soft">{where.text}</p>
        <Link
          href={where.href}
          className="mt-6 inline-flex items-center gap-2 text-[0.8rem] font-semibold tracking-[0.18em] text-ink uppercase underline decoration-gold underline-offset-4"
        >
          {where.cta}
        </Link>
      </div>
    )
  }

  return (
    <div ref={rootRef} id={`apply-${instance}`} className={cn("scroll-mt-24", className)}>
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
            <p className="micro">Step 1 of 2 · Takes two minutes</p>
            <h2 className="display mx-auto mt-4 max-w-[18ch] text-[2.35rem] text-balance text-ink sm:text-[3.4rem]">
              Pick the look closest to your brand.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[1rem] leading-relaxed text-soft">Tap one. It sets the starting point for your free homepage.</p>
          </div>

          <StylePicker
            name={id("style")}
            value={a.values.style_pick}
            onChange={(v) => a.set("style_pick", v)}
            error={a.errors.style_pick}
            className="mt-7"
          />

          <div className="mx-auto mt-12 grid max-w-xl gap-4">
            <TextField
              id={id("store_url")}
              label={<span className="display block pb-3 text-center text-[1.75rem] text-ink sm:pb-4 sm:text-[2.2rem]">What&apos;s your store&apos;s address?</span>}
              inputClassName="h-[60px] text-center text-[1.05rem]"
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
            <CtaButton type="submit" pending={a.pending === "partial"} className="w-full">
              Continue
            </CtaButton>
            <FormError>{a.formError}</FormError>
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
            <p className="micro">Step 2 of 2 · Almost done</p>
            <h2 className="display mt-4 text-[2.35rem] text-ink sm:text-[3.4rem]">A few quick questions.</h2>
          </div>

          <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-white px-4 py-3 text-[0.9rem] text-soft ring-1 ring-line">
            <span className="font-semibold text-ink">{labelOf(LOOKS, a.values.style_pick)}</span>
            <Ornament className="size-2" />
            <span className="truncate">{a.values.store_url}</span>
            <button
              type="button"
              onClick={() => {
                a.goTo(1)
                scrollToTop()
              }}
              className="ml-auto text-[0.74rem] font-semibold tracking-[0.16em] text-ink uppercase underline decoration-gold underline-offset-4"
            >
              Change
            </button>
          </div>

          <div className="mx-auto mt-8 grid max-w-2xl gap-6">
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
            <div className="grid gap-6">
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
            <input
              id={id("website")}
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div className="mx-auto mt-8 grid max-w-2xl gap-4">
            <FormError>{a.formError}</FormError>
            <CtaButton type="submit" pending={a.pending === "submit"} className="w-full">
              Send my application
            </CtaButton>
            <p className="text-center text-[0.86rem] font-medium text-ink">Kent looks at every store himself.</p>
            <p className="text-center text-[0.74rem] leading-relaxed text-tan">
              By applying you agree that LocalEyes may text, call or email you about your application at the details above. Message and
              data rates may apply. Reply STOP to opt out. See our{" "}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
                privacy policy
              </Link>
              .
            </p>
          </div>
        </form>
      )}
    </div>
  )
}
