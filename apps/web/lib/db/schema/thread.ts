import type { JSONValue } from "ai";
import { sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { nanoid, timestamps } from "./index";

export const roleEnum = pgEnum("role", ["user", "assistant", "system", "data"]);
export const statusEnum = pgEnum("status", [
  "pending",
  "streaming",
  "done",
  "error",
  "stopped",
]);
export const visibilityEnum = pgEnum("visibility", ["private", "public"]);

export const thread = pgTable(
  "thread",
  {
    id: varchar("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    userId: varchar("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    title: varchar("title").notNull().default("New Thread"),
    visibility: visibilityEnum("visibility").notNull().default("private"),
    originThreadId: varchar("origin_thread_id"),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      columns: [table.originThreadId],
      foreignColumns: [table.id],
      name: "origin_thread_fk",
    }).onDelete("set null"),
    // Thread queries by user (sidebar loading - most frequent query)
    index("idx_thread_user_id").on(table.userId),
    // Thread visibility for public sharing
    index("idx_thread_visibility")
      .on(table.visibility)
      .where(sql`${table.visibility} = 'public'`),
  ]
);

export const message = pgTable(
  "message",
  {
    id: varchar("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    threadId: varchar("thread_id")
      .references(() => thread.id, { onDelete: "cascade" })
      .notNull(),
    parts: jsonb("parts").notNull(),
    content: text("content"),
    role: roleEnum("role").notNull(),
    annotations: jsonb("annotations").$type<JSONValue[]>().default([]),
    model: varchar("model"),
    status: statusEnum("status").notNull().default("done"),
    isErrored: boolean("is_errored").notNull().default(false),
    isStopped: boolean("is_stopped").notNull().default(false),
    errorMessage: text("error_message"),
    ...timestamps,
  },
  (table) => [
    // Messages by thread with timestamp ordering (most critical - covers most queries)
    index("idx_message_thread_id_created_at").on(
      table.threadId,
      table.createdAt.desc()
    ),
    // Streaming/pending messages (for real-time features)
    index("idx_message_streaming")
      .on(table.threadId, table.createdAt.desc())
      .where(sql`${table.status} = 'streaming'`),
    // Assistant messages for model tracking
    index("idx_message_assistant_model")
      .on(table.threadId, table.createdAt.desc())
      .where(sql`${table.role} = 'assistant'`),
  ]
);
