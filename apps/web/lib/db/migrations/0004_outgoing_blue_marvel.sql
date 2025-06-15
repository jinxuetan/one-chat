ALTER TYPE "public"."status" ADD VALUE 'stopped';--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "is_errored" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "is_stopped" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "error_message" text;