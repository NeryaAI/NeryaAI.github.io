import React, { Suspense, useSyncExternalStore } from 'react';
const subscribe = (notify: () => void) => { addEventListener('hashchange',notify); return () => removeEventListener('hashchange',notify); };
const locationValue = () => location.hash.slice(1) || '/';
export function usePathname() { return useSyncExternalStore(subscribe,locationValue,()=>'/').split('?')[0]; }
export function useSearchParams() { const value=useSyncExternalStore(subscribe,locationValue,()=>'/'); return new URLSearchParams(value.split('?')[1]||''); }
export function useParams() { const parts=usePathname().split('/');return {sessionId:parts[2],id:parts[2],pageId:parts[2],ts:parts[4]}; }
export const navigate = (href:string) => { let next=String(href);if(next.startsWith(location.pathname)){const query=new URLSearchParams(next.split('?')[1]||'');query.delete('lang');next=locationValue().split('?')[0]+(query.size?'?'+query:'');}if(/^\/strategies\/[^/]+$/.test(next))next='/strategies?strategy_id='+encodeURIComponent(next.split('/')[2]); if(next.startsWith('/')&&!next.startsWith('//')) location.hash=next; };
const router={push:navigate,replace:(href:string)=>{history.replaceState(null,'','#'+href);dispatchEvent(new HashChangeEvent('hashchange'));},refresh:()=>dispatchEvent(new HashChangeEvent('hashchange')),back:()=>history.back(),forward:()=>history.forward(),prefetch:()=>Promise.resolve()};
export function useRouter(){return router;}
export function redirect(href:string){navigate(href);}
export function notFound(){navigate('/');}
export function Link({href,children,onClick,prefetch,replace,scroll,...props}:any){const value=typeof href==='string'?href:href.pathname;return <a {...props} href={'#'+value} onClick={event=>{onClick?.(event);if(!event.defaultPrevented){event.preventDefault();navigate(value);}}}>{children}</a>;}
export function dynamic(loader:any,options:any={}){const Component=React.lazy(()=>loader().then((m:any)=>({default:m.default||m})));return function Dynamic(props:any){return <Suspense fallback={options.loading?<options.loading/>:null}><Component {...props}/></Suspense>;};}
export function Image({fill,priority,quality,unoptimized,...props}:any){return <img {...props}/>;}
