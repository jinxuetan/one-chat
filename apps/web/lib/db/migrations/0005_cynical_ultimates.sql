DROP TABLE "attachment" CASCADE;--> statement-breakpoint
DROP TABLE "message_attachment" CASCADE;--> statement-breakpoint
ALTER TABLE "message" DROP COLUMN "attachment_ids";--> statement-breakpoint
ALTER TABLE "message" DROP COLUMN "attachments";