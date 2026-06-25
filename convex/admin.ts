import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";

/**
 * Guard for admin-only queries and mutations.
 *
 * Every signed-in user is an admin (see `auth.ts`), so this just asserts that a
 * request is authenticated and returns the user id. Public endpoints (form
 * submissions, reading the live menu) deliberately do NOT call this.
 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError("Not signed in.");
  }
  return userId;
}
