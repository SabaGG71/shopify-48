import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"

export type StripeCheckoutSession = {
  id: string
  object: "checkout.session"
  client_reference_id: string | null
  customer_details: { email: string | null; name: string | null; phone: string | null } | null
  customer_email: string | null
  amount_total: number | null
  currency: string | null
  payment_status: "paid" | "unpaid" | "no_payment_required"
  payment_link: string | null
  status: string | null
}

/** Verify a Stripe-Signature header (t=..., v1=...) against the raw body. */
export function verifyStripeSignature(rawBody: string, header: string | null, secret: string, toleranceSec = 300) {
  if (!header) return false
  const parts = header.split(",").map((p) => p.trim().split("=") as [string, string])
  const t = parts.find(([k]) => k === "t")?.[1]
  const sigs = parts.filter(([k]) => k === "v1").map(([, v]) => v)
  if (!t || !sigs.length) return false
  if (Math.abs(Date.now() / 1000 - Number(t)) > toleranceSec) return false
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex")
  const e = Buffer.from(expected)
  return sigs.some((s) => {
    const b = Buffer.from(s)
    return b.length === e.length && timingSafeEqual(b, e)
  })
}

/** Look up a Checkout Session (needs STRIPE_SECRET_KEY). */
export async function retrieveCheckoutSession(id: string): Promise<StripeCheckoutSession | null> {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || !/^cs_(test|live)_[\w]+$/.test(id)) return null
  try {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${id}`, {
      headers: { authorization: `Bearer ${key}` },
      cache: "no-store",
    })
    if (!res.ok) {
      console.error("[stripe] session lookup failed", res.status)
      return null
    }
    return (await res.json()) as StripeCheckoutSession
  } catch (err) {
    console.error("[stripe] session lookup error", err)
    return null
  }
}

/** Only sessions from the 48 hour rebuild payment link, when STRIPE_PAYMENT_LINK_ID is set. */
export function isRebuildSession(s: Pick<StripeCheckoutSession, "payment_link">) {
  const only = process.env.STRIPE_PAYMENT_LINK_ID
  return !only || s.payment_link === only
}
