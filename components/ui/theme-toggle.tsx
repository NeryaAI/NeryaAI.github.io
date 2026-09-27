import React,{useEffect,useState} from 'react';
import {Sun,Moon} from 'lucide-react';

/** Theme bootstrap owns only the document palette; React owns this button.
 * The deterministic initial state matches the build-time rendered markup. */
export function ThemeToggle({className='icon-button'}:{className?:string}){
  const [dark,setDark]=useState(false);
  const [english,setEnglish]=useState(false);
  useEffect(()=>{
    const sync=()=>{setDark(window.NeryaTheme.mode==='dark');setEnglish(document.documentElement.lang==='en');};
    sync();window.addEventListener('nerya:themechange',sync);window.addEventListener('nerya:languagechange',sync);
    const locale=new MutationObserver(sync);locale.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    return()=>{locale.disconnect();window.removeEventListener('nerya:themechange',sync);window.removeEventListener('nerya:languagechange',sync);};
  },[]);
  const label=dark?(english?'Switch to light theme':'切换浅色主题'):(english?'Switch to dark theme':'切换深色主题');
  return <button id="theme-toggle" data-react-theme type="button" className={className} aria-label={label} title={label} aria-pressed={dark}
    onClick={()=>window.NeryaTheme.set(dark?'light':'dark')}>{dark?<Sun size={18} strokeWidth={1.6} aria-hidden="true"/>:<Moon size={18} strokeWidth={1.6} aria-hidden="true"/>}</button>;
}
