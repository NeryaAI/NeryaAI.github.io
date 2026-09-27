// Background Paths + Spotlight / Glowing Effect treatments. No component
// rerenders per pointer event; no scroll hijack, custom cursor or live network.
export {};
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const ambient = [...document.querySelectorAll<HTMLElement>('[data-ambient]')];
const surfaces = [...document.querySelectorAll<HTMLElement>('.product-story,.result-showcase')];
const visible = new Set<Element>();
const paused = () => reduce.matches || root.classList.contains('motion-paused') || document.hidden;
const toggle = document.querySelector<HTMLButtonElement>('#effects-toggle');
const trace = document.querySelector<HTMLElement>('[data-tracing-story]');
let pointerFrame = 0, scrollFrame = 0;
let hovered: HTMLElement | null = null;
let point = { x: 0, y: 0 };
const text = (zh: string, en: string) => root.lang.startsWith('zh') ? zh : en;

function sync() {
  root.dataset.pageHidden = String(document.hidden);
  for (const el of ambient) el.dataset.ambientPaused = String(paused() || !visible.has(el));
  if (toggle) {
    const off = reduce.matches || root.classList.contains('motion-paused');
    toggle.setAttribute('aria-pressed', String(off));
    toggle.setAttribute('aria-label', off ? text('打开特效','Turn effects on') : text('关闭特效','Turn effects off'));
    toggle.title = reduce.matches ? text('系统已启用减少动态效果','System reduced motion is enabled') : text('特效','Effects');
    toggle.disabled = reduce.matches;
  }
  if (paused() || !fine.matches) {
    cancelAnimationFrame(pointerFrame); pointerFrame = 0;
    surfaces.forEach(el => { el.style.removeProperty('--spotlight'); el.style.removeProperty('transform'); });
    hovered = null;
  }
}
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target);
  sync();
}, { threshold: .02 });
ambient.forEach(el => observer.observe(el));

function drawPointer() {
  pointerFrame = 0;
  if (!hovered || paused() || !fine.matches) return;
  const box = hovered.getBoundingClientRect();
  const x = point.x - box.left, y = point.y - box.top;
  hovered.style.setProperty('--spot-x', `${x}px`); hovered.style.setProperty('--spot-y', `${y}px`);
  hovered.style.setProperty('--edge-angle', `${Math.atan2(y-box.height/2,x-box.width/2)*180/Math.PI+90}deg`);
  hovered.style.setProperty('--spotlight', '1');
}
document.addEventListener('pointermove', event => {
  if (paused() || !fine.matches) return;
  const el = event.target instanceof Element ? event.target.closest<HTMLElement>('.product-story,.result-showcase') : null;
  if (el !== hovered) { hovered?.style.removeProperty('--spotlight'); hovered = el; }
  if (!el) return;
  point = { x: event.clientX, y: event.clientY };
  if (!pointerFrame) pointerFrame = requestAnimationFrame(drawPointer);
}, { passive: true });
document.addEventListener('pointerleave', () => { hovered?.style.removeProperty('--spotlight'); hovered = null; });

function paintScroll() {
  scrollFrame = 0;
  const distance = root.scrollHeight - innerHeight;
  root.style.setProperty('--read-progress', String(distance > 0 ? Math.max(0,Math.min(1,scrollY/distance)) : 0));
  if (trace) {
    const rect = trace.getBoundingClientRect();
    trace.style.setProperty('--trace-progress', String(Math.max(0,Math.min(1,(innerHeight*.55-rect.top)/rect.height))));
  }
}
const onScroll = () => { if (!scrollFrame && !document.hidden) scrollFrame = requestAnimationFrame(paintScroll); };
window.addEventListener('scroll', onScroll, { passive:true });
window.addEventListener('resize', onScroll, { passive:true });
window.addEventListener('nerya:languagechange', () => { sync(); onScroll(); });
document.addEventListener('visibilitychange', () => { sync(); if(document.hidden){cancelAnimationFrame(scrollFrame);scrollFrame=0;}else onScroll(); });
reduce.addEventListener('change', sync); fine.addEventListener('change', sync);
new MutationObserver(sync).observe(root, { attributes:true, attributeFilter:['class'] });
toggle?.addEventListener('click', () => document.querySelector<HTMLButtonElement>('#motion-toggle')?.click());
sync(); paintScroll();
