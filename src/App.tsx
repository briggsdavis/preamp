import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import { Layout } from "@/components/site/Layout";
import { Home } from "@/pages/Home";
import { MenuCoffee } from "@/pages/MenuCoffee";
import { MenuFood } from "@/pages/MenuFood";
import { Merch } from "@/pages/Merch";
import { Contact } from "@/pages/Contact";
import { Events } from "@/pages/Events";
import { Hiring } from "@/pages/Hiring";
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
          <Route path="/menu/coffee" element={<MenuCoffee />} />
          <Route path="/menu/food" element={<MenuFood />} />
          <Route path="/about" element={<NotDeveloped />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/retail" element={<Merch />} />
          <Route path="/events" element={<Events />} />
          <Route path="/gift-cards" element={<NotDeveloped />} />
          <Route path="/hiring" element={<Hiring />} />
          <Route path="*" element={<NotDeveloped />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}
