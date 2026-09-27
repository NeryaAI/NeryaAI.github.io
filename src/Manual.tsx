import React,{createContext,useContext,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {sections as sourceSections} from './data/manual.mjs';
import {ThemeToggle} from '../components/ui/theme-toggle';

type Pair=readonly [string,string];
type Block={type:string;zh?:string;en?:string;language?:string;text?:string;headers?:Pair[];values?:Array<Pair|Array<string|Pair>>};
type Section={id:string;aliases?:string[];tag:string;title:Pair;content:Block[]};
const sections=sourceSections as unknown as Section[];
const Locale=createContext<'zh'|'en'>('zh');
function D({zh,en,html=false}:{zh:string;en:string;html?:boolean}){
  const lang=useContext(Locale),text=lang==='zh'?zh:en;
  return html?<span dangerouslySetInnerHTML={{__html:text}}/>:<span>{text}</span>;
}
function PairCopy({pair}:{pair:Pair}){return <D zh={pair[0]} en={pair[1]}/>;}
function DocBlock({block,onCopy}:{block:Block;onCopy:(text:string)=>void}){
  if(block.type==='code')return <div className="code-block"><div><span>{block.language}</span><button data-code-copy aria-label="复制代码 / Copy code" onClick={()=>onCopy(block.text||'')}><D zh="复制" en="Copy"/></button></div><pre tabIndex={0}><code>{block.text}</code></pre></div>;
  if(block.type==='table')return <div className="doc-table" tabIndex={0}><table><thead><tr>{block.headers?.map((pair,i)=><th key={i}><PairCopy pair={pair}/></th>)}</tr></thead><tbody>{block.values?.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{Array.isArray(cell)?<PairCopy pair={cell as unknown as Pair}/>:cell}</td>)}</tr>)}</tbody></table></div>;
  if(block.type==='steps')return <ol className="doc-steps">{block.values?.map((pair,i)=><li key={i}><PairCopy pair={pair as Pair}/></li>)}</ol>;
  const content=<D zh={block.zh||''} en={block.en||''}/>;
  if(block.type==='note')return <aside className="doc-note">{content}</aside>;
  if(block.type==='h3')return <h3>{content}</h3>;
  return <p>{content}</p>;
}

