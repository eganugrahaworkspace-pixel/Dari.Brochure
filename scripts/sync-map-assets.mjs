#!/usr/bin/env node
// Copies the bundled Blok M basemap, Dari Day style and Noto glyphs from the iOS app
// into public/map/ so the brochure never keeps a second copy in Git (docs/SDD.md §6.2).
import { mkdir, readFile, writeFile, copyFile, readdir, access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const src = resolve(root, "../ios/dari/dari/Resources/DariMap");
const out = join(root, "public/map");

try {
  await access(src);
} catch {
  console.error(`[sync-map-assets] Source not found: ${src}\nRun this inside the dari monorepo.`);
  process.exit(1);
}

await mkdir(out, { recursive: true });

// 1. Basemap (ODbL, © OpenStreetMap contributors · Protomaps)
await copyFile(join(src, "blokm-20261109.pmtiles"), join(out, "blokm.pmtiles"));

// 2. Style: drop the Dari sprite (no public release license yet, PROVENANCE L-01)
//    and leave URL placeholders for map.ts to resolve against the page origin.
const style = JSON.parse(await readFile(join(src, "dari-protomaps-day.json"), "utf8"));
delete style.sprite;
style.glyphs = "__DARI_GLYPHS_URL__";
style.sources.protomaps.url = "pmtiles://__DARI_PMTILES_URL__";
for (const layer of style.layers) {
  if (layer.layout && "icon-image" in layer.layout) delete layer.layout["icon-image"];
}
await writeFile(join(out, "style-day.json"), JSON.stringify(style));

// 3. Glyphs: flat iOS names -> MapLibre {fontstack}/{range}.pbf layout
const stacks = { regular: "Noto Sans Regular", bold: "Noto Sans Bold", italic: "Noto Sans Italic" };
let glyphs = 0;
for (const file of await readdir(src)) {
  const m = file.match(/^glyph-noto-sans-(regular|bold|italic)-(\d+-\d+)\.pbf$/);
  if (!m) continue;
  const dir = join(out, "fonts", stacks[m[1]]);
  await mkdir(dir, { recursive: true });
  await copyFile(join(src, file), join(dir, `${m[2]}.pbf`));
  glyphs++;
}
await copyFile(join(src, "NotoSans-OFL.txt"), join(out, "fonts", "NotoSans-OFL.txt"));

console.log(`[sync-map-assets] basemap + style + ${glyphs} glyph ranges -> public/map/`);
