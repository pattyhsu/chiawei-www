# 圖文選單 (LINE rich menu) — 家長專區

`richmenu.png` (2500×1686) is the artwork parents see pinned under the chat in
the @chiawei LINE Official Account. Every button opens the **same** LIFF page —
`parent/index.html` — at a different section.

Regenerate after editing `richmenu.html`:

```bash
node build.mjs
```

## The five buttons

Five is the intended count (Patty, 2026-08-18). **我要請假 / 聯絡櫃檯 / 常見問題
were removed and deliberately NOT replaced with filler** — don't add a sixth
button to "fill the grid".

## Tap-area map — this and the artwork are ONE thing

LINE renders a rich menu as a flat image with invisible tap areas mapped over
it. The image and this table must move together; a column edited in
`richmenu.html` without the matching row here produces a menu whose buttons are
silently off-target.

**Size is 小型 / Compact — 2500×843, five equal 500-wide columns.** The first cut
was 大型 (2500×1686) with a double-width 今日作業 block; Patty rejected it on
sight (2026-08-18) as "way too big and not useful", against 木生婦幼診所's bar as
the reference. A rich menu is a tab bar, not a poster — it sits on top of the
conversation, so height is taken from the thing the parent actually came for.
**今日作業 keeps its emphasis through COLOUR, not area**, which is what let the
layout drop to five equal columns without losing the daily-one hierarchy.

| # | Cell (x, y, w, h) | Button | Link |
|---|---|---|---|
| 1 | 0, 0, 500, 843 | 今日作業 | `https://liff.line.me/<LIFF_ID>?s=hw` |
| 2 | 500, 0, 500, 843 | 每週課表 | `https://liff.line.me/<LIFF_ID>?s=week` |
| 3 | 1000, 0, 500, 843 | 本期學費 | `https://liff.line.me/<LIFF_ID>?s=fee` |
| 4 | 1500, 0, 500, 843 | 餐費餘額 | `https://liff.line.me/<LIFF_ID>?s=meal` |
| 5 | 2000, 0, 500, 843 | 學習進度 | `https://liff.line.me/<LIFF_ID>?s=progress` |

LIFF ID is `2011161502-kGxpeEuI`. Five buttons is the intended count (Patty):
我要請假 / 聯絡櫃檯 / 常見問題 were removed and deliberately NOT replaced with
filler — don't add a sixth to "fill the row".

⚠️ **A 1×5 compact layout may not be among LINE Official Account Manager's stock
templates.** If it isn't, the menu has to be created through the Messaging API
(`POST /v2/bot/richmenu` + image upload + `setDefault`), which is available now
that the OA is linked to the 家偉補習班 provider. Trade-off to accept knowingly:
**a Messaging-API rich menu does not appear in OA Manager's Rich menus list**, so
the console stops being the place you can see or edit it — this README becomes
the only record.

### The `?s=` keys are a published contract

`hw` · `week` · `fee` · `meal` · `progress` are matched against `SECTIONS` in
`parent/index.html`, which scrolls to the card carrying the matching
`data-sec="…"`. **Renaming a key breaks a button already sitting in parents'
LINE**, where it cannot be recalled — add a new key and keep the old one
resolving. An unknown or absent key is harmless: the page just opens at the top.

The page reads `?s=<key>` **and** `#<key>`, because LIFF packs the whole suffix
(query *and* fragment) into `liff.state` and hands it back before `liff.init()`
resolves. `?s=` is the form used here; the hash form exists so a plain browser
link works too.

## What is live right now

Published through the Messaging API on 2026-08-18 (OA Manager cannot express a
5-column bar — its compact templates cap at 3):

```
→ DEFAULT  richmenu-e5c96f190d6050b43f723823acbfd0bb  2500×843  家長專區  [5 areas]
```

**LINE's API and OA Manager do not see each other's rich menus in EITHER
direction** — the console warns about one half, but `--list` also returned "(no
rich menus)" while the console was showing a 家長專區 menu as current. So there
is no single screen showing the truth: `node deploy.mjs --list` is the API side,
the console is its own side, and only one of them should ever hold a menu.

## The old OA Manager path (superseded — kept for context)

1. **主頁 → 圖文選單 → 建立**
2. 標題 `家長專區`（internal only）· 使用期間 start today, **no end date**
3. **選單列顯示文字**: `家長專區` · 選單預設顯示方式: **顯示**
4. 版型 → **大型** → the **六格 (3×2)** template
5. 上傳 `richmenu.png`
6. For each of the six areas, 動作 = **連結**, and paste the URL from the table
   above. Set 動作標籤 to the button name (screen readers + LINE analytics).
   **Areas 1 and 2 take the SAME URL** — that is intentional.
7. 儲存

⚠️ Upload the image **before** setting the actions — OA Manager resets the area
map when the template or image changes.
