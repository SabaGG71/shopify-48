"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { confirmAccess, saveIntakeStep, submitIntake } from "@/app/actions/intake"
import { CtaButton } from "@/components/brand/cta"
import { Check, LabelRule, Ornament } from "@/components/brand/marks"
import { FieldShell, FormError, SelectField, TextArea, TextField, inputBase } from "@/components/form/fields"
import { LookbookDialog } from "@/components/lookbook/lookbook-dialog"
import { LookPreview } from "@/components/style/look-previews"
import { StylePicker } from "@/components/style/style-picker"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video/video-player"
import type { LookbookEntry } from "@/lib/config/schema"
import { INTAKE_STEPS, STEP_COUNT, type IntakeDraft } from "@/lib/intake/schema"
import {
  COLORS_MODES,
  EMAIL_PLATFORMS,
  FONTS_MODES,
  LOOK_DEFAULTS,
  LOOKS,
  PHONE_CHANNELS_OFFERED,
  REVIEWS_APPS,
  SUBSCRIPTION_STATUS,
  TOGGLE_FIELDS,
  WHOLESALE_STATUS,
  labelOf,
  type Look,
} from "@/lib/options"
import { normalizeUrl } from "@/lib/url"
import { useFocusFirstError } from "@/lib/use-focus-first-error"
import { cn } from "@/lib/utils"
import { AnalyticsHelp } from "./analytics-help"
import { ColorRows, DateRanges, FileDrop, Segmented, UrlListField, YesNoField } from "./intake-fields"

export type IntakeFlowProps = {
  token: string
  initialDraft: IntakeDraft
  initialStep: number
  submitted: boolean
  accessConfirmed: boolean
  clockStarted: boolean
  firstName: string
  video: { url: string; captions: string }
  collabVideo: string
  lookbook: LookbookEntry[]
  missing: boolean
}

type Errors = Record<string, string | undefined>

function CheckRow({
  id,
  checked,
  onChange,
  children,
  hint,
}: {
  id: string
  checked: boolean
  onChange: (v: boolean) => void
  children: React.ReactNode
  hint?: React.ReactNode
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-line-strong bg-paper p-4">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        className={cn(
          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-gold",
          checked ? "border-gold bg-gold text-paper" : "border-line-strong bg-paper text-transparent",
        )}
        aria-hidden="true"
      >
        <Check className="size-3" />
      </span>
      <span>
        <span className="block text-[0.92rem] font-semibold text-ink">{children}</span>
        {hint ? <span className="mt-1 block text-[0.8rem] leading-relaxed text-soft">{hint}</span> : null}
      </span>
    </label>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-6 border-t border-line pt-7 first:border-t-0 first:pt-0">
      <p className="micro">{title}</p>
      {children}
    </div>
  )
}

