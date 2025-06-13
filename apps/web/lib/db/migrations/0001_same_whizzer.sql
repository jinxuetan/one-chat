CREATE TYPE "public"."visibility" AS ENUM('private', 'public');--> statement-breakpoint
ALTER TABLE "thread" ADD COLUMN "visibility" "visibility" DEFAULT 'private' NOT NULL;