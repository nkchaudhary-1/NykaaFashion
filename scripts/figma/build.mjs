// Cuts every picture on the site from the owner's AI-generated set (docs/IMAGE_PROMPTS.md → the Figma file → scripts/figma/source/*.jpg, listed in manifest.json).
//   node scripts/figma/build.mjs [--only scenes/,launches/vrisa] [--plan]
// It is the picture builder of scripts/unsplash (windows, focus points, copy-area contrast, shoppable pins, image-meta.json), pointed at this library instead of an Unsplash one:
// the originals are looked up in scripts/figma/source (through a link in .cache/figma), the manifest is scripts/figma/manifest.json. See docs/IMAGE_SET.md.
import { existsSync, mkdirSync, symlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const cache = join(here, "../../.cache/figma");
mkdirSync(cache, { recursive: true });
const link = join(cache, "originals");
if (!existsSync(link)) symlinkSync(join(here, "source"), link, "dir");
process.env.UNSPLASH_MANIFEST = join(here, "manifest.json");
process.env.UNSPLASH_CACHE = cache;
await import("../unsplash/build.mjs");
