import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

import { pageKeyForPath, showsOnPage } from "@/lib/cms";

/**
 * The active announcement bar, fixed above the navbar. Sets a CSS variable
 * (`--preamp-ann-h`) so the navbar can offset itself by the bar's height.
 */
const BAR_HEIGHT = "2.5rem";

export function AnnouncementBar() {
  const announcement = useQuery(api.marketing.getActiveAnnouncement);
  const { pathname } = useLocation();
  const pageKey = pageKeyForPath(pathname);

  const visible =
    !!announcement && showsOnPage(announcement.showOn, pageKey);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--preamp-ann-h",
      visible ? BAR_HEIGHT : "0px",
    );
    return () => {
      document.documentElement.style.setProperty("--preamp-ann-h", "0px");
    };
  }, [visible]);

  if (!visible || !announcement) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-3 px-4 text-sm font-semibold"
      style={{
        height: BAR_HEIGHT,
        background: announcement.bgColor,
        color: announcement.textColor,
      }}
    >
      <span className="truncate">{announcement.text}</span>
      {announcement.buttonLabel && announcement.buttonLink && (
        <a
          href={announcement.buttonLink}
          className="shrink-0 rounded-full border border-current px-3 py-0.5 text-xs font-semibold transition-opacity hover:opacity-80"
        >
          {announcement.buttonLabel}
        </a>
      )}
    </div>
  );
}
