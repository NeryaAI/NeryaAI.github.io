// Authored CSS timelines; theme and language remain DOM-native. No recordings,
// duplicate media requests, scroll commands, or background animation loops.
export {};
type Story = { el: HTMLElement; animations: Animation[]; visible: boolean; manual: boolean; time: number; previous: number; raf: number };
const duration = 12_000;
const media = matchMedia('(prefers-reduced-motion: reduce)');
const stories: Story[] = [...document.querySelectorAll<HTMLElement>('[data-story]')].map(el => ({ el, animations: [], visible: false, manual: false, time: 8000, previous: 0, raf: 0 }));
const pausedGlobally = () => media.matches || document.documentElement.classList.contains('motion-paused');
const text = (zh: string, en: string) => document.documentElement.lang.startsWith('zh') ? zh : en;
function paint(story: Story) {
  const phase = (story.time % duration) / 4000;
  story.el.dataset.chapter = String(Math.min(2, Math.floor(phase)));
  for (const button of story.el.querySelectorAll<HTMLElement>('[data-story-chapter]')) {
    const chapter = Number(button.dataset.storyChapter);
    button.setAttribute('aria-pressed', String(chapter === Math.floor(phase)));
    button.style.setProperty('--chapter-progress', `${Math.max(0, Math.min(1, phase - chapter)) * 100}%`);
  }
  for (const animation of story.animations) animation.currentTime = story.time;
}
function sync(story: Story) {
  cancelAnimationFrame(story.raf); story.raf = 0; story.previous = 0;
  const paused = pausedGlobally() || story.manual || !story.visible || document.hidden;
  story.el.dataset.paused = String(paused);
  const toggle = story.el.querySelector<HTMLButtonElement>('.story-toggle')!;
  toggle.disabled = media.matches;
  toggle.title = media.matches ? text('已启用减少动态效果，可手动选择章节','Reduced motion is enabled. Chapters remain available.') : '';
  toggle.setAttribute('aria-pressed', String(paused));
  toggle.setAttribute('aria-label', paused ? text('播放动画','Play animation') : text('暂停动画','Pause animation'));
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
  story.el.querySelector('.story-toggle')!.addEventListener('click', () => {
    if (media.matches) return; // Preserve reduced-motion choice; chapters remain usable.
    if (pausedGlobally()) document.querySelector<HTMLButtonElement>('#motion-toggle')?.click();
    story.manual = story.el.dataset.paused !== 'true'; sync(story);
  });
  story.el.querySelector('.story-replay')!.addEventListener('click', () => { story.time = 0; story.manual = false; sync(story); });
  story.el.querySelectorAll<HTMLButtonElement>('[data-story-chapter]').forEach(button => button.addEventListener('click', () => { story.manual = true; story.time = Number(button.dataset.storyChapter) * 4000 + 1600; sync(story); }));
  sync(story);
}
function syncAll() { stories.forEach(sync); }
document.addEventListener('visibilitychange', syncAll);
window.addEventListener('nerya:languagechange', syncAll);
media.addEventListener('change', syncAll);
new MutationObserver(syncAll).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
