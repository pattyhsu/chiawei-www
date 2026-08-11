// lead-form.js — the 預約免費檢測 form on the public 官網.
//
// Posts into the `leads` table (chiawei-platform migration 20260812000002).
// That table is the ONE deliberately anon-WRITABLE table: anon may INSERT and
// can NEVER SELECT, because a row holds a parent's phone + a child's grade.
// The key below is the anon key — public by design, safe in a public repo; RLS
// is the boundary. Everything that actually protects the table lives in the DB:
// column grants (staff fields unreachable), CHECK constraints, and a throttle
// trigger (3/hour per phone). The checks in this file are UX, not security.
//
// Usage: <div data-lead-form data-page="junior" data-stages="國中"></div>
//        + <script src="lead-form.js" defer></script>
(function () {
  var SUPABASE_URL = "https://fngddvxroiokqmpxdwwu.supabase.co";
  var ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuZ2Rkdnhyb2lva3FtcHhkd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNjYzMzgsImV4cCI6MjA5Njc0MjMzOH0.x5PQWx-V8gyJvcsNMSFoJYjRWCXgt1fcUAfkhCjlVE0";

  // Must stay a subset of the DB CHECK vocabularies (leads_stage_ck / leads_subjects_ck).
  var STAGES = {
    "國小": ["國小三年級", "國小四年級", "國小五年級", "國小六年級"],
    "國中": ["國一", "國二", "國三"],
    "高中": ["高一", "高二", "高三"],
  };
  var SUBJECTS = {
    "國小": ["數學", "國語", "英語", "尚未決定"],
    "國中": ["數學", "理化", "英語", "國文", "社會", "尚未決定"],
    "高中": ["數學", "物理", "化學", "英文", "尚未決定"],
  };

  function stagesFor(spec) {
    var keys = spec ? spec.split(",") : ["國小", "國中", "高中"];
    var out = [];
    keys.forEach(function (k) { out = out.concat(STAGES[k.trim()] || []); });
    return out.length ? out : STAGES["國中"];
  }
  function subjectsFor(spec) {
    var keys = spec ? spec.split(",") : ["國中"];
    var seen = {}, out = [];
    keys.forEach(function (k) {
      (SUBJECTS[k.trim()] || []).forEach(function (s) {
        if (!seen[s]) { seen[s] = 1; out.push(s); }
      });
    });
    return out.length ? out : SUBJECTS["國中"];
  }

  function build(el) {
    var stages = stagesFor(el.getAttribute("data-stages"));
    var subjects = subjectsFor(el.getAttribute("data-stages"));
    el.innerHTML =
      '<form class="lf" novalidate>' +
        '<div class="lf-grid">' +
          '<label class="lf-f"><span>家長稱呼 <i>*</i></span>' +
            '<input name="parent_name" maxlength="40" required placeholder="例：陳媽媽"></label>' +
          '<label class="lf-f"><span>聯絡電話 <i>*</i></span>' +
            '<input name="phone" type="tel" inputmode="tel" maxlength="20" required placeholder="09xx-xxx-xxx"></label>' +
          '<label class="lf-f"><span>孩子年級 <i>*</i></span><select name="stage" required>' +
            '<option value="">請選擇</option>' +
            stages.map(function (s) { return '<option>' + s + "</option>"; }).join("") +
            '<option>其他</option></select></label>' +
          '<label class="lf-f"><span>方便聯絡時段</span><select name="contact_window">' +
            '<option value="">不限</option><option>上午</option><option>下午</option>' +
            '<option>晚間</option><option>皆可</option></select></label>' +
        "</div>" +
        '<fieldset class="lf-subj"><legend>想加強的科目（可複選）</legend>' +
          subjects.map(function (s) {
            return '<label class="lf-chip"><input type="checkbox" name="subjects" value="' + s + '"><span>' + s + "</span></label>";
          }).join("") +
        "</fieldset>" +
        '<label class="lf-f"><span>想告訴我們的事（選填）</span>' +
          '<textarea name="note" maxlength="500" rows="3" placeholder="例：數學段考 50 分上下，想先了解孩子卡在哪"></textarea></label>' +
        // honeypot: a real parent never fills this (off-screen, not tabbable)
        '<div class="lf-hp" aria-hidden="true"><label>公司<input name="company" tabindex="-1" autocomplete="off"></label></div>' +
        '<div class="lf-actions">' +
          '<button class="btn btn-cta" type="submit">送出預約</button>' +
          '<p class="lf-privacy">送出即表示同意我們以此電話與您聯絡安排檢測。' +
            '我們<b>不會</b>將您的資料提供給第三方，詳見<a href="legal/privacy-v1.html">個資保護說明</a>。</p>' +
        "</div>" +
        '<p class="lf-msg" role="status"></p>' +
      "</form>";

    var form = el.querySelector("form");
    var msg = el.querySelector(".lf-msg");
    var btn = el.querySelector("button[type=submit]");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      msg.className = "lf-msg";
      var fd = new FormData(form);

      if (fd.get("company")) { return; }              // bot: silently drop
      var name = (fd.get("parent_name") || "").trim();
      var phone = (fd.get("phone") || "").trim();
      var stage = fd.get("stage") || "";
      if (!name || !phone || !stage) {
        msg.className = "lf-msg err";
        msg.textContent = "請填寫家長稱呼、聯絡電話與孩子年級。";
        return;
      }
      if (!/^[0-9+()#\- ]{8,20}$/.test(phone)) {
        msg.className = "lf-msg err";
        msg.textContent = "電話格式看起來不對，請再確認一次。";
        return;
      }

      var subjects = fd.getAll("subjects");
      var row = {
        parent_name: name,
        phone: phone,
        stage: stage,
        subjects: subjects.length ? subjects : null,
        contact_window: fd.get("contact_window") || null,
        note: (fd.get("note") || "").trim() || null,
        source_page: el.getAttribute("data-page") || "index",
        source: "官網",
      };

      btn.disabled = true;
      msg.textContent = "送出中…";
      fetch(SUPABASE_URL + "/rest/v1/leads", {
        method: "POST",
        headers: {
          apikey: ANON_KEY,
          "Content-Type": "application/json",
          Prefer: "return=minimal",                   // no SELECT grant: must not ask for the row back
        },
        body: JSON.stringify(row),
      })
        .then(function (res) {
          if (res.ok) {
            form.innerHTML =
              '<div class="lf-done"><b>收到了，謝謝您！</b>' +
              "<p>我們會在一個工作天內以電話與您聯絡，安排孩子的免費觀念檢測時間。" +
              "若想更快，也可以直接來電或加 LINE。</p></div>";
            return;
          }
          return res.json().then(function (e) { throw e; }, function () { throw {}; });
        })
        .catch(function (err) {
          btn.disabled = false;
          msg.className = "lf-msg err";
          // 22023 = the throttle trigger; anything else is a generic failure.
          msg.textContent =
            err && err.code === "22023"
              ? "這支電話剛剛已經送出過了，我們會盡快與您聯絡；如需更快請直接來電。"
              : "送出失敗，請稍後再試，或直接來電／加 LINE 與我們聯絡。";
        });
    });
  }

  function boot() {
    var slots = document.querySelectorAll("[data-lead-form]");
    for (var i = 0; i < slots.length; i++) build(slots[i]);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
