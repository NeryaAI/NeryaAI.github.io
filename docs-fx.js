// ───────────────────────────────────────────────────────────────────
// Nerya Docs · docs-fx.js  (ES module · anime.js v4, vendored)
//
// The kinetic + interaction layer for the operator manual: hero reveal,
// scroll-triggered section/grid animations, counters, sidebar scrollspy,
// read-progress meter, code copy buttons, a live filter, the mobile
// nav drawer, and the back-to-top button.
//
// Robustness rule: nothing is hidden by CSS. This module writes the
// hidden pre-state inline then animates it in, so if anime.js ever fails
// to import the page still renders fully visible and usable.
// ───────────────────────────────────────────────────────────────────

import { animate, stagger } from "animejs";

const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ── helpers ─────────────────────────────────────────────────────────
function hide(els, y = 22) {
  els.forEach((e) => {
    e.style.opacity = "0";
    e.style.transform = `translateY(${y}px)`;
  });
}

function onEnter(el, cb, threshold = 0.15) {
  if (!el) return;
  if (!("IntersectionObserver" in window)) return cb();
  const io = new IntersectionObserver(
    (ents) =>
      ents.forEach((e) => {
        if (e.isIntersecting) {
          io.disconnect();
          cb();
        }
      }),
    { threshold, rootMargin: "0px 0px -8% 0px" }
  );
  io.observe(el);
}

// Word split that preserves inline markup (<em>, <br>).
function splitWords(el) {
  const frag = document.createDocumentFragment();
  const walk = (node, target) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        child.textContent.split(/(\s+)/).forEach((p) => {
          if (p === "") return;
          if (/^\s+$/.test(p)) target.appendChild(document.createTextNode(" "));
          else {
            const w = document.createElement("span");
            w.className = "w";
            w.style.display = "inline-block";
            w.textContent = p;
            target.appendChild(w);
          }
        });
      } else if (child.nodeType === 1) {
        const clone = child.cloneNode(false);
        target.appendChild(clone);
        walk(child, clone);
      }
    });
  };
  walk(el, frag);
  el.textContent = "";
  el.appendChild(frag);
  return [...el.querySelectorAll(".w")];
}

// ── HERO ────────────────────────────────────────────────────────────
function setupHero() {
  const title = $(".doc-hero h1");
  const bits = $$(".doc-hero [data-fx]");
  if (REDUCE) return;

  let words = [];
  if (title) {
    words = splitWords(title);
    words.forEach((w) => {
      w.style.opacity = "0";
      w.style.transform = "translateY(40px) rotateZ(4deg)";
    });
  }
  hide(bits, 18);

  animate(words, {
    opacity: [0, 1],
    translateY: [40, 0],
    rotateZ: [4, 0],
    duration: 900,
    delay: stagger(60, { start: 120 }),
    ease: "outExpo",
  });
  animate(bits, {
    opacity: [0, 1],
    translateY: [18, 0],
    duration: 760,
    delay: stagger(90, { start: 360 }),
    ease: "outExpo",
  });
}

// ── section reveals ─────────────────────────────────────────────────
function setupReveals() {
  if (REDUCE) return;
  $$("[data-reveal]").forEach((el) => {
    hide([el], 24);
    onEnter(
      el,
      () =>
        animate(el, {
          opacity: [0, 1],
          translateY: [24, 0],
          duration: 760,
          ease: "outExpo",
        }),
      0.12
    );
  });
}

// ── grid cascades ───────────────────────────────────────────────────
function setupGrids() {
  if (REDUCE) return;
  $$("[data-grid]").forEach((grid) => {
    const items = $$("[data-card]", grid);
    if (!items.length) return;
    items.forEach((it) => {
      it.style.opacity = "0";
      it.style.transform = "translateY(26px) scale(0.97)";
    });
    onEnter(
      grid,
      () =>
        animate(items, {
          opacity: [0, 1],
          translateY: [26, 0],
          scale: [0.97, 1],
          duration: 680,
          delay: stagger(70),
          ease: "outExpo",
        }),
      0.1
    );
  });
}

