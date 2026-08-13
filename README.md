# chiawei-www — 家偉文理補習班 官網 + 家長專區

Public repo → GitHub Pages → **https://chiaweiedu.com** (same deployment
pattern as `chiawei-admin`). Static only: no server, no build step. The pages
talk straight to Supabase PostgREST with the **anon key** (public by design);
**RLS is the entire security boundary** — nothing in this repo is one.

| File | What |
|---|---|
| `index.html` | 官網首頁 (brand v4 版型 + live 開課資訊) |
| `elementary/junior/senior.html` | 年段頁 (國小/國中/高中) |
| `offerings.js` | renders 開課資訊 from `class_offerings` (the one anon-readable table; edited on admin.chiaweiedu.com) |
| `legal/privacy-v1.html` | 個資法 告知/同意文 (versioned; new version = NEW file) |
| `robots.txt` / `sitemap.xml` | 官網 indexable |

> **家長專區 REMOVED from the site 2026-08-13** (Patty: "we'll build this later if
> needed"). `parent/index.html` was deleted — recover with
> `git show 73bc363:parent/index.html`. The **backend is intact and inert**: the
> `parent-login` Edge Function is deployed but returns 503 (no LINE secret), and
> the DB half (`parents.line_user_id`, `parent_link_codes`, `parent_consents`,
> `parent_bind()`, `taxonomy_labels_v`, pgTAP 15/16) is untouched — migrations are
> append-only, and none of it is reachable without the page. To revive: restore the
> file, re-add the nav/footer links, set `LIFF_ID`, and put back the 產生家長綁定碼
> button in `chiawei-admin/roster.html` (also removed).
> ⚠️ `legal/privacy-v1.html` is still linked in the footer but its text describes
> the 家長專區 specifically — it does **not** cover the 預約表單's collection of
> parent name/phone/child grade. Rewrite it as a general 告知 before relying on it.

## 上線前 (content pour — owner)

1. Replace every 「示意資料」 block (榜單/躍升/師資/地址電話/LINE id/費用 FAQ)
   with real data — 榜單/見證 require 家長書面同意; then remove the badges.
2. GA4 measurement id (not added yet — add the snippet to all four pages).
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
