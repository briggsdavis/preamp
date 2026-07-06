import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

import { pageKeyForPath, showsOnPage } from "@/lib/cms";
import { useTrack } from "@/lib/analytics";

/**
 * The active announcement bar, fixed above the navbar. Sets a CSS variable
 * (`--preamp-ann-h`) so the navbar can offset itself by the bar's height.
 */
const BAR_HEIGHT = "2.5rem";

export function AnnouncementBar() {
  const announcement = useQuery(api.marketing.getActiveAnnouncement);
  const { pathname } = useLocation();
  const track = useTrack();
  const pageKey = pageKeyForPath(pathname);

  const visible =
    !!announcement && showsOnPage(announcement.showOn, pageKey);

  // Set the navbar's offset synchronously, before paint, so the bar and the
  // navbar's shifted position land in the same frame - the bar appears in
  // place instead of popping in and shoving the navbar down a beat later.
  useLayoutEffect(() => {
    document.documentElement.style.setProperty(
      "--preamp-ann-h",
      visible ? BAR_HEIGHT : "0px",
    );
    return () => {
      document.documentElement.style.setProperty("--preamp-ann-h", "0px");
    };
  }, [visible]);

  // Count one impression per page the bar is shown on (enables CTR).
  useEffect(() => {
    if (!visible || !announcement) return;
    track("announcement_view", {
      path: pathname,
      entityId: announcement._id,
      entityTitle: announcement.internalTitle,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, announcement?._id, pathname]);

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
          onClick={() =>
            track("announcement_click", {
              path: pathname,
              entityId: announcement._id,
              entityTitle: announcement.internalTitle,
              destination: announcement.buttonLink ?? undefined,
            })
          }
          className="shrink-0 rounded-full border border-current px-3 py-0.5 text-xs font-semibold transition-opacity hover:opacity-80"
        >
          {announcement.buttonLabel}
        </a>
      )}
    </div>
  );
}
