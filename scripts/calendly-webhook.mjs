// Creates the Calendly webhook subscription for the live site (run once, after deploy).
// Usage: node --env-file=.env.local scripts/calendly-webhook.mjs https://your-domain.com
// Prints the signing key to put in Vercel as CALENDLY_WEBHOOK_SIGNING_KEY.
import { randomBytes } from "node:crypto"

const site = (process.argv[2] || "").replace(/\/$/, "")
const token = process.env.CALENDLY_TOKEN
if (!/^https:\/\//.test(site) || !token) {
  console.error("Usage: node --env-file=.env.local scripts/calendly-webhook.mjs https://your-domain.com  (needs CALENDLY_TOKEN)")
  process.exit(1)
}
const h = { authorization: `Bearer ${token}`, "content-type": "application/json" }
const me = (await (await fetch("https://api.calendly.com/users/me", { headers: h })).json()).resource
const signingKey = randomBytes(32).toString("hex")
const res = await fetch("https://api.calendly.com/webhook_subscriptions", {
  method: "POST",
  headers: h,
  body: JSON.stringify({
    url: `${site}/api/webhooks/calendly`,
    events: ["invitee.created", "invitee.canceled", "invitee_no_show.created"],
    organization: me.current_organization,
    user: me.uri,
    scope: "user",
    signing_key: signingKey,
  }),
})
const json = await res.json()
if (!res.ok) {
  console.error("Calendly said:", res.status, JSON.stringify(json))
  process.exit(1)
}
console.log("Webhook created:", json.resource?.uri)
console.log("Set this in Vercel: CALENDLY_WEBHOOK_SIGNING_KEY=" + signingKey)
