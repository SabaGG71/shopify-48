# 48 Hour Rebuild

Landing page, apply form, booking step and full intake for the LocalEyes 48 Hour Rebuild. Next.js 16, TypeScript, Tailwind 4, shadcn/ui, Neon Postgres with Drizzle, Vercel Blob. Built to Kent's brief of Nov 16 2026.

## Pages

| Path | What it is |
| --- | --- |
| `/` | Landing page, light blue, pared back: headline, video, the apply form as six short steps (store, revenue, name and email, phone, pick a direction, what you sell), the Green Kettle showcase, what you get, and a short FAQ (how it works, what is included, guarantees, price, fine print). Step five opens the direction explorer: real stores scrolling on desktop and phone, one direction to pick, any number of stores to heart |
| `/demo` | The same funnel in the lime design (films, the 0h to 48h scrubber, the Lake Effect redline). `/demo-1` redirects here and `/demo-2` redirects to `/` |
| `/demo/privacy` | The privacy notice in the lime design. The lime page links here |
| `/book` | Page 2, qualified applicants only: video, five short design steps (sites they love and what they like about each, how the store should feel, optional preferences, one thing they never want, best sellers), then the booking calendar (Calendly, prefilled with name, email, store URL, phone and the lead id) |
| `/booked` | After a booking: call time, the booked page video, and the reserve option. Calendly's redirect lands here too |
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

1. **Database.** Neon is already set up: `npm run db:migrate` created the tables. **Run it again before deploying the pared-back landing page**: migration `0002_design_notes` adds one `design_notes` column to `applications` and `homepage_jobs`, and saves fail without it. Tables: (`applications`, `homepage_jobs`, `jobs`, `site_config`, `alerts`). After a schema change: `npm run db:generate`, then `npm run db:migrate`. `npm run db:studio` opens a table browser.
2. **File storage.** In Vercel, create a Blob store and connect it to the project. That adds `BLOB_READ_WRITE_TOKEN`.
3. **Vercel.** Import the repo, then set the env vars from `.env.example`. Needs a Pro team for a commercial site.
4. **Settings in /admin.** Already in Neon: price and price note, reserve link, booking link, slot counter (7 a week, counted from real payments), checklist, fine print, lookbook, proof stores. Still to add when Kent sends them: the four videos and `KENT_TEXT_NUMBER`. Nothing price related is in the code.
5. **Stripe.** Send Kent two URLs. Webhook: `https://<site>/api/webhooks/stripe` with `checkout.session.completed` and `checkout.session.async_payment_succeeded`; he sends back the signing secret for `STRIPE_WEBHOOK_SECRET`. Thank you page for the Payment Link redirect: `https://<site>/reserved?session_id={CHECKOUT_SESSION_ID}`. `STRIPE_SECRET_KEY` and `STRIPE_PAYMENT_LINK_ID` are already known.
6. **Calendly.** `CALENDLY_TOKEN` goes in Vercel. Send Kent the booked page URL for the event's redirect: `https://<site>/booked` (with "pass event details" on). Then run `node --env-file=.env.local scripts/calendly-webhook.mjs https://<site>` once: it subscribes new booking, cancel and no-show, and prints `CALENDLY_WEBHOOK_SIGNING_KEY` for Vercel.
7. **Meta.** Set `NEXT_PUBLIC_META_PIXEL_ID` and `META_CAPI_TOKEN` in Vercel only (they are off locally so tests never send fake events). Use `META_TEST_EVENT_CODE` from Events Manager to watch `Lead`, `QualifiedLead`, `Schedule` and `Purchase` arrive, then remove it.
8. **Alerts.** Kent wants email: set `KENT_ALERT_EMAIL` in Vercel (Resend is set up, localeyesgrowth.com is verified). It is off locally so tests never email Kent. A no-show gets one rebook text if Twilio is added, otherwise one email.
9. **Google Sheet.** Optional copy of every lead for Kent, one row per application, updated on apply, design answers and call booked. Paste `docs/google-sheet-sync.gs` into the sheet (Extensions > Apps Script), deploy as a web app, then set `SHEETS_WEBHOOK_URL` and `SHEETS_WEBHOOK_SECRET` in Vercel. Empty means off. The database stays the source of truth.

## How the rules from the brief are met

- **Partial leads.** Screen one (look + store URL) is saved the moment it is complete. The Shopify check runs in the background.
- **Qualification.** Shopify is true (Shopify headers, `cdn.shopify.com` in the source, or a working `/cart.js`), revenue is 5K or more, and the niche is in `ACTIVE_NICHES`. Coffee and "something else" go to Kent for review. A store that blocks the check also goes to review instead of being rejected. Every application is stored either way.
- **Resume.** The apply form remembers the browser (cookie). The intake saves on every step and autosaves while typing; the link returns to the same step.
- **Uploads.** Straight from the browser to Vercel Blob (Vercel's 4.5 MB request limit does not apply), 50 MB each, images, SVG, PDF, fonts and zip.
- **Never silent.** Every failed save shows an error on screen and alerts Kent. Alerts are also logged in the `alerts` table.
- **Meta.** Browser pixel and Conversions API send the same event id, so Meta counts each event once.
- **The clock.** `clock_started_at` is stamped when intake submitted, access confirmed and payment cleared are all true, then Kent gets a text.

The data the build agent reads is described key by key in [docs/DATA.md](docs/DATA.md).

## Still open

- Videos: Kent sends the VSL, booked page video, welcome video and collaborator code clip as he records them. Until then the hero shows a before and after, and the other video spots are hidden.
- Proof stores: Lima is live. Boxwood, Lake Effect and JJ's pairs are being captured (befores from the Wayback Machine) and get added once reviewed. Lamppost is held: its rebuild is still an unpublished preview and the client has not signed off. Green Kettle (the timed test build) is ready but hidden until Kent sets `cleared: true`.
- The lookbook was captured during Black Friday sales. Recapture after Dec 2 with the same file names. Kent's capture script needs two fixes first: Sanzo's mobile page overflows sideways, and Heist's desktop theme scrolls inside a wrapper (both were recaptured by hand). After a recapture, run `node scripts/build-lookbook.mjs <path to playbook-1>` to rebuild the picker's WebP sizes and `src/lib/lookbook/lookbook.generated.json`. The script never touches the mp4 loops.

## Where things live

- `src/lib/config`: config keys, defaults, and the reader (database row, then env var, then default).
- `src/lib/options.ts`: every option key.
- `src/lib/intake/schema.ts`: intake steps, validation and the JSON document builder.
- `src/components/style/look-previews.tsx`: the five live style previews.
- `public/lookbook`: Kent's 19 lookbook stores. The picker uses the sized files (`desktop/1-home-700.webp`, `mobile/1-home-300.webp`, `thumb.webp` and so on). The older unsized files and the mp4 loops belong to the lookbook dialog on /book and /intake. `public/proof`: before and after images. `public/styles`: photos inside the style previews (Pexels).
- `src/lib/lookbook`: the five looks (line and chips are written in index.ts) and the generated store data.
- `src/components/looks`: the "Pick a look" picker (pick mode in step 2 of the apply form, browse mode on the landing pages).
