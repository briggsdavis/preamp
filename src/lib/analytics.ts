import { useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

/**
 * First-party analytics on the public site.
 *
 * `useTrack()` returns a fire-and-forget `track()` that writes one event to
 * Convex (see convex/analytics.ts). Tracking is intentionally best-effort: it
 * never throws into the UI and silently no-ops on the admin app, the PDF
 * viewer, or when a "do not track me" flag is set. Signed-in admins are
 * additionally excluded server-side, so staff browsing never skews the numbers.
 */

const VISITOR_KEY = "preamp_vid"; // stable, anonymous, persists across visits
const SESSION_KEY = "preamp_sid"; // per-tab session
const SOURCE_KEY = "preamp_src"; // traffic source captured once per session
const DNT_KEY = "preamp_dnt"; // opt-out flag

export type TrackType =
  | "page_view"
  | "order_click"
  | "menu_click"
  | "cta_click";

export interface TrackOptions {
  path?: string;
  source?: string;
  clickSource?: string; // e.g. "navbar" | "featured"
  menu?: string; // "coffee" | "food"
  cta?: string; // "instagram" | "directions" | …
  destination?: string;
}

function randomId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

function readStore(store: Storage, key: string): string {
  try {
    let v = store.getItem(key);
    if (!v) {
      v = randomId();
      store.setItem(key, v);
    }
    return v;
  } catch {
    return "anon"; // storage blocked (e.g. strict privacy mode)
  }
}

function getVisitorId(): string {
  return readStore(window.localStorage, VISITOR_KEY);
}

function getSessionId(): string {
  return readStore(window.sessionStorage, SESSION_KEY);
}

/** Don't track the admin app, the PDF utility, or opted-out visitors. */
export function shouldTrack(path = window.location.pathname): boolean {
  if (path.startsWith("/admin") || path.startsWith("/menu-pdf")) return false;
  try {
    if (window.localStorage.getItem(DNT_KEY) === "1") return false;
  } catch {
    /* ignore */
  }
  return true;
}

/** Normalize the referrer host into a friendly source label. */
function sourceFromReferrer(ref: string): string {
  if (!ref) return "direct";
  try {
    const host = new URL(ref).hostname.replace(/^www\./, "");
    if (host === window.location.hostname) return "direct"; // internal nav
    if (host.includes("instagram")) return "instagram";
    if (host.includes("tiktok")) return "tiktok";
    if (host.includes("google")) return "google";
    if (host.includes("bing")) return "bing";
    if (host.includes("facebook") || host === "l.facebook.com")
      return "facebook";
    if (host.includes("yelp")) return "yelp";
    return host;
  } catch {
    return "direct";
  }
}

/**
 * The session's traffic source, decided once and cached: a `utm_source` query
 * param wins, otherwise it's derived from the referrer, otherwise "direct".
 */
function getSource(): string {
  try {
    const cached = window.sessionStorage.getItem(SOURCE_KEY);
    if (cached) return cached;
    const utm = new URLSearchParams(window.location.search).get("utm_source");
    const src = utm
      ? utm.toLowerCase().slice(0, 64)
      : sourceFromReferrer(document.referrer);
    window.sessionStorage.setItem(SOURCE_KEY, src);
    return src;
  } catch {
    return "direct";
  }
}

export function useTrack() {
  const track = useMutation(api.analytics.track);
  return useCallback(
    (type: TrackType, opts: TrackOptions = {}) => {
      const path = opts.path ?? window.location.pathname;
      if (!shouldTrack(path)) return;
      void track({
        type,
        path,
        visitorId: getVisitorId(),
        sessionId: getSessionId(),
        source: type === "page_view" ? (opts.source ?? getSource()) : opts.source,
        clickSource: opts.clickSource,
        menu: opts.menu,
        cta: opts.cta,
        destination: opts.destination,
      }).catch(() => {
        /* analytics must never disrupt the UI */
      });
    },
    [track],
  );
}
