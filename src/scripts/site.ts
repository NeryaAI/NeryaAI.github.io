// The parent is static Astro HTML; only product controls require client code.
export {};
declare global {
  interface Window {
    NeryaTheme: { mode: string; set: (mode: string) => void };
    NeryaIcons: { set: (el: Element | null, name: string, size?: number) => void; render: () => void };
    NeryaLanding: { language: () => string; openAgent: (route: string) => void };
    __neryaMarkets: Array<{ id: string; symbol: string; note: string[]; route: string }>;
  }
}
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
const $$ = <T extends HTMLElement = HTMLElement>(s: string) => [...document.querySelectorAll<T>(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const frame = $<HTMLIFrameElement>('#agent-frame');
let lang: 'zh' | 'en' = 'zh';
try { lang = localStorage.getItem('nerya-lang') === 'en' ? 'en' : 'zh'; } catch { /* Preferences are optional. */ }
let currentRoute = '/';
let market = 'crypto';
let expanded = false;
let lastExpandFocus: HTMLElement | null = null;
const inertBackground = new Map<HTMLElement, boolean>();
const text = (zh: string, en: string) => lang === 'zh' ? zh : en;
const templates = {
  zh: '帮我适配一个新的行情接口，并为策略补上数据校验',
  en: 'Connect a new market data API and add data validation to the strategy',
};

function routeTabs() {
  const tabs = $$('[data-demo-route]');
  const matched = tabs.some(tab => tab.dataset.demoRoute === currentRoute);
  tabs.forEach((tab, i) => {
    const selected = tab.dataset.demoRoute === currentRoute;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected || (!matched && i === 0) ? 0 : -1;
  });
  $('#standalone-demo').setAttribute('href', `/demo/index.html?lang=${lang}&theme=${window.NeryaTheme.mode}#${currentRoute}`);
}
function syncFrame(route?: string) {
  if (route !== undefined) currentRoute = route;
  routeTabs();
  frame.contentWindow?.postMessage({ type: 'nerya-demo', lang, theme: window.NeryaTheme.mode, ...(route === undefined ? {} : { route }) }, location.origin);
  // The frozen demo build predates settings in its message allowlist. Its
  // native hash router supports settings without rebuilding the app bundle.
  if (route === '/settings' && frame.contentDocument?.documentElement.dataset.demo === 'real-agent') frame.contentWindow!.location.hash = route;
}
function openAgent(route: string) {
  window.dispatchEvent(new Event('nerya:workspaceopen'));
  syncFrame(route);
  $('#workspace').scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'start' });
  frame.focus({ preventScroll: true });
}
window.NeryaLanding = { language: () => lang, openAgent };
frame.addEventListener('load', () => syncFrame(currentRoute));
window.addEventListener('nerya:themechange', () => syncFrame());
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
  if (event.data?.type === 'nerya-demo-route' && typeof event.data.route === 'string' && event.data.route.startsWith('/')) {
    currentRoute = frame.contentWindow?.location.hash.slice(1) || event.data.route; routeTabs();
  }
  if (event.data?.type === 'nerya-demo-escape' && expanded) expand(false);
});
function expand(open: boolean) {
  expanded = open;
  if (open) lastExpandFocus = document.activeElement as HTMLElement;
  const shell = $('#agent-frame-shell');
  shell.classList.toggle('expanded', open);
  if (open) {
    shell.setAttribute('role', 'dialog'); shell.setAttribute('aria-modal', 'true'); shell.setAttribute('aria-label', 'Nerya Agent');
    let branch: HTMLElement = shell;
    while (branch.parentElement) {
      for (const sibling of branch.parentElement.children) if (sibling !== branch && sibling instanceof HTMLElement) {
        inertBackground.set(sibling, sibling.inert); sibling.inert = true;
      }
      branch = branch.parentElement;
      if (branch === document.body) break;
    }
  } else {
    shell.removeAttribute('role'); shell.removeAttribute('aria-modal'); shell.removeAttribute('aria-label');
    inertBackground.forEach((wasInert, el) => el.inert = wasInert); inertBackground.clear();
  }
  document.body.classList.toggle('workspace-expanded', open);
  window.dispatchEvent(new CustomEvent('nerya:workspaceexpand', { detail: { open } }));
  $('#expand-agent').setAttribute('aria-expanded', String(open));
  $('#expand-agent [data-i18n]').textContent = open ? text('收起', 'Close') : text('展开', 'Expand');
  if (!open) lastExpandFocus?.focus({ preventScroll: true });
}
$('#expand-agent').addEventListener('click', () => expand(!expanded));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') { if (expanded) expand(false); toggleMenu(false); }
});
$$('[data-demo-route]').forEach(tab => tab.addEventListener('click', () => syncFrame(tab.dataset.demoRoute)));
$$('[data-open-agent]').forEach(button => button.addEventListener('click', () => openAgent(button.dataset.openAgent!)));
$('.workspace-tabs').addEventListener('keydown', event => {
  if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
  const tabs = $$('[data-demo-route]'); const current = tabs.indexOf(document.activeElement as HTMLElement);
  if (current < 0) return;
  event.preventDefault();
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  tabs.forEach((tab, i) => tab.tabIndex = i === next ? 0 : -1); tabs[next].focus();
});

