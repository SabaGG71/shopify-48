"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useApply } from "@/components/apply/apply-provider"
import { ChoiceGroup, FormError, SelectField, TextArea, TextField } from "@/components/form/fields"
import { LookPreview } from "@/components/style/look-previews"
import { LOOKS, NICHES, PHONE_CHANNELS, REVENUE_BANDS, labelOf } from "@/lib/options"
import { useFocusFirstError } from "@/lib/use-focus-first-error"
import { cn } from "@/lib/utils"

const EXAMPLES = ["yourstore.com", "yourbrand.com", "yourshop.co"]

const tidy = (url: string) =>
  url
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "")

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" className="d2-arrow size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path d="M2.5 8h11M9.5 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Types out example addresses in the blank until the visitor starts typing. */
function useGhost(active: boolean) {
  const [text, setText] = useState(EXAMPLES[0])
  useEffect(() => {
    if (!active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let word = 0
    let i = 0
    let deleting = false
    let t = 0
    const tick = () => {
      const w = EXAMPLES[word]
      if (!deleting) {
        i++
        setText(w.slice(0, i))
        if (i === w.length) {
          deleting = true
          t = window.setTimeout(tick, 1600)
          return
        }
      } else {
        i--
        setText(w.slice(0, i))
        if (i === 0) {
          deleting = false
          word = (word + 1) % EXAMPLES.length
        }
      }
      t = window.setTimeout(tick, deleting ? 45 : 85)
    }
    let i0 = EXAMPLES[0].length
    const erase = () => {
      i0--
      setText(EXAMPLES[0].slice(0, i0))
      if (i0 > 0) t = window.setTimeout(erase, 40)
      else {
        word = 1
        t = window.setTimeout(tick, 300)
      }
    }
    t = window.setTimeout(erase, 2200)
    return () => window.clearTimeout(t)
  }, [active])
  return text
}

/**
 * The opening of the proposal and the whole application. One sentence holds the first
 * field; from then on the page speaks to their store. Same fields, same two screens and
 * same server actions as the main page.
 */
export function Proposal({ instance }: { instance: "top" | "bottom" }) {
  const a = useApply()
  const rootRef = useRef<HTMLDivElement>(null)
  const [honeypot, setHoneypot] = useState("")
  const [submittedHere, setSubmittedHere] = useState(false)
  useFocusFirstError(submittedHere ? a.errors : null, rootRef)
  const id = (k: string) => `d2-${instance}-${k}`
  const domain = tidy(a.values.store_url)
  const ghost = useGhost(instance === "top" && !domain)
  const shown = domain || "yourstore.com"
  const scrollToTop = () => requestAnimationFrame(() => rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }))

  if (a.screen === "done") {
    const where =
      a.outcome === "qualified"
        ? { text: "You're in. Pick a time for your homepage call.", cta: "Book my call", href: a.next ?? "/book" }
        : { text: "Thanks, your application is in. We'll be in touch by text.", cta: "See what's next", href: a.next ?? "/thanks" }
    return (
      <div ref={rootRef} id={`apply-${instance}`} className="scroll-mt-24">
        <p className="d2-label">Proposal accepted</p>
        <p className="d2-h2 mt-2 text-ink">Your application is in.</p>
        <p className="mt-2 max-w-md text-[1rem] leading-relaxed text-soft">{where.text}</p>
        <Link href={where.href} className="d2-btn mt-6">
          {where.cta}
          <Arrow />
        </Link>
      </div>
    )
  }

  if (a.screen === 2) {
    return (
      <div ref={rootRef} id={`apply-${instance}`} className="d2-form scroll-mt-24">
        <form
          noValidate
          onSubmit={async (e) => {
            e.preventDefault()
            setSubmittedHere(true)
            await a.submit(honeypot)
          }}
        >
          <p className="d2-label">Last step, about a minute</p>
          <h2 className="d2-h2 mt-2 text-ink">A few details about {shown}.</h2>
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[10px] bg-[var(--green-soft)] px-4 py-3 text-[0.92rem] text-soft">
            <span className="font-semibold text-ink">{labelOf(LOOKS, a.values.style_pick)}</span>
            <span aria-hidden="true">for</span>
            <span className="min-w-0 truncate font-medium text-ink">{shown}</span>
            <button
              type="button"
              onClick={() => {
                a.goTo(1)
                scrollToTop()
              }}
              className="d2-link ml-auto text-[0.88rem]"
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
              <TextField id={id("name")} label="Your name" name="name" autoComplete="name" value={a.values.name} onChange={(e) => a.set("name", e.target.value)} error={a.errors.name} />
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
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label htmlFor={id("website")}>Website</label>
            <input id={id("website")} tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </div>
          <div className="mt-7 grid gap-3">
            <FormError>{a.formError}</FormError>
            <button type="submit" className="d2-btn justify-self-start" disabled={a.pending === "submit"} aria-busy={a.pending === "submit" || undefined}>
              Send my application
              {a.pending === "submit" ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" /> : <Arrow />}
            </button>
            <p className="text-[0.9rem] font-semibold text-ink">Kent looks at every store himself.</p>
            <p className="max-w-2xl text-[0.76rem] leading-relaxed text-tan">
              By applying you agree that LocalEyes may text, call or email you about your application at the details above. Message and data rates may apply. Reply
              STOP to opt out. See our{" "}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
                privacy policy
              </Link>
              .
            </p>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div ref={rootRef} id={`apply-${instance}`} className="d2-form scroll-mt-24">
      <form
        noValidate
        onSubmit={async (e) => {
          e.preventDefault()
          setSubmittedHere(true)
          if (await a.continueToTwo()) scrollToTop()
        }}
      >
        <p className="d2-sentence text-ink">
          <label htmlFor={id("store_url")}>Rebuild</label>{" "}
          <span className="d2-blank">
            <input
              id={id("store_url")}
              name="url"
              inputMode="url"
              autoComplete="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="yourstore.com"
              value={a.values.store_url}
              onChange={(e) => a.set("store_url", e.target.value)}
              aria-invalid={a.errors.store_url ? true : undefined}
              aria-describedby={a.errors.store_url ? `${id("store_url")}-error` : undefined}
              style={{ ["--w" as string]: `${Math.max(domain.length + 1, 11)}ch` }}
            />
            {!a.values.store_url ? (
              <span className="d2-ghost" aria-hidden="true">
                {ghost}
                <span className="d2-caret" />
              </span>
            ) : null}
          </span>{" "}
          in 48&nbsp;hours.
        </p>
        {a.errors.store_url ? (
          <p id={`${id("store_url")}-error`} role="alert" className="mt-2 text-[0.88rem] font-semibold text-destructive">
            {a.errors.store_url}
          </p>
        ) : null}

        <div className="mt-9">
          <p className="d2-label">
            Pick a starting look for <span className="font-semibold text-ink">{shown}</span>
          </p>
          <div
            role="radiogroup"
            aria-label="Pick the look closest to your brand"
            aria-invalid={a.errors.style_pick ? true : undefined}
            aria-describedby={a.errors.style_pick ? `${id("style")}-error` : undefined}
            className="d2-looks mt-4"
          >
            {LOOKS.map((look) => {
              const lid = `${id("style")}-${look.key}`
              return (
                <label key={look.key} htmlFor={lid} className="d2-look">
                  <input
                    id={lid}
                    type="radio"
                    name={id("style")}
                    value={look.key}
                    checked={a.values.style_pick === look.key}
                    onChange={() => a.set("style_pick", look.key)}
                    className="sr-only"
                  />
                  <div className="d2-win">
                    <div className="d2-winbar" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <span>{shown}</span>
                    </div>
                    <div className="d2-winbody @container">
                      <div className="pointer-events-none size-full" aria-hidden="true">
                        <LookPreview look={look.key} />
                      </div>
                    </div>
                  </div>
                  <span className="d2-check" aria-hidden="true">
                    <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <path d="M3 8.5 6.5 12 13 4.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className={cn("mt-2.5 block text-[0.9rem] leading-tight font-semibold", a.values.style_pick === look.key ? "text-[var(--green)]" : "text-ink")}>{look.label}</span>
                  <span className="mt-0.5 block text-[0.76rem] leading-snug text-soft">{look.hint}</span>
                </label>
              )
            })}
          </div>
          {a.errors.style_pick ? (
            <p id={`${id("style")}-error`} role="alert" className="mt-3 text-[0.88rem] font-semibold text-destructive">
              {a.errors.style_pick}
            </p>
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button type="submit" className="d2-btn" disabled={a.pending === "partial"} aria-busy={a.pending === "partial" || undefined}>
            Continue
            {a.pending === "partial" ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" /> : <Arrow />}
          </button>
          <p className="text-[0.9rem] text-soft">Free homepage first if you qualify. About two minutes.</p>
        </div>
        <div className="mt-4">
          <FormError>{a.formError}</FormError>
        </div>
      </form>
    </div>
  )
}
