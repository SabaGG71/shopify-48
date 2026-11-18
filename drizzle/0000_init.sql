CREATE TABLE "alerts" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"kind" text NOT NULL,
	"message" text NOT NULL,
	"context" jsonb,
	"delivered" jsonb
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"stage" text DEFAULT 'partial' NOT NULL,
	"resume_token" text NOT NULL,
	"style_pick" text,
	"store_url" text,
	"revenue_band" text,
	"niche" text,
	"main_problem" text,
	"name" text,
	"email" text,
	"phone" text,
	"phone_channel" text,
	"is_shopify" boolean,
	"shopify_signal" text,
	"store_checked_at" timestamp with time zone,
	"store_name" text,
	"qualified" boolean,
	"outcome" text,
	"qualify_reason" text,
	"needs_review" boolean DEFAULT false NOT NULL,
	"reference_stores" jsonb,
	"never_want" text,
	"top_products" jsonb,
	"design_saved_at" timestamp with time zone,
	"source" jsonb,
	"submitted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "homepage_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"application_id" uuid NOT NULL,
	"store_url" text NOT NULL,
	"style_pick" text NOT NULL,
	"reference_stores" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"never_want" text,
	"top_products" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"name" text,
	"email" text,
	"phone" text,
	"phone_channel" text,
	"call_time" timestamp with time zone,
	"booking" jsonb,
	"status" text DEFAULT 'booked' NOT NULL,
	CONSTRAINT "homepage_jobs_application_id_unique" UNIQUE("application_id")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"application_id" uuid,
	"intake_token" text NOT NULL,
	"email" text,
	"name" text,
	"store_url" text,
	"status" text DEFAULT 'awaiting_intake' NOT NULL,
	"paid_at" timestamp with time zone,
	"stripe_session_id" text,
	"payment" jsonb,
	"intake_step" integer DEFAULT 1 NOT NULL,
	"intake_draft" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"intake_submitted_at" timestamp with time zone,
	"access_confirmed" boolean DEFAULT false NOT NULL,
	"clock_started_at" timestamp with time zone,
	"doc" jsonb,
	CONSTRAINT "jobs_intake_token_unique" UNIQUE("intake_token"),
	CONSTRAINT "jobs_stripe_session_id_unique" UNIQUE("stripe_session_id")
);
--> statement-breakpoint
CREATE TABLE "site_config" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "homepage_jobs" ADD CONSTRAINT "homepage_jobs_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "applications_created_idx" ON "applications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "applications_email_idx" ON "applications" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "jobs_created_idx" ON "jobs" USING btree ("created_at");