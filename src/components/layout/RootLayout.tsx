import { Outlet } from "react-router-dom";

import { Header } from "@/components/layout/Header";

/**
 * Shared page shell: header + routed page content. Add footers, toasts,
 * or global modals here.
 */
export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-50">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
