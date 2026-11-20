import type { Look, Niche, PhoneChannel, RevenueBand } from "@/lib/options"

export type Outcome = "qualified" | "review" | "not_fit"

/** Where the visitor came from. Stored on the application, used for Meta CAPI matching. */
export type SourceInfo = {
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_content?: string | null
  utm_term?: string | null
  fbclid?: string | null
  fbp?: string | null
  fbc?: string | null
  referrer?: string | null
  landing_url?: string | null
  ip?: string | null
  user_agent?: string | null
}

export type Application = {
  id: string
  created_at: string
  updated_at: string
  stage: "partial" | "submitted"
  resume_token: string
  style_pick: Look | null
  store_url: string | null
  revenue_band: RevenueBand | null
  niche: Niche | null
  main_problem: string | null
  name: string | null
  email: string | null
  phone: string | null
  phone_channel: PhoneChannel | null
  is_shopify: boolean | null
  shopify_signal: string | null
  store_checked_at: string | null
  store_name: string | null
  qualified: boolean | null
  outcome: Outcome | null
  qualify_reason: string | null
  needs_review: boolean
  // Page 2 answers, saved as soon as they are given
  reference_stores: string[] | null
  never_want: string | null
  top_products: string[] | null
  design_saved_at: string | null
  // The lookbook: free text when no look fits, looks opened and live stores visited (first-seen order)
  style_other: string | null
  styles_viewed: string[] | null
  stores_clicked: string[] | null
  /** When the Meta Lead event was sent (once per application). */
  lead_at: string | null
  source: SourceInfo | null
  submitted_at: string | null
}

export type BookingInfo = {
  provider: "calendly" | "google" | "other"
  event_uri?: string | null
  invitee_uri?: string | null
  cancel_url?: string | null
  reschedule_url?: string | null
  verified: boolean
  canceled_at?: string | null
  no_show_at?: string | null
  rebook_sent_at?: string | null
  rebook_channel?: "sms" | "email" | null
}

/** The record Kent's agent reads to build the free homepage. */
export type HomepageJob = {
  id: string
  created_at: string
  updated_at: string
  application_id: string
  store_url: string
  style_pick: Look
  reference_stores: string[]
  never_want: string | null
  top_products: string[]
  name: string | null
  email: string | null
  phone: string | null
  phone_channel: PhoneChannel | null
  call_time: string | null
  booking: BookingInfo | null
  status: "booked" | "canceled"
}

export type UploadedFile = { name: string; url: string; type: string }

export type JobStatus =
  | "awaiting_intake"
  | "intake_in_progress"
  | "intake_submitted"
  | "clock_started"
  | "preview_sent"
  | "live"
  | "canceled"

export type PaymentInfo = {
  provider: "stripe"
  session_id: string
  amount_total: number | null
  currency: string | null
  email: string | null
  payment_status: string | null
}

/** A paid 48 hour rebuild. Holds the intake while it is filled and the final document. */
export type Job = {
  id: string
  created_at: string
  updated_at: string
  application_id: string | null
  intake_token: string
  email: string | null
  name: string | null
  store_url: string | null
  status: JobStatus
  paid_at: string | null
  stripe_session_id: string | null
  payment: PaymentInfo | null
  intake_step: number
  intake_draft: Record<string, unknown>
  intake_submitted_at: string | null
  access_confirmed: boolean
  clock_started_at: string | null
  doc: Record<string, unknown> | null
}

export type AlertRow = {
  id?: number
  created_at?: string
  kind: string
  message: string
  context: Record<string, unknown> | null
  delivered: Record<string, unknown> | null
}
