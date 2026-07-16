import { type ReactNode } from "react";

import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { PopupHost } from "@/components/site/PopupHost";
import { StickyOrderBar } from "@/components/site/StickyOrderBar";
import { ErrorBoundary } from "@/components/site/ErrorBoundary";
import { GlobalContentProvider } from "@/lib/siteContent";

/** Global page shell: grain overlay, fixed navbar, routed content, footer. */
export function Layout({ children }: { children: ReactNode }) {
  return (
    <GlobalContentProvider>
    <div className="grain flex min-h-screen flex-col">
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
      <StickyOrderBar />
    </div>
    </GlobalContentProvider>
  );
}
