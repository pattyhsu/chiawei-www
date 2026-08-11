# chiawei-www — 家偉文理補習班 官網 + 家長專區

Public repo → GitHub Pages → **https://www.chiaweiedu.com** (same deployment
pattern as `chiawei-admin`). Static only: no server, no build step. The pages
talk straight to Supabase PostgREST with the **anon key** (public by design);
**RLS is the entire security boundary** — nothing in this repo is one.

| File | What |
|---|---|
| `index.html` | 官網首頁 (brand v4 版型 + live 開課資訊) |
| `elementary/junior/senior.html` | 年段頁 (國小/國中/高中) |
| `offerings.js` | renders 開課資訊 from `class_offerings` (the one anon-readable table; edited on admin.chiaweiedu.com) |
| `parent/index.html` | **家長專區** — LIFF/LINE Login → parent-login Edge Function → RLS-scoped child report |
| `legal/privacy-v1.html` | 個資法 告知/同意文 (versioned; new version = NEW file, bump `CONSENT_VERSION`) |
| `robots.txt` / `sitemap.xml` | 官網 indexable; `/parent/` noindex |

## Config points

- `parent/index.html` → `LIFF_ID` is **empty** until the LINE Login channel +
  LIFF app exist (LINE Developers console, **same provider as the school OA** —
  otherwise the captured userId will never match the push userId). Until then
  the page shows 尚未開通.
- The Edge Function needs `supabase secrets set LINE_LOGIN_CHANNEL_ID=…`.

## 上線前 (content pour — owner)

1. Replace every 「示意資料」 block (榜單/躍升/師資/地址電話/LINE id/費用 FAQ)
   with real data — 榜單/見證 require 家長書面同意; then remove the badges.
2. GA4 measurement id (not added yet — add the snippet to all four pages).
3. 同意文 (`legal/privacy-v1.html`) needs owner sign-off before the first real
   parent binds.

## DNS (Namecheap BasicDNS since 2026-08-11 — deliberately NOT on Cloudflare)

**LIVE at https://www.chiaweiedu.com since 2026-08-11** (cert issued, HTTPS
enforced). The zone moved GoDaddy → Namecheap (registrar transfer) that day;
records now live in Namecheap → chiaweiedu.com → Advanced DNS:

- `www` CNAME → `pattyhsu.github.io` (this site)
- `admin` CNAME → `pattyhsu.github.io` (chiawei-admin)
- `@` URL Redirect (301) → `https://www.chiaweiedu.com`
- MAIL SETTINGS → Gmail preset (the school's Google Workspace MX — do NOT
  remove; without it school email silently queues then bounces)

If the Pages cert ever goes null (Pages checks DNS once, never retries):
remove `CNAME`, push, re-add, push (learned on chiawei-admin).