export function IntakeFlow(props: IntakeFlowProps) {
  const { token } = props
  const [draft, setDraft] = useState<IntakeDraft>(props.initialDraft)
  const [step, setStep] = useState(Math.min(Math.max(1, props.initialStep), STEP_COUNT))
  const [done, setDone] = useState(props.submitted)
  const [accessOk, setAccessOk] = useState(props.accessConfirmed)
  const [clock, setClock] = useState(props.clockStarted)
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [saveState, setSaveState] = useState<"idle" | "pending" | "saving" | "saved" | "error">("idle")
  const [lookOpen, setLookOpen] = useState(false)
  const [lookbookOpen, setLookbookOpen] = useState(false)
  const [analyticsFocus, setAnalyticsFocus] = useState<string | null>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stepRef = useRef(step)
  const draftRef = useRef(draft)

  useEffect(() => {
    stepRef.current = step
  }, [step])
  useEffect(() => {
    draftRef.current = draft
  }, [draft])
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )
  useFocusFirstError(errors, topRef)

  // Warn before closing the tab while an edit is still waiting to save.
  useEffect(() => {
    if (saveState !== "pending" && saveState !== "saving") return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [saveState])

  // Autosave shortly after each edit, so leaving mid-step loses nothing.
  const scheduleSave = useCallback(() => {
    setSaveState("pending")
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setSaveState("saving")
      try {
        const res = await saveIntakeStep(token, stepRef.current, draftRef.current, false)
        setSaveState(res.ok ? "saved" : "error")
        if (!res.ok) setFormError(res.error)
      } catch {
        setSaveState("error")
      }
    }, 1400)
  }, [token])

  const set = useCallback(
    <K extends keyof IntakeDraft>(key: K, value: IntakeDraft[K]) => {
      setDraft((d) => ({ ...d, [key]: value }))
      setErrors((e) => (e[key as string] ? { ...e, [key as string]: undefined } : e))
      scheduleSave()
    },
    [scheduleSave],
  )

  const scrollTop = () => requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }))

  const goContinue = async () => {
    if (timer.current) clearTimeout(timer.current)
    setPending(true)
    setFormError(null)
    try {
      if (step < STEP_COUNT) {
        const res = await saveIntakeStep(token, step, draft, true)
        if (!res.ok) {
          setErrors(res.errors ?? {})
          setFormError(res.error)
          return
        }
        setErrors({})
        setSaveState("saved")
        setStep(res.step)
        scrollTop()
      } else {
        const res = await submitIntake(token, draft)
        if (!res.ok) {
          setErrors(res.errors ?? {})
          setFormError(res.error)
          if (res.step && res.step !== step) {
            setStep(res.step)
            scrollTop()
          }
          return
        }
        setErrors({})
        setAccessOk(res.accessConfirmed)
        setClock(res.clockStarted)
        setDone(true)
        scrollTop()
      }
    } catch {
      setFormError("We couldn't reach the server. Check your connection and try again.")
    } finally {
      setPending(false)
    }
  }

  const goBack = () => {
    if (timer.current) clearTimeout(timer.current)
    const prev = Math.max(1, step - 1)
    setErrors({})
    setFormError(null)
    setStep(prev)
    saveIntakeStep(token, prev, draft, false).catch(() => {})
    scrollTop()
  }

  const changeLook = (look: Look) => {
    setDraft((d) => ({ ...d, style_pick: look, ...LOOK_DEFAULTS[look] }))
    scheduleSave()
  }

  const meta = INTAKE_STEPS[step - 1]
  const lookbookName = (u: string) => props.lookbook.find((e) => normalizeUrl(e.url) === u)?.name ?? u.replace(/^https:\/\//, "")

  /* ---------------- done ---------------- */
  if (done) {
    return (
      <div ref={topRef} className="mx-auto max-w-2xl scroll-mt-6">
        <LabelRule>
          <Ornament /> Intake submitted
        </LabelRule>
        <h1 className="display mt-6 text-[2.6rem] text-balance text-ink sm:text-[3.6rem]">
          {clock ? "The clock is running." : accessOk ? "Got it. Almost there." : "Thank you. One last step."}
        </h1>
        {clock ? (
          <p className="mt-5 text-[1rem] leading-relaxed text-soft">
            Your 48 hours have started. Kent will text you the private preview link. Nothing goes live until you say yes.
          </p>
        ) : !accessOk ? (
          <div className="mt-5 grid gap-5 text-[1rem] leading-relaxed text-soft">
            <p>
              The clock starts once you approve our store access. Kent sends the request to your Shopify admin. Approve it there, then tap
              the button below.
            </p>
            <ol className="grid gap-2 rounded-xl border border-line bg-paper/80 p-4 text-[0.92rem]">
              <li>1. Open Shopify admin and go to Settings, then Users.</li>
              <li>2. Find the request from LocalEyes and approve it.</li>
              <li>3. Come back here and tap the button.</li>
            </ol>
            <CtaButton
              type="button"
              pending={pending}
              className="w-full sm:w-auto"
              onClick={async () => {
                setPending(true)
                setFormError(null)
                try {
                  const res = await confirmAccess(token)
                  if (!res.ok) setFormError(res.error)
                  else {
                    setAccessOk(true)
                    setClock(res.clockStarted)
                  }
                } catch {
                  setFormError("We couldn't reach the server. Try again in a moment.")
                } finally {
                  setPending(false)
                }
              }}
            >
              I approved the access request
            </CtaButton>
          </div>
        ) : (
          <p className="mt-5 text-[1rem] leading-relaxed text-soft">
            Your intake and store access are in. The clock starts as soon as your payment clears, and we&apos;ll text you when it does.
          </p>
        )}
        <div className="mt-6">
          <FormError>{formError}</FormError>
        </div>
        {!clock ? (
          <button
            type="button"
            onClick={() => {
              setDone(false)
              setStep(1)
            }}
            className="mt-8 text-[0.74rem] font-semibold tracking-[0.16em] text-ink uppercase underline decoration-gold underline-offset-4"
          >
            Review my answers
          </button>
        ) : null}
      </div>
    )
  }

  /* ---------------- steps ---------------- */
  return (
    <div ref={topRef} className="mx-auto max-w-2xl scroll-mt-4">
      <div className="sticky top-0 z-30 -mx-4 bg-page/95 px-4 pt-3 pb-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex items-center justify-between gap-4 text-[0.72rem] font-semibold tracking-[0.18em] uppercase">
          <span className="text-ink">
            Step {step} of {STEP_COUNT} <span className="text-tan">· {meta.title}</span>
          </span>
          <span className="text-tan normal-case tracking-normal font-medium" aria-live="polite">
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : saveState === "error" ? "Not saved" : ""}
          </span>
        </div>
        <div
          className="mt-2.5 grid gap-1"
          style={{ gridTemplateColumns: `repeat(${STEP_COUNT}, minmax(0, 1fr))` }}
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEP_COUNT}
          aria-valuenow={step}
          aria-label="Intake progress"
        >
          {INTAKE_STEPS.map((s, i) => (
            <span key={s.key} className={cn("h-1 rounded-full transition-colors duration-500", i < step ? "bg-gold" : "bg-line")} />
          ))}
        </div>
      </div>

      {step === 1 ? (
        <div className="mt-6">
          <h1 className="display text-[2.4rem] text-balance text-ink sm:text-[3.2rem]">Welcome, {props.firstName}. Let’s build your store.</h1>
          <p className="mt-3 text-[0.98rem] leading-relaxed text-soft">About 15 minutes. It saves as you go, so you can stop and come back on any device.</p>
          <VideoPlayer
            url={props.video.url}
            captions={props.video.captions}
            title="Welcome to your 48 hour rebuild"
            className="mt-6"
          />
        </div>
      ) : null}

      <div className="mt-10">
        <h2 className="display text-[2rem] text-ink sm:text-[2.4rem]">{meta.title}</h2>
        <p className="mt-2 text-[0.95rem] text-soft">{meta.lead}</p>
      </div>

      <form
        noValidate
        className="mt-8 grid gap-8"
        onSubmit={(e) => {
          e.preventDefault()
          goContinue()
        }}
      >
        {step === 1 ? (
          <>
            <TextField
              id="store_url"
              label="Store URL"
              value={draft.store_url}
              onChange={(e) => set("store_url", e.target.value)}
              inputMode="url"
              autoCapitalize="none"
              spellCheck={false}
              error={errors.store_url}
            />
            <div className="grid gap-3">
              <TextField
                id="collab_code"
                label="Collaborator request code"
                value={draft.collab_code}
                onChange={(e) => set("collab_code", e.target.value)}
                inputMode="numeric"
                autoComplete="off"
                placeholder="1234"
                error={errors.collab_code}
                hint="In Shopify admin: Settings, then Users. Under Collaborators you'll see your request code."
              />
              {props.collabVideo ? (
                <VideoPlayer url={props.collabVideo} title="Where to find your collaborator code" aspect="9 / 16" className="mx-auto w-full max-w-[260px]" />
              ) : null}
            </div>
            <CheckRow
              id="access_confirmed"
              checked={draft.access_confirmed}
              onChange={(v) => set("access_confirmed", v)}
              hint="Kent sends the request after you continue. Approve it in Shopify admin under Settings, then Users. You can also tick this at the end."
            >
              I approved the access request
            </CheckRow>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Section title="Logo">
              <FileDrop
                token={token}
                field="logo_files"
                label="Logo files"
                optional
                hint="SVG or a large PNG is best. Skip it and we'll use the logo on your store."
                files={draft.logo_files}
                onChange={(f) => set("logo_files", f)}
              />
            </Section>
            <Section title="Colors">
              <Segmented id="colors_mode" label="Keep or change your brand colors?" options={COLORS_MODES} value={draft.colors_mode} onChange={(v) => set("colors_mode", v)} error={errors.colors_mode} />
              <CheckRow
                id="colors_from_store"
                checked={draft.colors_from_store}
                onChange={(v) => set("colors_from_store", v)}
                hint="We'll read them straight from your theme."
              >
                The colors already in my store are right
              </CheckRow>
              {!draft.colors_from_store ? (
                <FieldShell id="colors" label="Brand colors" optional hint="Up to five, with what each one is for.">
                  <ColorRows values={draft.colors} onChange={(v) => set("colors", v)} errors={errors} />
                </FieldShell>
              ) : null}
            </Section>
            <Section title="Fonts">
              <Segmented id="fonts_mode" label="Fonts" options={FONTS_MODES} value={draft.fonts_mode} onChange={(v) => set("fonts_mode", v)} error={errors.fonts_mode} />
              {draft.fonts_mode === "upload" ? (
                <FileDrop token={token} field="font_files" label="Font files" hint="OTF, TTF, WOFF or a zip." files={draft.font_files} onChange={(f) => set("font_files", f)} error={errors.font_files} />
              ) : null}
            </Section>
            <Section title="Your look">
              <div className="flex items-center gap-4 rounded-[18px] border border-line bg-paper/80 p-3 pr-4">
                <div className="@container relative aspect-[3/4] w-[74px] shrink-0 overflow-hidden rounded-[10px] ring-1 ring-line" aria-hidden="true">
                  {draft.style_pick ? <LookPreview look={draft.style_pick as Look} /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="micro">Your look</p>
                  <p className="display mt-1 text-[1.5rem] text-ink">{labelOf(LOOKS, draft.style_pick) || "Pick one"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLookOpen(true)}
                  className="text-[0.72rem] font-semibold tracking-[0.16em] text-ink uppercase underline decoration-gold underline-offset-4"
                >
                  Change
                </button>
              </div>
              {errors.style_pick ? (
                <p role="alert" className="text-[0.8rem] font-medium text-destructive">
                  {errors.style_pick}
                </p>
              ) : null}
              <div className="grid gap-5 rounded-[18px] border border-line bg-paper/60 p-4 sm:p-5">
                <p className="text-[0.84rem] leading-relaxed text-soft">
                  Set from your look. Change any one you feel strongly about, leave the rest.
                </p>
                {TOGGLE_FIELDS.map((t) => (
                  <Segmented
                    key={t.key}
                    id={t.key}
                    label={t.label}
                    options={t.options}
                    value={draft[t.key]}
                    onChange={(v) => set(t.key, v)}
                  />
                ))}
              </div>
            </Section>
            <Section title="Taste">
              <FieldShell id="refs" label="Stores you love" optional hint="Up to three.">
                <div className="rounded-xl border border-line-strong bg-paper p-3">
                  {draft.reference_stores.length ? (
                    <ul className="mb-3 flex flex-wrap gap-2">
                      {draft.reference_stores.map((u) => (
                        <li key={u} className="flex items-center gap-2 rounded-full border border-gold/60 bg-[#fbf6ea] py-1 pr-1 pl-3 text-[0.82rem] text-ink">
                          {lookbookName(u)}
                          <button
                            type="button"
                            onClick={() => set("reference_stores", draft.reference_stores.filter((x) => x !== u))}
                            className="grid size-6 place-items-center rounded-full hover:bg-cream"
                            aria-label={`Remove ${lookbookName(u)}`}
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
                    Open the lookbook <span className="text-tan">{draft.reference_stores.length}/3</span>
                  </button>
                </div>
              </FieldShell>
              <TextField
                id="never_want"
                label="One thing you would never want on your store"
                optional
                value={draft.never_want}
                onChange={(e) => set("never_want", e.target.value)}
              />
            </Section>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <UrlListField
              id="top_products"
              label="Biggest money makers"
              hint="Up to five product links."
              values={draft.top_products}
              onChange={(v) => set("top_products", v)}
              max={5}
              placeholder="yourstore.com/products/..."
              error={errors.top_products}
            />
            <UrlListField
              id="margin_products"
              label="Highest margin products"
              optional
              hint="Up to five product links."
              values={draft.margin_products}
              onChange={(v) => set("margin_products", v)}
              max={5}
              placeholder="yourstore.com/products/..."
            />
            <UrlListField
              id="push_products"
              label="What you want to push"
              optional
              hint="Product or collection links."
              values={draft.push_products}
              onChange={(v) => set("push_products", v)}
              max={10}
              placeholder="yourstore.com/collections/..."
            />
            <Section title="Photos">
              <TextField
                id="photo_link"
                label="Photo folder link"
                optional
                hint="Google Drive, Dropbox or similar. Or upload below."
                value={draft.photo_link}
                onChange={(e) => set("photo_link", e.target.value)}
                inputMode="url"
                autoCapitalize="none"
                spellCheck={false}
                error={errors.photo_link}
              />
              <FileDrop token={token} field="photo_files" label="Upload photos" optional files={draft.photo_files} onChange={(f) => set("photo_files", f)} />
            </Section>
            <UrlListField
              id="locked_pages"
              label="Products or pages that must not change"
              optional
              values={draft.locked_pages}
              onChange={(v) => set("locked_pages", v)}
              max={10}
              placeholder="yourstore.com/pages/..."
            />
          </>
        ) : null}

        {step === 4 ? (
          <>
            <TextArea
              id="customer"
              label="Who buys from you"
              placeholder="Busy parents who love a good snack, mostly in their 30s, a lot of repeat orders."
              value={draft.customer}
              onChange={(e) => set("customer", e.target.value)}
              error={errors.customer}
            />
            <FieldShell id="faq-0" label="Top three questions customers ask" optional>
              <div className="grid gap-2.5">
                {[0, 1, 2].map((i) => (
                  <input
                    key={i}
                    id={`faq-${i}`}
                    aria-label={`Question ${i + 1}`}
                    value={draft.faqs[i] ?? ""}
                    onChange={(e) => {
                      const next = [...draft.faqs]
                      next[i] = e.target.value
                      set("faqs", next)
                    }}
                    placeholder={["How long does shipping take?", "Is it gluten free?", "How should I store it?"][i]}
                    className={cn(inputBase, "h-[52px]")}
                  />
                ))}
              </div>
            </FieldShell>
            <TextField
              id="objection"
              label="Biggest reason people don't buy"
              optional
              value={draft.objection}
              onChange={(e) => set("objection", e.target.value)}
            />
            <TextArea id="best_review" label="Best review you have" optional rows={4} value={draft.best_review} onChange={(e) => set("best_review", e.target.value)} />
          </>
        ) : null}

        {step === 5 ? (
          <>
            <div className="grid gap-3">
              <Segmented
                id="free_ship"
                label="Free shipping threshold"
                options={[
                  { key: "amount", label: "Free over an amount" },
                  { key: "none", label: "No free shipping" },
                ]}
                value={draft.free_ship_mode}
                onChange={(v) => set("free_ship_mode", v)}
                error={errors.free_ship_threshold}
              />
              {draft.free_ship_mode === "amount" ? (
                <div className="relative max-w-[220px]">
                  <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-soft">$</span>
                  <input
                    aria-label="Free shipping over"
                    value={draft.free_ship_threshold}
                    onChange={(e) => set("free_ship_threshold", e.target.value)}
                    inputMode="decimal"
                    placeholder="50"
                    className={cn(inputBase, "h-[52px] pl-8")}
                  />
                </div>
              ) : null}
            </div>
            <YesNoField
              id="gift_tiers"
              label="Gift tiers or a free gift"
              value={draft.gift_tiers}
              onChange={(v) => set("gift_tiers", v)}
              error={errors.gift_tiers}
              detailsLabel="Details"
              detailsPlaceholder="Free tote over $75"
            />
            <YesNoField
              id="bundles"
              label="Bundles"
              value={draft.bundles}
              onChange={(v) => set("bundles", v)}
              error={errors.bundles}
              detailsLabel="Details"
              detailsPlaceholder="Any 3 jars for $30"
            />
            <div className="grid gap-3">
              <Segmented
                id="subscriptions"
                label="Subscriptions"
                options={SUBSCRIPTION_STATUS}
                value={draft.subscriptions_status}
                onChange={(v) => set("subscriptions_status", v)}
                error={errors.subscriptions}
              />
              {draft.subscriptions_status === "have-it" || draft.subscriptions_status === "want-it" ? (
                <TextField
                  id="subscriptions_app"
                  label={draft.subscriptions_status === "have-it" ? "Which app?" : "Any app in mind?"}
                  optional
                  placeholder="Recharge, Skio, Loop"
                  value={draft.subscriptions_app}
                  onChange={(e) => set("subscriptions_app", e.target.value)}
                />
              ) : null}
            </div>
            <Segmented id="wholesale" label="Wholesale" options={WHOLESALE_STATUS} value={draft.wholesale} onChange={(v) => set("wholesale", v)} error={errors.wholesale} />
            <TextField
              id="no_discounts"
              label="Discounts you will not run"
              optional
              placeholder="No sitewide sales over 20%"
              value={draft.no_discounts}
              onChange={(e) => set("no_discounts", e.target.value)}
            />
          </>
        ) : null}

        {step === 6 ? (
          <>
            <div className="grid gap-3">
              <SelectField
                id="email_platform"
                label="Email platform"
                options={EMAIL_PLATFORMS}
                value={draft.email_platform}
                onChange={(e) => set("email_platform", e.target.value)}
                error={errors.email_platform}
              />
              {draft.email_platform === "other" ? (
                <TextField id="email_platform_other" label="Which one?" value={draft.email_platform_other} onChange={(e) => set("email_platform_other", e.target.value)} />
              ) : null}
            </div>
            <div className="grid gap-3">
              <SelectField
                id="reviews_app"
                label="Reviews app"
                options={REVIEWS_APPS}
                value={draft.reviews_app}
                onChange={(e) => set("reviews_app", e.target.value)}
                error={errors.reviews_app}
              />
              {draft.reviews_app === "other" ? (
                <TextField id="reviews_app_other" label="Which one?" value={draft.reviews_app_other} onChange={(e) => set("reviews_app_other", e.target.value)} />
              ) : null}
            </div>
            <TextArea id="keep_apps" label="Apps that must stay" optional rows={2} value={draft.keep_apps} onChange={(e) => set("keep_apps", e.target.value)} />
            <TextArea id="remove_apps" label="Apps you want gone" optional rows={2} value={draft.remove_apps} onChange={(e) => set("remove_apps", e.target.value)} />
          </>
        ) : null}

        {step === 7 ? (
          <>
            <AnalyticsHelp active={analyticsFocus} />
            <div className="grid gap-6 sm:grid-cols-2">
              {(
                [
                  ["base_cvr", "Conversion rate", "%", "2.4"],
                  ["base_aov", "Average order value", "$", "48"],
                  ["base_sessions", "Sessions", "", "12000"],
                  ["base_revenue", "Revenue (total sales)", "$", "26000"],
                ] as const
              ).map(([k, label, unit, ph]) => (
                <FieldShell key={k} id={k} label={label} error={errors[k]}>
                  <div className="relative">
                    {unit === "$" ? <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-soft">$</span> : null}
                    <input
                      id={k}
                      value={draft[k]}
                      onChange={(e) => set(k, e.target.value)}
                      onFocus={() => setAnalyticsFocus(k)}
                      onBlur={() => setAnalyticsFocus(null)}
                      inputMode="decimal"
                      placeholder={ph}
                      aria-invalid={errors[k] ? true : undefined}
                      className={cn(inputBase, "h-[52px]", unit === "$" && "pl-8", unit === "%" && "pr-9")}
                    />
                    {unit === "%" ? <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-soft">%</span> : null}
                  </div>
                </FieldShell>
              ))}
            </div>
            <FileDrop
              token={token}
              field="base_screenshot"
              label="Analytics screenshot"
              hint="A screenshot of that screen works too, instead of typing the numbers."
              optional
              files={draft.base_screenshot}
              onChange={(f) => set("base_screenshot", f)}
            />
            <p className="text-[0.82rem] leading-relaxed text-soft">These numbers are private. We use them only to measure your store 30 days after launch.</p>
          </>
        ) : null}

        {step === 8 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2">
              <TextField
                id="phone"
                label="Best number to text"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={draft.phone}
                onChange={(e) => set("phone", e.target.value)}
                error={errors.phone}
              />
              <Segmented id="phone_channel" label="Text me on" options={PHONE_CHANNELS_OFFERED} value={draft.phone_channel} onChange={(v) => set("phone_channel", v)} error={errors.phone_channel} />
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <TextField id="approver_name" label="Who approves the preview" autoComplete="name" value={draft.approver_name} onChange={(e) => set("approver_name", e.target.value)} error={errors.approver_name} />
              <TextField
                id="approver_email"
                label="Their email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                value={draft.approver_email}
                onChange={(e) => set("approver_email", e.target.value)}
                error={errors.approver_email}
              />
            </div>
            <FieldShell id="blackout" label="Dates to avoid launching" optional hint="Big sales, launches, holidays.">
              <DateRanges values={draft.blackout_dates} onChange={(v) => set("blackout_dates", v)} errors={errors} />
            </FieldShell>
            <TextArea id="notes" label="Anything else" optional rows={4} value={draft.notes} onChange={(e) => set("notes", e.target.value)} />
          </>
        ) : null}

        <FormError>{formError}</FormError>

        <div className="sticky bottom-0 z-20 -mx-4 flex items-center gap-3 border-t border-line bg-page/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="min-h-12 rounded-full border border-line-strong px-5 text-[0.72rem] font-semibold tracking-[0.2em] text-ink uppercase hover:bg-paper"
            >
              Back
            </button>
          ) : null}
          <CtaButton type="submit" pending={pending} className="flex-1 sm:flex-none sm:min-w-[240px]">
            {step === STEP_COUNT ? "Submit my intake" : "Continue"}
          </CtaButton>
        </div>
      </form>

      <Dialog open={lookOpen} onOpenChange={setLookOpen}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto bg-page p-5 sm:max-w-[min(1100px,calc(100%-3rem))] sm:p-8">
          <DialogTitle className="display text-[1.9rem] font-normal text-ink">Change your look</DialogTitle>
          <DialogDescription className="text-[0.88rem] text-soft">The detail settings below reset to the new look. You can still change them.</DialogDescription>
          <StylePicker name="intake-style" value={(draft.style_pick as Look) || ""} onChange={changeLook} showNote={false} className="mt-2" />
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
        selected={draft.reference_stores}
        onChange={(urls) => set("reference_stores", urls)}
        firstLook={(draft.style_pick as Look) || ""}
      />
    </div>
  )
}
