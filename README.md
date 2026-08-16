# chiawei-www — 家偉文理補習班 官網 + 家長專區

Public repo → GitHub Pages → **https://chiaweiedu.com** (same deployment
pattern as `chiawei-admin`). Static only: no server, no build step. The pages
talk straight to Supabase PostgREST with the **anon key** (public by design);
**RLS is the entire security boundary** — nothing in this repo is one.

| File | What |
|---|---|
| `index.html` | 官網首頁 (brand v4 版型 + live 開課資訊) |
| `elementary/junior/senior.html` | 年段頁 (國小/國中/高中) |
| `parent/index.html` | 家長專區 — LIFF page (LINE login → 綁定碼 → 課程/作業 · 未繳學費 · 學習進度) |
| `offerings.js` | renders 開課資訊 from `class_offerings` (the one anon-readable table; edited on admin.chiaweiedu.com) |
| `legal/privacy-v1.html` | 個資法 告知/同意文 (versioned; new version = NEW file) |
| `robots.txt` / `sitemap.xml` | 官網 indexable |

## 家長專區 — restored 2026-08-16, COMMITTED BUT NOT PUSHED

> **⚠️ THIS COMMIT IS DELIBERATELY UNPUSHED (Patty's call, 2026-08-16).** It is
> sitting on `main` on Patty's Mac and is NOT on GitHub Pages. She chose to hold
> it so no 家長專區 link appears in the live nav/footer until the LIFF actually
> works. **`git push origin main` is the last step, after the LINE console work
> below** — not before. If you are a later session and find an unpushed commit
> here, this is why; don't "tidy" it away, and don't push it without asking.

Removed 2026-08-13 ("build it later if needed"), restored when Patty said to
start the LIFF. The page + nav/footer links + the `/parent/` robots disallow +
the 產生家長綁定碼 button in `chiawei-admin/roster.html` are all back. (The admin
half **was** pushed — a button only the owner sees, minting codes nobody can yet
redeem, carries no public surface.)

**It is deliberately safe to have live right now.** `LIFF_ID` is still `""`, and
the page's first branch on that is `show("st-notopen")` — every visitor sees
「家長專區尚未開通」 and nothing touches Supabase. The Edge Function is the second
lock: `parent-login` 503s without `LINE_LOGIN_CHANNEL_ID`. Both must be set
before a single parent can log in, and neither is set yet.

**Two owner steps remain, and the FIRST ONE IS IRREVERSIBLE:**

1. **LINE console — the same-provider trap.** The LINE **Login channel must be
   created under the SAME provider as the school's Official Account** (`@chiawei`).
   If it isn't, the `sub` this page captures will never equal the Messaging-API
   `userId` that Phase 2 push notifications need — and the only fix is re-binding
   every family by hand. Verify the provider **before** the first parent binds,
   not after. Then create a LIFF app (endpoint `https://www.chiaweiedu.com/parent/`,
   size `Full`, scopes `profile` + `openid`) and set:
   - `LIFF_ID` → `parent/index.html` (line ~182)
   - `supabase secrets set LINE_LOGIN_CHANNEL_ID=<channel id> --project-ref fngddvxroiokqmpxdwwu`
2. **同意文 sign-off — `legal/privacy-v2.html`** (new file, 2026-08-16). The page now
   binds against `privacy-v2`, which discloses the two categories v2 added (學費金額,
   課堂/作業紀錄) and restores the LINE-binding sections the 08-13 rewrite dropped.
   It is **drafted by Claude and not lawyer-reviewed** — Patty must sign it off before
   the first real parent binds.
   > **🔑 A new consent version is a NEW FILE, never an edit.** `parent_bind()` stores
   > the version string in `parent_consents` as the legal basis, so the text a family
   > agreed to must stay recoverable verbatim. `privacy-v1.html` *was* edited in place
   > on 08-13 while `CONSENT_VERSION` still read `privacy-v1`; that was harmless only
   > because the table was empty. After the first bind, editing the file a family's row
   > points at silently rewrites what they consented to — add `privacy-v3.html` instead.
   > (`privacy-v1.html` stays on disk, still footer-linked from the four public pages as
   > the site-wide 告知 covering the 預約表單.)

### What the portal shows (v2, 2026-08-16)

Three sections, in the order a parent actually uses them:

1. **課程與作業** — the授課老師's 進度 + 作業 for the child's classes, newest first,
   today's pinned and badged. From `parent_journal_v`.
2. **本期學費** — 應繳 / 已繳 / 未繳 per class + a total. From `parent_tuition_v`.
   **未繳金額 only** — no receipt numbers, no payment methods, no 線上繳費. That
   half of PRD §11 E-4 stays cut; E-5 reversed only the balance.
3. **學習進度** — the 覆蓋度 dial, unit statuses, exam history (unchanged).

Both new surfaces are **security-definer views** filtered by `is_self_or_parent()`,
not row policies — because PostgREST lets the client pick columns, so a policy on
`teacher_journals` would let a parent `select=*` and read `notes`, the teacher's
internal 班級狀況. A column that is not in the view cannot leak, and pgTAP 24 pins
that with `hasnt_column`. **Never add `notes`/`teacher_id` to `parent_journal_v`,
or `receipt_no`/`method`/`paid_on` to `parent_tuition_v`.**

### ⚠️ Build now, invite later — every section is empty today

`terms`, `class_fees`, `teacher_journals` and `readiness_snapshots` are all at **0
rows**. The portal is a display layer over daily staff habits, and those habits have
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
3. 同意文 (`legal/privacy-v1.html`) needs owner sign-off before the first real
   parent binds.

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
