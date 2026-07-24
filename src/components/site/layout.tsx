import { type ReactNode } from "react"
import { AnnouncementBar } from "@/components/site/announcement-bar"
import { ErrorBoundary } from "@/components/site/error-boundary"
import { Footer } from "@/components/site/footer"
import { Navbar } from "@/components/site/navbar"
import { PopupHost } from "@/components/site/popup-host"
import { StickyOrderBar } from "@/components/site/sticky-order-bar"
import { GlobalContentProvider } from "@/lib/site-content"

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
  )
}
