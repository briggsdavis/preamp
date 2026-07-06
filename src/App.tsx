import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import { Layout } from "@/components/site/Layout";
import { ErrorBoundary } from "@/components/site/ErrorBoundary";
import { useTrack } from "@/lib/analytics";

// Admin (with its heavy charting deps) and the PDF viewer sit off the public
// funnel, so load them on demand — this keeps them out of the main bundle and
// speeds up first load for regular visitors.
const AdminApp = lazy(() =>
  import("@/admin/AdminApp").then((m) => ({ default: m.AdminApp })),
);
const PdfViewer = lazy(() =>
  import("@/pages/PdfViewer").then((m) => ({ default: m.PdfViewer })),
);
import { Home } from "@/pages/Home";
import { MenuCoffee } from "@/pages/MenuCoffee";
import { MenuFood } from "@/pages/MenuFood";
import { About } from "@/pages/About";
import { Merch } from "@/pages/Merch";
import { Contact } from "@/pages/Contact";
import { Events } from "@/pages/Events";
import { Hiring } from "@/pages/Hiring";
import { NotDeveloped } from "@/pages/NotDeveloped";

/** Shown if the menu's Convex query fails (e.g. backend not deployed). */
function MenuUnavailable() {
  return (
    <div className="bg-cream px-5 pb-20 pt-40 text-center">
      <h1 className="font-display text-4xl text-espresso">Menu</h1>
      <p className="mt-4 text-espresso/60">
        We couldn't load the menu right now. Please check back soon.
      </p>
    </div>
  );
}

/**
 * Route table for Pre Amp Coffee Studio. Only the home page is built out;
 * every other route renders the friendly "Not Brewed Yet" placeholder.
 * Routes are wrapped in AnimatePresence for cross-page transitions.
 */
export default function App() {
  const location = useLocation();
  const track = useTrack();

  // A menu item's page (/menu/<kind>/<slug>) is the menu page with a modal
  // open. Collapse it to the base menu route so opening/closing an item doesn't
  // trigger a full page transition or scroll reset behind the modal.
  const routeKey = location.pathname.replace(
    /^(\/menu\/(?:coffee|food))\/[^/]+$/,
    "$1",
  );

  // Jump to the top of the page on real route changes (not item open/close).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [routeKey]);

  // Record a page view on every route change (no-ops on /admin & /menu-pdf).
  useEffect(() => {
    track("page_view", { path: location.pathname });
  }, [location.pathname, track]);

  // The admin app renders on its own, without the public navbar/footer chrome.
  if (location.pathname.startsWith("/admin")) {
    return (
      <Suspense fallback={null}>
        <AdminApp />
      </Suspense>
    );
  }

  // Full-screen menu PDF viewer (its own tab, branded with the site favicon).
  if (location.pathname.startsWith("/menu-pdf")) {
    return (
      <Suspense fallback={null}>
        <PdfViewer />
      </Suspense>
    );
  }

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={routeKey}>
          <Route path="/" element={<Home />} />
          <Route
            path="/menu/coffee"
            element={
              <ErrorBoundary fallback={<MenuUnavailable />}>
                <MenuCoffee />
              </ErrorBoundary>
            }
          />
          {/* An item's own page — renders the coffee menu with its modal open. */}
          <Route
            path="/menu/coffee/:slug"
            element={
              <ErrorBoundary fallback={<MenuUnavailable />}>
                <MenuCoffee />
              </ErrorBoundary>
            }
          />
          <Route
            path="/menu/food"
            element={
              <ErrorBoundary fallback={<MenuUnavailable />}>
                <MenuFood />
              </ErrorBoundary>
            }
          />
          <Route
            path="/menu/food/:slug"
            element={
              <ErrorBoundary fallback={<MenuUnavailable />}>
                <MenuFood />
              </ErrorBoundary>
            }
          />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/retail" element={<Merch />} />
          <Route
            path="/events"
            element={
              <ErrorBoundary
                fallback={
                  <div className="bg-cream px-5 pb-20 pt-40 text-center">
                    <h1 className="font-display text-4xl text-espresso">
                      Events
                    </h1>
                    <p className="mt-4 text-espresso/60">
                      We couldn't load events right now. Please check back soon.
                    </p>
                  </div>
                }
              >
                <Events />
              </ErrorBoundary>
            }
          />
          <Route path="/gift-cards" element={<NotDeveloped />} />
          <Route path="/hiring" element={<Hiring />} />
          <Route path="*" element={<NotDeveloped />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}