export default function Manual(){
  const [lang,setLang]=useState<'zh'|'en'>('zh');
  const [query,setQuery]=useState('');
  const [menu,setMenu]=useState(false);
  const [active,setActive]=useState('overview');
  const [copyStatus,setCopyStatus]=useState('');
  const search=useRef<HTMLInputElement>(null),menuButton=useRef<HTMLButtonElement>(null);
  const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const t=(zh:string,en:string)=>lang==='zh'?zh:en;
  const matches=useMemo(()=>sections.filter(s=>!query.trim()||JSON.stringify(s).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())),[query]);
  useEffect(()=>{try{setLang(localStorage.getItem('nerya-lang')==='en'?'en':'zh');}catch{}
    document.documentElement.dataset.reactReady='true';
    const observer=new IntersectionObserver(entries=>{const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);if(visible[0])setActive(visible[0].target.id);},{rootMargin:'-85px 0px -60% 0px'});
    document.querySelectorAll('.doc-section').forEach(s=>observer.observe(s));
    return()=>{observer.disconnect();clearTimeout(timer.current);};
  },[]);
  useEffect(()=>{document.documentElement.lang=lang==='zh'?'zh-CN':'en';document.title=lang==='zh'?'Nerya Docs · Agent 与 SDK':'Nerya Docs · Agent & SDK';},[lang]);
  useEffect(()=>{
    const keyboard=(e:KeyboardEvent)=>{
      const editable=e.target instanceof Element&&e.target.closest('input,textarea,[contenteditable]');
      if(e.key==='/'&&!editable){e.preventDefault();if(matchMedia('(max-width:850px)').matches)setMenu(true);requestAnimationFrame(()=>search.current?.focus({preventScroll:true}));}
      if(e.key==='Escape'){setQuery('');setMenu(false);if(menu)menuButton.current?.focus({preventScroll:true});}
    };
    document.addEventListener('keydown',keyboard);return()=>document.removeEventListener('keydown',keyboard);
  },[menu]);
  const language=()=>{const next=lang==='zh'?'en':'zh';setLang(next);try{localStorage.setItem('nerya-lang',next);}catch{}};
  const copy=async(value:string)=>{try{await navigator.clipboard.writeText(value);setCopyStatus(t('代码已复制','Code copied'));}catch{setCopyStatus(t('复制失败，请选中代码复制','Copy failed. Select and copy the code.'));}clearTimeout(timer.current);timer.current=setTimeout(()=>setCopyStatus(''),2800);};
  return <Locale.Provider value={lang}>
    <a className="skip-link" href="#doc-content"><D zh="跳到文档" en="Skip to documentation"/></a>
    <header className="docs-header"><a href="/" className="brand"><img src="/assets/nerya-logo.webp" alt="" width={30} height={30}/>nerya <span>docs</span></a><div className="docs-header-actions"><a href="https://github.com/NeryaAI/Nerya" target="_blank" rel="noopener noreferrer">GitHub ↗</a><a href="/"><D zh="返回官网" en="Website"/></a><ThemeToggle/><button id="docs-language" aria-label="Switch language / 切换语言" onClick={language}>{lang==='zh'?'EN':'中文'}</button><button id="docs-menu" ref={menuButton} aria-controls="docs-sidebar" aria-expanded={menu} onClick={()=>setMenu(!menu)}><D zh="目录" en="Contents"/></button></div></header>
    <div className="docs-layout"><aside className={`docs-sidebar${menu?' open':''}`} id="docs-sidebar"><label className="search-label" htmlFor="docs-search"><D zh="搜索文档" en="Search documentation"/><kbd>/</kbd></label><input ref={search} id="docs-search" type="search" autoComplete="off" placeholder={t('Agent、SDK、图表…','Agent, SDK, charts…')} aria-describedby="docs-search-status" value={query} onChange={e=>setQuery(e.target.value)}/><p id="docs-search-status" className="search-status" role="status">{query?t(`${matches.length} 个相关章节`,`${matches.length} matching sections`):''}</p><nav aria-label="文档章节 / Documentation chapters">{sections.map((s,i)=><a key={s.id} href={`#${s.id}`} data-doc-link={s.id} hidden={!matches.includes(s)} aria-current={active===s.id?'location':undefined} onClick={()=>setMenu(false)}><span>{String(i+1).padStart(2,'0')}</span><PairCopy pair={s.title}/></a>)}</nav><div className="sidebar-note"><D zh="依据当前源码整理" en="Based on the current source"/><strong>2026.09.26</strong><D zh="示例不自动连接账户或提交交易" en="Examples do not automatically connect accounts or submit trades"/></div></aside>
    <main id="doc-content"><div className="docs-hero"><div className="doc-eyebrow">NERYA / DEVELOPER MANUAL</div><h1><D zh="从一次对话<br>到可追溯的工作流" en="From a conversation<br>to a traceable workflow" html/></h1><p><D zh="用 Agent 完成研究与策略任务，用 SDK 接入同一个运行时。工具调用、会话记录、图表和报告，都有各自清晰的契约。" en="Use the Agent for research and strategy work. Use the SDK to reach the same runtime. Tool calls, session history, charts and reports each have an explicit contract."/></p><div className="doc-entry-links"><a href="https://github.com/NeryaAI/Nerya" target="_blank" rel="noopener noreferrer"><D zh="开始使用" en="Get started"/> ↗</a><a href="#quickstart"><D zh="安装与配置" en="Setup guide"/> ↗</a><a href="#sdk">Agent SDK ↗</a><a href="#artifacts"><D zh="卡片与图表" en="Cards & charts"/> ↗</a></div></div>
    {sections.map((s,i)=><section className="doc-section" key={s.id} id={s.id}>{s.aliases?.map(alias=><span key={alias} id={alias} className="anchor-alias"/>)}<div className="section-number">{String(i+1).padStart(2,'0')} / {s.tag}</div><h2><a href={`#${s.id}`} aria-label="链接到此章节 / Link to this section">#</a><PairCopy pair={s.title}/></h2>{s.content.map((block,j)=><DocBlock key={j} block={block} onCopy={copy}/>)}</section>)}
    <footer className="docs-footer"><D zh="本文描述当前工作树中的接口，不把未验证的包发布、连接器或收益当作已验证事实。" en="This manual describes the current working-tree interfaces. Package publication, connector availability and performance are not presented as independently verified facts."/><a href="/">← <D zh="返回 Nerya" en="Back to Nerya"/></a></footer></main></div>
    <button id="docs-top" aria-label="返回顶部 / Back to top" onClick={()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}>↑</button><div id="docs-copy-status" className="copy-status" role="status">{copyStatus}</div>
  </Locale.Provider>;
}
