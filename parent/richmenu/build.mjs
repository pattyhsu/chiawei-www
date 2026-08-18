// Render richmenu.html → richmenu.png at exactly 2500×1686 (LINE "large").
// Run from this directory:  node build.mjs
// Uses the Playwright already installed for the app's PDF renderer.
import { chromium } from "/Users/pattyhsu/chiawei/web/node_modules/playwright/index.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const W = 2500, H = 1686;               // LINE rich menu "large"; do not change

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.goto("file://" + join(here, "richmenu.html"), { waitUntil: "networkidle" });
await page.screenshot({ path: join(here, "richmenu.png"), clip: { x: 0, y: 0, width: W, height: H } });
await browser.close();
console.log("wrote richmenu.png");
