import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "convex/react";

/**
 * Gates its children behind authentication. While auth state is resolving we
 * render a lightweight loading state; unauthenticated users are redirected to
 * the sign-in page.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthLoading>
        <p className="text-sm text-gray-500">Loading…</p>
      </AuthLoading>
      <Unauthenticated>
        <Navigate to="/sign-in" replace />
      </Unauthenticated>
      <Authenticated>{children}</Authenticated>
    </>
  );
}
