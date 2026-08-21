# chiawei-www — 家偉文理補習班 官網 + 家長專區

Public repo → GitHub Pages → **https://chiaweiedu.com** (same deployment
pattern as `chiawei-admin`). Static only: no server, no build step. The pages
talk straight to Supabase PostgREST with the **anon key** (public by design);
**RLS is the entire security boundary** — nothing in this repo is one.

| File | What |
|---|---|
| `index.html` | 官網首頁 (brand v4 版型 + live 開課資訊) |
| `elementary/junior/senior.html` | 年段頁 (國小/國中/高中) |
| `parent/index.html` | 家長專區 — LIFF page (LINE login → 綁定碼 → 提醒 · 課程/作業 · 課表 · 未繳學費 · 餐費 · 學習進度) |
| `offerings.js` | renders 開課資訊 from `class_offerings` (the one anon-readable table; edited on admin.chiaweiedu.com) |
| `legal/privacy-v1.html` | 個資法 告知/同意文 — site-wide 告知 covering the 預約表單 |
| `legal/privacy-v2.html` | the version `parent_bind()` records; **a new version is a NEW FILE, never an edit** |
| `parent/richmenu/` | LINE 圖文選單 artwork + its tap-area map (see that dir's README) |
| `robots.txt` / `sitemap.xml` | 官網 indexable |

## 家長專區 — the LINE setup, as built 2026-08-18

Removed 2026-08-13 ("build it later if needed"), restored 2026-08-16, and wired
to a real LINE channel on 2026-08-18. The 產生家長綁定碼 button lives in
`chiawei-admin/student.html` (學生總覽), since 名冊 was split into 班級 + 學生總覽.

### The LINE objects — do not create a second one of any of these

| Thing | Value |
|---|---|
| Provider | **家偉補習班** |
| Messaging API channel | 家偉補習班 (@chiawei) — linked to that provider **permanently** |
| LINE Login channel | 家偉補習班家長專區 — **Channel ID `2011161502`** |
| LIFF app | 家長專區 — **LIFF ID `2011161502-kGxpeEuI`**, size **`Tall`** |
| LIFF scopes | `openid` + `profile` only (**never `email`** — needless PII) |
| LIFF endpoint | `https://www.chiaweiedu.com/parent/` |
| LIFF size | **`Tall`** (~80% of screen), NOT `Full`. Patty's call 2026-08-18, against 木生婦幼's: a full-screen takeover to check one homework line reads as heavier than the errand. `Compact` (~50%) was the alternative, judged too short for a six-section scrolling report. |
| Add friend option | `On (Normal)` — offered, not pre-ticked |

**The same-provider requirement is SATISFIED and that is the whole ballgame.**
LINE user IDs are scoped per provider — *"if the provider is the same, the user
ID is the same regardless of the channel type"* — so the `sub` this page captures
equals the Messaging-API `userId` that Phase 2 per-class push needs. It was got
right by doing the **irreversible** step first: the OA was linked to the provider
from **OA Manager → 設定 → Messaging API → 啟用**, which LINE warns *"you won't be
able to change or unlink this provider once linked"*, and only then was the Login
channel created **inside that provider's own page**.

> ⚠️ **You should never see a "Create a new provider" screen again.** Everything
> LINE-side gets created from inside the 家偉補習班 provider. A Login channel in a
> second provider silently breaks the userId match, and the only fix is re-binding
> every family by hand.

### The two locks — both now OPEN

1. `LIFF_ID` in `parent/index.html` (~line 279). Empty → `show("st-notopen")`
   before any Supabase call.
2. `LINE_LOGIN_CHANNEL_ID` as a Supabase secret. Unset → `parent-login` 503s
   `not_configured`.
   ```bash
   supabase secrets set LINE_LOGIN_CHANNEL_ID=2011161502 --project-ref fngddvxroiokqmpxdwwu
   ```
   No function redeploy needed — the secret is read at runtime. Verify live by
   POSTing a junk token: **401 `bad_token`** = configured, **503 `not_configured`**
   = not.

### 綁定第二個孩子 — the office sends a LINK, not just a code

There is no ＋綁定另一個孩子 button. Only **11 of 145 families** have more than one
child enrolled, so a permanent control on every screen was furniture for the other
134 — and the tab row it lived in is now hidden entirely for single-child families,
since a lone pill repeating the name the 首頁 summary already prints is noise.

To add a second child, 學生總覽 → 產生家長綁定碼, then send the parent **both**:

```
https://liff.line.me/2011161502-kGxpeEuI?s=bind
```

⚠️ **The code is useless without the link.** `?s=bind` is the ONLY way an
already-bound parent can reach the code entry screen — the automatic route fires
only for a parent with no children bound at all. If the key is ever removed,
second children become unbindable with no visible symptom.

### Gates still standing before a real family binds

- **The Login channel is in `Developing` status.** Only accounts with a role on
  the channel (i.e. Patty as Admin) can log in — which is what makes the ZZ 測試班
  pilot naturally private. **Switch it to `Published` before handing a 綁定碼 to
  any real family**, or their login fails in a way that looks like anything but
  the real cause.
- **Set the Privacy policy URL in BOTH LINE places** once the push has made
  `privacy-v2.html` reachable (it was 404 while unpushed, which is why both were
  left blank at creation): the provider-level dialog (OA Manager → Messaging API)
  and the Login channel's Basic settings →
  `https://www.chiaweiedu.com/legal/privacy-v2.html`. Terms of use stays blank —
  the school has none and one must not be invented.
- **Require two-factor authentication is left ON** (LINE's default). The docs say
  *"the behavior of LINE Login authorization requests within the LIFF browser is
  not guaranteed"*, so whether a parent actually sees a 2FA prompt is an open
  question the pilot answers. It is a toggle, not a one-way door — if it is
  friction, turn it off; nothing needs re-binding.

### 同意文 — `legal/privacy-v2.html`, signed off by Patty 2026-08-18

The page binds against `privacy-v2`, which discloses the two categories v2 added
(學費金額, 課堂/作業紀錄) and restores the LINE-binding sections the 08-13 rewrite
dropped. Drafted by Claude, not lawyer-reviewed; Patty accepted it on that basis.

> **🔑 A new consent version is a NEW FILE, never an edit.** `parent_bind()` stores
> the version string in `parent_consents` as the legal basis, so the text a family
> agreed to must stay recoverable verbatim. `privacy-v1.html` *was* edited in place
> on 08-13 while `CONSENT_VERSION` still read `privacy-v1`; that was harmless only
> because the table was empty. After the first bind, editing the file a family's row
> points at silently rewrites what they consented to — add `privacy-v3.html` instead.
> (`privacy-v1.html` stays on disk, still footer-linked from the four public pages as
> the site-wide 告知 covering the 預約表單.)

### The push order — why it is split in two

The original plan had the pilot before the push. **That cannot work**: LIFF loads
`https://www.chiaweiedu.com/parent/`, which is 404 until the push. What Patty
actually held back on 08-16 was not the page but *advertising* it — a 家長專區
link in the live nav pointing at something unproven. So:

1. `hold the 家長專區 nav link until the pilot passes` — reverts only the nav +
   footer links on the four public pages. Push. `/parent/` is reachable, nothing
   on the site points at it, and a stranger who guesses the URL meets the 綁定碼
   screen and a code only the owner can mint (10/h, audited).
2. Pilot against ZZ 測試班 (示範甲…己, `117-1191`–`1196`).
3. **`git revert` that hold commit and push. That revert is the launch.**

### What the portal shows (v2, 2026-08-16/17)

**Since 2026-08-19 these are five SEPARATE SCREENS, one per 圖文選單 button** —
not one scrolling page. `?s=hw` doubles as home (there is no 首頁 button) and
carries a **重點摘要** strip: 今天有作業 / 未繳 / 餐費, each chip **omitted when its
data is absent, never zeroed**. Below is what each screen shows.

0. **老師提醒** — pinned above everything, auto-expiring (default 7 days). For a
   forward-looking class notice like 「本週六加課」. From `parent_notice_v`.
1. **課程與作業** — the授課老師's 進度 + 作業, newest first, today's pinned and
   badged. From `parent_journal_v`.
2. **每週課表** — the child's own meetings, day rows not a 6-column grid (a child
   takes 2–5 classes; a full grid is mostly blank). From `parent_schedule_v`.
   ⚠️ Synced from `chiawei-admin/schedule.data.js` — **re-run
   `scripts/sync_schedule.py --apply` after every timetable edit** or parents read
   stale times.
3. **本期學費** — 應繳 / 已繳 / 未繳 per class + a total. From `parent_tuition_v`.
   **未繳金額 only** — no receipt numbers, no payment methods, no 線上繳費. That
   half of PRD §11 E-4 stays cut; E-5 reversed only the balance.
4. **餐費餘額** — prepaid balance + recent draw-downs. From `parent_meal_balance_v`
   (summed over ALL history) + `parent_meal_v` (60-day detail). May be negative —
   the child ate, so it says 已欠款 rather than a minus sign to interpret.
5. **學習進度** — the 覆蓋度 dial, unit statuses, exam history (unchanged).

All of these are **security-definer views** filtered by `is_self_or_parent()`, not
row policies — because PostgREST lets the client pick columns, so a policy on
`teacher_journals` would let a parent `select=*` and read `notes`, the teacher's
internal 班級狀況. A column that is not in the view cannot leak, and pgTAP 24/25/26/27
pin that with `hasnt_column`. **Never add `notes`/`teacher_id` to `parent_journal_v`
or `parent_schedule_v`, `receipt_no`/`method`/`paid_on` to `parent_tuition_v`, or
`recorded_by` to `parent_meal_v`.** `student_notes` (學生備註) is **not** in this list
and must never be: it is owner/主任-only free text about a named minor.

### ⚠️ Build now, invite later — every section is empty today

`terms`, `class_fees`, `teacher_journals`, `meal_ledger` (real students) and
`readiness_snapshots` are all at **0 rows**. `class_meetings` is the exception — 40
rows are synced, so 每週課表 works on day one. The portal is a display layer over daily staff habits, and those habits have
not started (the 115 term opens 8/24). **Hand out 綁定碼 only after** the 收費台 has a
term + class fees entered, and teachers have kept 老師日誌 for ~2 weeks. A page that
says 「尚無資料」 in all three sections costs more trust than not having one.

Every section degrades to an honest empty state rather than a zero — deliberately:

- no fee rows → 「本期費用尚未公告」, **never NT$0** (which reads as "you owe nothing");
- some classes priced and others not → the total is **withheld** behind
  「部分班別的本期費用尚未公告」, because `parent_tuition_v` INNER JOINs `class_fees`
  and an unpriced class silently vanishes, making the sum look authoritative and low;
- no journal → 「老師還沒有填寫課堂紀錄」, phrased as *not yet*, not as "nothing happened";
- no snapshot → 「還沒有覆蓋度快照——測驗批改後就會開始累積。」 **Do not force a snapshot
  to fill that space**: as of 2026-08-16 the only graded data in the system belongs to
  `ZZ 測試班`'s fake students, so every real child would render a stark `0` at 100% 未測.
  Let the 9/1 cron run after the term has produced real 批改.

## Content pour (owner) — 示意 badges removed 2026-08-13

The 「示意資料 / 數字示意，待填」 badges and the `.demo-badge` style are **gone**
(Patty's call: "we launched, I'll change the info in it slowly afterwards").
Nothing on the site now signals which content is still placeholder, so the list
below is the only record of what still needs real data:

1. **升學成果** — hero 成果卡, the 「00 位／00 年」 stat row, 榜單牆 (王○宇…), and the
   段考躍升 chips are all invented and currently read as fact. 榜單/見證 require
   家長書面同意 before publishing the real ones.
2. **見證與師資** — 國小部「家長怎麼說」, 高中部「學長姊怎麼說」, and the ○○老師 cards.
3. **每週報告 mock-ups** (index 家長每週收到的報告, junior 逐觀念精熟報告) — these are
   UI examples rather than claims, so they can stay as-is.
4. **Seasonal banner** (`#summer` on index) — swapped to 新學期 on 2026-08-13 and
   left date-free; it needs the real 開課日 whenever the 檔期 is fixed.
5. GA4 measurement id (not added yet — add the snippet to all four pages).

## DNS — Cloudflare since 2026-08-13 (reversal; read the why)

**Both hosts work over HTTPS.** `https://chiaweiedu.com` and
`https://www.chiaweiedu.com` both serve; the apex 301s to www (canonical).
Cert is Cloudflare's Universal SSL (Google Trust Services), covering both names.

Registrar = Namecheap; **DNS is now Cloudflare** (`chuck`/`jade.ns.cloudflare.com`).
Records live in the Cloudflare dashboard:

| Record | Value | Proxy |
|---|---|---|
| `@` A ×4 | `185.199.108–111.153` (GitHub Pages) | 🟠 Proxied — this is what gets the apex a cert |
| `www` CNAME | `pattyhsu.github.io` | 🟠 Proxied |
| `admin` CNAME | `pattyhsu.github.io` | ⚪ DNS-only (already had a valid GitHub cert; keeps blast radius small) |
| MX ×5 | Google Workspace (`aspmx.l`, `alt1`, `alt2`, `aspmx2`, `aspmx3`) | ⚪ DNS-only — **never proxy MX; this is school email** |

**SSL/TLS mode MUST stay "Full"** — not "Full (strict)" (GitHub has no cert for
the apex, so strict fails), not "Flexible" (redirect loop with GitHub Pages).
"Always Use HTTPS" is on; **HSTS is deliberately OFF** (it is a one-way door and
already caused a day of "can't even load http" during the outage below).

Cloudflare caches static assets: after pushing site changes, if you don't see
them, **Caching → Configuration → Purge Everything** (or Development Mode).

### Why we moved (this reverses a recorded decision)

The domain was deliberately kept OFF Cloudflare (PRD §11 F-1) because it carries
the school's Google Workspace MX and the move was judged "risk for zero gain".
The gain stopped being zero:

**GitHub Pages could not give the apex a certificate.** GitHub scopes the cert to
whatever `CNAME` held at provisioning and never widens it, so the first cert named
`www` only. Putting the apex in `CNAME` made the API list both names — and then
nothing issued for **16+ hours**, with Certificate Transparency confirming Let's
Encrypt issued *nothing* for the apex, while DNS was provably perfect (4 A records,
no AAAA/CAA/DNSSEC). That is a **known GitHub backend failure** (community
discussions #200447, #184514 — one apex stuck 3 weeks) whose only remedy is a
support ticket. Meanwhile a parent typing `chiaweiedu.com` got a browser security
warning — the actual business cost that flipped the decision (Patty, 2026-08-13).

**Two traps learned the hard way, do not repeat:**
1. **Never remove/re-add the GitHub custom domain to "nudge" provisioning** — it
   resets GitHub's internal timer. We did it three times; it prolonged the outage.
2. **Diagnose at the handshake and in CT logs, not the Pages API.** The API happily
   reported both domains "approved" while the edge served `CN=*.github.io`:
   - `curl -sv https://<host>/ 2>&1 | grep subject` → `CN=*.github.io` means no cert
   - `curl -s "https://api.certspotter.com/v1/issuances?domain=chiaweiedu.com&include_subdomains=true&expand=dns_names"` → was one ever issued?

If Cloudflare is ever removed, the apex loses HTTPS again until GitHub fixes the
backend — do not undo this without re-reading the above.
