// ───────────────────────────────────────────────────────────────────
// Nerya Landing · main.js
// Canvas2D market field — DNA double-helix (evolution) + scrolling
// candlestick / K-line tape (trading) + loader + custom cursor
// + magnetic targets + spotlight masks + scroll meter + pinned ritual
// scroll + reveals + frame counter + count-up + reduced-motion fallback.
// ───────────────────────────────────────────────────────────────────

const canvas = document.querySelector("#signal-field");
const meter = document.querySelector("[data-scroll-meter]");
const cursor = document.querySelector("[data-cursor-dot]");
const cursorLabel = document.querySelector("[data-cursor-label]");
const loaderCount = document.querySelector("[data-loader-count]");
const loaderLine = document.querySelector("[data-loader-line]");
const ritualTrack = document.querySelector("[data-ritual-track]");
const frameLabel = document.querySelector("[data-frame]");
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const pointer = {
  x: window.innerWidth * 0.5,
  y: window.innerHeight * 0.5,
  tx: window.innerWidth * 0.5,
  ty: window.innerHeight * 0.5,
};

let width = 1;
let height = 1;
let dpr = 1;
let scrollProgress = 0;
let pulse = 0;
let startedAt = performance.now();
let frameTick = 0;
let ctx = null;

// ───────────────────────────────────────────────────────────────────
// Procedural market field — tiny deterministic helpers
// ───────────────────────────────────────────────────────────────────

const fract = (x) => x - Math.floor(x);
const hash1 = (n) => fract(Math.sin(n * 127.1) * 43758.5453123);
// smooth 1D value noise
function vnoise(x) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash1(i) * (1 - u) + hash1(i + 1) * u;
}
// a gently trending price walk, ~[-1.4, 1.4]
function priceAt(i) {
  return (
    (vnoise(i * 0.3) - 0.5) * 1.1 +
    (vnoise(i * 0.11 + 19) - 0.5) * 1.3 +
    Math.sin(i * 0.18) * 0.18
  );
}

// Brand palette (violet identity — no amber, that is reserved for warnings)
const C = {
  violet: [139, 92, 246], // #8b5cf6 brand-500
  light: [180, 139, 255], // #b48bff brand-300
  iris: [170, 156, 255], // periwinkle highlight
  deep: [122, 74, 210], // recessed violet (down candles)
};
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// ───────────────────────────────────────────────────────────────────
// K-line / candlestick tape — a market chart that streams leftward
// ───────────────────────────────────────────────────────────────────

function drawCandles(t, ox, oy) {
  const spacing = 26;
  const cw = 12;
  const baseY = height * 0.7;
  const amp = Math.min(height * 0.13, 150);
  const drift = t * 0.0011; // candle indexes per ms
  const cols = Math.ceil(width / spacing) + 4;
  const frac = drift - Math.floor(drift);

  ctx.save();
  ctx.translate(ox * 0.6, oy * 0.6);
  for (let k = -3; k < cols; k += 1) {
    const idx = k + Math.floor(drift);
    const x = k * spacing - frac * spacing + spacing * 0.5;
    const o = priceAt(idx);
    const c = priceAt(idx + 1);
    const hi = Math.max(o, c) + (0.12 + hash1(idx * 1.7) * 0.5);
    const lo = Math.min(o, c) - (0.12 + hash1(idx * 2.3) * 0.5);
    const yO = baseY - o * amp;
    const yC = baseY - c * amp;
    const yH = baseY - hi * amp;
    const yL = baseY - lo * amp;
    const up = c >= o;
    const col = up ? C.iris : C.deep;
    const edge = up ? C.light : C.violet;

    // wick
    ctx.strokeStyle = rgba(col, 0.22);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, yH);
    ctx.lineTo(x, yL);
    ctx.stroke();

    // body
    const top = Math.min(yO, yC);
    const h = Math.max(2, Math.abs(yC - yO));
    ctx.fillStyle = rgba(col, 0.16);
    ctx.fillRect(x - cw / 2, top, cw, h);
    ctx.strokeStyle = rgba(edge, 0.26);
    ctx.lineWidth = 1;
    ctx.strokeRect(x - cw / 2, top, cw, h);
  }
  ctx.restore();
}

// ───────────────────────────────────────────────────────────────────
// DNA double helix — two strands + base-pair rungs, slowly travelling
// ───────────────────────────────────────────────────────────────────

