"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { useApply } from "@/components/apply/apply-provider"
import { LookPreview } from "@/components/style/look-previews"
import { LOOKBOOK, lookById, type LookbookStore, type ShotView } from "@/lib/lookbook"
import { LOOKS, type Look } from "@/lib/options"
import { cn } from "@/lib/utils"
import { LookActions, LookPanelBody, sizesFor, type Variant } from "./look-panel"
import { lookEvents, type PickerMode } from "./look-events"
import { Lightbox, Sheet, useFocusTrap } from "./overlays"
import { DESKTOP, prefersReduced, useMedia } from "./use-media"
import "./looks.css"

export type LookPickerProps = {
  mode: PickerMode
  /** "demo" is the light blue "/" page, "d1" the lime "/demo" page. */
  variant: Variant
  /** Unique per instance. Every id inside is built from it. */
  idPrefix: string
  /** Pick mode: the current style_pick. */
  value?: Look | "" | null
  onPick?: (look: Look) => void
  /** Pick mode: the "None of these feel right." answer (style_other). */
  styleOther?: string
  onStyleOtherChange?: (v: string) => void
  /** Pick mode: a friendly message under the cards. */
  error?: string | null
  /** Pick mode: after a pick, scroll to this element and focus it. */
  nextFieldId?: string
  /** Browse mode: the step one form to scroll to. */
  applyTargetId?: string
  onLookOpened?: (look: Look) => void
  onStoreVisit?: (slug: string, look: Look) => void
  className?: string
}

type Open = { look: Look; via: "panel" | "sheet"; root: HTMLElement }

const HINT: Record<string, string> = Object.fromEntries(LOOKS.map((l) => [l.key, l.hint ?? ""]))

/**
 * "Pick a look": the five style cards, each opening onto real stores built in that style.
 * Desktop opens an inline panel under the row. Phones open a bottom sheet.
 * Pick mode sits inside step two of the apply form. Browse mode is a read-only section.
 */
