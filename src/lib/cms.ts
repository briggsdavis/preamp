/**
 * Shared CMS constants used by both the admin editors and the public site:
 * the set of targetable pages, pop-up positions, trigger options, and display
 * frequencies. Keeping these in one place keeps the admin dropdowns and the
 * public rendering in sync.
 */

/** Public pages an announcement bar or pop-up can be shown on. */
export const PUBLIC_PAGES: { key: string; label: string; path: string }[] = [
  { key: "home", label: "Home", path: "/" },
  { key: "menu-coffee", label: "Menu · Coffee", path: "/menu/coffee" },
  { key: "menu-food", label: "Menu · Food", path: "/menu/food" },
  { key: "about", label: "About", path: "/about" },
  { key: "contact", label: "Contact", path: "/contact" },
  { key: "events", label: "Events", path: "/events" },
  { key: "retail", label: "Retail", path: "/retail" },
  { key: "hiring", label: "Hiring", path: "/hiring" },
];

/** Map a router pathname to its page key (for showOn matching). */
export function pageKeyForPath(pathname: string): string | null {
  // Longest path first so "/menu/coffee" beats "/".
  const sorted = [...PUBLIC_PAGES].sort((a, b) => b.path.length - a.path.length);
  for (const page of sorted) {
    if (page.path === "/") {
      if (pathname === "/") return page.key;
    } else if (pathname === page.path || pathname.startsWith(page.path + "/")) {
      return page.key;
    }
  }
  return null;
}

/** Does a `showOn` value ("all" | string[]) include the given page key? */
export function showsOnPage(
  showOn: "all" | string[],
  pageKey: string | null,
): boolean {
  if (showOn === "all") return true;
  if (!pageKey) return false;
  return showOn.includes(pageKey);
}

export const POPUP_POSITIONS: { key: string; label: string }[] = [
  { key: "center", label: "Center" },
  { key: "top-left", label: "Top Left" },
  { key: "top-right", label: "Top Right" },
  { key: "bottom-left", label: "Bottom Left" },
  { key: "bottom-right", label: "Bottom Right" },
  { key: "top-edge", label: "Top Edge (full width)" },
  { key: "bottom-edge", label: "Bottom Edge (full width)" },
  { key: "left-edge", label: "Left Edge (full height)" },
  { key: "right-edge", label: "Right Edge (full height)" },
];

export const DISPLAY_FREQUENCIES: { key: string; label: string }[] = [
  { key: "every-visit", label: "Every visit" },
  { key: "session", label: "Once per session" },
  { key: "daily", label: "Once per day" },
];

/** User-action triggers (the alternative to a time delay). */
export const ACTION_TRIGGERS: { key: string; label: string }[] = [
  { key: "exit-intent", label: "Exit intent (mouse leaves the page)" },
  { key: "scroll-half", label: "Scrolls halfway down the page" },
  { key: "click-menu", label: "Clicks a Menu link in the nav" },
  { key: "second-page", label: "Views a second page in the visit" },
  { key: "reaches-footer", label: "Reaches the footer" },
];

export type PopupPosition = (typeof POPUP_POSITIONS)[number]["key"];
