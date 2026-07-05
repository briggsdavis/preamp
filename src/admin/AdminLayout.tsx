import { lazy, Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

import { DialogProvider } from "@/admin/dialogs";

import { Home } from "@/admin/sections/Home";
import { MenuManager } from "@/admin/sections/MenuManager";
import { Inquiries } from "@/admin/sections/Inquiries";
import { Announcements } from "@/admin/sections/Announcements";
import { Popups } from "@/admin/sections/Popups";
import { Events } from "@/admin/sections/Events";
import { Reviews } from "@/admin/sections/Reviews";
import { AboutEditor } from "@/admin/sections/AboutEditor";
import { PagePlaceholder } from "@/admin/sections/PagePlaceholder";

// Recharts is heavy and admin-only — load the dashboard on demand so it never
// touches the public site or the rest of the admin bundle.
const Analytics = lazy(() =>
  import("@/admin/sections/Analytics").then((m) => ({ default: m.Analytics })),
);

/**
 * The signed-in admin shell: a left sidebar with collapsible nav groups and a
 * content area that swaps in the selected section's editor.
 */

type NavGroup = {
  label: string;
  items: { id: string; label: string }[];
};

const NAV: NavGroup[] = [
  {
    label: "Home",
    items: [{ id: "home", label: "Home" }],
  },
  {
    label: "Analytics",
    items: [{ id: "analytics", label: "Dashboard" }],
  },
  // The three collapsible dropdowns are grouped together, stacked directly on
  // top of one another.
  {
    label: "Page Editor",
    items: [
      { id: "page-home", label: "Home" },
      { id: "page-about", label: "About" },
      { id: "page-global", label: "Global / Footer / Contact" },
    ],
  },
  {
    label: "Menu",
    items: [
      { id: "menu-coffee", label: "Coffee" },
      { id: "menu-food", label: "Food" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { id: "announcements", label: "Announcement Bar" },
      { id: "popups", label: "Pop-up" },
    ],
  },
  {
    label: "Inquiries",
    items: [{ id: "inquiries", label: "All Inquiries" }],
  },
  {
    label: "Events",
    items: [{ id: "events", label: "All Events" }],
  },
  {
    label: "Reviews",
    items: [{ id: "reviews", label: "All Reviews" }],
  },
];

export function AdminLayout() {
  const { signOut } = useAuthActions();
  const [selected, setSelected] = useState("home");
  // Dropdowns start collapsed; the admin expands what they need.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Live counts for the sidebar "needs attention" badges.
  const inquiryCounts = useQuery(api.inquiries.counts);
  const reviewStats = useQuery(api.reviews.stats);

  function badgeFor(label: string): number {
    if (label === "Inquiries") return inquiryCounts?.totalUnread ?? 0;
    if (label === "Reviews") return reviewStats?.pending ?? 0;
    return 0;
  }

  function toggleGroup(label: string) {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <DialogProvider>
    <div className="flex min-h-screen bg-cream-deep text-espresso">
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r-2 border-sand bg-cream">
        <div className="border-b-2 border-sand px-5 py-5">
          <p className="font-groovy text-xs uppercase tracking-[0.3em] text-terracotta">
            Pre Amp
          </p>
          <p className="font-display text-2xl leading-none">Admin</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV.map((group) => {
            const isSingle = group.items.length === 1;
            return (
              <div key={group.label} className="mb-2">
                {isSingle ? (
                  <NavButton
                    label={group.label}
                    active={selected === group.items[0].id}
                    badge={badgeFor(group.label)}
                    onClick={() => setSelected(group.items[0].id)}
                  />
                ) : (
                  <>
                    <motion.button
                      type="button"
                      onClick={() => toggleGroup(group.label)}
                      whileTap={{ scale: 0.98 }}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left font-semibold text-espresso/80 transition-colors hover:bg-cream-deep"
                    >
                      {group.label}
                      <motion.span
                        className="text-xs"
                        animate={{ rotate: openGroups[group.label] ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        ▶
                      </motion.span>
                    </motion.button>
                    <AnimatePresence initial={false}>
                      {openGroups[group.label] && (
                        <motion.div
                          key="items"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="mt-1 space-y-0.5 pl-3">
                            {group.items.map((item) => (
                              <NavButton
                                key={item.id}
                                label={item.label}
                                small
                                active={selected === item.id}
                                onClick={() => setSelected(item.id)}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t-2 border-sand p-3">
          <motion.a
            href="/"
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="mb-2 block rounded-lg px-3 py-2 text-center text-sm font-semibold text-espresso/70 transition-colors hover:bg-cream-deep"
          >
            ← Back to site
          </motion.a>
          <motion.button
            type="button"
            onClick={() => void signOut()}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="w-full rounded-lg bg-espresso px-3 py-2 text-sm font-semibold text-cream transition-colors hover:bg-maroon"
          >
            Sign out
          </motion.button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-x-hidden px-6 py-8 md:px-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Panel selected={selected} onNavigate={setSelected} />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
    </DialogProvider>
  );
}

function NavButton({
  label,
  active,
  onClick,
  small,
  badge = 0,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  small?: boolean;
  badge?: number;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
        small ? "text-sm" : "font-semibold"
      } ${
        active
          ? "bg-brick text-cream"
          : "text-espresso/80 hover:bg-cream-deep"
      }`}
    >
      <span>{label}</span>
      {badge > 0 && (
        <span
          className={`min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-[0.65rem] font-bold ${
            active ? "bg-cream text-brick" : "bg-brick text-cream"
          }`}
          aria-label={`${badge} need attention`}
        >
          {badge}
        </span>
      )}
    </motion.button>
  );
}

function Panel({
  selected,
  onNavigate,
}: {
  selected: string;
  onNavigate: (section: string) => void;
}) {
  switch (selected) {
    case "home":
      return <Home onNavigate={onNavigate} />;
    case "analytics":
      return (
        <Suspense
          fallback={
            <p className="font-display text-2xl text-espresso/60">
              Loading analytics…
            </p>
          }
        >
          <Analytics />
        </Suspense>
      );
    case "menu-coffee":
      return <MenuManager menu="coffee" />;
    case "menu-food":
      return <MenuManager menu="food" />;
    case "inquiries":
      return <Inquiries />;
    case "events":
      return <Events />;
    case "reviews":
      return <Reviews />;
    case "announcements":
      return <Announcements />;
    case "popups":
      return <Popups />;
    case "page-home":
      return <PagePlaceholder name="Home" />;
    case "page-about":
      return <AboutEditor />;
    case "page-global":
      return <PagePlaceholder name="Global / Footer / Contact" />;
    default:
      return null;
  }
}
