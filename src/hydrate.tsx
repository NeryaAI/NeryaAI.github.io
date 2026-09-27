import type {ReactNode,ErrorInfo} from 'react';
import {createRoot,hydrateRoot} from 'react-dom/client';
declare global {interface Window {__neryaHydrationErrors?:Array<{message:string;componentStack:string}>}}
export function mountPage(root:HTMLElement,page:ReactNode){
  if(!root.childNodes.length){createRoot(root).render(page);return;}
  hydrateRoot(root,page,{onRecoverableError(error:unknown,info:ErrorInfo){
    // Keep the diagnostics visible and testable; do not hide hydration errors.
    (window.__neryaHydrationErrors??=[]).push({message:String(error),componentStack:info.componentStack||''});
    console.error('Nerya hydration mismatch',error,info.componentStack);
    setTimeout(()=>{throw error;},0);
  }});
}
