(() => {
  const $ = selector => document.querySelector(selector);
  const copies = [...document.querySelectorAll('[data-doc-copy]')];
  const links = [...document.querySelectorAll('[data-doc-link]')];
  let lang='zh'; try { lang=localStorage.getItem('nerya-lang')==='en'?'en':'zh'; } catch {}
  const t=(zh,en)=>lang==='zh'?zh:en;
  function translate(){
    document.documentElement.lang=lang==='zh'?'zh-CN':'en';
    for(const el of copies) {
      if(el.dataset.docHtml) el.innerHTML=el.dataset[lang]; else el.textContent=el.dataset[lang];
    }
    document.title=t('Nerya Docs · Agent 与 SDK','Nerya Docs · Agent & SDK');
    $('meta[name="description"]').content=t('Nerya Agent 与 SDK 开发文档：安装、原生 Agent、会话与事件、工具与 Skills、策略、图表产物和安全边界。','Nerya Agent and SDK documentation: installation, the native Agent, sessions and events, tools and Skills, strategies, chart artifacts and security boundaries.');
    $('#docs-language').textContent=lang==='zh'?'EN':'中文';
    $('#docs-search').placeholder=t('Agent、SDK、图表…','Agent, SDK, charts…');
    filter();
  }
  function filter(){
    const query=$('#docs-search').value.trim().toLocaleLowerCase();
    let count=0;
    for(const link of links){
      const section=document.getElementById(link.dataset.docLink);
      const content=[section.textContent,...section.querySelectorAll('[data-doc-copy]')].map(x=>typeof x==='string'?x:x.dataset.zh+' '+x.dataset.en).join(' ').toLocaleLowerCase();
      link.hidden=!!query&&!content.includes(query); if(!link.hidden)count++;
    }
    $('#docs-search-status').textContent=query?t(`${count} 个相关章节`,`${count} matching sections`):'';
  }
  function menu(open){$('#docs-sidebar').classList.toggle('open',open);$('#docs-menu').setAttribute('aria-expanded',String(open));}
  $('#docs-language').addEventListener('click',()=>{lang=lang==='zh'?'en':'zh';try{localStorage.setItem('nerya-lang',lang);}catch{}translate();});
  $('#docs-search').addEventListener('input',filter);
  $('#docs-menu').addEventListener('click',()=>menu($('#docs-menu').getAttribute('aria-expanded')!=='true'));
  links.forEach(link=>link.addEventListener('click',()=>menu(false)));
  document.addEventListener('keydown',event=>{
    const editable=event.target.closest('input,textarea,[contenteditable]');
    if(event.key==='/'&&!editable){event.preventDefault();if(matchMedia('(max-width:850px)').matches)menu(true);$('#docs-search').focus({preventScroll:true});}
    if(event.key==='Escape'){if(editable){$('#docs-search').value='';filter();}menu(false);}
  });
  let copyTimer;
  document.querySelectorAll('[data-code-copy]').forEach(button=>button.addEventListener('click',async()=>{
    const text=button.closest('.code-block').querySelector('code').textContent;
    try{await navigator.clipboard.writeText(text);$('#docs-copy-status').textContent=t('代码已复制','Code copied');}
    catch{$('#docs-copy-status').textContent=t('复制失败，请选中代码手动复制','Copy failed. Select the code and copy manually.');}
    clearTimeout(copyTimer);copyTimer=setTimeout(()=>$('#docs-copy-status').textContent='',2800);
  }));
  const spy=new IntersectionObserver(entries=>{
    const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);
    if(!visible.length)return;
    links.forEach(link=>{if(link.dataset.docLink===visible[0].target.id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
  },{rootMargin:'-85px 0px -60% 0px'});
  document.querySelectorAll('.doc-section').forEach(s=>spy.observe(s));
  $('#docs-top').addEventListener('click',()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
  translate();
})();
