/**
 * Create / replace the 家長專區 圖文選單 through the LINE Messaging API.
 *
 * WHY this exists instead of clicking in OA Manager: the console's compact
 * templates top out at 3 columns, and the approved design is a 5-column bar
 * (Patty, 2026-08-18). Five custom areas can only be defined through the API.
 *
 * ⚠️ A Messaging-API rich menu does NOT appear in OA Manager's "Rich menus"
 * list. This file + README.md are therefore the ONLY record of what is live.
 * Run `--list` to see the truth from LINE itself.
 *
 * The token is a long-lived Channel access token from the 家偉補習班 Messaging
 * API channel. It can send messages as the school's OA, so it lives in
 * ~/chiawei/.env (gitignored) and is NEVER committed or pasted anywhere.
 *
 *   node deploy.mjs --list              show every rich menu LINE currently holds
 *   node deploy.mjs --deploy            create + upload + set as default for all
 *   node deploy.mjs --delete <id>       remove one
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));

function token() {
  if (process.env.LINE_CHANNEL_ACCESS_TOKEN) return process.env.LINE_CHANNEL_ACCESS_TOKEN.trim();
  const envPath = join(homedir(), "chiawei", ".env");
  if (existsSync(envPath)) {
    const m = readFileSync(envPath, "utf8").match(/^LINE_CHANNEL_ACCESS_TOKEN\s*=\s*(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  console.error("No LINE_CHANNEL_ACCESS_TOKEN. Add it to ~/chiawei/.env:\n" +
                "  LINE_CHANNEL_ACCESS_TOKEN=<long-lived token from the Messaging API channel>");
  process.exit(1);
}
const TOKEN = token();
const H = { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" };

const LIFF = "2011161502-kGxpeEuI";
const COLS = 6, W = Math.floor(2500 / 6), HH = 843;   // 416px columns

// Column order is the artwork's, left to right. Changing either without the
// other silently mis-aims every button — see README.md's tap-area table.
// Two-character labels are what let six columns breathe — 木生 fits five
// because 掛號/報告/意見/我的 are two chars and ours were four. The long names
// survive as the card HEADINGS inside each screen.
const BUTTONS = [
  ["首頁", "home"],
  ["作業", "hw"],
  ["課表", "week"],
  ["學費", "fee"],
  ["餐費", "meal"],
  ["進度", "progress"],
];

const MENU = {
  size: { width: 2500, height: 843 },          // compact
  selected: true,                              // open by default
  name: "家長專區",                             // management-only
  chatBarText: "家長專區",                      // ≤14 chars, parents DO see this
  areas: BUTTONS.map(([label, key], i) => ({
    bounds: { x: i * W, y: 0, width: i === BUTTONS.length - 1 ? 2500 - i * W : W, height: HH },
    action: { type: "uri", label, uri: `https://liff.line.me/${LIFF}?s=${key}` },
  })),
};

async function api(url, init, { tolerate404 = false } = {}) {
  const r = await fetch(url, init);
  const body = await r.text();
  // NOTE: this exits the process rather than throwing, so callers cannot
  // recover with try/catch — pass tolerate404 for states that are legitimately
  // "not there yet", such as no default rich menu having been set.
  if (r.status === 404 && tolerate404) return null;
  if (!r.ok) { console.error(`${r.status} ${url}\n${body}`); process.exit(1); }
  return body ? JSON.parse(body) : {};
}

const arg = process.argv[2];

if (arg === "--list") {
  const { richmenus } = await api("https://api.line.me/v2/bot/richmenu/list", { headers: H });
  const d = await api("https://api.line.me/v2/bot/user/all/richmenu", { headers: H }, { tolerate404: true });
  const def = d?.richMenuId ?? null;
  if (!richmenus?.length) console.log("(no rich menus)");
  for (const m of richmenus ?? []) {
    console.log(`${m.richMenuId === def ? "→ DEFAULT" : "         "}  ${m.richMenuId}  ${m.size.width}×${m.size.height}  ${m.name}  [${m.areas.length} areas]`);
  }
} else if (arg === "--delete") {
  const id = process.argv[3];
  if (!id) { console.error("need a richMenuId"); process.exit(1); }
  await api(`https://api.line.me/v2/bot/richmenu/${id}`, { method: "DELETE", headers: H });
  console.log("deleted", id);
} else if (arg === "--deploy") {
  const png = readFileSync(join(here, "richmenu.png"));
  const { richMenuId } = await api("https://api.line.me/v2/bot/richmenu", {
    method: "POST", headers: H, body: JSON.stringify(MENU),
  });
  console.log("created ", richMenuId);
  // image upload is a DIFFERENT host (api-data), and the content-type must be
  // the real image type, not json
  await api(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
    method: "POST",
    headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "image/png" },
    body: png,
  });
  console.log("uploaded richmenu.png");
  await api(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, { method: "POST", headers: H });
  console.log("set as default for all users");
  console.log("\nNow run --list and delete any leftover menu, so exactly one is live.");
} else {
  console.log("usage: node deploy.mjs --list | --deploy | --delete <richMenuId>");
}
