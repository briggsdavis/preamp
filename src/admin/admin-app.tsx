import { Authenticated, Unauthenticated, AuthLoading } from "convex/react"
import { AdminLayout } from "@/admin/admin-layout"
import { AuthScreen } from "@/admin/auth-screen"

/**
 * Entry point for everything under `/admin`. Gates on Convex Auth state:
 * signed-in admins get the dashboard; everyone else gets the sign-in screen.
 */
export function AdminApp() {
  return (
    <>
      <AuthLoading>
        <div className="flex min-h-screen items-center justify-center bg-espresso text-cream">
          <p className="font-display text-2xl">Loading…</p>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <AuthScreen />
      </Unauthenticated>
      <Authenticated>
        <AdminLayout />
      </Authenticated>
    </>
  )
}
