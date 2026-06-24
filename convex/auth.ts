import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexError } from "convex/values";

/**
 * Convex Auth configuration.
 *
 * The only people who ever sign in are admins, so we use a single email +
 * password provider and treat anyone signed in as an admin.
 *
 * Sign-up is gated: an account can only be created if its email appears in the
 * `ADMIN_EMAILS` environment variable (a comma-separated allowlist set in the
 * Convex dashboard). Sign-in is not gated here -- only existing accounts can
 * sign in, and accounts can only ever be created through the gate.
 *
 * Docs: https://labs.convex.dev/auth
 */

/** Parse the comma-separated `ADMIN_EMAILS` allowlist into a normalized set. */
function allowedAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email: string) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const email = String(params.email ?? "")
          .trim()
          .toLowerCase();

        // Only enforce the allowlist when creating a brand-new account.
        if (params.flow === "signUp") {
          if (!email) {
            throw new ConvexError("An email address is required.");
          }
          if (!allowedAdminEmails().has(email)) {
            throw new ConvexError(
              "This email isn't on the admin allowlist, so an account can't be created. Ask an existing admin to add it to ADMIN_EMAILS.",
            );
          }
        }

        return { email };
      },
    }),
  ],
});
