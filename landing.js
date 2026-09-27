/* Local-only, deterministic product tour. No backend/model/account requests. */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const { roles, gateState } = window.NeryaDemo;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let lang = 'zh';
  try { lang = localStorage.getItem('nerya-lang') || (navigator.language.startsWith('zh') ? 'zh' : 'en'); } catch { /* Storage is optional. */ }
  if (!['zh', 'en'].includes(lang)) lang = 'en';
  const state = { role: 'lead', mode: 'live', size: 3, approved: false, executed: false };
  let demoRoute = '/';
  const originals = new Map($$('[data-en]').map(el => [el, el.innerHTML]));
  const t = (en, zh) => lang === 'en' ? en : zh;
  const pair = (values) => values[lang === 'en' ? 0 : 1];
  const esc = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function translate() {
    originals.forEach((zh, el) => { if (lang === 'zh') el.innerHTML = zh; else el.textContent = el.dataset.en; });
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.title = t('Nerya · AI live quant trading', 'Nerya · AI 实盘量化');
    $('meta[name=description]').content = t('A multi-agent workspace for live quant trading. Research and build strategies, review risk and approve execution on supported connectors.', '面向实盘量化的多智能体工作台。协同研究、构建策略、检查风险，通过已支持的连接器审批执行。');
    $('#language').textContent = lang === 'zh' ? 'EN' : '中文';
    syncAgent(); renderRole(); renderGate();
    $('#copy-status').textContent = '';
    window.dispatchEvent(new CustomEvent('nerya:languagechange',{detail:{lang}}));
  }
  function selectTabs(selector, key, value) {
    $$(selector).forEach(el => { const active = el.dataset[key] === value; el.setAttribute('aria-selected', String(active)); el.tabIndex = active ? 0 : -1; });
  }
  function syncAgent(route) {
    if (route !== undefined) demoRoute = route;
    const tabs = $$('[data-demo-route]');
    const matched = tabs.some(el => el.dataset.demoRoute === demoRoute);
    tabs.forEach((el, i) => {
      const active = el.dataset.demoRoute === demoRoute;
      el.setAttribute('aria-selected', String(active));
      el.tabIndex = active || (!matched && i === 0) ? 0 : -1;
    });
    $('#standalone-demo').href = 'demo/index.html?lang=' + lang + '&theme=' + window.NeryaTheme.mode + '#' + demoRoute;
    $('#agent-frame').contentWindow?.postMessage({type:'nerya-demo',lang,theme:window.NeryaTheme.mode,...(route !== undefined ? {route: demoRoute} : {})}, location.origin);
  }
  $('#agent-frame').addEventListener('load', () => syncAgent(demoRoute));
  window.addEventListener('nerya:themechange',()=>syncAgent());
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== $('#agent-frame').contentWindow) return;
    if (event.data?.type === 'nerya-demo-escape') { if (expanded) expandAgent(false); return; }
    if (event.data?.type !== 'nerya-demo-route') return;
    demoRoute = String(event.data.route || '/');
    syncAgent();
  });
  let expanded = false;
  function expandAgent(open) {
    expanded = open;
    $('#agent-frame-shell').classList.toggle('expanded', open);
    document.body.classList.toggle('agent-expanded', open);
    $('#expand-agent').setAttribute('aria-expanded', String(open));
    $('#expand-agent').textContent = open ? t('Close full view ×','关闭完整视图 ×') : t('Expand ↗','展开体验 ↗');
    window.NeryaIcons.render($('#expand-agent'));
    if (!open) $('#expand-agent').focus();
  }
  $('#expand-agent').addEventListener('click', () => expandAgent(!expanded));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && expanded) expandAgent(false); });
  function renderRole() {
    selectTabs('[data-role]', 'role', state.role);
    const role = roles[state.role];
    $('#team-detail').setAttribute('aria-labelledby', `role-${state.role}`);
    $('#team-detail').innerHTML = `<div class="blackboard-header"><span class="role-author"><img class="inline-agent-avatar" src="${window.NeryaAvatars.path(role.avatar)}" width="32" height="32" alt="" aria-hidden="true" data-avatar-role="${role.avatar}"><span>${pair(role.label)}</span></span><span>${t('Shared board','共享黑板')}</span></div><h3 class="blackboard-title">${pair(role.title)}</h3><p class="blackboard-note">${pair(role.note)}</p><ul class="blackboard-list">${role.list.map(item => `<li><span>${window.NeryaIcons.svg('cornerDownRight')}</span>${pair(item)}</li>`).join('')}</ul><p class="blackboard-footer">${pair(role.footer)}</p>`;
  }
  function renderGate() {
    const gate = gateState(state.mode, state.size, state.approved, state.executed);
    $$('[data-mode]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.mode === state.mode)));
    $('#risk-output').textContent = `${state.size}%`;
    $('#risk-row').classList.toggle('blocked', gate === 'blocked');
    window.NeryaIcons.set($('#risk-row .gate-symbol'), gate === 'blocked' ? 'x' : 'check');
    $('#risk-state').textContent = gate === 'blocked' ? t('Over the 5% limit','超过 5% 限制') : t('Within position limit','满足仓位限制');
    $('#approval-state').textContent = state.mode === 'paper' ? t('Preflight only','仅检查，不下单') : state.approved ? t('Approved','已批准') : t('Awaiting review','等待人工审批');
    window.NeryaIcons.set($('#approval-row .gate-symbol'), state.mode === 'live' && !state.approved ? 'circle' : 'check');
    const action = $('#gate-action');
    action.disabled = gate === 'blocked';
    const labels = { blocked: ['Blocked by Risk Gate','已被 Risk Gate 拦截'], pending: ['Approve this intent','批准此意图'], approved: ['Reset checkpoint','重置检查点'], ready: ['Run preflight','执行检查'], simulated: ['Reset checkpoint','重置检查点'] };
    action.textContent = pair(labels[gate]);
    const messages = { blocked: ['Reduce the size to 5% or below. Approval cannot bypass the limit.','请将比例调至 5% 或以下，审批不能绕过风控限制。'], pending: ['Live execution also requires the runtime live-trading switch.','实盘执行还需要明确开启运行时实盘开关。'], approved: ['Review passed. The next step is an execution check.','审批已通过，下一步是执行检查。'], ready: ['Risk limits are satisfied. Ready for the next check.','已满足风险限制，可以继续下一步检查。'], simulated: ['Preflight complete. Risk conditions passed; no order was sent.','检查完成，风险条件均已通过，未发送订单。'] };
    $('#gate-result').textContent = pair(messages[gate]);
    $('.gate-lab').dataset.state = gate;
  }
  // One delegated listener keeps translated/re-rendered controls operable.
  document.addEventListener('click', event => {
    const el = event.target.closest('button');
    if (!el) return;
    if (el.dataset.demoRoute !== undefined) syncAgent(el.dataset.demoRoute);
    if (el.dataset.role) { state.role = el.dataset.role; renderRole(); }
    if (el.dataset.mode) { Object.assign(state, { mode: el.dataset.mode, approved: false, executed: false }); renderGate(); }
    if (el.hasAttribute('data-start')) $('#start-dialog').showModal();
  });
  // Manual-activation tabs: arrows move focus, Enter/Space selects using native buttons.
  $$('[role=tablist]').forEach(list => list.addEventListener('keydown', event => {
    const keys = list.getAttribute('aria-orientation') === 'vertical' ? ['ArrowUp','ArrowDown'] : ['ArrowLeft','ArrowRight'];
    if (![...keys, 'Home', 'End'].includes(event.key)) return;
    const tabs = [...list.querySelectorAll('[role=tab]')]; const index = tabs.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === keys[1] ? 1 : -1) + tabs.length) % tabs.length;
    tabs.forEach((tab, i) => tab.tabIndex = i === next ? 0 : -1); tabs[next].focus();
  }));
  $('#inspect-proposal').addEventListener('click', () => { syncAgent('/chat/demo-review'); $('#workspace').scrollIntoView({behavior:motion.matches?'instant':'smooth'}); $('#scenario-review').focus({preventScroll:true}); });
  $('#risk-size').addEventListener('input', event => { Object.assign(state, { size: Number(event.target.value), approved: false, executed: false }); renderGate(); });
  $('#gate-action').addEventListener('click', () => {
    const gate = gateState(state.mode, state.size, state.approved, state.executed);
    if (gate === 'blocked') return;
    if (gate === 'pending') state.approved = true;
    else if (gate === 'ready') state.executed = true;
    else { state.approved = false; state.executed = false; }
    renderGate();
  });
  $('#language').addEventListener('click', () => { lang = lang === 'en' ? 'zh' : 'en'; try { localStorage.setItem('nerya-lang', lang); } catch { /* Remain usable in private contexts. */ } translate(); });
  const menu = $('#menu-toggle');
  function closeMenu(returnFocus = false) { $('#navigation').classList.remove('open'); menu.setAttribute('aria-expanded','false'); if (returnFocus) menu.focus(); }
  menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; $('#navigation').classList.toggle('open',open); menu.setAttribute('aria-expanded',String(open)); });
  $('#navigation').addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') closeMenu(true); });
  document.addEventListener('click', e => { if (!e.target.closest('.header')) closeMenu(); });
  $('#close-dialog').addEventListener('click', () => $('#start-dialog').close());
  $('#start-dialog').addEventListener('click', event => { if (event.target === event.currentTarget) { const r = event.currentTarget.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) event.currentTarget.close(); } });
  $('#copy-command').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText('nerya setup --web'); $('#copy-status').textContent = t('Copied. Run only after installing Nerya.','已复制，请在安装 Nerya 后运行。'); }
    catch { $('#copy-status').textContent = t('Clipboard unavailable. Select and copy the command above.','无法访问剪贴板，请选中上方命令手动复制。'); }
  });
  window.NeryaLanding={get language(){return lang;},openAgent(route){syncAgent(route);$('#workspace').scrollIntoView({behavior:motion.matches?'instant':'smooth'});}};
  translate();
  document.documentElement.dataset.ready = 'true';
})();
