"use client"

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef } from "react"
import { lookEvents } from "@/components/looks/look-events"
import { lockScroll, useFocusTrap } from "@/components/looks/overlays"
import { REDUCED, useMedia } from "@/components/looks/use-media"
import { LOOKBOOK, lookById, type LookbookStore } from "@/lib/lookbook"
import { type Look } from "@/lib/options"
import { displayHost } from "@/lib/url"

/** The scroll loops sit beside each store's captures (see scripts/build-lookbook.mjs). */
const loops = (s: LookbookStore) => {
  const base = `/lookbook/${s.look}/${s.slug}`
  return { desktop: `${base}/desktop/card-loop.mp4`, phone: `${base}/card-loop.mp4` }
}

function Heart() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M8 13.6S2.2 10.2 2.2 6.1A3 3 0 0 1 8 4.9a3 3 0 0 1 5.8 1.2c0 4.1-5.8 7.5-5.8 7.5Z" strokeLinejoin="round" />
    </svg>
  )
}

function StoreCard({
  store,
  moving,
  liked,
  onLike,
  onVisit,
}: {
  store: LookbookStore
  moving: boolean
  liked: boolean
  onLike: () => void
  onVisit: () => void
}) {
  const v = loops(store)
  return (
    <article>
      <div className="hx-stage">
        <div className="hx-browser">
          <div aria-hidden="true">
            <i />
            <i />
            <i />
            <span>{displayHost(store.url)}</span>
          </div>
          {moving ? (
            <video src={v.desktop} poster={store.desktop.home.src} autoPlay muted loop playsInline aria-label={`${store.name} on desktop, scrolling`} />
          ) : (
            <img src={store.desktop.home.src} alt={`${store.name} on desktop`} loading="lazy" />
          )}
        </div>
        <div className="hx-phone">
          {moving ? (
            <video src={v.phone} poster={store.mobile.home.src} autoPlay muted loop playsInline aria-label={`${store.name} on a phone, scrolling`} />
          ) : (
            <img src={store.mobile.home.src} alt={`${store.name} on a phone`} loading="lazy" />
          )}
        </div>
      </div>
      <div className="hx-meta">
        <div>
          <h3>{store.name}</h3>
          <p>{store.why}</p>
        </div>
        <button type="button" className="hx-like" aria-pressed={liked} onClick={onLike}>
          <Heart />
          {liked ? "Liked" : "I like this one"}
        </button>
        <a className="hx-visit" href={store.url} target="_blank" rel="noopener" onClick={onVisit}>
          Visit<span className="sr-only"> {store.name} (opens in a new tab)</span>&nbsp;↗
        </a>
      </div>
    </article>
  )
}

/**
 * The direction explorer: one tab per look, each with real stores scrolling on desktop and
 * phone. They pick one direction and heart any stores they like, from any look.
 * Rendered in place (not portaled) so it keeps the page's colors and fonts.
 */
export function DirectionExplorer({
  open,
  onOpen,
  onClose,
  value,
  onPick,
  liked,
  onToggleLike,
  onStoreVisit,
}: {
  /** The look whose tab is showing, or null when closed. */
  open: Look | null
  onOpen: (look: Look) => void
  onClose: () => void
  value: Look | "" | null
  onPick: (look: Look) => void
  liked: string[]
  onToggleLike: (slug: string) => void
  onStoreVisit: (slug: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const reduced = useMedia(REDUCED)
  const look = lookById(open)
  useFocusTrap(ref, !!look, onClose)

  useEffect(() => {
    if (!open) return
    const release = lockScroll()
    const before = document.activeElement as HTMLElement | null
    requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus())
    return () => {
      release()
      before?.focus?.({ preventScroll: true })
    }
    // Only when it opens or closes, not on every tab change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!open])

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0
  }, [open])

  if (!look) return null
  const isPicked = value === look.id
  const pickedLabel = lookById(value)?.label

  return (
    <div
      className="hx-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div ref={ref} className="hx-modal" role="dialog" aria-modal="true" aria-labelledby="hx-explorer-title">
        <div className="hx-mtabs">
          <div role="tablist" aria-label="Design directions">
            {LOOKBOOK.map((l) => (
              <button
                key={l.id}
                type="button"
                role="tab"
                aria-selected={l.id === look.id}
                className="hx-mtab"
                onClick={() => {
                  onOpen(l.id)
                  lookEvents.opened(l.id, "pick")
                }}
              >
                {l.label}
                {l.id === value ? (
                  <>
                    <i aria-hidden="true" />
                    <span className="sr-only"> (your pick)</span>
                  </>
                ) : null}
              </button>
            ))}
          </div>
          <button type="button" className="hx-mx" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="m3.5 3.5 9 9M12.5 3.5l-9 9" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="hx-mhead">
          <div>
            <h2 id="hx-explorer-title">{look.label}</h2>
            <p>
              {look.line} {look.stores.length} real stores below. Watch them scroll, visit them, and heart any you like.
            </p>
          </div>
          <button
            type="button"
            className="hx-btn"
            aria-pressed={isPicked}
            onClick={() => {
              if (isPicked) return
              onPick(look.id)
              lookEvents.picked(look.id)
            }}
          >
            {isPicked ? "✓ Your direction" : "Pick this direction"}
          </button>
        </div>

        <div ref={bodyRef} className="hx-mbody" role="tabpanel" aria-label={look.label}>
          {look.stores.map((s) => (
            <StoreCard
              key={s.slug}
              store={s}
              moving={!reduced}
              liked={liked.includes(s.slug)}
              onLike={() => onToggleLike(s.slug)}
              onVisit={() => {
                onStoreVisit(s.slug)
                lookEvents.storeVisit(s.slug, look.id, "pick")
              }}
            />
          ))}
        </div>

        <div className="hx-mfoot">
          <p aria-live="polite">
            Direction: <b>{pickedLabel ?? "not picked yet"}</b> · Stores liked: <b>{liked.length}</b>
            <span className="max-sm:hidden"> (like as many as you want, from any style)</span>
          </p>
          <button type="button" className="hx-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
