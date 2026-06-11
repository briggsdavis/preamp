import { useConvexAuth } from "convex/react";

/**
 * Convenience hook exposing the current auth state. Extend this to also fetch
 * the user document (e.g. `useQuery(api.users.current)`) once you add that
 * query to the backend.
 */
export function useCurrentUser() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  return { isLoading, isAuthenticated };
}
