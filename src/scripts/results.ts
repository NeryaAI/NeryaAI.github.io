// Small, accessible interactions; never advance tabs or move the page for users.
export {};
const tabs = [...document.querySelectorAll<HTMLButtonElement>('[data-result-tab]')];
function select(tab: HTMLButtonElement, focus = false) {
  tabs.forEach(item => {
    const active = item === tab;
    item.setAttribute('aria-selected', String(active)); item.tabIndex = active ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')!)!.hidden = !active;
  });
  if (focus) tab.focus({ preventScroll: true });
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => select(tab));
  tab.addEventListener('keydown', event => {
    if (!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    select(tabs[next], true);
  });
});
const report = document.querySelector<HTMLDialogElement>('#research-report');
document.querySelector('#open-research-report')?.addEventListener('click', () => report?.showModal());
document.querySelector('#close-research-report')?.addEventListener('click', () => report?.close());
report?.addEventListener('click', event => {
  if (event.target !== report) return;
  const r = report.getBoundingClientRect();
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) report.close();
});
// The document remains fully visible without JS or with reduced motion.
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-revealed'); observer.unobserve(entry.target);
  }), { threshold: .08 });
  document.querySelectorAll('.feature-copy,.story-intro,.start-content').forEach(el => { el.classList.add('reveal-ready'); observer.observe(el); });
}
