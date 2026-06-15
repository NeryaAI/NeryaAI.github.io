// ───────────────────────────────────────────────────────────────────
// Nerya Landing · main.js
// WebGL2 shader hero + loader + custom cursor + magnetic targets
// + spotlight masks + scroll meter + pinned ritual scroll + reveals
// + frame counter + count-up + reduced-motion fallback.
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
let glState = null;
let frameTick = 0;

// ───────────────────────────────────────────────────────────────────
// Fragment shader — Nerya signal field
// ───────────────────────────────────────────────────────────────────

const vertexSource = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const fragmentSource = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform vec2  u_resolution;
uniform vec2  u_mouse;
uniform float u_time;
uniform float u_scroll;
uniform float u_pulse;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i),                hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float lineField(vec2 uv, float t) {
  float a = atan(uv.y, uv.x);
  float d = length(uv);
  float f = sin(a * 9.0 + t * 0.9 + noise(uv * 2.0 + t * 0.06) * 4.0);
  float g = sin((uv.x * 6.0 - uv.y * 3.5) + t * 0.7);
  return smoothstep(0.98, 1.0, abs(f * g)) * smoothstep(1.4, 0.05, d);
}

void main() {
  vec2 res = u_resolution;
  vec2 uv = (gl_FragCoord.xy * 2.0 - res) / min(res.x, res.y);
  vec2 mouse = (u_mouse * 2.0 - res) / min(res.x, res.y);
  uv -= mouse * 0.07;

  float t = u_time;
  float d = length(uv);
  float angle = atan(uv.y, uv.x);
  float n  = noise(uv * 3.8 + t * 0.08);
  float n2 = noise(vec2(angle * 2.0, d * 5.0 - t * 0.22));

  float core   = smoothstep(0.22, 0.02, d + sin(angle * 5.0 + t) * 0.018 + n * 0.035);
  float shell  = smoothstep(0.46, 0.18, abs(d - 0.34 + n * 0.06));
  float ring   = smoothstep(0.014, 0.0, abs(sin(d * 26.0 - t * 1.6 + n2 * 2.0)) * 0.025);
  float fila   = lineField(uv, t);
  float scan   = smoothstep(0.996, 1.0, sin((uv.y + t * 0.07) * 340.0)) * 0.18;
  float stars  = smoothstep(0.992, 1.0, noise(uv * 94.0 + t * 0.018)) * smoothstep(1.8, 0.1, d);
  float pulseW = u_pulse * smoothstep(0.9, 0.08, d);
  float sHeat  = clamp(u_scroll, 0.0, 1.0);

  // Palette mapped to the Nerya brand tokens: violet primary,
  // brand-300 highlight, periwinkle filament. No amber, the operator
  // console only uses amber for warnings, never identity.
  vec3 violet      = vec3(0.545, 0.361, 0.965);  // #8b5cf6 brand-500
  vec3 violetLight = vec3(0.706, 0.545, 1.000);  // #b48bff brand-300
  vec3 iris        = vec3(0.640, 0.600, 1.000);  // periwinkle highlight (violet family)

  vec3 color = vec3(0.0);
  color += violet      * shell * 0.95;
  color += iris        * ring  * 0.42;
  color += iris        * fila  * 0.30;
  color += vec3(1.0)   * core  * (1.10 + pulseW * 1.5);
  color += violet      * stars * 0.65;
  color += mix(violet, violetLight, sHeat) * scan * smoothstep(1.55, 0.08, d);
  color += violetLight * pulseW * 0.22;
  color *= 1.0 - smoothstep(0.62, 1.6, d) * 0.66;

  float alpha = clamp(core + shell * 0.7 + ring * 0.6 + fila * 0.7 + stars + scan, 0.0, 1.0);
  outColor = vec4(color, alpha);
}`;

// ───────────────────────────────────────────────────────────────────
// WebGL boilerplate
// ───────────────────────────────────────────────────────────────────

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "shader failed");
  }
  return shader;
}

function initWebGL() {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  if (!gl) return null;

  const program = gl.createProgram();
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "program failed");
  }

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW
  );
  const position = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  return {
    gl,
    program,
    uniforms: {
      resolution: gl.getUniformLocation(program, "u_resolution"),
      mouse:      gl.getUniformLocation(program, "u_mouse"),
      time:       gl.getUniformLocation(program, "u_time"),
      scroll:     gl.getUniformLocation(program, "u_scroll"),
      pulse:      gl.getUniformLocation(program, "u_pulse"),
    },
  };
}

function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  if (glState) glState.gl.viewport(0, 0, canvas.width, canvas.height);
}

// ───────────────────────────────────────────────────────────────────
// 2D fallback (no WebGL2 available)
// ───────────────────────────────────────────────────────────────────

function render2DFallback(time) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);
  const x = pointer.x;
  const y = pointer.y;
  const gradient = ctx.createRadialGradient(
    x,
    y,
    0,
    x,
    y,
    Math.max(width, height) * 0.5
  );
  gradient.addColorStop(0, `rgba(220, 200, 255, ${0.55 + pulse})`);
  gradient.addColorStop(0.14, "rgba(139, 92, 246, 0.34)");
  gradient.addColorStop(0.66, "rgba(150, 140, 255, 0.05)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(139, 92, 246, 0.38)";
  for (let i = 0; i < 9; i += 1) {
    ctx.beginPath();
    ctx.ellipse(
      x,
      y,
      100 + i * 48,
      32 + i * 22,
      time * 0.0004 + i,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }
}

// ───────────────────────────────────────────────────────────────────
// Render loop
// ───────────────────────────────────────────────────────────────────

function render(time) {
  pointer.x += (pointer.tx - pointer.x) * 0.08;
  pointer.y += (pointer.ty - pointer.y) * 0.08;
  pulse *= 0.93;

  if (glState) {
    const { gl, program, uniforms } = glState;
    gl.clearColor(0.02, 0.02, 0.06, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform2f(uniforms.mouse, pointer.x * dpr, (height - pointer.y) * dpr);
    gl.uniform1f(uniforms.time, (time - startedAt) * 0.001);
    gl.uniform1f(uniforms.scroll, scrollProgress);
    gl.uniform1f(uniforms.pulse, pulse);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  } else {
    render2DFallback(time);
  }

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
        startCountUps();
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
// Title scramble
// ───────────────────────────────────────────────────────────────────

function scrambleText(element, finalText) {
  if (prefersReducedMotion) {
    element.textContent = finalText;
    return;
  }
  const chars = "01/<>-_+·";
  let frame = 0;
  const total = 26;
  const run = () => {
    const output = finalText
      .split("")
      .map((char, index) => {
        if (char === " ") return " ";
        if (index < frame / 1.4) return char;
        return chars[(index + frame) % chars.length];
      })
      .join("");
    element.textContent = output;
    frame += 1;
    if (frame <= total) requestAnimationFrame(run);
    else element.textContent = finalText;
  };
  run();
}

function setupScramble() {
  const title = document.querySelector("[data-scramble]");
  if (!title) return;
  window.setTimeout(() => scrambleText(title, title.dataset.scramble), 900);
  title.addEventListener("pointerenter", () =>
    scrambleText(title, title.dataset.scramble)
  );
}

// ───────────────────────────────────────────────────────────────────
// Reveal observer
// ───────────────────────────────────────────────────────────────────

function setupReveal() {
  const items = document.querySelectorAll("[data-reveal]");
  if (!("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  items.forEach((item) => observer.observe(item));
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
// Magnetic buttons
// ───────────────────────────────────────────────────────────────────

function setupMagnetic() {
  if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;
  document.querySelectorAll(".magnetic").forEach((item) => {
    item.addEventListener("pointermove", (event) => {
      const rect = item.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      item.style.transform = `translate(${x * 0.1}px, ${y * 0.14}px)`;
    });
    item.addEventListener("pointerleave", () => {
      item.style.transform = "";
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
// Star pulse / hero scramble re-trigger
// ───────────────────────────────────────────────────────────────────

function setupPulse() {
  document.querySelectorAll("[data-pulse]").forEach((btn) => {
    btn.addEventListener("click", () => {
      pulse = 1;
      const title = document.querySelector("[data-scramble]");
      if (title) scrambleText(title, title.dataset.scramble);
    });
  });
}

// ───────────────────────────────────────────────────────────────────
// Count-up — kicks off after loader hides
// ───────────────────────────────────────────────────────────────────

function startCountUps() {
  document.querySelectorAll("[data-count-to]").forEach((el) => {
    const target = parseInt(el.getAttribute("data-count-to") || "0", 10);
    const dur = 1200;
    const start = performance.now();
    const initial = parseInt(el.textContent || "0", 10) || 0;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      // ease-out-quart
      const e = 1 - Math.pow(1 - p, 4);
      const value = Math.round(initial + (target - initial) * e);
      el.textContent = value.toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

// ───────────────────────────────────────────────────────────────────
// Init
// ───────────────────────────────────────────────────────────────────

function init() {
  resizeCanvas();
  try {
    glState = initWebGL();
  } catch (error) {
    console.warn("WebGL shader fallback:", error.message);
    glState = null;
  }
  resizeCanvas();
  makeAsciiCloud();
  setupReveal();
  setupCursor();
  setupMagnetic();
  setupSpotlight();
  setupParallax();
  setupPulse();
  setupScramble();
  updateScroll();
  bootLoader();
  if (prefersReducedMotion) {
    // Still draw one frame so the canvas isn't blank
    render(performance.now());
    startCountUps();
  } else {
    render(performance.now());
  }
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
