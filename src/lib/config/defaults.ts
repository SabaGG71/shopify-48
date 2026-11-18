import type { SiteConfig } from "./schema"
import { DEFAULT_LOOKBOOK } from "./lookbook-default"

const proof = (slug: string) => ({
  before_desktop: `/proof/${slug}/before-desktop.webp`,
  after_desktop: `/proof/${slug}/after-desktop.webp`,
  before_mobile: `/proof/${slug}/before-mobile.webp`,
  after_mobile: `/proof/${slug}/after-mobile.webp`,
})

/**
 * Launch defaults. Prices, links and videos are deliberately empty: Kent fills
 * them in /admin (or as env vars). Nothing here is a price.
 *
 * WHAT_YOU_GET and FINE_PRINT are drafted from Kent's ad scripts because the
 * plan doc was not available. Kent should replace them with the plan doc text.
 */
export const DEFAULT_CONFIG: SiteConfig = {
  PRICE_DISPLAY: "",
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
    { slug: "boxwood", name: "Boxwood Coffee", cleared: true, caption: null },
    { slug: "lamppost", name: "Lamppost Coffee", cleared: true, caption: null },
    { slug: "lake-effect", name: "Lake Effect Coffee Co.", cleared: true, caption: null },
    { slug: "jjs", name: "JJ's Flower Shop", cleared: true, caption: null },
    // Kent's timed test build (Wix site rebuilt on Shopify). Not on the cleared list yet.
    { slug: "green-kettle", name: "Green Kettle Coffee", cleared: false, caption: null, ...proof("green-kettle") },
  ],
  LOOKBOOK: DEFAULT_LOOKBOOK,
  WHAT_YOU_GET: [
    "A new homepage built around your best sellers",
    "Product pages rebuilt to sell",
    "Collection pages that are easy to shop",
    "A cart that sells the second item",
    "Apps cleaned up and every old link redirected",
    "Checked on real phones before you see it",
    "Still your theme editor, so you can change anything after",
  ],
  FINE_PRINT: [
    {
      title: "When the clock starts",
      body: "The 48 hours start once three things are in: your intake, your approval of our store access, and your payment. We text you the moment it starts.",
    },
    {
      title: "If we're late",
      body: "If your preview isn't ready 48 hours after the clock starts, the rebuild is free.",
    },
    {
      title: "Your live store",
      body: "We build on a copy of your theme. Your store keeps selling while we work, and nothing goes live until you say yes.",
    },
    {
      title: "Not included",
      body: "New photography, custom app development and changes after launch. Ask on the call if you need any of these.",
    },
  ],
}
