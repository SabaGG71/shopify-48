"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useApply } from "@/components/apply/apply-provider"
import { ChoiceGroup, FormError, SelectField, TextArea, TextField } from "@/components/form/fields"
import { LookPreview } from "@/components/style/look-previews"
import { LOOKS, NICHES, PHONE_CHANNELS, REVENUE_BANDS, labelOf, type Look } from "@/lib/options"
import { useFocusFirstError } from "@/lib/use-focus-first-error"
import { cn } from "@/lib/utils"
import { D1Button } from "./ui"

function Looks({ name, value, onChange, error }: { name: string; value: Look | ""; onChange: (l: Look) => void; error?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div>
      <div
        ref={ref}
        role="radiogroup"
        aria-label="Pick the look closest to your brand"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={cn("grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4 lg:grid-cols-5", !inView && "[&_*]:[animation-play-state:paused]")}
      >
        {LOOKS.map((look) => {
          const id = `${name}-${look.key}`
          const selected = value === look.key
          return (
            <label key={look.key} htmlFor={id} className="d1-look">
              <input id={id} type="radio" name={name} value={look.key} checked={selected} onChange={() => onChange(look.key)} className="sr-only" />
              <div className="d1-look-face @container">
                <div className="pointer-events-none size-full" aria-hidden="true">
                  <LookPreview look={look.key} inView={inView} />
                </div>
              </div>
              <div className="mt-3">
                <span className="block min-w-0">
                  <span className={cn("block text-[0.95rem] leading-tight font-semibold", selected ? "text-ink" : "text-ink/85")}>{look.label}</span>
                  <span className="mt-1 block text-[0.78rem] leading-snug text-soft">{look.hint}</span>
                </span>
              </div>
            </label>
          )
        })}
        <div className="flex items-center rounded-[14px] border border-dashed border-line-strong p-4 lg:hidden">
          <p className="text-[0.82rem] leading-relaxed text-soft">Not an exact match? Pick the closest. You can change the details later.</p>
        </div>
      </div>
      {error ? (
        <p id={`${name}-error`} role="alert" className="mt-4 text-sm font-semibold text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/**
 * The same seven fields and two screens as the main page (one shared state, the same
 * server actions), set in the /demo style.
 */
export function D1ApplyForm({ instance, className }: { instance: "top" | "bottom"; className?: string }) {
  const a = useApply()
  const rootRef = useRef<HTMLDivElement>(null)
  const [honeypot, setHoneypot] = useState("")
  const [submittedHere, setSubmittedHere] = useState(false)
  useFocusFirstError(submittedHere ? a.errors : null, rootRef)
  const id = (k: string) => `d1-${instance}-${k}`
  const scrollToTop = () => requestAnimationFrame(() => rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }))

  if (a.screen === "done") {
    const where =
      a.outcome === "qualified"
        ? { text: "You're in. Pick a time for your homepage call.", cta: "Book my call", href: a.next ?? "/book" }
        : { text: "Thanks, your application is in. We'll be in touch by text.", cta: "See what's next", href: a.next ?? "/thanks" }
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
            if (await a.continueToTwo()) scrollToTop()
          }}
        >
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
            <div>
              <p className="d1-mono text-tan">
                <span className="text-ink">Step 1 of 2</span>&nbsp;&nbsp;Two minutes
              </p>
              <h2 className="d1-h2 mt-4 max-w-[16ch] text-[2.4rem] text-ink sm:text-[3.4rem]">Pick the look closest to your brand.</h2>
            </div>
            <p className="max-w-xs text-[1rem] leading-relaxed text-soft">It sets the starting point for your free homepage.</p>
          </div>

          <div className="mt-10">
            <Looks name={id("style")} value={a.values.style_pick} onChange={(v) => a.set("style_pick", v)} error={a.errors.style_pick} />
          </div>

          <div className="mt-14 border-t border-line pt-10 sm:mt-16 sm:pt-12">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-end lg:gap-12">
              <h3 className="d1-h2 text-[2rem] text-ink sm:text-[2.6rem]">What&apos;s your store&apos;s address?</h3>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <TextField
                  id={id("store_url")}
                  label={<span className="sr-only">Your store&apos;s address</span>}
                  className="[&_label]:mb-0"
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
                <D1Button type="submit" pending={a.pending === "partial"} className="w-full sm:w-auto sm:self-start">
                  Continue
                </D1Button>
              </div>
            </div>
            <div className="mt-4">
              <FormError>{a.formError}</FormError>
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
          <p className="d1-mono text-tan">
            <span className="text-ink">Step 2 of 2</span>&nbsp;&nbsp;Almost done
          </p>
          <h2 className="d1-h2 mt-4 text-[2.4rem] text-ink sm:text-[3.4rem]">A few quick questions.</h2>

          <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 border-y border-line py-3 text-[0.92rem] text-soft">
            <span className="font-semibold text-ink">{labelOf(LOOKS, a.values.style_pick)}</span>
            <span aria-hidden="true">/</span>
            <span className="min-w-0 truncate">{a.values.store_url}</span>
            <button
              type="button"
              onClick={() => {
                a.goTo(1)
                scrollToTop()
              }}
              className="d1-link ml-auto text-[0.88rem] text-ink"
            >
              Change
            </button>
          </div>

          <div className="mt-8 grid max-w-4xl gap-6">
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

          <div className="mt-8 grid max-w-4xl gap-4">
            <FormError>{a.formError}</FormError>
            <D1Button type="submit" pending={a.pending === "submit"} className="w-full sm:w-auto sm:justify-self-start">
              Send my application
            </D1Button>
            <p className="text-[0.92rem] font-semibold text-ink">Kent looks at every store himself.</p>
            <p className="max-w-2xl text-[0.76rem] leading-relaxed text-tan">
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
