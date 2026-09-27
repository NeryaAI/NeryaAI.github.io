import './mock';
import React from 'react';
import {createRoot} from 'react-dom/client';
import {AppShell} from '@dashboard/components/AppShell.tsx';
import {I18nProvider} from '@dashboard/components/I18nProvider.tsx';
import {ThemeApplier} from '@dashboard/components/ThemeApplier.tsx';
import {DialogProvider} from '@dashboard/lib/dialogs.tsx';
import {CommandHome} from '@dashboard/components/home/CommandHome.tsx';
import {ChatView} from '@dashboard/components/chat/ChatView.tsx';
import {usePathname} from './navigation';
import pages from 'demo-pages';
import './frame.css';
function Demo(){
 const pathname=usePathname();
 const Page=pages[pathname as keyof typeof pages];
 const content=pathname==='/'?<CommandHome/>:pathname==='/chat'||pathname.startsWith('/chat/')?<div className="h-full"><ChatView sessionId={pathname.split('/')[2]}/></div>:Page?<Page/>:<CommandHome/>;
 return <><ThemeApplier/><I18nProvider><DialogProvider><AppShell>{content}</AppShell></DialogProvider></I18nProvider></>;
}
class DemoError extends React.Component<{children:React.ReactNode},{error:string}>{state={error:''};static getDerivedStateFromError(e:Error){return {error:e.message};}componentDidCatch(error:Error,info:React.ErrorInfo){(window as any).__demoErrors=[...((window as any).__demoErrors||[]),{message:error.message,stack:error.stack,components:info.componentStack}];}render(){return this.state.error?<div role="alert" className="p-8"><h2>演示页面暂未准备好 / Demo unavailable</h2><p>{this.state.error}</p><button onClick={()=>{location.hash='/';location.reload();}}>返回 Agent / Return to Agent</button></div>:this.props.children;}}
function Root(){const route=usePathname();return <DemoError key={route}><Demo/></DemoError>;}
createRoot(document.getElementById('root')!).render(<Root/>);
document.documentElement.dataset.demo='real-agent';
