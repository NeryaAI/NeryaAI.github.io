// ───────────────────────────────────────────────────────────────────
// Nerya · i18n.js — lightweight bilingual runtime (no dependencies)
//
// English is the HTML source of truth (default textContent / attributes).
// Chinese lives in i18n.zh.json as a flat { "key.path": "中文" } map.
//
// Markup contract:
//   [data-i18n="key"]                       → textContent
//   [data-i18n-html="key"]                  → innerHTML (rich: <em>/<code>…)
//   [data-i18n-attr="placeholder:k, aria-label:k2"] → attributes
//   [data-lang-switch] … [data-lang-set]    → the topbar dropdown
//
// Language is resolved once (localStorage > navigator.language) by the
// tiny inline <head> bootstrap, exposed as window.__NERYA_LANG__, then
// re-used here. window.NeryaLang.ready resolves after the dictionary is
// fetched and applied, so the kinetic layers (anime-fx / docs-fx) can
// split text only after it has been translated.
// ───────────────────────────────────────────────────────────────────
(function () {
  "use strict";

  var STORAGE_KEY = "nerya-lang";
  var SUPPORTED = ["en", "zh"];
  var DICT_URL = "i18n.zh.json";
  var LABELS = { en: "EN", zh: "中文" };

  function each(list, fn) {
    for (var i = 0; i < list.length; i++) fn(list[i], i);
  }

  function detect() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
    } catch (e) {}
    var nav = ((navigator.language || navigator.userLanguage || "en") + "").toLowerCase();
    return nav.indexOf("zh") === 0 ? "zh" : "en";
  }

  var current =
    SUPPORTED.indexOf(window.__NERYA_LANG__) !== -1 ? window.__NERYA_LANG__ : detect();
  var dict = {};
  var originals = new WeakMap();
  var captured = false;

  function parseAttrSpec(spec) {
    var map = {};
    if (!spec) return map;
    each(spec.split(","), function (pair) {
      var idx = pair.indexOf(":");
      if (idx === -1) return;
      var attr = pair.slice(0, idx).trim();
      var key = pair.slice(idx + 1).trim();
      if (attr && key) map[attr] = key;
    });
    return map;
  }

  function i18nEls() {
    return document.querySelectorAll("[data-i18n],[data-i18n-html],[data-i18n-attr]");
  }

  // Snapshot the authored English once, before any translation or kinetic
  // text-splitting mutates the DOM.
  function captureOriginals() {
    if (captured) return;
    captured = true;
    each(i18nEls(), function (el) {
      var rec = {};
      if (el.hasAttribute("data-i18n")) rec.text = el.textContent;
      if (el.hasAttribute("data-i18n-html")) rec.html = el.innerHTML;
      if (el.hasAttribute("data-i18n-attr")) {
        rec.attrs = {};
        var spec = parseAttrSpec(el.getAttribute("data-i18n-attr"));
        for (var a in spec) if (spec.hasOwnProperty(a)) rec.attrs[a] = el.getAttribute(a);
      }
      originals.set(el, rec);
    });
  }

  function applyLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) lang = "en";
    current = lang;
    captureOriginals();
    var zh = lang === "zh";

    each(i18nEls(), function (el) {
      var orig = originals.get(el) || {};

      if (el.hasAttribute("data-i18n")) {
        var k = el.getAttribute("data-i18n");
        if (zh && dict[k] != null) el.textContent = dict[k];
        else if (orig.text != null) el.textContent = orig.text;
      }
      if (el.hasAttribute("data-i18n-html")) {
        var kh = el.getAttribute("data-i18n-html");
        if (zh && dict[kh] != null) el.innerHTML = dict[kh];
        else if (orig.html != null) el.innerHTML = orig.html;
      }
      if (el.hasAttribute("data-i18n-attr")) {
        var spec = parseAttrSpec(el.getAttribute("data-i18n-attr"));
        for (var attr in spec) {
          if (!spec.hasOwnProperty(attr)) continue;
          var ka = spec[attr];
          if (zh && dict[ka] != null) el.setAttribute(attr, dict[ka]);
          else if (orig.attrs && orig.attrs[attr] != null) el.setAttribute(attr, orig.attrs[attr]);
        }
      }
    });

    var d = document.documentElement;
    d.lang = lang;
    d.classList.remove("lang-en", "lang-zh");
    d.classList.add("lang-" + lang);

    NeryaLang.current = lang;
    updateSwitchUI(lang);
    try {
      window.dispatchEvent(new CustomEvent("nerya:langchange", { detail: { lang: lang } }));
    } catch (e) {}
  }

  function set(lang) {
    if (SUPPORTED.indexOf(lang) === -1) return;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}
    applyLang(lang);
  }

  // Translate a dynamic JS string by key, English fallback otherwise.
  function t(key, fallback) {
    if (current === "zh" && dict[key] != null) return dict[key];
    return fallback != null ? fallback : key;
  }

  // ── topbar dropdown ───────────────────────────────────────────────
  function closeAll(except) {
    each(document.querySelectorAll("[data-lang-switch].is-open"), function (sw) {
      if (sw === except) return;
      sw.classList.remove("is-open");
      var tg = sw.querySelector("[data-lang-toggle]");
      if (tg) tg.setAttribute("aria-expanded", "false");
    });
  }

  function updateSwitchUI(lang) {
    each(document.querySelectorAll("[data-lang-current]"), function (el) {
      el.textContent = LABELS[lang] || lang;
    });
    each(document.querySelectorAll("[data-lang-set]"), function (btn) {
      var on = btn.getAttribute("data-lang-set") === lang;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", String(on));
    });
  }

  function wireSwitch() {
    document.addEventListener("click", function (e) {
      var node = e.target;
      var toggle = node.closest && node.closest("[data-lang-toggle]");
      if (toggle) {
        var sw = toggle.closest("[data-lang-switch]");
        var open = !sw.classList.contains("is-open");
        closeAll(sw);
        sw.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        return;
      }
      var opt = node.closest && node.closest("[data-lang-set]");
      if (opt) {
        set(opt.getAttribute("data-lang-set"));
        closeAll();
        return;
      }
      closeAll();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeAll();
    });
  }

  // ── boot ──────────────────────────────────────────────────────────
  function boot() {
    captureOriginals();
    wireSwitch();

    // Prefer the embedded dictionary (i18n.zh.js → window.__NERYA_ZH__).
    // It is bundled via a <script> tag, so Chinese works even over file://
    // where fetch() of a local JSON is blocked by the browser. Applying it
    // synchronously also removes the first-paint English flash.
    if (window.__NERYA_ZH__ && typeof window.__NERYA_ZH__ === "object") {
      dict = window.__NERYA_ZH__;
    }
    applyLang(current); // instant: embedded zh if present, else English fallback

    // Over http(s), refresh from the JSON source of truth (keeps a single
    // canonical file). Over file:// this rejects and we keep the embedded dict.
    return fetch(DICT_URL)
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (json) {
        if (json && typeof json === "object") {
          dict = json;
          applyLang(current);
        }
      })
      .catch(function () {
        /* file:// or offline: keep the embedded dictionary already applied */
      });
  }

  var NeryaLang = {
    current: current,
    set: set,
    apply: applyLang,
    t: t,
    ready: null,
  };
  window.NeryaLang = NeryaLang;
  window.NeryaI18n = NeryaLang;
  NeryaLang.ready = boot();
})();