function drawHelix(t, ox, oy) {
  const cy = height * 0.44;
  const amp = Math.min(height * 0.12, 150);
  const wavelength = Math.min(width * 0.5, 620);
  const freq = (Math.PI * 2) / wavelength;
  const phase = t * 0.0011;
  const step = 8;

  ctx.save();
  ctx.translate(ox, oy);

  // base-pair rungs + nodes (fake glow via stacked translucent discs)
  for (let x = -24; x <= width + 24; x += 24) {
    const ang = phase + x * freq;
    const y1 = cy + Math.sin(ang) * amp;
    const y2 = cy + Math.sin(ang + Math.PI) * amp;
    const depth = (Math.cos(ang) + 1) * 0.5; // 0 back … 1 front

    ctx.strokeStyle = rgba(C.iris, 0.05 + depth * 0.12);
    ctx.lineWidth = 1 + depth * 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
    ctx.stroke();

    drawNode(x, y1, 1.5 + depth * 2.8, C.light, 0.2 + depth * 0.45);
    drawNode(x, y2, 1.5 + (1 - depth) * 2.8, C.violet, 0.2 + (1 - depth) * 0.45);
  }

  // the two phosphate strands
  for (const off of [0, Math.PI]) {
    ctx.beginPath();
    for (let x = -24; x <= width + 24; x += step) {
      const y = cy + Math.sin(phase + x * freq + off) * amp;
      x === -24 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = rgba(off ? C.violet : C.iris, 0.24);
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

function drawNode(x, y, r, col, a) {
  ctx.fillStyle = rgba(col, a * 0.16);
  ctx.beginPath();
  ctx.arc(x, y, r * 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgba(col, a);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawGlow(ox, oy) {
  const gx = width * 0.62 + ox * 2;
  const gy = height * 0.48 + oy * 2;
  const g = ctx.createRadialGradient(
    gx,
    gy,
    0,
    gx,
    gy,
    Math.max(width, height) * 0.62
  );
  g.addColorStop(0, rgba(C.violet, 0.16 + pulse * 0.2));
  g.addColorStop(0.42, rgba(C.violet, 0.05));
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
}

// ───────────────────────────────────────────────────────────────────
// Render loop
// ───────────────────────────────────────────────────────────────────

function render(time) {
  pointer.x += (pointer.tx - pointer.x) * 0.08;
  pointer.y += (pointer.ty - pointer.y) * 0.08;
  pulse *= 0.93;

  const t = time - startedAt;
  const ox = (pointer.x - width / 2) * -0.012;
  const oy = (pointer.y - height / 2) * -0.012;

  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = "source-over";
  drawGlow(ox, oy);
  ctx.globalCompositeOperation = "lighter";
  drawCandles(t, ox, oy);
  drawHelix(t, ox, oy);
  ctx.globalCompositeOperation = "source-over";

  // Hero frame counter — operator feel
  frameTick += 1;
  if (frameLabel && frameTick % 4 === 0) {
    frameLabel.textContent = `frame ${String(frameTick).padStart(4, "0")}`;
  }

  if (!prefersReducedMotion) requestAnimationFrame(render);
}

// ───────────────────────────────────────────────────────────────────
// Loader sequence (counter + line fill)
// ───────────────────────────────────────────────────────────────────

function bootLoader() {
  let value = 0;
  const interval = window.setInterval(() => {
    value += Math.ceil((100 - value) * 0.18);
    value = Math.min(100, value);
    if (loaderCount) loaderCount.textContent = `/${String(value).padStart(2, "0")}`;
    if (loaderLine) loaderLine.style.width = `${value}%`;
    if (value >= 100) {
      window.clearInterval(interval);
      window.setTimeout(() => document.body.classList.add("is-loaded"), 260);
      window.setTimeout(() => {
        pulse = 1;
      }, 620);
    }
  }, 70);
}

// ───────────────────────────────────────────────────────────────────
// ASCII cloud — soft signal noise in the hero
// ───────────────────────────────────────────────────────────────────

function makeAsciiCloud() {
  const target = document.querySelector("[data-ascii]");
  if (!target) return;
  const rows = [];
  const alphabet = ["/", "/", "/", "0", "1", ">", "-", "_", "·", "+"];
  for (let y = 0; y < 22; y += 1) {
    let row = "";
    for (let x = 0; x < 46; x += 1) {
      const center = Math.abs(x - 23) + Math.abs(y - 11);
      const char =
        center < 9 && (x + y) % 3 === 0
          ? alphabet[(x * 7 + y * 11) % alphabet.length]
          : " ";
      row += char;
    }
    rows.push(row);
  }
  target.textContent = rows.join("\n");
}

// ───────────────────────────────────────────────────────────────────
// Scroll meter + pinned ritual track
// ───────────────────────────────────────────────────────────────────

function updateScroll() {
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  scrollProgress = Math.min(1, Math.max(0, window.scrollY / max));
  if (meter) meter.style.width = `${scrollProgress * 100}%`;

  const rituals = document.querySelector("#rituals");
  if (rituals && ritualTrack) {
    if (window.innerWidth <= 720) {
      ritualTrack.style.transform = "none";
      return;
    }
    const rect = rituals.getBoundingClientRect();
    const travel = rituals.offsetHeight - window.innerHeight;
    const sectionProgress = Math.min(
      1,
      Math.max(0, -rect.top / Math.max(1, travel))
    );
    ritualTrack.style.transform = `translate3d(${-sectionProgress * 200}vw, 0, 0)`;
  }

  updateScrollParallax();
}

// ───────────────────────────────────────────────────────────────────
// Custom cursor
// ───────────────────────────────────────────────────────────────────

function setupCursor() {
  if (!cursor || window.matchMedia("(hover: none), (pointer: coarse)").matches)
    return;

  window.addEventListener("pointermove", (event) => {
    pointer.tx = event.clientX;
    pointer.ty = event.clientY;
    cursor.classList.add("is-active");
    cursorLabel.classList.add("is-active");
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
    cursorLabel.style.left = `${event.clientX}px`;
    cursorLabel.style.top = `${event.clientY}px`;
  });

  document
    .querySelectorAll("a, button, .magnetic, .spotlight, [data-spotlight]")
    .forEach((target) => {
      target.addEventListener("pointerenter", () => {
        cursor.classList.add("is-hot");
        cursorLabel.textContent = target.matches("a, button") ? "open" : "inspect";
      });
      target.addEventListener("pointerleave", () => {
        cursor.classList.remove("is-hot");
        cursorLabel.textContent = "signal";
      });
    });
}

// ───────────────────────────────────────────────────────────────────
// Spotlight masks (evolve-figure, etc.)
// ───────────────────────────────────────────────────────────────────

function setupSpotlight() {
  document.querySelectorAll("[data-spotlight]").forEach((item) => {
    item.addEventListener("pointermove", (event) => {
      const rect = item.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      item.style.setProperty("--spot-x", `${x}%`);
      item.style.setProperty("--spot-y", `${y}%`);
    });
  });
}

// ───────────────────────────────────────────────────────────────────
// Parallax — full-bleed scenes drift on scroll, cut-outs lean on the
// pointer. Scene images get a clamped translateY; cut-outs publish
// --px / --py custom properties so CSS keyframes can compose on top.
// ───────────────────────────────────────────────────────────────────

const scrollParallaxEls = [];
const pointerParallaxEls = [];

function setupParallax() {
  if (prefersReducedMotion) return;
  document.querySelectorAll("[data-parallax]").forEach((el) => {
    scrollParallaxEls.push({ el, speed: parseFloat(el.dataset.parallax) || 0.06 });
  });
  if (!window.matchMedia("(hover: none), (pointer: coarse)").matches) {
    document.querySelectorAll("[data-parallax-pointer]").forEach((el) => {
      pointerParallaxEls.push({
        el,
        speed: parseFloat(el.dataset.parallaxPointer) || 0.02,
      });
    });
  }
  updateScrollParallax();
}

function updateScrollParallax() {
  if (!scrollParallaxEls.length) return;
  const half = window.innerHeight / 2;
  for (const { el, speed } of scrollParallaxEls) {
    const rect = el.getBoundingClientRect();
    const delta = (rect.top + rect.height / 2 - half) * speed;
    const clamped = Math.max(-34, Math.min(34, delta));
    el.style.transform = `translate3d(0, ${clamped.toFixed(1)}px, 0)`;
  }
}

function updatePointerParallax() {
  if (!pointerParallaxEls.length) return;
  const dx = pointer.tx - window.innerWidth / 2;
  const dy = pointer.ty - window.innerHeight / 2;
  for (const { el, speed } of pointerParallaxEls) {
    el.style.setProperty("--px", `${(dx * speed).toFixed(1)}px`);
    el.style.setProperty("--py", `${(dy * speed * 0.55).toFixed(1)}px`);
  }
}

// ───────────────────────────────────────────────────────────────────
// Star pulse — CTA clicks kick the field bloom
// ───────────────────────────────────────────────────────────────────

function setupPulse() {
  document.querySelectorAll("[data-pulse]").forEach((btn) => {
    btn.addEventListener("click", () => {
      pulse = 1;
    });
  });
}

// ───────────────────────────────────────────────────────────────────
// Init
// ───────────────────────────────────────────────────────────────────

function init() {
  ctx = canvas.getContext("2d");
  resizeCanvas();
  makeAsciiCloud();
  setupCursor();
  setupSpotlight();
  setupParallax();
  setupPulse();
  updateScroll();
  bootLoader();
  // The kinetic layer (reveals, hero title, magnetic buttons, counters,
  // section choreography) is owned by anime.js in anime-fx.js.
  render(performance.now());
}

window.addEventListener("resize", () => {
  resizeCanvas();
  updateScroll();
});
window.addEventListener("scroll", updateScroll, { passive: true });
window.addEventListener(
  "pointermove",
  (event) => {
    pointer.tx = event.clientX;
    pointer.ty = event.clientY;
    updatePointerParallax();
  },
  { passive: true }
);

init();
