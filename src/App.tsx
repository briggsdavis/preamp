import { Routes, Route } from "react-router-dom";

import { RootLayout } from "@/components/layout/RootLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HomePage } from "@/pages/HomePage";
import { DashboardPage } from "@/pages/DashboardPage";
import { SignInPage } from "@/pages/SignInPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

/**
 * Application route table. Public routes render inside the shared layout;
 * the dashboard is wrapped in `ProtectedRoute` to require authentication.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="sign-in" element={<SignInPage />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
