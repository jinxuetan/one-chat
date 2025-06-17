CREATE INDEX "idx_account_user_id" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_account_provider_account" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "idx_session_token" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_session_user_id" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_session_expires_at" ON "session" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_user_email" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_message_thread_id_created_at" ON "message" USING btree ("thread_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_message_streaming" ON "message" USING btree ("thread_id","created_at" DESC NULLS LAST) WHERE "message"."status" = 'streaming';--> statement-breakpoint
CREATE INDEX "idx_message_assistant_model" ON "message" USING btree ("thread_id","created_at" DESC NULLS LAST) WHERE "message"."role" = 'assistant';--> statement-breakpoint
CREATE INDEX "idx_thread_user_id" ON "thread" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_thread_visibility" ON "thread" USING btree ("visibility") WHERE "thread"."visibility" = 'public';