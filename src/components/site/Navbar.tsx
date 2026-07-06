import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

import { NAV, SITE, type NavItem, type NavLink as NavChild } from "@/data/site";
import { cn } from "@/lib/utils";
import { useTrack } from "@/lib/analytics";

/** Map a nav link to the analytics event it should fire, if any. */
function trackNavChild(
  track: ReturnType<typeof useTrack>,
  child: NavChild,
) {
  if (child.to === "/menu/coffee") track("menu_click", { menu: "coffee", clickSource: "navbar" });
  else if (child.to === "/menu/food") track("menu_click", { menu: "food", clickSource: "navbar" });
  else if (/egiftcards/.test(child.to)) track("cta_click", { cta: "gift_card", destination: child.to });
}

/**
 * Hover underline: a 2px terracotta line pinned under a nav item that grows
 * from its center out to both edges on hover (origin-center + scale-x). It's
 * held open (scaled to full) for the active page via `after:scale-x-100`.
 */
const NAV_UNDERLINE =
  "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0.5 after:h-[2px] after:origin-center after:rounded-full after:bg-terracotta after:transition-transform after:duration-300 hover:after:scale-x-100";

function DesktopItem({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  const track = useTrack();

  if (!item.children) {
    return (
      <NavLink
        to={item.to!}
        className={({ isActive }) =>
          cn(
            "relative px-1 py-2 text-sm font-medium lowercase tracking-wide text-espresso/80 transition-colors hover:text-terracotta",
            NAV_UNDERLINE,
            isActive ? "text-terracotta after:scale-x-100" : "after:scale-x-0",
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
        className={cn(
          "relative flex items-center gap-1 px-1 py-2 text-sm font-medium lowercase tracking-wide text-espresso/80 transition-colors hover:text-terracotta",
          NAV_UNDERLINE,
          "after:scale-x-0",
        )}
        aria-expanded={open}
      >
        {item.label}
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
              {item.children.map((child) => {
                const cls =
                  "block px-5 py-3 text-sm font-medium text-espresso/80 transition-colors hover:bg-gold/15 hover:text-terracotta";
                return child.external ? (
                  <a
                    key={child.to}
                    href={child.to}
                    target="_blank"
                    rel="noreferrer"
                    className={cls}
                    onClick={() => trackNavChild(track, child)}
                  >
                    {child.label}
                  </a>
                ) : (
                  <Link
                    key={child.to}
                    to={child.to}
                    className={cls}
                    onClick={() => trackNavChild(track, child)}
                  >
                    {child.label}
                  </Link>
                );
              })}
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
  const track = useTrack();
  const settings = useQuery(api.settings.getPublicSettings);

  // Drop the Merch link when the page is turned off in the admin. Absent/loading
  // settings default to showing it (the common case), so nothing flickers.
  const navItems = useMemo(() => {
    if (settings?.merchEnabled === false) {
      return NAV.filter((item) => item.to !== "/retail");
    }
    return NAV;
  }, [settings?.merchEnabled]);

  useEffect(() => {
    // Only tracks whether we've scrolled past the top - the bar is always
    // visible and never hides on scroll direction.
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
        "fixed inset-x-0 top-[var(--preamp-ann-h,0px)] z-50 bg-cream shadow-sm transition-shadow duration-300",
        scrolled ? "shadow-maroon/10" : "shadow-maroon/5",
      )}
    >
      <nav
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between px-5 transition-all duration-300 md:px-8",
          // Mobile stays compact at all times. On desktop the bar expands a
          // touch at the very top, then tucks back in once the page scrolls.
          "py-4",
          !scrolled && "md:py-5",
        )}
      >
        <Link to="/" className="group flex items-center gap-3">
          <img
            src="/images/preamplogo.png"
            alt={`${SITE.name} logo`}
            width={46}
            height={46}
            className={cn(
              "object-contain transition-all duration-300 group-hover:-rotate-6",
              // Compact on mobile; ~15% larger on desktop at the very top.
              "h-10 w-10",
              !scrolled && "md:h-[2.875rem] md:w-[2.875rem]",
            )}
          />
        </Link>

        <div className="hidden items-center gap-5 md:flex lg:gap-6">
          {navItems.map((item) => (
            <DesktopItem key={item.label} item={item} />
          ))}
          <a
            href={SITE.orderUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              track("order_click", {
                clickSource: "navbar",
                destination: SITE.orderUrl,
              })
            }
            className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold uppercase tracking-wide text-cream shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brick hover:shadow-md"
          >
            Order now
          </a>
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
              {navItems.map((item) => (
                <div key={item.label}>
                  {item.to ? (
                    <Link
                      to={item.to}
                      className="block font-groovy text-lg lowercase text-espresso"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <>
                      <p className="font-groovy text-lg lowercase text-espresso">
                        {item.label}
                      </p>
                      <div className="mt-1 flex flex-col gap-1 pl-3">
                        {item.children!.map((child) =>
                          child.external ? (
                            <a
                              key={child.to}
                              href={child.to}
                              target="_blank"
                              rel="noreferrer"
                              className="py-1 text-sm text-espresso/70"
                              onClick={() => trackNavChild(track, child)}
                            >
                              {child.label}
                            </a>
                          ) : (
                            <Link
                              key={child.to}
                              to={child.to}
                              className="py-1 text-sm text-espresso/70"
                              onClick={() => trackNavChild(track, child)}
                            >
                              {child.label}
                            </Link>
                          ),
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
              <a
                href={SITE.orderUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  track("order_click", {
                    clickSource: "navbar",
                    destination: SITE.orderUrl,
                  })
                }
                className="mt-2 block rounded-full bg-terracotta px-5 py-3 text-center font-semibold uppercase tracking-wide text-cream"
              >
                Order now
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
