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
it. The image below and this table must move together; a box edited in
`richmenu.html` without the matching row here produces a menu whose buttons are
silently off-target.

Layout is the stock **大型 (Large) 2500×1686, 3×2 六格** template, so it can be
built entirely in **LINE Official Account Manager** with no Messaging API call.
**今日作業 spans the top two cells visually, and BOTH of those cells get the same
link** — that is what makes it double-width without a custom area map.

| # | Cell (x, y, w, h) | Button | Link |
|---|---|---|---|
| 1 | 0, 0, 833, 843 | 今日作業 (left half) | `https://liff.line.me/<LIFF_ID>?s=hw` |
| 2 | 833, 0, 833, 843 | 今日作業 (right half — **same link as #1**) | `https://liff.line.me/<LIFF_ID>?s=hw` |
| 3 | 1666, 0, 834, 843 | 每週課表 | `https://liff.line.me/<LIFF_ID>?s=week` |
| 4 | 0, 843, 833, 843 | 本期學費 | `https://liff.line.me/<LIFF_ID>?s=fee` |
| 5 | 833, 843, 833, 843 | 餐費餘額 | `https://liff.line.me/<LIFF_ID>?s=meal` |
| 6 | 1666, 843, 834, 843 | 學習進度 | `https://liff.line.me/<LIFF_ID>?s=progress` |

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

## Building it in LINE Official Account Manager

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
