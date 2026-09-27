/* Runs before CSS for a flash-free system-aware theme; stores preference only. */
(() => {
  const media=matchMedia('(prefers-color-scheme: dark)');
  let preference=null;
  try { const saved=localStorage.getItem('nerya-landing-theme');if(saved==='light'||saved==='dark')preference=saved; } catch {}
  const api={mode:preference||(media.matches?'dark':'light'),set};
  function paint(){
    document.documentElement.dataset.theme=api.mode;
    document.documentElement.style.colorScheme=api.mode;
    const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=api.mode==='dark'?'#101117':'#f8f8fb';
    const button=document.querySelector('#theme-toggle');
    if(button&&!button.hasAttribute('data-react-theme')){if(window.NeryaIcons)window.NeryaIcons.set(button,api.mode==='dark'?'sun':'moon');else button.textContent=api.mode==='dark'?'☀':'☾';button.setAttribute('aria-pressed',String(api.mode==='dark'));button.setAttribute('aria-label',api.mode==='dark'?'切换白天模式 / Switch to light theme':'切换暗黑模式 / Switch to dark theme');button.title=api.mode==='dark'?'白天 / Light':'暗黑 / Dark';}
  }
  function set(mode){if(mode!=='dark'&&mode!=='light')return;preference=mode;api.mode=mode;try{localStorage.setItem('nerya-landing-theme',mode);}catch{}paint();dispatchEvent(new CustomEvent('nerya:themechange',{detail:{theme:mode}}));}
  window.NeryaTheme=api;paint();
  document.addEventListener('DOMContentLoaded',paint,{once:true});
  document.addEventListener('click',e=>{if(e.target instanceof Element&&e.target.closest('#theme-toggle:not([data-react-theme])'))set(api.mode==='dark'?'light':'dark');});
  media.addEventListener('change',e=>{if(preference)return;api.mode=e.matches?'dark':'light';paint();dispatchEvent(new CustomEvent('nerya:themechange',{detail:{theme:api.mode}}));});
})();
