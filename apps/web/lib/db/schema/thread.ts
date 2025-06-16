import type { JSONValue } from "ai";
import {
  boolean,
  foreignKey,
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
  ]
);

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
  isErrored: boolean("is_errored").notNull().default(false),
  isStopped: boolean("is_stopped").notNull().default(false),
  errorMessage: text("error_message"),
  ...timestamps,
});