// ── counters ────────────────────────────────────────────────────────
function setupCounters() {
  $$("[data-count-to]").forEach((el) => {
    const to = parseInt(el.getAttribute("data-count-to") || "0", 10);
    const suffix = el.getAttribute("data-suffix") || "";
    if (REDUCE) {
      el.textContent = to + suffix;
      return;
    }
    onEnter(
      el,
      () => {
        const start = performance.now();
        const dur = 1500;
        const tick = (now) => {
          const p = Math.min(1, (now - start) / dur);
          const e = 1 - Math.pow(1 - p, 4);
          el.textContent = Math.round(to * e) + (p >= 1 ? suffix : "");
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      0.6
    );
  });
}

// ── sidebar scrollspy ───────────────────────────────────────────────
function setupSpy() {
  const links = $$(".side-nav a[data-spy]");
  if (!links.length) return;
  const map = new Map();
  links.forEach((a) => {
    const id = a.getAttribute("href").slice(1);
    const sec = document.getElementById(id);
    if (sec) map.set(sec, a);
  });
  const sections = [...map.keys()];
  let ticking = false;

  const docHeight = () =>
    Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);

  const update = () => {
    ticking = false;
    // The "reading line" sits just below the sticky top bar. The active
    // section is the one that the line currently falls inside.
    const line = Math.max(120, window.innerHeight * 0.22);
    let current = sections[0];
    for (const sec of sections) {
      const r = sec.getBoundingClientRect();
      if (r.top <= line && r.bottom > line) {
        current = sec;
        break;
      }
      if (r.top <= line) current = sec; // fallback: last section above the line
    }
    // near the very bottom, force the last section active
    if (window.innerHeight + window.scrollY >= docHeight() - 4) {
      current = sections[sections.length - 1];
    }
    links.forEach((a) => a.classList.remove("is-active"));
    const active = map.get(current);
    if (active) {
      active.classList.add("is-active");
      // keep the active link visible inside the scrolling sidebar
      const sb = $(".docs-sidebar");
      if (sb) {
        const ar = active.getBoundingClientRect();
        const sr = sb.getBoundingClientRect();
        if (ar.top < sr.top + 40 || ar.bottom > sr.bottom - 40) {
          active.scrollIntoView({ block: "nearest" });
        }
      }
    }
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  update();
}

// ── read progress meter ─────────────────────────────────────────────
function setupReadMeter() {
  const bar = $("[data-read-bar]");
  if (!bar) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    const docH = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    const max = docH - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    bar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
  update();
}

// ── back to top ─────────────────────────────────────────────────────
function setupToTop() {
  const btn = $("[data-top]");
  if (!btn) return;
  const onScroll = () => btn.classList.toggle("is-shown", window.scrollY > 600);
  window.addEventListener("scroll", onScroll, { passive: true });
  btn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: REDUCE ? "auto" : "smooth" })
  );
  onScroll();
}

// ── copy buttons ────────────────────────────────────────────────────
function setupCopy() {
  $$("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const code = $("code", btn.closest(".code"));
      if (!code) return;
      const text = code.innerText;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
        } catch {}
        ta.remove();
      }
      const prev = btn.textContent;
      btn.textContent =
        window.NeryaLang && window.NeryaLang.t ? window.NeryaLang.t("dz.copied", "copied") : "copied";
      btn.classList.add("is-done");
      window.setTimeout(() => {
        btn.textContent = prev;
        btn.classList.remove("is-done");
      }, 1400);
    });
  });
}

// ── mobile nav drawer ───────────────────────────────────────────────
function setupDrawer() {
  const btn = $("[data-menu]");
  const sidebar = $("[data-sidebar]");
  const scrim = $("[data-scrim]");
  if (!btn || !sidebar) return;
  const setOpen = (open) => {
    sidebar.classList.toggle("is-open", open);
    scrim?.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  };
  btn.addEventListener("click", () =>
    setOpen(!sidebar.classList.contains("is-open"))
  );
  scrim?.addEventListener("click", () => setOpen(false));
  $$(".side-nav a", sidebar).forEach((a) =>
    a.addEventListener("click", () => setOpen(false))
  );
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
}

// ── live filter ─────────────────────────────────────────────────────
function setupFilter() {
  const input = $("[data-filter]");
  if (!input) return;
  const sections = $$(".doc-section");
  const links = $$(".side-nav a[data-spy]");

  const linkFor = (id) => links.find((a) => a.getAttribute("href") === `#${id}`);

  const apply = () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      $$("[data-filter-item]").forEach((it) => it.classList.remove("is-dimmed"));
      sections.forEach((s) => s.classList.remove("is-dimmed"));
      links.forEach((a) => a.classList.remove("is-dimmed"));
      return;
    }
    sections.forEach((s) => {
      // When a section has filterable items (e.g. skill cards), filter at the
      // item level and only hide the section when nothing inside matches.
      const items = $$("[data-filter-item]", s);
      let visible;
      if (items.length) {
        visible = 0;
        items.forEach((it) => {
          const hit = it.textContent.toLowerCase().includes(q);
          it.classList.toggle("is-dimmed", !hit);
          if (hit) visible += 1;
        });
      } else {
        visible = s.textContent.toLowerCase().includes(q) ? 1 : 0;
      }
      s.classList.toggle("is-dimmed", visible === 0);
      const link = linkFor(s.id);
      if (link) link.classList.toggle("is-dimmed", visible === 0);
    });
  };
  input.addEventListener("input", apply);

  // "/" focuses the filter
  window.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== input) {
      e.preventDefault();
      input.focus();
    }
    if (e.key === "Escape" && document.activeElement === input) {
      input.value = "";
      apply();
      input.blur();
    }
  });
}

// ── boot ────────────────────────────────────────────────────────────
// Wait for i18n to apply the active language before splitting/animating, so
// the kinetic layer runs on the translated copy (not the English source).
const i18nReady =
  window.NeryaLang && window.NeryaLang.ready ? window.NeryaLang.ready : Promise.resolve();

i18nReady.then(() => {
  const runs = [
    setupHero,
    setupReveals,
    setupGrids,
    setupCounters,
    setupSpy,
    setupReadMeter,
    setupToTop,
    setupCopy,
    setupDrawer,
    setupFilter,
  ];
  for (const fn of runs) {
    try {
      fn();
    } catch (err) {
      console.warn(`[docs-fx] ${fn.name || "fx"} skipped:`, err);
    }
  }
});
