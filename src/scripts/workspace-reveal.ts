// Progressive enhancement for the real iframe shell. No wheel interception,
// synthetic input, timers, animation dependency or transforms inside the iframe.
export function workspacePose(progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  const eased = p * p * (3 - 2 * p);
  return { tilt: 34 * (1 - eased), roll: 0, scale: .92 + .08 * eased, lift: -86 * (1 - eased) };
}

function initWorkspaceReveal() {
  const workspace = document.querySelector<HTMLElement>('[data-workspace-reveal]');
  const shell = document.querySelector<HTMLElement>('#agent-frame-shell');
  const frame = document.querySelector<HTMLIFrameElement>('#agent-frame');
  if (!workspace || !shell || !frame) return;

  const eligible = matchMedia('(min-width: 801px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  let raf = 0;
  let start = 0;
  let distance = 1;
  let frozen = false;
  let pointerDown = false;
  let settled = false;
  let keyboardIntent = false;

  function cancel() { cancelAnimationFrame(raf); raf = 0; }
  function settle() {
    cancel();
    settled = true;
    workspace!.dataset.revealState = 'settled';
  }
  function enabled() {
    return !settled && eligible.matches && !document.documentElement.classList.contains('motion-paused');
  }
  function paint() {
    raf = 0;
    if (!enabled() || frozen || document.hidden) return;
    const pose = workspacePose((window.scrollY - start) / distance);
    shell!.style.setProperty('--workspace-tilt', `${pose.tilt}deg`);
    shell!.style.setProperty('--workspace-roll', `${pose.roll}deg`);
    shell!.style.setProperty('--workspace-scale', `${pose.scale}`);
    shell!.style.setProperty('--workspace-lift', `${pose.lift}px`);
  }
  function schedule() {
    if (!raf && enabled() && !frozen && !document.hidden) raf = requestAnimationFrame(paint);
  }
  function sync() {
    cancel();
    workspace!.dataset.revealState = enabled() ? (frozen ? 'frozen' : 'scroll') : 'settled';
    if (enabled() && !frozen) paint();
  }
  function measure() {
    workspace!.dataset.revealReady = String(eligible.matches);
    // Read the untransformed section, never the shell we're transforming.
    const top = workspace!.getBoundingClientRect().top + window.scrollY;
    // The workspace now starts behind the centered slogan. Spread the reveal
    // over most of a viewport rather than snapping upright after a small scroll.
    start = 0;
    distance = Math.max(560, Math.min(820, window.innerHeight * .78), top + 160);
    sync();
  }
  function freeze() {
    frozen = true;
    cancel();
    if (enabled()) workspace!.dataset.revealState = 'frozen';
  }
  function beginPointer() { pointerDown = true; freeze(); }
  function endPointer() {
    if (!pointerDown) return;
    pointerDown = false;
    settled = true;
    cancel();
    // Keep the hit target stationary through pointerup and the native click.
    // Only then settle upright; subsequent interaction never restarts the tilt.
    raf = requestAnimationFrame(settle);
  }
  // CommandHome autofocuses its composer after mount. That is not visitor
  // intent and must not erase the opening pose before the first scroll.
  function focus() { if (!pointerDown && keyboardIntent) settle(); }
  function listenForInput(target: HTMLElement | Document) {
    target.addEventListener('pointerdown', beginPointer, { capture: true, passive: true });
    target.addEventListener('pointerup', endPointer, { capture: true, passive: true });
    target.addEventListener('pointercancel', endPointer, { capture: true, passive: true });
    target.addEventListener('focusin', focus);
    target.addEventListener('keydown', () => {
      keyboardIntent = true;
      if (target === frame!.contentDocument && !pointerDown) settle();
    });
  }
  function listenInsideFrame() {
    // The supplied demo is same-origin. Observe input only; leave its app and
    // controls untouched. If that changes, parent focus still settles the shell.
    try { if (frame!.contentDocument) listenForInput(frame!.contentDocument); }
    catch { /* Cross-origin frames are not inspected. */ }
  }

  listenForInput(workspace);
  document.addEventListener('keydown', () => { keyboardIntent = true; }, { capture: true });
  window.addEventListener('nerya:workspaceopen', settle);
  frame.addEventListener('load', listenInsideFrame);
  listenInsideFrame();
  window.addEventListener('pointerup', endPointer, { passive: true });
  window.addEventListener('pointercancel', endPointer, { passive: true });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('nerya:languagechange', measure);
  document.addEventListener('visibilitychange', () => document.hidden ? cancel() : measure());
  document.addEventListener('fullscreenchange', () => { if (document.fullscreenElement) settle(); });
  eligible.addEventListener('change', measure);
  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(() => { if (shell.classList.contains('expanded')) settle(); })
    .observe(shell, { attributes: true, attributeFilter: ['class'] });
  measure();
}

initWorkspaceReveal();
