/* Nerya Outline. No fonts, remote assets, polling, or mutation observers.
 * New UI uses svg(name) / set(element, name). render() also upgrades the
 * legacy bilingual copy's decorative glyphs, only in explicit UI slots.
 * Body copy, code, charts, user input, branding and avatars are never touched.
 */
(() => {
  'use strict';
  const paths = window.NeryaIconPaths;
  const glyphs = { '↗':'arrowUpRight', '↳':'cornerDownRight', '↺':'history', '↻':'refresh', '↓':'download', '→':'arrowRight', '←':'arrowLeft', '▷':'play', '▶':'play', 'Ⅱ':'pause', '☾':'moon', '☀':'sun', '✓':'check', '✔':'check', '×':'x', '✕':'x', '○':'circle', '◉':'circleDot', '◒':'prediction', '◇':'shield', '▤':'document', '₿':'bitcoin', '⋯':'ellipsis', '▾':'chevronDown', '▸':'chevronRight' };
  const pattern = /[↗↳↺↻↓→←▷▶Ⅱ☾☀✓✔×✕○◉◒◇▤₿⋯▾▸]/g;
  const selector = 'button,a,summary,[data-icon],.gate-symbol,.cap-icon,.play-icon,.guard-note > span,.blackboard-list li > span,#market-constraints > span,.adapter-file > span,#adapter-log > div > span:first-child,.flow-artifact > span';
  // React owns its rendered text/SVG tree. Legacy glyph upgrades must not
  // replace its nodes before hydration (for example the GitHub arrow).
  const skip = 'svg,script,style,pre,code,textarea,input,[contenteditable],.brand,.wordmark,[data-no-icons],#react-root';
  function svg(name, size = 18) {
    if (!Object.hasOwn(paths, name)) throw new Error(`Unknown Nerya icon: ${name}`);
    size = Number.isFinite(size) ? Math.min(96, Math.max(12, size)) : 18;
    return `<svg class="nerya-icon" data-nerya-icon="${name}" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${size <= 16 ? 1.75 : 1.5}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${paths[name]}"/></svg>`;
  }
  function set(element, name, size = 18) {
    if (!element) return;
    const old = element.firstElementChild;
    if (element.childNodes.length === 1 && old?.dataset.neryaIcon === name && old.getAttribute('width') === String(size)) return;
    element.innerHTML = svg(name, size);
  }
  function upgradeText(node) {
    const value = node.nodeValue;
    if (!value || !/[↗↳↺↻↓→←▷▶Ⅱ☾☀✓✔×✕○◉◒◇▤₿⋯▾▸]/.test(value)) return;
    const fragment = document.createDocumentFragment();
    let end = 0;
    for (const match of value.matchAll(pattern)) {
      fragment.append(document.createTextNode(value.slice(end, match.index)));
      const slot = document.createElement('span');
      slot.className = 'nerya-icon-slot'; slot.setAttribute('aria-hidden', 'true');
      slot.innerHTML = svg(glyphs[match[0]]);
      fragment.append(slot); end = match.index + match[0].length;
    }
    fragment.append(document.createTextNode(value.slice(end)));
    node.replaceWith(fragment);
  }
  function render(root = document) {
    const nodes = new Set();
    const slots = [...root.querySelectorAll(selector)];
    if (root.matches?.(selector)) slots.unshift(root);
    for (const slot of slots) {
      if (slot.closest(skip)) continue;
      if (slot.dataset.icon) { set(slot, slot.dataset.icon, Number(slot.dataset.iconSize) || 18); continue; }
      const walker = document.createTreeWalker(slot, NodeFilter.SHOW_TEXT, {
        acceptNode: node => node.parentElement?.closest(skip) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
      });
      while (walker.nextNode()) nodes.add(walker.currentNode);
    }
    nodes.forEach(upgradeText);
    for (const [id, name] of [['market-crypto','bitcoin'],['market-prediction','prediction'],['market-futures','candles'],['market-equities','building']]) {
      set(root.querySelector(`#${id} > span:first-child`), name, 20);
    }
    root.querySelectorAll('.doc-search > svg:not([data-nerya-icon])').forEach(old => { const slot = document.createElement('span'); slot.className='nerya-icon-slot'; set(slot, 'search', 16); old.replaceWith(slot); });
    root.querySelectorAll('svg.lang-globe:not([data-nerya-icon])').forEach(old => { const slot = document.createElement('span'); slot.className='lang-globe nerya-icon-slot'; set(slot, 'globe', 16); old.replaceWith(slot); });
    root.querySelectorAll('#menu-toggle,button[data-menu]').forEach(button => {
      button.classList.add('nerya-menu-control'); set(button, button.getAttribute('aria-expanded') === 'true' ? 'x' : 'menu', 20);
    });
  }
  window.NeryaIcons = Object.freeze({ svg, set, render, names: Object.keys(paths) });
  // Called explicitly after the two bilingual runtimes finish translating.
  window.addEventListener('nerya:languagechange', () => render());
  window.addEventListener('nerya:langchange', () => render());
  document.addEventListener('DOMContentLoaded', () => render(), { once:true });
  // Only navigation icons depend on external menu implementations. No global
  // document rescanning per click: synchronise these few controls after events.
  function syncMenus() { document.querySelectorAll('.nerya-menu-control').forEach(button => set(button, button.getAttribute('aria-expanded') === 'true' ? 'x' : 'menu', 20)); }
  document.addEventListener('click', () => requestAnimationFrame(syncMenus));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') requestAnimationFrame(syncMenus); });
})();
