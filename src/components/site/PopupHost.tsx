import { useEffect, useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

import { pageKeyForPath, showsOnPage } from "@/lib/cms";

/**
 * Renders the active pop-ups on the public site, honoring each pop-up's
 * page targeting, trigger, and display frequency. Frequency is remembered in
 * session/local storage so a pop-up doesn't nag a returning visitor.
 */

type Media = { type: "image" | "video"; url: string | null };

type Popup = {
  _id: Id<"popups">;
  internalTitle: string;
  heading?: string;
  body?: string;
  media: Media[];
  position: string;
  frequency: "every-visit" | "session" | "daily";
  buttonLabel?: string;
  buttonLink?: string;
  trigger: { type: "time" | "action"; seconds?: number; action?: string };
  emailCapture: boolean;
  showOn: "all" | string[];
};

const PV_KEY = "preamp-pageviews";

function pageViewCount(): number {
  try {
    return Number(sessionStorage.getItem(PV_KEY) ?? "0");
  } catch {
    return 0;
  }
}

export function PopupHost() {
  const popups = useQuery(api.marketing.listActivePopups) as
    | Popup[]
    | undefined;
  const { pathname } = useLocation();
  const pageKey = pageKeyForPath(pathname);

  // Count pages viewed this visit (drives the "second page" trigger). Kept in
  // session storage so we never call setState inside an effect.
  useEffect(() => {
    try {
      sessionStorage.setItem(PV_KEY, String(pageViewCount() + 1));
    } catch {
      /* storage unavailable */
    }
  }, [pathname]);

  if (!popups) return null;

  const visible = popups.filter((p) => showsOnPage(p.showOn, pageKey));

  return (
    <>
      {visible.map((popup) => (
        <PopupItem key={popup._id} popup={popup} pathname={pathname} />
      ))}
    </>
  );
}

/** Storage key per pop-up for frequency gating. */
function freqKey(id: string) {
  return `preamp-popup-${id}`;
}

function alreadySeen(popup: Popup): boolean {
  try {
    if (popup.frequency === "session") {
      return sessionStorage.getItem(freqKey(popup._id)) === "1";
    }
    if (popup.frequency === "daily") {
      const today = new Date().toISOString().slice(0, 10);
      return localStorage.getItem(freqKey(popup._id)) === today;
    }
  } catch {
    /* storage unavailable */
  }
  return false;
}

function markSeen(popup: Popup) {
  try {
    if (popup.frequency === "session") {
      sessionStorage.setItem(freqKey(popup._id), "1");
    } else if (popup.frequency === "daily") {
      localStorage.setItem(
        freqKey(popup._id),
        new Date().toISOString().slice(0, 10),
      );
    }
  } catch {
    /* storage unavailable */
  }
}

function PopupItem({
  popup,
  pathname,
}: {
  popup: Popup;
  pathname: string;
}) {
  const captureEmail = useMutation(api.inquiries.captureEmail);
  const [open, setOpen] = useState(false);
  const [armed] = useState(() => !alreadySeen(popup));
  const [current, setCurrent] = useState(0);
  const [email, setEmail] = useState("");
  const [captured, setCaptured] = useState(false);

  // Arm the trigger once.
  useEffect(() => {
    if (!armed || open) return;
    const reveal = () => {
      setOpen(true);
      markSeen(popup);
    };

    const { trigger } = popup;

    if (trigger.type === "time") {
      const ms = (trigger.seconds ?? 0) * 1000;
      const t = window.setTimeout(reveal, ms);
      return () => window.clearTimeout(t);
    }

    // Action triggers.
    switch (trigger.action) {
      case "exit-intent": {
        const onLeave = (e: MouseEvent) => {
          if (e.clientY <= 0) reveal();
        };
        document.addEventListener("mouseout", onLeave);
        return () => document.removeEventListener("mouseout", onLeave);
      }
      case "scroll-half":
      case "reaches-footer": {
        const threshold = popup.trigger.action === "scroll-half" ? 0.5 : 0.9;
        const onScroll = () => {
          const scrolled =
            (window.scrollY + window.innerHeight) /
            document.documentElement.scrollHeight;
          if (scrolled >= threshold) reveal();
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
      }
      case "click-menu": {
        const onClick = (e: MouseEvent) => {
          const target = e.target as HTMLElement | null;
          if (target?.closest('a[href*="/menu"]')) reveal();
        };
        document.addEventListener("click", onClick);
        return () => document.removeEventListener("click", onClick);
      }
      case "second-page": {
        if (pageViewCount() >= 2) reveal();
        return;
      }
      default:
        return;
    }
  }, [armed, open, popup, pathname]);

  if (!open) return null;

  const media = popup.media.filter((m) => m.url);
  const showBackdrop = popup.position === "center";

  async function submitEmail(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await captureEmail({
        email: email.trim(),
        source: popup.internalTitle,
        popupId: popup._id,
      });
      setCaptured(true);
    } catch {
      setCaptured(true); // fail quietly for the visitor
    }
  }

  const card = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 12 }}
      transition={{ type: "spring", damping: 26, stiffness: 260 }}
      onClick={(e) => e.stopPropagation()}
      className={`pointer-events-auto relative overflow-hidden bg-cream shadow-2xl ${cardClasses(
        popup.position,
      )}`}
    >
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Close"
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-espresso/70 text-cream transition-colors hover:bg-espresso"
      >
        ✕
      </button>

      {media.length > 0 && (
        <div className="bg-cream-deep">
          {media[current]?.type === "video" ? (
            <video
              src={media[current].url ?? undefined}
              controls
              className="max-h-72 w-full object-cover"
            />
          ) : (
            <img
              src={media[current]?.url ?? undefined}
              alt={popup.heading ?? popup.internalTitle}
              className="max-h-72 w-full object-cover"
            />
          )}
          {media.length > 1 && (
            <div className="flex justify-center gap-1.5 py-2">
              {media.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrent(i)}
                  aria-label={`Media ${i + 1}`}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    i === current ? "bg-brick" : "bg-espresso/25"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="p-6">
        {popup.heading && (
          <h3 className="font-display text-2xl text-espresso">
            {popup.heading}
          </h3>
        )}
        {popup.body && (
          <p className="mt-2 text-espresso/80">{popup.body}</p>
        )}

        {popup.emailCapture &&
          (captured ? (
            <p className="mt-4 font-semibold text-brick">
              Thanks — you're on the list!
            </p>
          ) : (
            <form onSubmit={submitEmail} className="mt-4 flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="min-w-0 flex-1 rounded-full border-2 border-sand bg-white px-4 py-2 text-sm text-espresso outline-none focus:border-gold"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-brick px-4 py-2 text-sm font-semibold text-cream transition-colors hover:bg-maroon"
              >
                Sign up
              </button>
            </form>
          ))}

        {popup.buttonLabel && popup.buttonLink && (
          <a
            href={popup.buttonLink}
            className="mt-4 inline-block rounded-full bg-brick px-6 py-2.5 font-semibold text-cream transition-colors hover:bg-maroon"
          >
            {popup.buttonLabel}
          </a>
        )}
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      <div
        className={`pointer-events-none ${wrapperClasses(popup.position)}`}
        onClick={showBackdrop ? () => setOpen(false) : undefined}
      >
        {showBackdrop && (
          <div className="pointer-events-auto absolute inset-0 bg-espresso/60 backdrop-blur-sm" />
        )}
        <div className="relative">{card}</div>
      </div>
    </AnimatePresence>
  );
}

/** Fixed positioning wrapper per anchor position. */
function wrapperClasses(position: string): string {
  switch (position) {
    case "center":
      return "fixed inset-0 z-[75] flex items-center justify-center p-4";
    case "top-left":
      return "fixed left-4 top-4 z-[75]";
    case "top-right":
      return "fixed right-4 top-4 z-[75]";
    case "bottom-left":
      return "fixed bottom-4 left-4 z-[75]";
    case "bottom-right":
      return "fixed bottom-4 right-4 z-[75]";
    case "top-edge":
      return "fixed inset-x-0 top-0 z-[75]";
    case "bottom-edge":
      return "fixed inset-x-0 bottom-0 z-[75]";
    case "left-edge":
      return "fixed bottom-0 left-0 top-0 z-[75] flex items-center";
    case "right-edge":
      return "fixed bottom-0 right-0 top-0 z-[75] flex items-center";
    default:
      return "fixed inset-0 z-[75] flex items-center justify-center p-4";
  }
}

/** Card sizing per anchor position. */
function cardClasses(position: string): string {
  switch (position) {
    case "top-edge":
    case "bottom-edge":
      return "w-screen rounded-none";
    case "left-edge":
    case "right-edge":
      return "h-screen w-[22rem] max-w-[90vw] rounded-none";
    default:
      return "w-[22rem] max-w-[90vw] rounded-3xl";
  }
}
