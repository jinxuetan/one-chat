import {
  foreignKey,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { nanoid, timestamps } from "./index";
import { Attachment, JSONValue } from "ai";

export const roleEnum = pgEnum("role", ["user", "assistant", "system", "data"]);
export const statusEnum = pgEnum("status", [
  "pending",
  "streaming",
  "done",
  "error",
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
  ]
);

// Attachment table for file uploads
export const attachment = pgTable("attachment", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: varchar("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  fileKey: varchar("file_key").notNull(),
  fileName: varchar("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type").notNull(),
  attachmentType: varchar("attachment_type").notNull().default("file"),
  attachmentUrl: text("attachment_url").notNull(),
  ...timestamps,
});

export const message = pgTable("message", {
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
  attachmentIds: jsonb("attachment_ids").$type<string[]>().default([]),
  attachments: jsonb("attachments").$type<Attachment[]>().default([]),
  ...timestamps,
});

// Junction table for message-attachment relationships
export const messageAttachment = pgTable("message_attachment", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  messageId: varchar("message_id")
    .references(() => message.id, { onDelete: "cascade" })
    .notNull(),
  attachmentId: varchar("attachment_id")
    .references(() => attachment.id, { onDelete: "cascade" })
    .notNull(),
  ...timestamps,
});