function toggleMenu(open: boolean) {
  $('#navigation').classList.toggle('open', open);
  $('#menu-toggle').setAttribute('aria-expanded', String(open));
  window.NeryaIcons?.set($('#menu-toggle'), open ? 'x' : 'menu', 20);
}
$('#menu-toggle').addEventListener('click', () => toggleMenu($('#menu-toggle').getAttribute('aria-expanded') !== 'true'));
$$('#navigation a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));

function renderMarket() {
  const selected = window.__neryaMarkets.find(item => item.id === market)!;
  $('#market-symbol').textContent = selected.symbol;
  $('#market-description').textContent = selected.note[lang === 'zh' ? 0 : 1];
  $$('[data-market]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.market === market)));
}
$$('[data-market]').forEach(button => button.addEventListener('click', () => { market = button.dataset.market!; renderMarket(); }));
$('#market-open').addEventListener('click', () => openAgent(window.__neryaMarkets.find(item => item.id === market)!.route));

$('#integration-form').addEventListener('submit', async event => {
  event.preventDefault();
  const prompt = $<HTMLTextAreaElement>('#integration-prompt').value.trim();
  if (prompt.length < 6) { $('#integration-status').textContent = text('请补充接口名称或需要的能力', 'Add an API name or the capability you need'); return; }
  openAgent('/chat');
  // Fill only the isolated, source-backed demo. No message is auto-submitted.
  let input: HTMLTextAreaElement | null = null;
  for (let attempt = 0; attempt < 35; attempt++) {
    const doc = frame.contentDocument;
    if (doc?.documentElement.dataset.demo === 'real-agent' && frame.contentWindow?.location.hash === '#/chat') input = doc.querySelector('textarea');
    if (input) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (input) {
    const frameWindow = frame.contentWindow as Window & typeof globalThis;
    Object.getOwnPropertyDescriptor(frameWindow.HTMLTextAreaElement.prototype, 'value')?.set?.call(input, prompt);
    input.dispatchEvent(new frameWindow.Event('input', { bubbles: true }));
    input.dispatchEvent(new frameWindow.Event('change', { bubbles: true }));
    input.focus({ preventScroll: true });
    $('#integration-status').textContent = text('已放到工作台 发送后查看适配方案', 'Added to the workspace. Send it to view the plan.');
  } else {
    $('#integration-status').textContent = text('工作台尚未就绪 你的需求仍保留在这里', 'The workspace is not ready. Your request is still saved here.');
  }
});

type Film = { el: HTMLElement; video: HTMLVideoElement; gif: HTMLImageElement; manual: boolean; visible: boolean; mode: 'video' | 'gif'; failed: boolean; gifStart: number; gifTime: number; gifPlaying: boolean; frame: number; variant: string; generation: number };
const films: Film[] = $$('.product-film').map(el => ({ el, video: el.querySelector('video')!, gif: el.querySelector('.film-gif')!, manual: false, visible: false, mode: 'video', failed: false, gifStart: 0, gifTime: 0, gifPlaying: false, frame: 0, variant: '', generation: 0 }));
let motionPaused = reduced.matches;
function updateFilmMedia(film: Film) {
  const theme = window.NeryaTheme.mode === 'dark' ? 'dark' : 'light';
  const variant = `${lang}-${theme}`;
  film.el.querySelector<HTMLElement>('.film-variant-label')!.textContent = `${lang === 'zh' ? '中文' : 'English'} / ${theme === 'dark' ? text('深色','Dark') : text('浅色','Light')}`;
  if (film.variant === variant) return;
  film.variant = variant; film.generation++; film.failed = false;
  film.el.dataset.variant = variant;
  film.el.dataset.duration = String(JSON.parse(film.el.dataset.durations || '{}')[variant] || 8);
  const base = `/assets/product-recordings/${film.el.dataset.film}-${variant}`;
  cancelAnimationFrame(film.frame); film.video.pause();
  film.video.removeAttribute('src');
  film.video.poster = `${base}-poster.webp`;
  film.video.dataset.src = `${base}.mp4`;
  film.video.load();
  film.gif.dataset.src = `${base}.gif`; film.gif.dataset.poster = `${base}-poster.webp`;
  film.gif.src = film.gif.dataset.poster; film.gifPlaying = false; film.gifTime = 0;
  film.el.querySelectorAll<HTMLButtonElement>('[data-cue],.film-format').forEach(control => control.disabled = false);
  film.el.querySelector<HTMLElement>('.film-loading')!.hidden = true;
  paintProgress(film, 0, Number(film.el.dataset.duration));
}
function paintProgress(film: Film, time: number, duration: number) {
  const progress = duration > 0 ? (time % duration) / duration : 0;
  const cues = [...film.el.querySelectorAll<HTMLElement>('[data-cue]')];
  cues.forEach((cue, i) => {
    cue.setAttribute('aria-pressed', String(Math.min(2, Math.floor(progress * 3)) === i));
    cue.style.setProperty('--cue-progress', `${Math.max(0, Math.min(1, progress * 3 - i)) * 100}%`);
  });
}
function filmLabels(film: Film, paused: boolean) {
  film.el.dataset.paused = String(paused);
  const toggle = film.el.querySelector('.film-toggle')!;
  toggle.setAttribute('aria-pressed', String(paused));
  toggle.setAttribute('aria-label', paused ? text('播放演示', 'Play walkthrough') : text('暂停演示', 'Pause walkthrough'));
}
function syncFilm(film: Film) {
  updateFilmMedia(film);
  const paused = film.manual || motionPaused || !film.visible || document.hidden;
  filmLabels(film, paused);
  film.video.hidden = film.mode === 'gif'; film.gif.hidden = film.mode !== 'gif';
  film.el.dataset.mode = film.mode;
  film.el.querySelector('.film-format')!.setAttribute('aria-pressed', String(film.mode === 'gif'));
  cancelAnimationFrame(film.frame);
  if (film.mode === 'video') {
    film.gifPlaying = false;
    film.gif.src = film.gif.dataset.poster!;
    if (paused) film.video.pause();
    else if (!film.failed) {
      if (!film.video.getAttribute('src')) film.video.src = film.video.dataset.src!;
      const generation = film.generation;
      film.video.play().then(() => { if (generation === film.generation) film.el.querySelector<HTMLElement>('.film-loading')!.hidden = true; }).catch(error => {
        if (generation !== film.generation) return;
        if (error.name === 'AbortError' || film.mode !== 'video' || film.failed || !film.visible || document.hidden || motionPaused) return;
        film.manual = true; filmLabels(film, true); film.el.querySelector<HTMLElement>('.film-loading')!.hidden = false;
      });
    }
  } else {
    film.video.pause();
    if (paused) { film.gif.src = film.gif.dataset.poster!; film.gifTime = 0; film.gifPlaying = false; }
    else {
      if (!film.gifPlaying) {
        film.gif.src = film.gif.dataset.src!;
        film.gifStart = performance.now(); film.gifPlaying = true;
        paintProgress(film, 0, Number(film.el.dataset.duration));
      }
      const tick = () => { film.gifTime = (performance.now() - film.gifStart) / 1000; paintProgress(film, film.gifTime, film.video.duration || Number(film.el.dataset.duration)); film.frame = requestAnimationFrame(tick); };
      film.frame = requestAnimationFrame(tick);
    }
  }
}
const visibility = new IntersectionObserver(entries => { for (const entry of entries) { const film = films.find(f => f.el === entry.target)!; film.visible = entry.isIntersecting; syncFilm(film); } }, { threshold: .2 });
films.forEach(film => {
  visibility.observe(film.el);
  film.video.addEventListener('timeupdate', () => {
    if (film.mode === 'video') paintProgress(film, film.video.currentTime, film.video.duration);
  });
  film.video.addEventListener('error', () => {
    if (!film.video.error || film.video.getAttribute('src') !== film.video.dataset.src) return;
    film.failed = true; film.mode = 'gif';
    // GIFs cannot seek. Keep the fallback playable instead of switching back
    // into a failed video when a chapter is selected.
    film.el.querySelectorAll<HTMLButtonElement>('[data-cue],.film-format').forEach(control => control.disabled = true);
    film.el.querySelector<HTMLElement>('.film-loading')!.hidden = true;
    syncFilm(film);
  });
  film.el.querySelector('.film-toggle')!.addEventListener('click', () => {
    if (motionPaused) { motionPaused = false; films.forEach(f => f.manual = f !== film); }
    else film.manual = film.el.dataset.paused !== 'true';
    paintMotion(); films.forEach(syncFilm);
  });
  film.el.querySelector('.film-replay')!.addEventListener('click', () => {
    film.video.currentTime = 0; film.manual = false;
    if (motionPaused) { motionPaused = false; films.forEach(f => f.manual = f !== film); }
    if (film.mode === 'gif') { film.gif.src = film.gif.dataset.poster!; film.gifPlaying = false; }
    paintMotion(); syncFilm(film); paintProgress(film, 0, 1);
  });
  film.el.querySelector('.film-format')!.addEventListener('click', () => { film.mode = film.mode === 'video' ? 'gif' : 'video'; syncFilm(film); });
  film.el.querySelectorAll<HTMLElement>('[data-cue]').forEach(cue => cue.addEventListener('click', () => {
    if (film.failed) return;
    film.mode = 'video'; film.manual = true;
    if (!film.video.getAttribute('src')) film.video.src = film.video.dataset.src!;
    const generation = film.generation;
    const seek = () => { if (generation !== film.generation || !Number.isFinite(film.video.duration)) return; film.video.currentTime = Number(cue.dataset.cue) * film.video.duration / 3 + .12; paintProgress(film, film.video.currentTime, film.video.duration); };
    if (film.video.readyState >= 1) seek(); else film.video.addEventListener('loadedmetadata', seek, { once: true });
    syncFilm(film);
  }));
});
function paintMotion() {
  document.documentElement.classList.toggle('motion-paused', motionPaused);
  $('#motion-toggle').setAttribute('aria-pressed', String(motionPaused));
  $('#motion-toggle [data-i18n]').textContent = motionPaused ? text('播放动效', 'Play motion') : text('暂停动效', 'Pause motion');
  const icon = $('#motion-toggle svg');
  if (icon) { const slot = document.createElement('span'); window.NeryaIcons?.set(slot, motionPaused ? 'play' : 'pause', 15); if (slot.firstElementChild) icon.replaceWith(slot.firstElementChild); }
}
$('#motion-toggle').addEventListener('click', () => { motionPaused = !motionPaused; if (!motionPaused) films.forEach(f => f.manual = false); paintMotion(); films.forEach(syncFilm); });
document.addEventListener('visibilitychange', () => films.forEach(syncFilm));
window.addEventListener('nerya:themechange', () => films.forEach(syncFilm));
reduced.addEventListener('change', event => { motionPaused = event.matches; paintMotion(); films.forEach(syncFilm); });

function translate() {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  $$('[data-i18n]').forEach(el => { el.textContent = el.dataset[lang]!; });
  document.title = text('Nerya · 你的 Agent 策略团队', 'Nerya · Your agent strategy team');
  $('meta[name=description]').setAttribute('content', text('你提出交易逻辑，Nerya Agent 团队分工研究、编写策略。查看运行记录，再决定下一次改动。', 'Describe your trading idea. Agents research it and write the strategy. Review the runs and decide what to change next.'));
  $('#language').textContent = lang === 'zh' ? 'EN' : '中文';
  const prompt = $<HTMLTextAreaElement>('#integration-prompt');
  if (Object.values(templates).includes(prompt.value)) prompt.value = templates[lang];
  renderMarket(); syncFrame(); paintMotion(); films.forEach(syncFilm);
  if (expanded) $('#expand-agent [data-i18n]').textContent = text('收起','Close');
  window.dispatchEvent(new CustomEvent('nerya:languagechange', { detail: { lang } }));
}
$('#language').addEventListener('click', () => { lang = lang === 'zh' ? 'en' : 'zh'; try { localStorage.setItem('nerya-lang', lang); } catch { /* Optional. */ } translate(); });
translate();
