import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

import { Layout } from "@/components/site/Layout";
import { ErrorBoundary } from "@/components/site/ErrorBoundary";
import { useTrack } from "@/lib/analytics";

// Admin (with its heavy charting deps) and the PDF viewer sit off the public
// funnel, so load them on demand - this keeps them out of the main bundle and
// speeds up first load for regular visitors.
const AdminApp = lazy(() =>
  import("@/admin/AdminApp").then((m) => ({ default: m.AdminApp })),
);
const PdfViewer = lazy(() =>
  import("@/pages/PdfViewer").then((m) => ({ default: m.PdfViewer })),
);
import { Home } from "@/pages/Home";
import { MenuDynamic } from "@/pages/MenuDynamic";
import { About } from "@/pages/About";
import { Merch } from "@/pages/Merch";
import { ColdBrew } from "@/pages/ColdBrew";
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
 * Pages render instantly on navigation; reveal motion is scroll-driven only.
 */
export default function App() {
  const location = useLocation();
  const track = useTrack();
  const settings = useQuery(api.settings.getPublicSettings);
  // Per-page visibility. Only an explicit `false` turns a page off; absent or
  // still-loading settings keep every page on, so routes never flash a redirect.
  const merchEnabled = settings?.merchEnabled !== false;
  const aboutEnabled = settings?.aboutEnabled !== false;
  const coffeeEnabled = settings?.coffeeEnabled !== false;
  const foodEnabled = settings?.foodEnabled !== false;
  const eventsEnabled = settings?.eventsEnabled !== false;
  const coldBrewEnabled = settings?.coldBrewEnabled !== false;
  const hiringEnabled = settings?.hiringEnabled !== false;

  // A menu item's page (/menu/<kind>/<slug>) is the menu page with a modal
  // open. Collapse it to the base menu route so opening/closing an item doesn't
  // trigger a full page transition or scroll reset behind the modal.
  const routeKey = location.pathname
    .replace(/^(\/menu\/[^/]+)\/[^/]+$/, "$1")
    .replace(/^(\/retail)\/[^/]+$/, "$1");
  const hiddenBuiltInMenu =
    (location.pathname.startsWith("/menu/coffee") && !coffeeEnabled) ||
    (location.pathname.startsWith("/menu/food") && !foodEnabled);

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
      <Routes location={location} key={routeKey}>
          <Route path="/" element={<Home />} />
          <Route
            path="/menu/:menuSlug"
            element={
              !hiddenBuiltInMenu ? (
                <ErrorBoundary fallback={<MenuUnavailable />}>
                  <MenuDynamic />
                </ErrorBoundary>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          {/* An item's own page - renders the menu with its modal open. */}
          <Route
            path="/menu/:menuSlug/:slug"
            element={
              !hiddenBuiltInMenu ? (
                <ErrorBoundary fallback={<MenuUnavailable />}>
                  <MenuDynamic />
                </ErrorBoundary>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/about"
            element={aboutEnabled ? <About /> : <Navigate to="/" replace />}
          />
          <Route path="/contact" element={<Contact />} />
          <Route
            path="/retail"
            element={merchEnabled ? <Merch /> : <Navigate to="/" replace />}
          />
          <Route
            path="/retail/:slug"
            element={merchEnabled ? <Merch /> : <Navigate to="/" replace />}
          />
          <Route
            path="/cold-brew"
            element={coldBrewEnabled ? <ColdBrew /> : <Navigate to="/" replace />}
          />
          <Route
            path="/events"
            element={
              eventsEnabled ? (
                <ErrorBoundary
                  fallback={
                    <div className="bg-cream px-5 pb-20 pt-40 text-center">
                      <h1 className="font-display text-4xl text-espresso">
                        Events
                      </h1>
                      <p className="mt-4 text-espresso/60">
                        We couldn't load events right now. Please check back
                        soon.
                      </p>
                    </div>
                  }
                >
                  <Events />
                </ErrorBoundary>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="/gift-cards" element={<NotDeveloped />} />
          <Route
            path="/hiring"
            element={hiringEnabled ? <Hiring /> : <Navigate to="/" replace />}
          />
          <Route path="*" element={<NotDeveloped />} />
      </Routes>
    </Layout>
  );
}
