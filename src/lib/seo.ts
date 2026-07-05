import { useEffect } from "react";

/**
 * Lightweight document-head manager for client-rendered pages.
 *
 * `useSeo` sets the page <title>, meta description, canonical link, Open Graph
 * / Twitter tags, and an optional JSON-LD block while a page (e.g. a menu item)
 * is mounted, then restores the previous head on unmount. The build-time
 * prerender step (scripts/prerender.mjs) writes the same tags into the static
 * HTML so crawlers and social scrapers get them without running JS; this hook
 * keeps them correct during client-side navigation.
 */

export interface SeoData {
  title: string;
  description?: string;
  /** Absolute or root-relative canonical path; resolved against the origin. */
  canonicalPath?: string;
  image?: string;
  type?: string; // og:type, e.g. "website" | "product"
  jsonLd?: Record<string, unknown>;
}

const MARK = "data-preamp-seo";

function origin(): string {
  try {
    return window.location.origin;
  } catch {
    return "";
  }
}

/** Resolve a possibly root-relative URL to an absolute one. */
function absolute(url?: string): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//.test(url)) return url;
  return `${origin()}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function useSeo(seo: SeoData | null): void {
  // Serialize so the effect re-runs whenever the content changes.
  const key = seo ? JSON.stringify(seo) : "";
  useEffect(() => {
    if (!seo) return;
    const prevTitle = document.title;
    document.title = seo.title;

    const created: Element[] = [];
    const addMeta = (
      attr: "name" | "property",
      name: string,
      content?: string,
    ) => {
      if (!content) return;
      const el = document.createElement("meta");
      el.setAttribute(attr, name);
      el.setAttribute("content", content);
      el.setAttribute(MARK, "");
      document.head.appendChild(el);
      created.push(el);
    };

    const canonical = absolute(seo.canonicalPath);
    const image = absolute(seo.image);

    addMeta("name", "description", seo.description);
    addMeta("property", "og:title", seo.title);
    addMeta("property", "og:description", seo.description);
    addMeta("property", "og:type", seo.type ?? "website");
    addMeta("property", "og:url", canonical);
    addMeta("property", "og:image", image);
    addMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    addMeta("name", "twitter:title", seo.title);
    addMeta("name", "twitter:description", seo.description);
    addMeta("name", "twitter:image", image);

    if (canonical) {
      const link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      link.setAttribute("href", canonical);
      link.setAttribute(MARK, "");
      document.head.appendChild(link);
      created.push(link);
    }

    if (seo.jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute(MARK, "");
      script.textContent = JSON.stringify(seo.jsonLd);
      document.head.appendChild(script);
      created.push(script);
    }

    return () => {
      document.title = prevTitle;
      created.forEach((el) => el.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
