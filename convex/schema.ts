import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

/**
 * The database schema for your Convex backend.
 *
 * `authTables` provides the tables required by Convex Auth (users, sessions,
 * accounts, etc.). Add your own application tables alongside them below.
 *
 * Docs: https://docs.convex.dev/database/schemas
 */
export default defineSchema({
  ...authTables,

  // Example application table — replace with your own.
  messages: defineTable({
    authorId: v.id("users"),
    body: v.string(),
  }).index("by_author", ["authorId"]),
});
