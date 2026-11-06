// Authored CSS timelines; theme and language remain DOM-native. No recordings,
// duplicate media requests, scroll commands, or background animation loops.
export {};
type Story = { el: HTMLElement; animations: Animation[]; visible: boolean; time: number; previous: number; raf: number };
const duration = 12_000;
const media = matchMedia('(prefers-reduced-motion: reduce)');
const stories: Story[] = [...document.querySelectorAll<HTMLElement>('[data-story]')].map(el => ({ el, animations: [], visible: false, time: 8000, previous: 0, raf: 0 }));
const pausedGlobally = () => media.matches || document.documentElement.classList.contains('motion-paused');
function paint(story: Story) {
  const phase = (story.time % duration) / 4000;
  story.el.dataset.chapter = String(Math.min(2, Math.floor(phase)));
  for (const animation of story.animations) animation.currentTime = story.time;
}
function sync(story: Story) {
  cancelAnimationFrame(story.raf); story.raf = 0; story.previous = 0;
  const paused = pausedGlobally() || !story.visible || document.hidden;
  story.el.dataset.paused = String(paused);
  // Keep CSS animations paused and advance all of them on one visible clock.
  story.animations = story.el.getAnimations({ subtree: true });
  story.animations.forEach(animation => animation.pause());
  paint(story);
  if (paused) return;
  const tick = (now: number) => {
    if (story.previous) story.time = (story.time + Math.min(100, now - story.previous)) % duration;
    story.previous = now; paint(story); story.raf = requestAnimationFrame(tick);
  };
  story.raf = requestAnimationFrame(tick);
}
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) { const story = stories.find(s => s.el === entry.target)!; const first = !story.visible && entry.isIntersecting && !story.el.dataset.started; story.visible = entry.isIntersecting; if (first && !pausedGlobally()) { story.time = 0; story.el.dataset.started = 'true'; } sync(story); }
}, { threshold: .12 });
for (const story of stories) {
  observer.observe(story.el);
  sync(story);
}
function syncAll() { stories.forEach(sync); }
document.addEventListener('visibilitychange', syncAll);
window.addEventListener('nerya:languagechange', syncAll);
media.addEventListener('change', syncAll);
new MutationObserver(syncAll).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
