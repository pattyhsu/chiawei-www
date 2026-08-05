// offerings.js — renders 開課資訊 from the class_offerings table.
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

  function matches(row, stage) {
    var hints = STAGE_HINTS[stage];
    if (!hints) return true;
    var hay = (row.grade_label || "") + " " + (row.name || "");
    return hints.some(function (h) { return hay.indexOf(h) !== -1; });
  }

  function render(el, rows) {
    if (!rows.length) {
      el.innerHTML =
        '<p class="off-empty">目前沒有新班公告——各年段常年招生中，歡迎加 LINE 詢問插班與試聽。</p>';
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
        "/rest/v1/class_offerings?select=name,grade_label,subject,schedule,start_date,note" +
        "&status=eq.open&order=sort_order.asc,start_date.asc.nullslast",
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
