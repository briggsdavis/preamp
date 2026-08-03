import { api } from "@convex/_generated/api"
import { useQuery } from "convex/react"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useMemo, useState } from "react"
import { Link, NavLink, useLocation } from "react-router"
import { NAV, type NavItem, type NavLink as NavChild } from "@/data/site"
import { useTrack } from "@/lib/analytics"
import { useGlobalContent } from "@/lib/site-content"
import { cn } from "@/lib/utils"

/** Map a nav link to the analytics event it should fire, if any. */
function trackNavChild(track: ReturnType<typeof useTrack>, child: NavChild) {
  if (child.to === "/menu/coffee") track("menu_click", { menu: "coffee", clickSource: "navbar" })
  else if (child.to === "/menu/food") track("menu_click", { menu: "food", clickSource: "navbar" })
  else if (child.to.startsWith("/menu/"))
    track("menu_click", { menu: child.to.split("/")[2], clickSource: "navbar" })
  else if (/egiftcards/.test(child.to))
    track("cta_click", { cta: "gift_card", destination: child.to })
}

/**
 * Hover underline: a 2px terracotta line pinned under a nav item that grows
 * from its center out to both edges on hover (origin-center + scale-x). It's
 * held open (scaled to full) for the active page via `after:scale-x-100`.
 */
const NAV_UNDERLINE =
  "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0.5 after:h-[2px] after:origin-center after:rounded-full after:bg-terracotta after:transition-transform after:duration-300 hover:after:scale-x-100"

function DesktopItem({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false)
  const track = useTrack()

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
    )
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
            className="absolute top-full left-1/2 z-50 -translate-x-1/2 pt-3"
          >
            <div className="min-w-[180px] overflow-hidden rounded-2xl border border-espresso/10 bg-cream shadow-xl shadow-maroon/10">
              {item.children.map((child) => {
                const cls =
                  "block px-5 py-3 text-sm font-medium text-espresso/80 transition-colors hover:bg-gold/15 hover:text-terracotta"
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
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const track = useTrack()
  const global = useGlobalContent()
  const settings = useQuery(api.settings.getPublicSettings)
  const menuPages = useQuery(api.menu.listMenuPages)

  // Drop links for any page turned off in the admin. A `to` is enabled unless
  // its setting is an explicit `false`, so absent/loading settings keep every
  // link visible (the common case) and nothing flickers. Dropdown children are
  // filtered too, and a dropdown with no children left is dropped entirely.
  const navItems = useMemo(() => {
    const linkEnabled = (to?: string) => {
      switch (to) {
        case "/menu/coffee":
          return settings?.coffeeEnabled !== false
        case "/menu/food":
          return settings?.foodEnabled !== false
        case "/events":
          return settings?.eventsEnabled !== false
        case "/retail":
          return settings?.merchEnabled !== false
        case "/cold-brew":
          return settings?.coldBrewEnabled !== false
        case "/about":
          return settings?.aboutEnabled !== false
        case "/hiring":
          return settings?.hiringEnabled !== false
        default:
          // The Gift Card entry is an external Toast link, matched by URL.
          if (to && /egiftcards/.test(to)) {
            return settings?.giftCardEnabled !== false
          }
          return true
      }
    }

    const withLiveMenus = NAV.map((item) =>
      item.label === "Menu"
        ? {
            ...item,
            children:
              menuPages?.map((page) => ({
                label: page.title,
                to: `/menu/${page.slug}`,
                external: false,
              })) ??
              item.children ??
              [],
          }
        : item,
    )

    return withLiveMenus.flatMap((item) => {
      if (item.children) {
        const children = item.children.filter((c) => linkEnabled(c.to))
        return children.length ? [{ ...item, children }] : []
      }
      return linkEnabled(item.to) ? [item] : []
    })
  }, [settings, menuPages])

  // Mobile uses one clear tap target per row. Dropdown headings are omitted
  // because they are labels rather than destinations.
  const mobileNavRows = useMemo<NavChild[]>(
    () =>
      navItems.flatMap(
        (item) =>
          item.children ?? (item.to ? [{ label: item.label, to: item.to, external: false }] : []),
      ),
    [navItems],
  )

  useEffect(() => {
    // Only tracks whether we've scrolled past the top - the bar is always
    // visible and never hides on scroll direction.
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Close the mobile drawer whenever the route changes (sync UI to the router).
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

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
          "py-3 md:py-4",
          !scrolled && "md:py-5",
        )}
      >
        <Link to="/" className="group flex items-center gap-3">
          <img
            src="/images/preamplogo.png"
            alt={`${global.businessName} logo`}
            width={46}
            height={46}
            className={cn(
              "object-contain transition-all duration-300 group-hover:-rotate-6",
              // Compact on mobile; ~15% larger on desktop at the very top.
              "h-9 w-9 md:h-10 md:w-10",
              !scrolled && "md:h-[2.875rem] md:w-[2.875rem]",
            )}
          />
        </Link>

        <div className="hidden items-center gap-5 md:flex lg:gap-6">
          {navItems.map((item) => (
            <DesktopItem key={item.label} item={item} />
          ))}
          <a
            href={global.orderUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              track("order_click", {
                clickSource: "navbar",
                destination: global.orderUrl,
              })
            }
            className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold tracking-wide text-cream uppercase shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brick hover:shadow-md"
          >
            Order now
          </a>
        </div>

        <div className="ml-auto flex items-center gap-1.5 md:hidden">
          <button
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5"
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
              className={cn("h-0.5 w-6 bg-espresso transition-all", mobileOpen && "opacity-0")}
            />
            <span
              className={cn(
                "h-0.5 w-6 bg-espresso transition-all",
                mobileOpen && "-translate-y-2 -rotate-45",
              )}
            />
          </button>
          <a
            href={global.orderUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              track("order_click", {
                clickSource: "navbar-mobile",
                destination: global.orderUrl,
              })
            }
            className="rounded-full bg-terracotta px-4 py-2 text-xs font-semibold tracking-wide text-cream uppercase shadow-sm"
          >
            Order now
          </a>
        </div>
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
            <div>
              {mobileNavRows.map((row, index) => {
                const className = cn(
                  "block px-6 py-4 font-groovy text-base text-espresso uppercase transition-colors active:bg-logo-orange active:text-cream",
                  index % 2 === 0 ? "bg-cream" : "bg-cream-deep",
                )
                return row.external ? (
                  <a
                    key={row.to}
                    href={row.to}
                    target="_blank"
                    rel="noreferrer"
                    className={className}
                    onClick={() => trackNavChild(track, row)}
                  >
                    {row.label}
                  </a>
                ) : (
                  <Link
                    key={row.to}
                    to={row.to!}
                    className={className}
                    onClick={() => trackNavChild(track, row)}
                  >
                    {row.label}
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
