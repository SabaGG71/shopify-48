import { QUALIFYING_REVENUE, type Niche, type RevenueBand } from "@/lib/options"
import type { Outcome } from "@/lib/types"

export type QualifyReason =
  | "qualified"
  | "not_shopify"
  | "revenue_under_5k"
  | "store_unverified"
  | "niche_coffee"
  | "niche_something_else"
  | "niche_not_active"

export const REASON_TEXT: Record<QualifyReason, string> = {
  qualified: "Qualified",
  not_shopify: "Not a live Shopify store",
  revenue_under_5k: "Revenue band under 5K",
  store_unverified: "Could not verify the store (blocked or down). Check by hand",
  niche_coffee: "Coffee. Review by hand",
  niche_something_else: "Something else. Review by hand",
  niche_not_active: "Niche not active right now. Review by hand",
}

/**
 * Brief: qualified = Shopify is true, revenue band is 5K or higher, niche is in ACTIVE_NICHES.
 * Coffee and "something else" are flagged for Kent instead of auto qualified.
 * A store we could not reach is flagged too, never rejected as "not Shopify".
 */
export function qualify(input: {
  isShopify: boolean | null
  revenueBand: RevenueBand
  niche: Niche
  activeNiches: readonly string[]
}): { outcome: Outcome; qualified: boolean; reason: QualifyReason; needsReview: boolean } {
  const { isShopify, revenueBand, niche, activeNiches } = input
  if (isShopify === false) return { outcome: "not_fit", qualified: false, reason: "not_shopify", needsReview: false }
  if (!QUALIFYING_REVENUE.includes(revenueBand)) {
    return { outcome: "not_fit", qualified: false, reason: "revenue_under_5k", needsReview: false }
  }
  const nicheActive = activeNiches.includes(niche)
  if (isShopify === null) return { outcome: "review", qualified: false, reason: "store_unverified", needsReview: true }
  if (nicheActive) return { outcome: "qualified", qualified: true, reason: "qualified", needsReview: false }
  const reason: QualifyReason =
    niche === "coffee" ? "niche_coffee" : niche === "something-else" ? "niche_something_else" : "niche_not_active"
  return { outcome: "review", qualified: false, reason, needsReview: true }
}
