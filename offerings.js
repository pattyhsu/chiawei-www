// offerings.js — renders 特別班 from the class_offerings table.
//
// 🔑 特別班 ONLY (Patty, 2026-08-20): "i dont want 常態班 advertised publicly. i
// only want 特別班 advertised publicly." 常態班 are what the 年段 pages already
// describe at length; listing them again as "news" says nothing new. A 特別班 —
// AMC / AIME / 寒暑假遊學 — is separately enrolled and CLOSES, so it is the only
// kind where a public listing does work: it can be missed.
//
// The 最新開課 section was deleted in 67e269d as noise. This is not a restore of
// it; it is a narrower section that earns its place because every row has a
// deadline.
//
// This is the ONE deliberately anon-readable table (RLS: status='open' rows
// only — see chiawei-platform migration 20260806000001). The key below is the
// anon key: public by design, safe in a public repo; RLS is the boundary.
// Editing happens on admin.chiaweiedu.com/offerings.html, so a new class
// appears here without touching this repo.
//
// Usage: <div data-offerings data-stage="國中"></div> + <script src="offerings.js" defer>
// data-stage is a DISPLAY filter only (matches grade_label/name loosely);
// if it matches nothing, all open offerings are shown rather than none.
(function () {
  var SUPABASE_URL = "https://fngddvxroiokqmpxdwwu.supabase.co";
  var ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuZ2Rkdnhyb2lva3FtcHhkd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNjYzMzgsImV4cCI6MjA5Njc0MjMzOH0.x5PQWx-V8gyJvcsNMSFoJYjRWCXgt1fcUAfkhCjlVE0";

  var STAGE_HINTS = {
    "國小": ["國小", "小一", "小二", "小三", "小四", "小五", "小六", "升國一"],
    "國中": ["國中", "國一", "國二", "國三", "升高一", "會考"],
    "高中": ["高中", "高一", "高二", "高三", "學測"],
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function rocDate(iso) {
    if (!iso) return "";
    var p = iso.split("-");
    return p[1] + "/" + p[2] + " 開課";
  }

  function mmdd(iso) {
    if (!iso) return "";
    var p = iso.split("-");
    return p[1] + "/" + p[2];
  }

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") +
           "-" + String(d.getDate()).padStart(2, "0");
  }

  function matches(row, stage) {
    var hints = STAGE_HINTS[stage];
    if (!hints) return true;
    var hay = (row.grade_label || "") + " " + (row.name || "");
    return hints.some(function (h) { return hay.indexOf(h) !== -1; });
  }

  function render(el, rows) {
    // 🔑 NO ROWS → THE WHOLE SECTION GOES, not an empty state. Same rule the
    // 家長專區's 特別班 tile follows: 「今天沒有作業」 is information, but a
    // permanent 「目前沒有特別班」 on a marketing page is a section that says
    // nothing — and the school may go a whole year without one (Patty,
    // 2026-08-20). It reappears by itself the moment a 特別班 is 上架.
    if (!rows.length) {
      var sec = el.closest("section");
      if (sec) sec.style.display = "none"; else el.innerHTML = "";
      return;
    }
    el.innerHTML = rows
      .map(function (r) {
        return (
          '<div class="off-row">' +
          '<div class="off-main"><b>' + esc(r.name) + "</b>" +
          (r.grade_label ? '<span class="off-tag">' + esc(r.grade_label) + "</span>" : "") +
          (r.subject ? '<span class="off-tag">' + esc(r.subject) + "</span>" : "") +
          "</div>" +
          '<div class="off-meta num">' +
          [esc(r.schedule || ""), esc(rocDate(r.start_date))].filter(Boolean).join("　") +
          "</div>" +
          (r.signup_deadline
            ? '<div class="off-due' + (r.signup_deadline < todayISO() ? " past" : "") + '">' +
              (r.signup_deadline < todayISO()
                ? "報名已截止"
                : "報名截止 " + esc(mmdd(r.signup_deadline))) + "</div>"
            : "") +
          (r.note ? '<div class="off-note">' + esc(r.note) + "</div>" : "") +
          "</div>"
        );
      })
      .join("");
  }

  function boot() {
    var slots = document.querySelectorAll("[data-offerings]");
    if (!slots.length) return;
    fetch(
      SUPABASE_URL +
        "/rest/v1/class_offerings?select=name,grade_label,subject,schedule,start_date,note,signup_deadline" +
        "&kind=eq.special&status=eq.open" +
        "&order=sort_order.asc,signup_deadline.asc.nullslast",
      { headers: { apikey: ANON_KEY } }
    )
      .then(function (res) { return res.ok ? res.json() : []; })
      .catch(function () { return []; })
      .then(function (rows) {
        slots.forEach(function (el) {
          var stage = el.getAttribute("data-stage");
          var mine = stage ? rows.filter(function (r) { return matches(r, stage); }) : rows;
          render(el, mine.length ? mine : rows);
        });
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
