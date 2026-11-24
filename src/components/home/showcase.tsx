"use client"

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react"

const DIR = "/proof/green-kettle"

/**
 * What we built for Green Kettle, one highlight per feature. `before` is the matching page
 * on the old Wix site, when there was one. To swap a shot (a new hero photo, say), replace
 * the file in public/proof/green-kettle with the same name: 1440 wide, 676 tall.
 */
const HIGHLIGHTS = [
  {
    key: "home",
    label: "Homepage",
    title: "A homepage that sells the coffee",
    body: "One clear headline, one button, and the three roasts ready to add right under the photo.",
    after: `${DIR}/after-desktop.jpg`,
    before: `${DIR}/before-desktop.jpg`,
  },
  {
    key: "roasts",
    label: "Roast picker",
    title: "Add a roast in one tap",
    body: "Light, medium, dark or all three at 10% off, each with its own Add button. No product page needed.",
    after: `${DIR}/after-roasts.jpg`,
    before: `${DIR}/before-collection.jpg`,
  },
  {
    key: "product",
    label: "Product page",
    title: "Subscribe and save, built in",
    body: "Subscriptions with a delivery schedule sit beside one-time orders, so repeat revenue starts on the first visit.",
    after: `${DIR}/after-product.jpg`,
    before: `${DIR}/before-product.jpg`,
  },
  {
    key: "shop-menu",
    label: "Shop menu",
    title: "A menu you can see",
    body: "The shop menu shows the bundle, coffee, kits, merch and gift cards as photos, not a list of links.",
    after: `${DIR}/after-shop-menu.jpg`,
    before: null,
  },
  {
    key: "cart",
    label: "Cart",
    title: "A cart that suggests the next thing",
    body: "The cart slides in with add-ons that go with the order, to lift the average order without a pop-up.",
    after: `${DIR}/after-cart.jpg`,
    before: null,
  },
  {
    key: "catering",
    label: "Catering",
    title: "Catering that asks for the quote",
    body: "The catering page leads with an instant quote button and keeps the search rankings the old page earned.",
    after: `${DIR}/after-catering.jpg`,
    before: `${DIR}/before-catering.jpg`,
  },
  {
    key: "catering-menu",
    label: "Catering menu",
    title: "Events one click from anywhere",
    body: "Every event type, every town they serve and a quote button, with a real review, inside the main menu.",
    after: `${DIR}/after-catering-menu.jpg`,
    before: null,
  },
  {
    key: "gift-cards",
    label: "Gift cards",
    title: "Two gift cards, no mix-ups",
    body: "One card for the cafe and one for the online store, side by side, so nobody buys the wrong one.",
    after: `${DIR}/after-gift-cards.jpg`,
    before: null,
  },
] as const

/**
 * The Green Kettle rebuild as a small tour: pick a highlight, see it full size, and flip to
 * the old site where there is a matching page.
 */
export function Showcase({ domain }: { domain: string }) {
  const [active, setActive] = useState(0)
  const [side, setSide] = useState<"before" | "after">("after")
  const h = HIGHLIGHTS[active]
  const showBefore = side === "before" && !!h.before

  // The first time the tour scrolls into view it flips to the old site and back by itself,
  // so nobody has to find the Before button to learn it is there. Any tap cancels it.
  const stageRef = useRef<HTMLDivElement>(null)
  const touched = useRef(false)
  const timers = useRef<number[]>([])
  const stopDemo = () => {
    touched.current = true
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  useEffect(() => {
    const el = stageRef.current
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || touched.current) return
        io.disconnect()
        timers.current = [
          window.setTimeout(() => !touched.current && setSide("before"), 700),
          window.setTimeout(() => !touched.current && setSide("after"), 2900),
        ]
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      timers.current.forEach((t) => window.clearTimeout(t))
    }
  }, [])
  const flip = (to: "before" | "after") => {
    stopDemo()
    setSide(to)
  }

  return (
    <div className="hx-show">
      <div className="hx-show-list" role="tablist" aria-label="What we built for Green Kettle" aria-orientation="vertical">
        {HIGHLIGHTS.map((x, i) => (
          <button
            key={x.key}
            type="button"
            role="tab"
            aria-selected={i === active}
            className="hx-show-item"
            onClick={() => {
              stopDemo()
              setActive(i)
              setSide("after")
            }}
          >
            <img src={x.after} alt="" width={1440} height={676} loading="lazy" />
            <span>
              <b>{x.label}</b>
              {i === active ? (
                <>
                  <strong>{x.title}</strong>
                  <small>{x.body}</small>
                </>
              ) : null}
            </span>
          </button>
        ))}
      </div>

      <div>
        <div ref={stageRef} className="hx-show-stage" role="tabpanel" aria-label={h.label}>
          <div className="hx-show-bar">
            <span className="hx-show-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="hx-show-url">{showBefore ? "The old site" : domain}</span>
            {h.before ? (
              <div className="hx-seg" role="group" aria-label="Before or after">
                <button type="button" aria-pressed={showBefore} onClick={() => flip("before")}>
                  Before
                </button>
                <button type="button" aria-pressed={!showBefore} onClick={() => flip("after")}>
                  After
                </button>
              </div>
            ) : (
              <span className="hx-tag" data-after="">
                New in the rebuild
              </span>
            )}
          </div>
          <div className="hx-show-shot">
            {/* Both images stay mounted so flipping is instant. */}
            <img src={h.after} alt={`Green Kettle after the rebuild: ${h.label.toLowerCase()}`} width={1440} height={676} />
            {h.before ? (
              <img
                src={h.before}
                alt={`Green Kettle before the rebuild: ${h.label.toLowerCase()}`}
                width={1440}
                height={676}
                loading="lazy"
                data-before=""
                data-on={showBefore ? "" : undefined}
              />
            ) : null}
            {h.before ? (
              // A small picture of the other side, always in the corner: the toggle you can see.
              <button type="button" className="hx-peek" onClick={() => flip(showBefore ? "after" : "before")}>
                <img src={showBefore ? h.after : h.before} alt="" width={1440} height={676} loading="lazy" />
                <span>{showBefore ? "See the new site" : "See the old site"}</span>
              </button>
            ) : null}
          </div>
        </div>
        {/* Phones: the list above is a row of chips, so the words sit under the picture. */}
        <div className="hx-show-cap" aria-hidden="true">
          <h3>{h.title}</h3>
          <p>{h.body}</p>
        </div>
      </div>
    </div>
  )
}
