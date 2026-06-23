import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import { Layout } from "@/components/site/Layout";
import { Home } from "@/pages/Home";
import { NotDeveloped } from "@/pages/NotDeveloped";

/**
 * Route table for Pre Amp Coffee Studio. Only the home page is built out;
 * every other route renders the friendly "Not Brewed Yet" placeholder.
 * Routes are wrapped in AnimatePresence for cross-page transitions.
 */
export default function App() {
  const location = useLocation();

  // Jump to the top of the page on every route change.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/menu/coffee" element={<NotDeveloped />} />
          <Route path="/menu/food" element={<NotDeveloped />} />
          <Route path="/about" element={<NotDeveloped />} />
          <Route path="/contact" element={<NotDeveloped />} />
          <Route path="/retail" element={<NotDeveloped />} />
          <Route path="/events" element={<NotDeveloped />} />
          <Route path="/gift-cards" element={<NotDeveloped />} />
          <Route path="/hiring" element={<NotDeveloped />} />
          <Route path="*" element={<NotDeveloped />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}
