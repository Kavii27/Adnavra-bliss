#!/usr/bin/env node
/**
 * Converts downloaded service photos into the small WebP files the app serves,
 * and refreshes src/lib/service-images.manifest.json.
 *
 *   input : service-images-src/<category>/<slug>.(jpg|jpeg|png|webp)
 *           service-images-src/_category/<category-slug or "default">.(jpg|...)
 *   output: public/service-images/...  (800x600 WebP, ~50-80 KB each)
 *
 * Run from the project root:   node scripts/optimize-service-images.mjs
 */
import { existsSync } from "node:fs";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "service-images-src");
const OUT = path.join(ROOT, "public", "service-images");
const MANIFEST = path.join(ROOT, "src", "lib", "service-images.manifest.json");
const EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const CATEGORIES = [
  "hair-styling",
  "nails",
  "hair-removal",
  "eyebrows-eyelashes",
  "facials-skincare",
  "massage",
  "spa-wellness",
  "makeup",
];

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function convert(file, outFile) {
  await mkdir(path.dirname(outFile), { recursive: true });
  await sharp(file)
    .rotate() // respect camera orientation
    .resize(800, 600, { fit: "cover", position: "attention" })
    .webp({ quality: 80 })
    .toFile(outFile);
  const { size } = await stat(outFile);
  return size;
}

async function main() {
  if (!(await exists(SRC))) {
    console.error(`Folder not found: ${SRC}\nCreate it and add your downloaded photos (see service-images-src/README.md).`);
    process.exit(1);
  }

  let converted = 0;
  for (const folder of ["_category", ...CATEGORIES]) {
    const dir = path.join(SRC, folder);
    if (!(await exists(dir))) continue;
    for (const name of await readdir(dir)) {
      const ext = path.extname(name).toLowerCase();
      if (!EXTS.has(ext)) continue;
      const slug = path.basename(name, path.extname(name)).toLowerCase();
      const outFile = path.join(OUT, folder, `${slug}.webp`);
      const size = await convert(path.join(dir, name), outFile);
      console.log(`✓ ${folder}/${slug}.webp  (${Math.round(size / 1024)} KB)`);
      converted++;
    }
  }

  // Manifest = every specific (non _category) image that now exists.
  const available = [];
  for (const cat of CATEGORIES) {
    const dir = path.join(OUT, cat);
    if (!(await exists(dir))) continue;
    for (const f of await readdir(dir)) {
      if (f.endsWith(".webp")) available.push(f.replace(/\.webp$/, ""));
    }
  }
  available.sort();
  await writeFile(MANIFEST, JSON.stringify({ available }, null, 2) + "\n");

  // Friendly check of the required fallbacks.
  const needed = ["default", ...CATEGORIES];
  const missing = needed.filter((n) => !existsSync(path.join(OUT, "_category", `${n}.webp`)));

  console.log(`\nConverted ${converted} image(s). Manifest lists ${available.length} specific image(s).`);
  if (missing.length) console.log(`⚠ Missing fallback image(s): ${missing.join(", ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
