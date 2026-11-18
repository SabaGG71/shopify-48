# 48 Hour Rebuild

Landing page, apply form, booking step and full intake for the LocalEyes 48 Hour Rebuild. Next.js 16, TypeScript, Tailwind 4, shadcn/ui, Neon Postgres with Drizzle, Vercel Blob. Built to Kent's brief of Nov 16 2026.

## Pages

| Path | What it is |
| --- | --- |
| `/` | Landing page: headline, video, apply form (two screens), proof, what you get, guarantees, how it works, price, fine print, apply again |
| `/book` | Page 2, qualified applicants only: video, three design questions, then the booking calendar |
| `/thanks` | Flagged for Kent to review by hand (coffee, something else, store we could not check) |
| `/not-a-fit` | Not a fit right now. Shows a Store Score link once `STORE_SCORE_URL` is set |
| `/reserved` | Stripe's after-payment page. Links straight to the intake |
| `/intake/[token]` | Page 3, the full intake, from the link sent when payment clears |
| `/admin` | Kent's admin: applications, homepage jobs, paid builds, settings |
| `/privacy` | Privacy notice (Meta pixel needs one). Kent should read it before launch |

## Run it locally

```bash
npm install
npm run dev
```

With `DATABASE_URL` in `.env.local` it uses Neon. Without it, everything is saved to `.data/db.json` (local only, git ignored), so the funnel can still be tested on a laptop. Without `BLOB_READ_WRITE_TOKEN`, uploads are stored locally in development. `/admin` is open in development when `ADMIN_PASSWORD` is not set.

To test the intake without a real payment, apply with a qualified store, then in the same browser run `fetch("/api/dev/simulate-payment", { method: "POST" }).then(r => r.json())` in the console. It returns the intake link. This route is off in production.

## Launch checklist

1. **Database.** Neon is already set up: `npm run db:migrate` created the tables (`applications`, `homepage_jobs`, `jobs`, `site_config`, `alerts`). After a schema change: `npm run db:generate`, then `npm run db:migrate`. `npm run db:studio` opens a table browser.
2. **File storage.** In Vercel, create a Blob store and connect it to the project. That adds `BLOB_READ_WRITE_TOKEN`.
3. **Vercel.** Import the repo, then set the env vars from `.env.example`. Needs a Pro team for a commercial site.
4. **Settings in /admin.** Kent fills `PRICE_DISPLAY`, `RESERVE_URL`, `BOOKING_URL`, the three videos, `KENT_TEXT_NUMBER`. Nothing price related is in the code.
5. **Stripe.** On the Payment Link, set the after-payment redirect to `https://<site>/reserved?session_id={CHECKOUT_SESSION_ID}`. Add a webhook to `https://<site>/api/webhooks/stripe` for `checkout.session.completed` and `checkout.session.async_payment_succeeded`, and put its secret in `STRIPE_WEBHOOK_SECRET`.
6. **Calendly.** Set `CALENDLY_TOKEN` so the booked time is saved. Optional backup: a webhook on `invitee.created` to `https://<site>/api/webhooks/calendly`.
7. **Meta.** Set `NEXT_PUBLIC_META_PIXEL_ID` and `META_CAPI_TOKEN`. Use `META_TEST_EVENT_CODE` to watch `Lead`, `QualifiedLead`, `Schedule` and `Purchase` arrive in Events Manager, then remove it.
8. **Alerts.** Set Twilio (`KENT_ALERT_PHONE`) and/or Resend (`KENT_ALERT_EMAIL`). Resend also emails the intake link after payment, so it needs a verified sending domain.

## How the rules from the brief are met

- **Partial leads.** Screen one (look + store URL) is saved the moment it is complete. The Shopify check runs in the background.
- **Qualification.** Shopify is true (Shopify headers, `cdn.shopify.com` in the source, or a working `/cart.js`), revenue is 5K or more, and the niche is in `ACTIVE_NICHES`. Coffee and "something else" go to Kent for review. A store that blocks the check also goes to review instead of being rejected. Every application is stored either way.
- **Resume.** The apply form remembers the browser (cookie). The intake saves on every step and autosaves while typing; the link returns to the same step.
- **Uploads.** Straight from the browser to Vercel Blob (Vercel's 4.5 MB request limit does not apply), 50 MB each, images, SVG, PDF, fonts and zip.
- **Never silent.** Every failed save shows an error on screen and alerts Kent. Alerts are also logged in the `alerts` table.
- **Meta.** Browser pixel and Conversions API send the same event id, so Meta counts each event once.
- **The clock.** `clock_started_at` is stamped when intake submitted, access confirmed and payment cleared are all true, then Kent gets a text.

The data the build agent reads is described key by key in [docs/DATA.md](docs/DATA.md).

## Content Kent should check

- `WHAT_YOU_GET` and `FINE_PRINT` are drafted from the ad scripts because the plan doc was not available. Replace them in /admin with the plan doc wording.
- Proof stores: Lima's pair is live. Boxwood, Lamppost, Lake Effect and JJ's are listed as cleared but need before and after images (set the four image paths in `PROOF_STORES`). Green Kettle (the timed test build: Wix site rebuilt as a Shopify draft) is ready but hidden until Kent sets `cleared: true`.
- The slot counter is off until Kent decides (`SLOT_COUNTER_ON`).
- The lookbook was captured during Black Friday sales. Recapture after Dec 2 with the same file names. Sanzo's loop from Kent's script was broken (the page was captured 6 times too wide), so a fixed loop from a fresh capture is in place; the capture script needs the same width fix.

## Where things live

- `src/lib/config`: config keys, defaults, and the reader (database row, then env var, then default).
- `src/lib/options.ts`: every option key.
- `src/lib/intake/schema.ts`: intake steps, validation and the JSON document builder.
- `src/components/style/look-previews.tsx`: the five live style previews.
- `public/lookbook`: Kent's 19 lookbook stores. `public/proof`: before and after images. `public/styles`: photos inside the style previews (Pexels).