export function LookPicker({
  mode,
  variant,
  idPrefix,
  value,
  onPick,
  styleOther = "",
  onStyleOtherChange,
  error,
  nextFieldId,
  applyTargetId = "apply-top",
  onLookOpened,
  onStoreVisit,
  className,
}: LookPickerProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const zoneRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const cardOpener = useRef<HTMLElement | null>(null)
  const shotOpener = useRef<HTMLElement | null>(null)

  const wide = useMedia(DESKTOP)
  const [open, setOpen] = useState<Open | null>(null)
  const [panelLook, setPanelLook] = useState<Look | null>(null)
  const [settled, setSettled] = useState(false)
  const [chosenView, setChosenView] = useState<ShotView | null>(null)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [inView, setInView] = useState(false)
  const [otherOpen, setOtherOpen] = useState(false)

  const view: ShotView = chosenView ?? (wide ? "desktop" : "mobile")
  const panelOpen = Boolean(open && open.via === "panel" && wide)
  const sheetOpen = Boolean(open && open.via === "sheet" && !wide)
  const openLookData = open ? lookById(open.look) : undefined
  const panelData = panelLook ? lookById(panelLook) : undefined

  const ids = {
    panel: `${idPrefix}-panel`,
    panelTitle: `${idPrefix}-panel-title`,
    sheet: `${idPrefix}-sheet`,
    sheetTitle: `${idPrefix}-sheet-title`,
    other: `${idPrefix}-other`,
    otherInput: `${idPrefix}-other-input`,
    error: `${idPrefix}-error`,
  }

  /* ----- warm the images before a look opens ----- */
  const warmed = useRef(new Set<string>())
  const warm = useCallback(
    (look: Look) => {
      const isWide = window.matchMedia(DESKTOP).matches
      const v: ShotView = chosenView ?? (isWide ? "desktop" : "mobile")
      const key = `${look}:${v}:${isWide}`
      if (warmed.current.has(key)) return
      warmed.current.add(key)
      const data = lookById(look)
      if (!data) return
      for (const s of data.stores) {
        const img = new Image()
        img.decoding = "async"
        img.sizes = sizesFor(v, isWide, data.stores.length)
        img.srcset = s[v].home.srcSet
        img.src = s[v].home.src
      }
    },
    [chosenView],
  )

  // Pause the card previews off screen. On phones, warm a look when its card is in view.
  useEffect(() => {
    const row = rowRef.current
    if (!row) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.1 })
    io.observe(row)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    const row = rowRef.current
    if (!row || wide) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const look = (e.target as HTMLElement).dataset.look as Look | undefined
          if (e.isIntersecting && look) warm(look)
        }
      },
      { threshold: 0.6 },
    )
    row.querySelectorAll("[data-look]").forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [wide, warm])

  /* ----- open, close, pick ----- */
  const closeLook = useCallback(() => {
    setOpen(null)
    setLightbox(null)
    setSettled(false)
    const card = cardOpener.current
    requestAnimationFrame(() => card?.focus({ preventScroll: true }))
  }, [setOpen, setLightbox, setSettled])

  const openLook = (look: Look, card: HTMLElement) => {
    const isWide = window.matchMedia(DESKTOP).matches
    const via = isWide ? "panel" : "sheet"
    if (open && open.look === look && open.via === via && via === "panel") {
      closeLook()
      return
    }
    const root = rootRef.current?.closest<HTMLElement>(".demo-root, .d1-root") ?? document.body
    cardOpener.current = card
    setOpen({ look, via, root })
    setLightbox(null)
    if (via === "panel") {
      setPanelLook(look)
      if (prefersReduced()) setSettled(true)
      card.scrollIntoView({ inline: "nearest", block: "nearest", behavior: prefersReduced() ? "auto" : "smooth" })
    }
    onLookOpened?.(look)
    lookEvents.opened(look, mode)
    warm(look)
  }

  const scrollToField = (id: string, focusFirstInput: boolean) => {
    requestAnimationFrame(() => {
      const el = document.getElementById(id)
      if (!el) return
      el.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: focusFirstInput ? "start" : "center" })
      const target = focusFirstInput
        ? el.querySelector<HTMLElement>("input:not([type=hidden]):not([tabindex='-1']), select, textarea")
        : el
      target?.focus({ preventScroll: true })
    })
  }

  const pick = (look: Look) => {
    onPick?.(look)
    lookEvents.picked(look)
    setOpen(null)
    setLightbox(null)
    setSettled(false)
    if (nextFieldId) scrollToField(nextFieldId, false)
  }

  const qualify = () => {
    setOpen(null)
    setLightbox(null)
    setSettled(false)
    scrollToField(applyTargetId, true)
  }

  const visit = (store: LookbookStore) => {
    onStoreVisit?.(store.slug, store.look)
    lookEvents.storeVisit(store.slug, store.look, mode)
  }

  const changeView = (v: ShotView) => {
    if (v === view || !open) return
    setChosenView(v)
    lookEvents.viewToggle(v === "desktop" ? "desktop" : "phone", open.look)
  }

  const openShot = (index: number, opener: HTMLElement) => {
    shotOpener.current = opener
    setLightbox(index)
  }
  const closeShot = useCallback(() => {
    setLightbox(null)
    const el = shotOpener.current
    requestAnimationFrame(() => el?.focus({ preventScroll: true }))
  }, [setLightbox])

  /* ----- the desktop panel: focus, connector, keep it in view ----- */
  useFocusTrap(panelRef, panelOpen, closeLook)

  useEffect(() => {
    if (!panelOpen) return
    const panel = panelRef.current
    if (!panel) return
    panel.querySelector<HTMLElement>("[data-lp-title]")?.focus({ preventScroll: true })
    const top = panel.getBoundingClientRect().top
    if (top > window.innerHeight * 0.6) window.scrollBy({ top: top - window.innerHeight * 0.28, behavior: prefersReduced() ? "auto" : "smooth" })
  }, [panelOpen, panelLook])

  useLayoutEffect(() => {
    if (!panelOpen || !open) return
    const row = rowRef.current
    const zone = zoneRef.current
    const card = row?.querySelector<HTMLElement>(`[data-look="${open.look}"]`)
    if (!row || !zone || !card) return
    const place = () => {
      const c = card.getBoundingClientRect()
      const z = zone.getBoundingClientRect()
      const x = c.left + c.width / 2 - z.left
      zone.style.setProperty("--lp-notch-x", `${Math.min(Math.max(x, 30), z.width - 30)}px`)
      zone.toggleAttribute("data-notch-off", x < 8 || x > z.width - 8)
    }
    place()
    row.addEventListener("scroll", place, { passive: true })
    window.addEventListener("resize", place)
    return () => {
      row.removeEventListener("scroll", place)
      window.removeEventListener("resize", place)
    }
  }, [panelOpen, open])

  const showOther = otherOpen || Boolean(styleOther)

  return (
    <div ref={rootRef} className={cn("lp", className)} data-variant={variant} data-mode={mode}>
      <div
        ref={rowRef}
        className={cn("lp-row", !inView && "lp-paused")}
        role="group"
        aria-label={mode === "pick" ? "Pick the look closest to what you want" : "Five looks with real stores"}
        aria-describedby={error ? ids.error : undefined}
      >
        {LOOKBOOK.map((l) => {
          const isOpen = open?.look === l.id && (panelOpen || sheetOpen)
          const isPicked = mode === "pick" && value === l.id
          const n = l.stores.length
          return (
            <div key={l.id} className="lp-card" data-look={l.id} data-open={isOpen ? "" : undefined} data-picked={isPicked ? "" : undefined}>
              <button
                type="button"
                className="lp-card-btn"
                aria-expanded={isOpen}
                aria-controls={wide ? ids.panel : isOpen ? ids.sheet : undefined}
                onClick={(e) => openLook(l.id, e.currentTarget)}
                onPointerEnter={() => warm(l.id)}
                onFocus={() => warm(l.id)}
                onTouchStart={() => warm(l.id)}
              >
                <span className="lp-face @container">
                  <span className="pointer-events-none block size-full" aria-hidden="true">
                    <LookPreview look={l.id} inView={inView} />
                  </span>
                  {isPicked ? <span className="lp-badge">Your pick</span> : null}
                </span>
                <span className="lp-meta">
                  <span className="lp-label">{l.label}</span>
                  <span className="lp-hint">{HINT[l.id]}</span>
                </span>
                <span className="lp-strip">
                  <span className="lp-thumbs" aria-hidden="true">
                    {l.stores.slice(0, 3).map((s) => (
                      // eslint-disable-next-line @next/next/no-img-element -- tiny static thumbnails, no optimizer on this team
                      <img key={s.slug} src={s.thumb} alt="" width={32} height={40} loading="lazy" decoding="async" />
                    ))}
                  </span>
                  <span className="lp-see">
                    See {n} real stores
                    <svg viewBox="0 0 16 16" className="lp-see-arrow" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                      <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </span>
              </button>
            </div>
          )
        })}
      </div>

      {wide ? (
        <div ref={zoneRef} className="lp-zone">
          <div className="lp-notch-track" aria-hidden="true">
            {panelOpen ? <span className="lp-notch" /> : null}
          </div>
          <div
            className="lp-panel-wrap"
            data-open={panelOpen ? "" : undefined}
            data-settled={panelOpen && settled ? "" : undefined}
            onTransitionEnd={(e) => {
              if (e.target === e.currentTarget && panelOpen) setSettled(true)
            }}
          >
            <div className="lp-panel-clip">
              <div ref={panelRef} id={ids.panel} className="lp-panel" role="region" aria-labelledby={ids.panelTitle} inert={!panelOpen}>
                {panelData ? (
                  <>
                    <div className="lp-panel-inner">
                      <LookPanelBody
                        look={panelData}
                        variant={variant}
                        view={view}
                        wide
                        titleId={ids.panelTitle}
                        onView={changeView}
                        onOpenShot={openShot}
                        onVisit={visit}
                      />
                    </div>
                    <div className="lp-actions">
                      <LookActions
                        mode={mode}
                        variant={variant}
                        look={panelData}
                        picked={mode === "pick" && value === panelData.id}
                        onPick={() => pick(panelData.id)}
                        onKeepLooking={closeLook}
                        onQualify={qualify}
                      />
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <p id={ids.error} role="alert" className="lp-error">
          {error}
        </p>
      ) : null}

      {mode === "pick" ? (
        <div className="lp-other">
          <button type="button" className="lp-other-toggle" aria-expanded={showOther} aria-controls={ids.other} onClick={() => setOtherOpen((v) => !v || Boolean(styleOther))}>
            None of these feel right.
          </button>
          {showOther ? (
            <div id={ids.other} className="lp-other-field">
              <label htmlFor={ids.otherInput} className="lp-other-label">
                Tell us or paste a store you love
              </label>
              <input
                id={ids.otherInput}
                type="text"
                value={styleOther}
                maxLength={300}
                autoComplete="off"
                placeholder="A store link, or a few words about the feel"
                onChange={(e) => onStyleOtherChange?.(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.preventDefault()
                }}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {sheetOpen && open && openLookData ? (
        <Sheet
          id={ids.sheet}
          root={open.root}
          variant={variant}
          titleId={ids.sheetTitle}
          title={
            <h3 id={ids.sheetTitle} className={cn("lp-sheet-title", variant === "demo" ? "d-display" : "d1-h2")}>
              {openLookData.label}
            </h3>
          }
          onClose={closeLook}
          actions={
            <LookActions
              mode={mode}
              variant={variant}
              look={openLookData}
              picked={mode === "pick" && value === openLookData.id}
              onPick={() => pick(openLookData.id)}
              onKeepLooking={closeLook}
              onQualify={qualify}
            />
          }
        >
          <LookPanelBody
            look={openLookData}
            variant={variant}
            view={view}
            wide={false}
            inSheet
            titleId={ids.sheetTitle}
            onView={changeView}
            onOpenShot={openShot}
            onVisit={visit}
          />
        </Sheet>
      ) : null}

      {lightbox !== null && open && openLookData ? (
        <Lightbox
          root={open.root}
          variant={variant}
          stores={openLookData.stores}
          index={lightbox}
          view={view}
          onIndex={setLightbox}
          onClose={closeShot}
          onVisit={visit}
        />
      ) : null}
    </div>
  )
}

/** Browse mode for a landing page section, wired to the apply form's lookbook trail. */
export function BrowseLooks({ variant, idPrefix, className }: { variant: Variant; idPrefix: string; className?: string }) {
  const a = useApply()
  return (
    <LookPicker
      mode="browse"
      variant={variant}
      idPrefix={idPrefix}
      onLookOpened={a.lookOpened}
      onStoreVisit={(slug) => a.storeVisited(slug)}
      className={className}
    />
  )
}
