/**
 * Post-build prerender for menu-item pages.
 *
 * `npm run build` runs `vite build` then this script (see the "postbuild"
 * lifecycle hook). It pulls the live menu from Convex and writes a static
 * `dist/menu/<kind>/<slug>/index.html` for every item, injecting per-item
 * <title>, meta description, Open Graph / Twitter tags, and JSON-LD plus a
 * crawlable content block - so search engines and social scrapers get the item
 * without executing JS. Users still boot into the SPA, which opens the same
 * item as a routed modal. A sitemap.xml + robots.txt are written too.
 *
 * Content lives in Convex, so these files reflect the menu at build time and
 * are regenerated on each deploy. If no Convex URL is configured (e.g. a local
 * build with no deployment), the script logs a notice and exits 0 - the SPA
 * fallback still serves every item client-side.
 */
import { ConvexHttpClient } from "convex/browser";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "..", "dist");

const CONVEX_URL =
  process.env.VITE_CONVEX_URL || process.env.CONVEX_URL || "";
// Absolute site origin for canonical/OG URLs + the sitemap. Optional; when
// unset, canonical/OG fall back to root-relative paths and the sitemap is
// skipped (it requires absolute URLs).
const SITE_URL = (
  process.env.VITE_SITE_URL ||
  process.env.SITE_URL ||
  ""
).replace(/\/$/, "");

const STATIC_PAGES = [
  "/",
  "/menu/coffee",
  "/menu/food",
  "/about",
  "/contact",
  "/events",
  "/retail",
  "/hiring",
];

function esc(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function absolute(url) {
  if (!url) return "";
  if (/^https?:\/\//.test(url)) return url;
  if (!SITE_URL) return url; // keep relative when no origin configured
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function priceValue(price = "") {
  const m = String(price).match(/[\d]+(\.\d+)?/);
  return m ? m[0] : "";
}

/** Build one item's static HTML from the built index.html template. */
export function renderItem(template, { kind, item, tagLabels }) {
  const path = `/menu/${kind}/${item.slug}`;
  const canonical = absolute(path);
  const image = absolute(item.images?.find((i) => i.url)?.url || "");
  const title = `${item.name} · ${
    kind === "coffee" ? "Coffee" : "Food"
  } · Pre Amp Coffee Studio`;
  const desc = item.description || `${item.name} at Pre Amp Coffee Studio.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MenuItem",
    name: item.name,
    description: desc,
    ...(image ? { image } : {}),
    offers: {
      "@type": "Offer",
      price: priceValue(item.price),
      priceCurrency: "USD",
    },
  };

  const head = [
    `<meta name="description" content="${esc(desc)}" />`,
    canonical ? `<link rel="canonical" href="${esc(canonical)}" />` : "",
    `<meta property="og:type" content="product" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    canonical ? `<meta property="og:url" content="${esc(canonical)}" />` : "",
    image ? `<meta property="og:image" content="${esc(image)}" />` : "",
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(desc)}" />`,
    image ? `<meta name="twitter:image" content="${esc(image)}" />` : "",
    `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
  ]
    .filter(Boolean)
    .join("\n    ");

  const tagsHtml = tagLabels.length
    ? `<ul>${tagLabels.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`
    : "";

  // Crawlable content; the SPA replaces #root on mount for real users.
  const body = `<main>
      <nav><a href="/menu/${kind}">Back to ${kind} menu</a></nav>
      <article>
        <h1>${esc(item.name)}</h1>
        <p>${esc(item.price)}</p>
        ${image ? `<img src="${esc(image)}" alt="${esc(item.name)}" width="640" />` : ""}
        <p>${esc(desc)}</p>
        ${tagsHtml}
      </article>
    </main>`;

  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace("</head>", `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}

function writeSitemap(urls) {
  const body = urls
    .map((u) => `  <url><loc>${esc(u)}</loc></url>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  writeFileSync(join(DIST, "sitemap.xml"), xml);
  if (!existsSync(join(DIST, "robots.txt"))) {
    writeFileSync(
      join(DIST, "robots.txt"),
      `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`,
    );
  }
}

async function main() {
  if (!existsSync(join(DIST, "index.html"))) {
    console.warn("[prerender] dist/index.html not found - run vite build first.");
    return;
  }
  if (!CONVEX_URL) {
    console.warn(
      "[prerender] No VITE_CONVEX_URL set - skipping menu-item prerender. " +
        "Items still work via the SPA fallback.",
    );
    return;
  }

  const template = readFileSync(join(DIST, "index.html"), "utf8");
  const client = new ConvexHttpClient(CONVEX_URL);

  let tagLabelByKey = {};
  try {
    const tags = await client.query("dietaryTags:list", {});
    tagLabelByKey = Object.fromEntries((tags ?? []).map((t) => [t.key, t.label]));
  } catch {
    /* tags are optional for prerender */
  }

  const itemUrls = [];
  let count = 0;
  for (const kind of ["coffee", "food"]) {
    let data;
    try {
      data = await client.query("menu:getMenu", { menu: kind });
    } catch (e) {
      console.warn(`[prerender] Failed to load ${kind} menu:`, e.message);
      continue;
    }
    for (const section of data.sections ?? []) {
      for (const item of section.items ?? []) {
        if (!item.slug) continue;
        const tagLabels = (item.dietaryTags ?? [])
          .map((k) => tagLabelByKey[k])
          .filter(Boolean);
        const html = renderItem(template, { kind, item, tagLabels });
        const dir = join(DIST, "menu", kind, item.slug);
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, "index.html"), html);
        itemUrls.push(`/menu/${kind}/${item.slug}`);
        count++;
      }
    }
  }

  console.log(`[prerender] Wrote ${count} menu-item page(s).`);

  if (SITE_URL) {
    writeSitemap([...STATIC_PAGES, ...itemUrls].map((p) => `${SITE_URL}${p}`));
    console.log(`[prerender] Wrote sitemap.xml (${STATIC_PAGES.length + itemUrls.length} URLs).`);
  } else {
    console.warn(
      "[prerender] No VITE_SITE_URL set - skipping sitemap.xml (needs absolute URLs).",
    );
  }
}

// Only run as a CLI (`node scripts/prerender.mjs`), not when imported for tests.
if (process.argv[1] && process.argv[1].endsWith("prerender.mjs")) {
  main().catch((e) => {
    // Never fail the build over prerendering - the SPA still serves everything.
    console.warn("[prerender] Skipped due to error:", e?.message ?? e);
  });
}
