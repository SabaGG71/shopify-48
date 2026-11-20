import type { SiteConfig } from "./schema"
import { DEFAULT_LOOKBOOK } from "./lookbook-default"

const proof = (slug: string) => ({
  before_desktop: `/proof/${slug}/before-desktop.webp`,
  after_desktop: `/proof/${slug}/after-desktop.webp`,
  before_mobile: `/proof/${slug}/before-mobile.webp`,
  after_mobile: `/proof/${slug}/after-mobile.webp`,
})
const proofDesktop = (slug: string) => ({
  before_desktop: `/proof/${slug}/before-desktop.webp`,
  after_desktop: `/proof/${slug}/after-desktop.webp`,
})

/**
 * Launch defaults. Prices, links and videos are deliberately empty: Kent fills
 * them in /admin (or as env vars). Nothing here is a price.
 *
 * WHAT_YOU_GET and FINE_PRINT are Kent's wording (Nov 18 2026).
 */
export const DEFAULT_CONFIG: SiteConfig = {
  PRICE_DISPLAY: "",
  PRICE_NOTE: "",
  RESERVE_URL: "",
  BOOKING_URL: "",
  VSL_URL: "",
  VSL_POSTER_URL: "",
  VSL_CAPTIONS_URL: "",
  CONFIRM_VIDEO_URL: "",
  CONFIRM_CAPTIONS_URL: "",
  INTAKE_VIDEO_URL: "",
  INTAKE_CAPTIONS_URL: "",
  COLLAB_HOWTO_VIDEO_URL: "",
  STORE_SCORE_URL: "",
  KENT_TEXT_NUMBER: "",
  SLOT_COUNTER_ON: false,
  SLOTS_PER_WEEK: null,
  SLOTS_LEFT: null,
  NICHE_LABEL: "food and drink brands",
  ACTIVE_NICHES: [
    "tea-and-matcha",
    "chocolate-and-sweets",
    "sauces-and-pantry",
    "bakery",
    "snacks",
    "drinks",
    "other-food-and-drink",
  ],
  PROOF_STORES: [
    { slug: "lima", name: "Lima Coffee Roasters", cleared: true, caption: null, ...proof("lima") },
    { slug: "boxwood", name: "Boxwood Coffee", cleared: true, caption: null, ...proofDesktop("boxwood") },
    { slug: "lake-effect", name: "Lake Effect Coffee Co.", cleared: true, caption: null, ...proof("lake-effect") },
    // Held: the new Lamppost site is still an unpublished preview, and JJ's has no visible redesign yet.
    { slug: "lamppost", name: "Lamppost Coffee", cleared: false, caption: null },
    { slug: "jjs", name: "JJ's Flower Shop", cleared: false, caption: null },
    // Kent's timed test build (Wix site rebuilt on Shopify). Not on the cleared list yet.
    { slug: "green-kettle", name: "Green Kettle Coffee", cleared: false, caption: null, ...proof("green-kettle") },
  ],
  LOOKBOOK: DEFAULT_LOOKBOOK,
  WHAT_YOU_GET: [
    "Full redesign: home, collection, product page, cart, nav, footer, about, contact",
    "Conversion setup: product page layout, cart upsells, gift tiers, mobile checkout",
    "One page your category needs: subscriptions, bundles, gifting or wholesale",
    "Up to 2 apps installed and set up",
    "Zero SEO loss: every URL kept or redirected, titles, meta, schema, internal links",
    "14 days of tweaks after launch",
    "30 day report on conversion rate, AOV and speed, plus your next 3 moves",
  ],
  FINE_PRINT: [
    {
      title: "When the clock starts",
      body: "The clock starts when your intake is done, store access is granted and payment clears. Business days only. It pauses while we're waiting on you.",
    },
    {
      title: "How you get it",
      body: "Delivery is a preview link. You publish when you're ready.",
    },
    {
      title: "Not included",
      body: "Logo or branding, photography, writing every product description, custom apps, migrations and ads. You pay your own app fees.",
    },
  ],
}
