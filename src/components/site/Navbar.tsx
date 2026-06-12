import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import { NAV, SITE, type NavItem } from "@/data/site";
import { cn } from "@/lib/utils";

function DesktopItem({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);

  if (!item.children) {
    return (
      <NavLink
        to={item.to!}
        className={({ isActive }) =>
          cn(
            "relative px-1 py-2 text-sm font-medium tracking-wide text-espresso/80 transition-colors hover:text-terracotta",
            isActive && "text-terracotta",
          )
        }
      >
        {item.label}
      </NavLink>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className="flex items-center gap-1 px-1 py-2 text-sm font-medium tracking-wide text-espresso/80 transition-colors hover:text-terracotta"
        aria-expanded={open}
      >
        {item.label}
        <span
          className={cn(
            "text-[10px] transition-transform duration-200",
            open && "rotate-180",
          )}
        >
          ▾
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3"
          >
            <div className="min-w-[180px] overflow-hidden rounded-2xl border border-espresso/10 bg-cream shadow-xl shadow-maroon/10">
              {item.children.map((child) => (
                <Link
                  key={child.to}
                  to={child.to}
                  className="block px-5 py-3 text-sm font-medium text-espresso/80 transition-colors hover:bg-gold/15 hover:text-terracotta"
                >
                  {child.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile drawer whenever the route changes (sync UI to the router).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- closing the drawer on navigation is the intended sync
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-cream/90 shadow-sm shadow-maroon/10 backdrop-blur-md"
          : "bg-transparent",
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
        <Link to="/" className="group flex items-center gap-3">
          <span className="relative grid h-10 w-10 place-items-center rounded-full bg-espresso text-cream">
            <span className="absolute h-3 w-3 rounded-full bg-gold" />
            <span className="absolute inset-1 rounded-full border border-cream/30 animate-spin-slow" />
          </span>
          <span className="leading-none">
            <span className="block font-groovy text-lg tracking-wide text-espresso">
              {SITE.name}
            </span>
            <span className="block text-[10px] uppercase tracking-[0.3em] text-terracotta">
              {SITE.tagline}
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <DesktopItem key={item.label} item={item} />
          ))}
          <Link
            to="/menu/coffee"
            className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-cream shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brick hover:shadow-md"
          >
            Order
          </Link>
        </div>

        <button
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <span
            className={cn(
              "h-0.5 w-6 bg-espresso transition-all",
              mobileOpen && "translate-y-2 rotate-45",
            )}
          />
          <span
            className={cn(
              "h-0.5 w-6 bg-espresso transition-all",
              mobileOpen && "opacity-0",
            )}
          />
          <span
            className={cn(
              "h-0.5 w-6 bg-espresso transition-all",
              mobileOpen && "-translate-y-2 -rotate-45",
            )}
          />
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-espresso/10 bg-cream md:hidden"
          >
            <div className="space-y-4 px-6 py-6">
              {NAV.map((item) => (
                <div key={item.label}>
                  {item.to ? (
                    <Link
                      to={item.to}
                      className="block font-groovy text-lg text-espresso"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <>
                      <p className="font-groovy text-lg text-espresso">
                        {item.label}
                      </p>
                      <div className="mt-1 flex flex-col gap-1 pl-3">
                        {item.children!.map((child) => (
                          <Link
                            key={child.to}
                            to={child.to}
                            className="py-1 text-sm text-espresso/70"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
              <Link
                to="/menu/coffee"
                className="mt-2 block rounded-full bg-terracotta px-5 py-3 text-center font-semibold text-cream"
              >
                Order
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
