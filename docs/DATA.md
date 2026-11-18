# Data contract for Kent's build agent

Everything the funnel stores, and the exact shape the build agent reads. If a key name changes, tell Kent first.

All tables live in a Neon Postgres database (`DATABASE_URL`), managed with Drizzle. The schema is in `src/lib/db/schema.ts` and the SQL migrations in `drizzle/`. Only the server reads or writes; nothing is exposed to the browser.

## Format rules (from the brief)

- URLs: `https://`, no trailing slash, tracking params and `#fragments` removed. A store URL is just the origin, e.g. `https://graza.co`.
- Hex codes: uppercase with the hash, 6 digits, e.g. `#B45A35`.
- Selects store the option key, never the label. Keys are kebab-case (see below).
- Empty optional fields are `null`, never `""`. Empty lists are `null` too.
- Uploaded files are a list of `{ "name", "url", "type" }`. `url` is a Vercel Blob link with a long random suffix (public but unguessable, so the agent can read it without credentials); `type` is the MIME type.
- Phone numbers are E.164, e.g. `+15551234567`.
- Times are ISO 8601 in UTC.

## 1. `homepage_jobs`: the free homepage

Created when a qualified applicant books the call. One per application. This is what the agent reads to build the free homepage.

| Key | Value |
| --- | --- |
| `id` | uuid |
| `application_id` | uuid of the row in `applications` |
| `store_url` | URL |
| `style_pick` | look key |
| `reference_stores` | list of URLs (lookbook picks and pasted ones), 1 to 3 |
| `never_want` | text |
| `top_products` | list of product URLs from their store, 1 to 3 |
| `name`, `email`, `phone`, `phone_channel` | contact |
| `call_time` | ISO time, or `null` if the booking tool did not report it |
| `booking` | `{ provider, event_uri, invitee_uri, verified }` |
| `status` | `booked` or `canceled` |

Example: [sample-homepage-job.json](sample-homepage-job.json)

## 2. `jobs.doc`: the intake document

Written when the intake is submitted. One JSON document per job, grouped by step. Top level: `job_id`, `store_url`, `created_at`, `clock_started_at`, `status`, then the groups below.

Example from a real test run: [sample-intake.json](sample-intake.json)

| Group | Key | Value |
| --- | --- | --- |
| access | `store_url` | URL |
| | `collab_code` | text (digits) |
| | `access_confirmed` | boolean |
| brand | `logo_files` | files or null |
| | `colors_mode` | `keep`, `change`, `not-sure` |
| | `colors` | list of `{ "hex": "#B45A35", "role": "primary" }`, up to 5, or null. Roles: `primary`, `secondary`, `accent`, `background`, `text` |
| | `colors_from_store` | boolean. If true, read the colors from the theme |
| | `fonts_mode` | `keep`, `change`, `upload` |
| | `font_files` | files or null |
| | `style_pick` | look key |
| | `corners` | `square`, `slight`, `rounded`, `pill` |
| | `heading_font`, `body_font` | `serif`, `sans`, `keep-mine` |
| | `button_style` | `solid`, `outline`, `pill` |
| | `motion` | `none`, `subtle`, `lively` |
| | `density` | `airy`, `balanced`, `compact` |
| | `photo_style` | `product-on-plain`, `lifestyle`, `mixed` |
| | `color_mode` | `light`, `dark` |
| | `reference_stores` | list of URLs or null |
| | `never_want` | text or null |
| sells | `top_products` | list of URLs, up to 5 |
| | `margin_products` | list of URLs or null |
| | `push_products` | list of product or collection URLs, or null |
| | `photo_link` | URL or null |
| | `photo_files` | files or null |
| | `locked_pages` | list of URLs or null |
| customer | `customer` | text |
| | `faqs` | list of up to 3 texts, or null |
| | `objection` | text or null |
| | `best_review` | text or null |
| offers | `free_ship_threshold` | number, or null for no free shipping |
| | `gift_tiers` | `{ "enabled": true, "details": "..." }` (`details` null when not given or when enabled is false) |
| | `bundles` | same shape as `gift_tiers` |
| | `subscriptions` | `{ "status": "none" or "have-it" or "want-it", "app": "Recharge" or null }` |
| | `wholesale` | `none`, `have-it`, `want-it` |
| | `no_discounts` | text or null |
| apps | `email_platform` | `klaviyo`, `shopify-email`, `mailchimp`, `omnisend`, `attentive`, `none`, or the name they typed when they picked Other |
| | `reviews_app` | `judge-me`, `okendo`, `yotpo`, `loox`, `stamped`, `junip`, `shopify-reviews`, `none`, or the name they typed |
| | `keep_apps`, `remove_apps` | text or null |
| baseline | `base_cvr` | number, percent (2.4 means 2.4%) |
| | `base_aov` | number |
| | `base_sessions` | integer |
| | `base_revenue` | number |
| | `base_screenshot` | files or null. The four numbers can be null if they uploaded this instead |
| contact | `phone` | E.164 |
| | `phone_channel` | `imessage`, `whatsapp`, `sms` |
| | `approver_name`, `approver_email` | text |
| | `blackout_dates` | list of `{ "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" }`, up to 3, or null |
| | `notes` | text or null |

`baseline` holds client numbers for the 30 day report. Store them, but never show them on LE HQ.

### Three choices made where the brief left room

- `blackout_dates` is a list of ranges (up to 3) instead of one range, so a store can block more than one period.
- "Select with Other" stores the option key, or the typed name when Other is picked.
- `gift_tiers`, `bundles` and `subscriptions` are small objects so the yes or no and the details travel together.

## 3. Option keys

| Field | Keys |
| --- | --- |
| Look (`style_pick`) | `loud-and-bold`, `editorial-and-moody`, `clean-minimal`, `playful-and-illustrated`, `warm-and-natural` (same keys as Kent's lookbook.json) |
| `revenue_band` | `under-5k`, `5k-20k`, `20k-50k`, `50k-150k`, `over-150k` |
| `niche` | `tea-and-matcha`, `chocolate-and-sweets`, `sauces-and-pantry`, `bakery`, `snacks`, `drinks`, `coffee`, `other-food-and-drink`, `something-else` |
| `phone_channel` | `imessage`, `whatsapp`, `sms` |

## 4. Other tables

- `applications`: every application, partial or submitted. `stage` is `partial` (screen one only) or `submitted`. `outcome` is `qualified`, `review` or `not_fit`, with `qualify_reason` (`qualified`, `not_shopify`, `revenue_under_5k`, `store_unverified`, `niche_coffee`, `niche_something_else`, `niche_not_active`, `approved_by_kent`). `shopify_signal` says how the store was checked. `source` holds UTM tags, fbclid and the Meta cookies.
- `jobs`: paid rebuilds. `status` moves `awaiting_intake`, `intake_in_progress`, `intake_submitted`, `clock_started`. `clock_started_at` is stamped once, when the intake is submitted, store access is confirmed and payment has cleared.
- `site_config`: Kent's settings (prices, links, videos, lookbook, proof stores). Edited in /admin.
- `alerts`: every alert sent or attempted to Kent, with delivery results.
- Uploads: Vercel Blob, under `jobs/<job_id>/<field>/`, 50 MB per file.
