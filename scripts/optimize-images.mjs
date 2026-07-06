/**
 * One-off image optimizer. Right-sizes and re-encodes the photographic assets
 * in public/images to WebP so the browser downloads a fraction of the bytes.
 *
 * - Photos (jpeg) -> WebP, capped at 1600px on the long edge, quality 80.
 * - Transparent wordmarks (heroprimary/preampprimary png) -> WebP, capped at
 *   1600px, quality 90 (they carry text, keep them crisp), alpha preserved.
 * - preamplogo.png is left as PNG (it's the favicon; broad format support).
 *
 * WebP is supported by ~97% of browsers; the site references .webp directly.
 * Re-run after adding new source images, then update the code references.
 */
import sharp from "sharp";
import { readdirSync, statSync } from "node:fs";
import { join, dirname, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "images");
const MAX = 1600;
const KEEP_PNG = new Set(["preamplogo.png"]);

const files = readdirSync(dir).filter((f) => /\.(jpe?g|png)$/i.test(f));
let before = 0, after = 0;

for (const f of files) {
  if (KEEP_PNG.has(f)) continue;
  const src = join(dir, f);
  const out = join(dir, basename(f, extname(f)) + ".webp");
  const isPng = /\.png$/i.test(f);
  const meta = await sharp(src).metadata();
  const long = Math.max(meta.width || 0, meta.height || 0);
  let img = sharp(src);
  if (long > MAX) img = img.resize({ width: meta.width >= meta.height ? MAX : undefined, height: meta.height > meta.width ? MAX : undefined, withoutEnlargement: true });
  await img.webp({ quality: isPng ? 90 : 80, effort: 6 }).toFile(out);
  before += statSync(src).size;
  after += statSync(out).size;
  console.log(`${f} -> ${basename(out)}  ${(statSync(src).size/1024|0)}KB -> ${(statSync(out).size/1024|0)}KB`);
}
console.log(`\nTotal: ${(before/1024|0)}KB -> ${(after/1024|0)}KB  (saved ${((before-after)/1024|0)}KB)`);
