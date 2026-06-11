import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

/**
 * Convex Auth configuration.
 *
 * This exports the auth helpers used throughout the backend. The `Password`
 * provider gives you email + password sign-in out of the box. You can add
 * OAuth providers (GitHub, Google, etc.) or magic links here.
 *
 * Docs: https://labs.convex.dev/auth
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
});
