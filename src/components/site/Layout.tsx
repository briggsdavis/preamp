import { type ReactNode } from "react";

import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Preloader } from "@/components/site/Preloader";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { PopupHost } from "@/components/site/PopupHost";
import { ErrorBoundary } from "@/components/site/ErrorBoundary";

/** Global page shell: grain overlay, fixed navbar, routed content, footer. */
export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="grain flex min-h-screen flex-col">
      <Preloader />
      {/* Marketing widgets read live data from Convex. If those queries fail
          (e.g. the backend isn't deployed), hide them rather than blank the
          whole site. */}
      <ErrorBoundary fallback={null}>
        <AnnouncementBar />
      </ErrorBoundary>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <ErrorBoundary fallback={null}>
        <PopupHost />
      </ErrorBoundary>
    </div>
  );
}
