// ───────────────────────────────────────────────────────────────────
// Nerya Landing · anime-fx.js  (ES module · anime.js v4, vendored)
//
// The whole kinetic layer lives here. anime.js owns every entrance,
// every cascade, the counters, the magnetic buttons, the 3D tilt, and
// the looping "this thing is alive" motion. main.js keeps only the
// WebGL shader, the loader, the cursor, and pointer/scroll parallax.
//
// Robustness rule: nothing is hidden by CSS. This module sets the
// pre-animation (hidden) state in JS and then animates it in, so if the
// engine ever fails to import, the page simply renders fully visible.
// ───────────────────────────────────────────────────────────────────

import { animate, stagger, createTimeline } from "animejs";

const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const COARSE = window.matchMedia("(hover: none), (pointer: coarse)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ── text splitting ──────────────────────────────────────────────────
function splitChars(el) {
  const text = el.textContent;
  el.textContent = "";
  el.classList.add("is-split");
  const out = [];
  // Group letters by word so a word never breaks mid-character when the
  // headline wraps — the line only breaks at the real spaces between words.
  const words = text.split(" ");
  words.forEach((word, wi) => {
    if (wi > 0) el.appendChild(document.createTextNode(" "));
    if (!word) return;
    const wspan = document.createElement("span");
    wspan.className = "word";
    for (const ch of word) {
      const span = document.createElement("span");
      span.className = "c";
      span.textContent = ch;
      wspan.appendChild(span);
      out.push(span);
    }
    el.appendChild(wspan);
  });
  return out;
}

// Word-split that preserves inline markup (<em>, <span>, <br>, <code>).
function splitWords(el) {
  el.classList.add("is-split");
  const frag = document.createDocumentFragment();
  const walk = (node, target) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const parts = child.textContent.split(/(\s+)/);
        for (const p of parts) {
          if (p === "") continue;
          if (/^\s+$/.test(p)) {
            target.appendChild(document.createTextNode(" "));
          } else {
            const w = document.createElement("span");
            w.className = "w";
            w.textContent = p;
            target.appendChild(w);
          }
        }
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

// Run cb the first time el enters the viewport.
function onEnter(el, cb, threshold = 0.2) {
  if (!el) return;
  if (!("IntersectionObserver" in window)) return cb();
  const io = new IntersectionObserver(
    (ents) => ents.forEach((e) => {
      if (e.isIntersecting) {
        io.disconnect();
        cb();
      }
    }),
    { threshold, rootMargin: "0px 0px -8% 0px" }
  );
  io.observe(el);
}

function whenLoaded() {
  return new Promise((res) => {
    if (document.body.classList.contains("is-loaded")) return res();
    const obs = new MutationObserver(() => {
      if (document.body.classList.contains("is-loaded")) {
        obs.disconnect();
        res();
      }
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    window.setTimeout(() => { obs.disconnect(); res(); }, 2800);
  });
}

// ── HERO · cinematic entrance ───────────────────────────────────────
function prepHero() {
  const title = $(".hero h1");
  if (!title || REDUCE) return null;
  const chars = splitChars(title);
  chars.forEach((c) => {
    c.style.opacity = "0";
    c.style.transform = "translateY(0.55em) rotateX(-90deg)";
  });
  // the supporting hero copy, hidden until the title lands
  const bits = [
    $(".hero .eyebrow"),
    $(".hero-lede"),
    ...$$(".hero-actions > *"),
    ...$$(".hero-query a"),
    ...$$(".status-strip > span"),
  ].filter(Boolean);
  bits.forEach((b) => {
    b.style.opacity = "0";
    b.style.transform = "translateY(18px)";
  });
  return { chars, bits };
}

function playHero(hero) {
  if (!hero) return;
  const tl = createTimeline({ defaults: { ease: "outExpo" } });
  tl.add(hero.chars, {
    opacity: [0, 1],
    translateY: ["0.55em", "0em"],
    rotateX: [-90, 0],
    duration: 900,
    delay: stagger(45, { from: "center" }),
    ease: "outBack",
    onComplete: () => heroTitleAlive(hero.chars),
  }).add(
    hero.bits,
    {
      opacity: [0, 1],
      translateY: [18, 0],
      duration: 720,
      delay: stagger(70),
    },
    "-=550"
  );
}

// Keep the hero title alive: a slow violet glow + lift wave travels the
// letters forever, so the headline never freezes after it lands.
function heroTitleAlive(chars) {
  if (!chars || !chars.length || REDUCE) return;
  animate(chars, {
    translateY: [0, -8, 0],
    duration: 3000,
    loop: true,
    delay: stagger(85, { from: "center" }),
    ease: "inOutSine",
  });
  animate(chars, {
    textShadow: [
      "0 0 0px oklch(0.7 0.2 300 / 0)",
      "0 0 26px oklch(0.74 0.2 300 / 0.65)",
      "0 0 0px oklch(0.7 0.2 300 / 0)",
    ],
    duration: 2600,
    loop: true,
    delay: stagger(95, { from: "center" }),
    ease: "inOutSine",
  });
}

// ── headings · word reveal on scroll ────────────────────────────────
function setupHeadings() {
  if (REDUCE) return;
  $$("main section h2").forEach((h2) => {
    // authors headline is a stacked line treatment — handled separately
    if (h2.closest(".authors-copy")) return;
    const words = splitWords(h2);
    words.forEach((w) => {
      w.style.opacity = "0";
      w.style.transform = "translateY(40px) rotateZ(3deg)";
    });
    onEnter(h2, () => {
      animate(words, {
        opacity: [0, 1],
        translateY: [40, 0],
        rotateZ: [3, 0],
        duration: 850,
        delay: stagger(55),
        ease: "outExpo",
      });
    });
  });

  // authors stacked lines
  const lines = $$(".authors-copy h2 .line");
  if (lines.length) {
    lines.forEach((l) => {
      l.style.opacity = "0";
      l.style.transform = "translateX(-26px)";
    });
    onEnter($(".authors-copy h2"), () => {
      animate(lines, {
        opacity: [0, 1],
        translateX: [-26, 0],
        duration: 760,
        delay: stagger(90),
        ease: "outExpo",
      });
    });
  }
}

// ── generic reveals / cascades ──────────────────────────────────────
function hide(els, y = 26) {
  els.forEach((e) => {
    e.style.opacity = "0";
    e.style.transform = `translateY(${y}px)`;
  });
}

function revealGroup(containerSel, childSel, opts = {}) {
  if (REDUCE) return;
  $$(containerSel).forEach((container) => {
    const items = $$(childSel, container);
    if (!items.length) return;
    hide(items, opts.y ?? 28);
    onEnter(container, () => {
      animate(items, {
        opacity: [0, 1],
        translateY: [opts.y ?? 28, 0],
        scale: opts.scale ? [0.94, 1] : undefined,
        filter: opts.blur ? ["blur(12px)", "blur(0px)"] : undefined,
        duration: opts.duration ?? 720,
        delay: stagger(opts.stagger ?? 90, { start: opts.start ?? 0 }),
        ease: opts.ease ?? "outExpo",
      });
    }, opts.threshold ?? 0.15);
  });
}

function revealItems(sel, opts = {}) {
  if (REDUCE) return;
  $$(sel).forEach((el) => {
    hide([el], opts.y ?? 24);
    onEnter(el, () => {
      animate(el, {
        opacity: [0, 1],
        translateY: [opts.y ?? 24, 0],
        filter: opts.blur ? ["blur(14px)", "blur(0px)"] : undefined,
        duration: opts.duration ?? 760,
        ease: opts.ease ?? "outExpo",
      });
    }, opts.threshold ?? 0.2);
  });
}

// Force-play the ambient + scene loops. They are muted/playsinline/autoplay,
// but Safari and battery-saver modes often need an explicit kick, mirroring
// the reactor video. Under reduced-motion we freeze them on the poster.
function playScenes() {
  $$(".scene-video").forEach((v) => {
    if (REDUCE) {
      v.removeAttribute("autoplay");
      v.pause?.();
      return;
    }
    const play = () => v.play?.().catch(() => {});
    play();
    v.addEventListener("loadeddata", play, { once: true });
    v.addEventListener("canplay", play, { once: true });
  });
}

function setupReveals() {
  // section eyebrows + indexes + lede paragraphs
  revealItems(".section-index", { y: 18 });
  revealItems(
    ".evolve-head .eyebrow, .evolve-head p, .guard-inner .eyebrow, .guard-inner p, .guard-inner code, .team-head .eyebrow, .team-head p, .reactor-head .eyebrow, .reactor-lede, .loop-head .eyebrow, .docs-head .eyebrow, .docs-sub, .launch-copy .eyebrow, .launch-copy p, .authors-copy p, .quote-block",
    { y: 22 }
  );
  // figures / bands — cinematic focus-pull on the big scenes
  revealItems(".evolve-bleed, .authors-tile, .guard-bg", { y: 30, threshold: 0.1, blur: true, duration: 900 });
  // grouped cascades
  revealGroup(".docs-grid", ".doc-card", { y: 34, scale: true, stagger: 80, blur: true });
  revealGroup(".guard-pills", "span", { y: 16, stagger: 55 });
  revealGroup(".launch-readouts", "article", { y: 30, stagger: 110 });
  revealGroup(".evolve-list", "li", { y: 16, stagger: 70 });
  revealGroup(".evolve-counter", ".counter-row", { y: 16, stagger: 90 });
  revealGroup(".authors-baseline", ".micro-copy, .baseline-rule", { y: 14, stagger: 80 });
  revealGroup(".ritual-list", "li", { y: 14, stagger: 70 });
  // CTAs in the launch block
  revealGroup(".launch-actions", "*", { y: 18, stagger: 80 });
}

// ── counters ────────────────────────────────────────────────────────
function fmt(v, pad) {
  if (v >= 1000) return v.toLocaleString();
  return pad ? String(v).padStart(pad, "0") : String(v);
}
function countUp(el, to, pad) {
  if (REDUCE) { el.textContent = fmt(to, pad); return; }
  const start = performance.now();
  const dur = 1600;
  const tick = (now) => {
    const p = Math.min(1, (now - start) / dur);
    const e = 1 - Math.pow(1 - p, 4);
    el.textContent = fmt(Math.round(to * e), pad);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function setupCounters() {
  $$("[data-count-to]").forEach((el) => {
    const to = parseInt(el.getAttribute("data-count-to") || "0", 10);
    onEnter(el, () => countUp(el, to, 0), 0.4);
  });
}

// ── magnetic buttons (spring) ───────────────────────────────────────
function setupMagnetic() {
  if (COARSE || REDUCE) return;
  $$(".magnetic").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.32;
      const y = (e.clientY - r.top - r.height / 2) * 0.42;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener("pointerleave", () => {
      animate(el, {
        translateX: 0,
        translateY: 0,
        duration: 700,
        ease: "outElastic(1, .5)",
      });
    });
  });
}

// ── 3D tilt for cards ───────────────────────────────────────────────
function setupTilt() {
  if (COARSE || REDUCE) return;
  $$(".doc-card").forEach((card) => {
    card.style.transformStyle = "preserve-3d";
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      card.style.transform = `perspective(900px) rotateX(${(-dy * 7).toFixed(
        2
      )}deg) rotateY(${(dx * 9).toFixed(2)}deg) translateY(-4px)`;
    });
    card.addEventListener("pointerleave", () => {
      animate(card, {
        rotateX: 0,
        rotateY: 0,
        translateY: 0,
        duration: 600,
        ease: "outElastic(1, .6)",
      });
    });
  });
}

// ── REACTOR · the live evolution feed ───────────────────────────────
function setupReactor() {
  const section = $("#reactor");
  if (!section) return;
  const video = $(".reactor-video", section);
  if (video) {
    if (REDUCE) { video.removeAttribute("autoplay"); video.pause?.(); }
    else {
      const play = () => video.play?.().catch(() => {});
      play();
      video.addEventListener("canplay", play, { once: true });
    }
  }

  const screen = $("[data-tilt]", section);
  const stage = $(".reactor-stage", section);
  if (screen && stage && !COARSE && !REDUCE) {
    stage.addEventListener("pointermove", (e) => {
      const r = screen.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      screen.style.transform = `perspective(1400px) rotateX(${(-dy * 5).toFixed(
        2
      )}deg) rotateY(${(dx * 6).toFixed(2)}deg)`;
    });
    stage.addEventListener("pointerleave", () => {
      screen.style.transform = "perspective(1400px) rotateX(0deg) rotateY(0deg)";
    });
  }

  onEnter(section, () => {
    const bks = $$(".reactor-brackets .bk", section);
    if (bks.length && !REDUCE) {
      bks.forEach((p) => {
        const L = p.getTotalLength();
        p.style.strokeDasharray = L;
        p.style.strokeDashoffset = L;
      });
      animate(bks, {
        strokeDashoffset: [(el) => el.getTotalLength(), 0],
        duration: 900,
        delay: stagger(130),
        ease: "inOutQuad",
      });
      window.setTimeout(() => bks.forEach((p) => (p.style.strokeDashoffset = "0")), 1500);
    }

    const huds = $$(".hud", section);
    if (huds.length && !REDUCE) {
      huds.forEach((h) => { h.style.opacity = "0"; h.style.transform = "translateY(10px) scale(0.9)"; });
      animate(huds, {
        opacity: [0, 1],
        translateY: [10, 0],
        scale: [0.9, 1],
        duration: 700,
        delay: stagger(120, { start: 300 }),
        ease: "outBack",
      });
      // keep them alive
      window.setTimeout(() => {
        animate(huds, {
          translateY: [0, -5],
          loop: true,
          alternate: true,
          duration: 2400,
          delay: stagger(280),
          ease: "inOutSine",
        });
      }, 1300);
    }

    $$("[data-telem]", section).forEach((el) =>
      countUp(el, parseInt(el.dataset.to || "0", 10), parseInt(el.dataset.pad || "0", 10))
    );
    runReactorCycle(section);
  });
}

function runReactorCycle(section) {
  const feed = $$(".rail-feed li", section);
  const bar = $("[data-rail-bar]", section);
  const versionEl = $("[data-version]", section);
  const versions = ["v1.1", "v1.1", "v1.2", "v1.2", "v1.3"];
  if (!feed.length) return;
  const apply = (idx) => {
    feed.forEach((li, k) => li.classList.toggle("is-active", k === idx));
    const pct = ((idx + 1) / feed.length) * 100;
    if (bar) {
      if (REDUCE) bar.style.width = `${pct}%`;
      else animate(bar, { width: `${pct}%`, duration: 600, ease: "outQuad" });
    }
    if (versionEl && versionEl.textContent !== versions[idx]) {
      versionEl.textContent = versions[idx];
      if (!REDUCE)
        animate(versionEl, { scale: [1.3, 1], opacity: [0.25, 1], duration: 420, ease: "outQuad" });
    }
  };
  apply(0);
  if (REDUCE) { apply(feed.length - 1); return; }
  let i = 0;
  window.setInterval(() => { i = (i + 1) % feed.length; apply(i); }, 2200);
}

// ── AGENT TEAM ──────────────────────────────────────────────────────
function setupTeam() {
  const section = $("#team");
  if (!section) return;
  onEnter(section, () => {
    const cards = $$(".agent-card", section);
    const core = $("[data-core]", section);
    if (REDUCE) return;
    cards.forEach((c) => { c.style.opacity = "0"; c.style.transform = "translateY(28px) scale(0.95)"; });
    animate(cards, {
      opacity: [0, 1],
      translateY: [28, 0],
      scale: [0.95, 1],
      duration: 760,
      delay: stagger(130),
      ease: "outExpo",
    });
    if (core) {
      core.style.opacity = "0";
      animate(core, { opacity: [0, 1], duration: 800, delay: 340, ease: "outQuad" });
    }
    let t = 0;
    const turn = () => { cards.forEach((c, k) => c.classList.toggle("is-turn", k === t % cards.length)); t += 1; };
    turn();
    window.setInterval(turn, 1600);
  }, 0.15);
}

// ── EVOLVE PIPELINE walk ────────────────────────────────────────────
function setupPipeline() {
  const list = $("[data-pipeline]");
  if (!list) return;
  const steps = $$("[data-step]", list);
  if (!steps.length) return;
  if (REDUCE) { steps[steps.length - 1].classList.add("is-active"); return; }
  onEnter(list, () => {
    let i = 0;
    const walk = () => { steps.forEach((s, k) => s.classList.toggle("is-active", k === i)); i = (i + 1) % steps.length; };
    walk();
    window.setInterval(walk, 950);
  });
}

// ── LOOP DIAGRAM assemble ───────────────────────────────────────────
function setupLoopDiagram() {
  const svg = $(".loop-diagram");
  if (!svg || REDUCE) return;
  onEnter(svg, () => {
    const nodes = $$(".loop-node", svg);
    const edges = $(".loop-edges", svg);
    const legend = $$(".loop-legend > span");
    if (edges) { edges.style.opacity = "0"; animate(edges, { opacity: [0, 1], duration: 1200, ease: "outQuad" }); }
    if (nodes.length) {
      // node <g> elements are positioned with an SVG translate() transform,
      // so animate opacity only — a CSS transform would reset their position.
      nodes.forEach((n) => (n.style.opacity = "0"));
      animate(nodes, { opacity: [0, 1], duration: 700, delay: stagger(110, { start: 200 }), ease: "outQuad" });
    }
    if (legend.length) {
      hide(legend, 12);
      animate(legend, { opacity: [0, 1], translateY: [12, 0], duration: 600, delay: stagger(90, { start: 900 }), ease: "outExpo" });
    }
  });
}

// ── STAR BURST on CTA clicks ────────────────────────────────────────
function setupStarBurst() {
  if (REDUCE) return;
  $$(".primary-cta, [data-pulse]").forEach((btn) =>
    btn.addEventListener("click", (e) => burst(e.clientX, e.clientY))
  );
}
function burst(x, y) {
  const frag = document.createDocumentFragment();
  const sparks = [];
  for (let i = 0; i < 22; i += 1) {
    const s = document.createElement("span");
    s.className = "spark";
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    if (i % 3 === 0) s.style.background = "var(--violet-soft)";
    if (i % 5 === 0) s.style.background = "var(--mint)";
    frag.appendChild(s);
    sparks.push(s);
  }
  document.body.appendChild(frag);
  sparks.forEach((s) => {
    const a = Math.random() * Math.PI * 2;
    const d = 60 + Math.random() * 130;
    animate(s, {
      translateX: Math.cos(a) * d,
      translateY: Math.sin(a) * d,
      scale: [1, 0],
      opacity: [1, 0],
      duration: 700 + Math.random() * 450,
      ease: "outExpo",
      onComplete: () => s.remove(),
    });
  });
}

// ── boot ────────────────────────────────────────────────────────────
const hero = prepHero();           // split + hide hero immediately (behind loader)
setupHeadings();
setupReveals();

whenLoaded().then(() => {
  const runs = [
    () => playHero(hero),
    playScenes,
    setupCounters,
    setupMagnetic,
    setupTilt,
    setupReactor,
    setupTeam,
    setupPipeline,
    setupLoopDiagram,
    setupStarBurst,
  ];
  for (const fn of runs) {
    try { fn(); } catch (err) { console.warn(`[anime-fx] ${fn.name || "fx"} skipped:`, err); }
  }
});
