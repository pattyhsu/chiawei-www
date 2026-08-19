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
| 1 | 0, 0, 416, 843 | 首頁 | `https://liff.line.me/<LIFF_ID>?s=home` |
| 2 | 416, 0, 416, 843 | 作業 | `https://liff.line.me/<LIFF_ID>?s=hw` |
| 3 | 832, 0, 416, 843 | 課表 | `https://liff.line.me/<LIFF_ID>?s=week` |
| 4 | 1248, 0, 416, 843 | 學費 | `https://liff.line.me/<LIFF_ID>?s=fee` |
| 5 | 1664, 0, 416, 843 | 餐費 | `https://liff.line.me/<LIFF_ID>?s=meal` |
| 6 | 2080, 0, **420**, 843 | 進度 | `https://liff.line.me/<LIFF_ID>?s=progress` |

The last column is 420 wide, not 416: it absorbs the 2500/6 rounding so the bar
has no dead strip on its right edge. `deploy.mjs` computes that; don't hand-edit
the widths here without matching it.

**Six buttons, two-character labels — and the labels are the reason six fits.**
木生婦幼 fits five comfortably because 掛號/報告/意見/我的 are two characters;
ours were four, and a six-column render was visibly cramped until they were
shortened. The full names survive as the card headings inside each screen.
首頁 exists because the daily button had been doubling as home, so its label lied
and there was no way back to the overview.

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

`hw` · `week` · `fee` · `meal` · `progress` are matched against `VIEWS` in
`parent/index.html`. **Each key opens its own SCREEN** — the page mounts only
that view's cards, and fetches only that view's data (每週課表 is one query;
the old single-page version fired twelve whichever button was tapped).

**A key may be ADDED but never RENAMED.** A menu already sitting in a parent's
LINE cannot be recalled, so a renamed key breaks a live button. *Which* cards a
key mounts is free to change; the key itself is not. An unknown or absent key
falls back to `hw`, which doubles as the home view — never a blank screen.

The page reads `?s=<key>` **and** `#<key>`, because LIFF packs the whole suffix
(query *and* fragment) into `liff.state` and hands it back before `liff.init()`
resolves. `?s=` is the form the menu uses — LINE rejects a fragment in the LIFF
**endpoint** URL.

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
