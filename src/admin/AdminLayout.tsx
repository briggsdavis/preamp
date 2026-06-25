import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

import { MenuManager } from "@/admin/sections/MenuManager";
import { Inquiries } from "@/admin/sections/Inquiries";
import { Announcements } from "@/admin/sections/Announcements";
import { Popups } from "@/admin/sections/Popups";
import { Events } from "@/admin/sections/Events";
import { Reviews } from "@/admin/sections/Reviews";
import { PagePlaceholder } from "@/admin/sections/PagePlaceholder";

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
  {
    label: "Marketing",
    items: [
      { id: "announcements", label: "Announcement Bar" },
      { id: "popups", label: "Pop-up" },
    ],
  },
];

export function AdminLayout() {
  const { signOut } = useAuthActions();
  const [selected, setSelected] = useState("menu-coffee");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Page Editor": true,
    Menu: true,
    Inquiries: true,
    Marketing: true,
  });

  function toggleGroup(label: string) {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
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
            const isSingle =
              group.items.length === 1 && group.items[0].label.startsWith("All");
            return (
              <div key={group.label} className="mb-2">
                {isSingle ? (
                  <NavButton
                    label={group.label}
                    active={selected === group.items[0].id}
                    onClick={() => setSelected(group.items[0].id)}
                  />
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.label)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left font-semibold text-espresso/80 transition-colors hover:bg-cream-deep"
                    >
                      {group.label}
                      <span
                        className={`text-xs transition-transform ${
                          openGroups[group.label] ? "rotate-90" : ""
                        }`}
                      >
                        ▶
                      </span>
                    </button>
                    {openGroups[group.label] && (
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
                    )}
                  </>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t-2 border-sand p-3">
          <a
            href="/"
            className="mb-2 block rounded-lg px-3 py-2 text-center text-sm font-semibold text-espresso/70 transition-colors hover:bg-cream-deep"
          >
            ← Back to site
          </a>
          <button
            type="button"
            onClick={() => void signOut()}
            className="w-full rounded-lg bg-espresso px-3 py-2 text-sm font-semibold text-cream transition-colors hover:bg-maroon"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-x-hidden px-6 py-8 md:px-10">
        <Panel selected={selected} />
      </main>
    </div>
  );
}

function NavButton({
  label,
  active,
  onClick,
  small,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-lg px-3 py-2 text-left transition-colors ${
        small ? "text-sm" : "font-semibold"
      } ${
        active
          ? "bg-brick text-cream"
          : "text-espresso/80 hover:bg-cream-deep"
      }`}
    >
      {label}
    </button>
  );
}

function Panel({ selected }: { selected: string }) {
  switch (selected) {
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
      return <PagePlaceholder name="About" />;
    case "page-global":
      return <PagePlaceholder name="Global / Footer / Contact" />;
    default:
      return null;
  }
}
