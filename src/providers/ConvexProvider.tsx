import { type ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

if (!convexUrl) {
  throw new Error(
    "Missing VITE_CONVEX_URL. Run `npx convex dev` to create a deployment, " +
      "then copy `.env.local.example` to `.env.local`.",
  );
}

const convex = new ConvexReactClient(convexUrl);

/**
 * Wraps the app with the Convex client and Convex Auth context so any
 * component can call `useQuery`, `useMutation`, and the auth hooks.
 */
export function ConvexProvider({ children }: { children: ReactNode }) {
  return <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>;
}
