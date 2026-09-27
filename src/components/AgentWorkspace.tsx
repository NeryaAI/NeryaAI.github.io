import React, {type CSSProperties} from 'react';
import {cn} from '@/lib/utils';
import Copy from './Copy';
import Icon from './Icon';



const tabs = [
  ['/', '开始探索', 'Explore'],
  ['/chat/demo-strategy', '创建策略', 'Create a strategy'],
  ['/chat/demo-research', '团队投研', 'Team research'],
  ['/chat/demo-review', '复盘与改进', 'Review a run'],
];

export default function AgentWorkspace(){

return <><section className="workspace-section wide" id="workspace" data-scroll-workspace aria-label="Nerya Agent 工作台 / Workspace">
  <div className="workspace-stage">
    <div className="workspace-shell" id="agent-frame-shell">
    <div className="workspace-chrome"><span className="window-dots" aria-hidden="true"><i /><i /><i /></span><span>nerya <span className="chrome-divider">/</span> <Copy zh="工作空间" en="workspace" /></span><button className="expand-workspace" id="expand-agent" aria-expanded="false"><Copy zh="展开" en="Expand" /><Icon name="arrowUpRight" size={15} /></button></div>
    <iframe id="agent-frame" title="Nerya Agent 工作台 / Workspace" src="/demo/index.html?lang=zh" loading="eager" sandbox="allow-scripts allow-same-origin allow-downloads" referrerPolicy="no-referrer"></iframe>
    </div>
  </div>
  <div className="workspace-toolbar"><div className="workspace-tabs" role="tablist" aria-label="工作台场景 / Workspace scenarios">
    {tabs.map(([route, zh, en], i) => <button key={route} role="tab" aria-selected={i === 0 ? 'true' : 'false'} aria-controls="agent-frame" tabIndex={i === 0 ? 0 : -1} data-demo-route={route}><Copy zh={zh} en={en} /></button>)}
  </div><span className="workspace-label"><i /> Nerya Agent</span></div>
  <div className="workspace-caption"><Copy as="p" zh="可以直接操作，点开任务或输入想法" en="Try it here. Open a task or type an idea." /><a id="standalone-demo" href="/demo/index.html?lang=zh" target="_blank" rel="noopener"><Copy zh="打开完整工作台" en="Open workspace" /><Icon name="arrowUpRight" size={16} /></a></div>
</section></>;
}
