ALTER TABLE "applications" ADD COLUMN "style_other" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "styles_viewed" jsonb;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "stores_clicked" jsonb;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "lead_at" timestamp with time zone;