import React, {useEffect} from 'react';
import {cn} from '@/lib/utils';

import Copy from './components/Copy';
import Icon from './components/Icon';
import ProductStory from './components/ProductStory';
import AgentWorkspace from './components/AgentWorkspace';
import ResultShowcase from './components/ResultShowcase';
import RsiLoop from './components/RsiLoop';
import { ContainerScroll } from '../components/ui/container-scroll-animation';
import { BackgroundPaths } from '../components/ui/background-paths';
import { GitHubButton } from '../components/ui/github-button';
import { ThemeToggle } from '../components/ui/theme-toggle';
import { features, hero } from './data/product';





const markets = [
  { id:'crypto', zh:'加密货币', en:'Crypto', symbol:'BTC / USDT', icon:'bitcoin', note:['趋势、价格变化与组合策略','Trend, price action and portfolio strategies'], route:'/strategies?strategy_id=btc_trend_guard' },
  { id:'prediction', zh:'预测市场', en:'Prediction markets', symbol:'EVENT / PROBABILITY', icon:'prediction', note:['事件信息和概率变化','Event information and probability shifts'], route:'/strategies?strategy_id=event_probability' },
  { id:'futures', zh:'期货', en:'Futures', symbol:'CONTRACT / TERM', icon:'candles', note:['期限、换月和趋势策略','Terms, rolls and trend strategies'], route:'/strategies?strategy_id=futures_term_structure' },
  { id:'equities', zh:'海外美股', en:'US equities', symbol:'US EQUITIES / FACTORS', icon:'building', note:['因子变化和组合轮动','Factor changes and portfolio rotation'], route:'/strategies?strategy_id=us_equity_factor_rotation' },
];
// ProductFilm only needs id/title/steps. Keep these page-only films outside
// the four-feature data contract owned by the product-copy worker.
const marketFilm = {
  id: 'markets',
  title: { zh: '换个市场，继续研究', en: 'Switch markets and keep researching' },
  steps: [
    { zh: '选择市场', en: 'Choose a market' },
    { zh: '查看策略', en: 'Inspect a strategy' },
    { zh: '检查规则', en: 'Check the rules' },
  ],
};
const integrationFilm = {
  id: 'integrations',
  title: { zh: '没有接口？先把需求说清楚', en: 'No connector? Start with the question' },
  steps: [
    { zh: '提出需求', en: 'Describe the API' },
    { zh: '准备适配', en: 'Draft the adapter' },
    { zh: '验证接入', en: 'Review validation' },
  ],
};

let controllers: Promise<unknown> | undefined;
export default function App(){
useEffect(()=>{
 window.__neryaMarkets=markets;
 controllers ??= import('./scripts/site').then(()=>Promise.all([import('./scripts/results'),import('./scripts/stories'),import('./scripts/effects')]));
 controllers.then(()=>{document.documentElement.dataset.reactReady='true';}).catch(error=>{console.error('Nerya website controls failed',error);document.documentElement.dataset.reactReady='error';});
},[]);
return <>
    <div className="reading-progress" aria-hidden="true"><span /></div>
    <a className="skip-link" href="#main"><Copy zh="跳到内容" en="Skip to content" /></a>
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Nerya"><img src="/assets/nerya-logo.webp" width="32" height="32" alt="" /><span>nerya</span></a>
      <nav id="navigation" aria-label="主导航 / Navigation"><a href="#workspace"><Copy zh="工作台" en="Workspace" /></a><a href="#rsi-loop"><Copy zh="它做什么" en="What it does" /></a><a href="#team"><Copy zh="团队怎么做" en="How the team works" /></a><a href="/docs.html"><Copy zh="文档" en="Docs" /></a></nav>
      <div className="header-actions"><ThemeToggle/><button id="language" className="language-button" aria-label="Switch language / 切换语言">EN</button><GitHubButton compact /><button id="menu-toggle" className="menu-toggle icon-button" aria-controls="navigation" aria-expanded="false" aria-label="菜单 / Menu"><Icon name="menu" /></button></div>
    </header>
    <main id="main">
      <section className="hero" id="top">
        <BackgroundPaths />
        <ContainerScroll titleComponent={<div className="hero-layout wrap"><div className="hero-copy">
        <p className="hero-intro"><Copy zh="NERYA / STRATEGY EVOLUTION SYSTEM" en="NERYA / STRATEGY EVOLUTION SYSTEM" /></p>
        <h1><Copy zh={hero.title.zh} en={hero.title.en} /></h1>
        <p className="hero-description"><Copy zh={hero.description.zh} en={hero.description.en} /><br /><Copy zh={hero.evolution.zh} en={hero.evolution.en} /></p>
        <div className="hero-actions"><GitHubButton /><a className="workspace-try" href="#rsi-loop"><Copy zh="看它进化" en="Watch it evolve" /><Icon name="arrowUpRight" size={17} /></a></div>
        <div className="hero-signal-rail"><span>ASK</span><i>→</i><span>RESEARCH</span><i>→</i><span>BACKTEST</span><i>→</i><span>EVOLVE</span></div>
        </div></div>}>

        <AgentWorkspace />
        </ContainerScroll>
      </section>

      <RsiLoop />

      <div className="story-intro wrap"><Copy as="h2" zh="团队做投研，策略持续进化" en="Team research. Evolving strategies." /><button id="motion-toggle" className="motion-button" aria-pressed="false"><Icon name="pause" size={15} /><Copy zh="暂停" en="Pause" /></button></div>

      <div className="feature-stories" data-tracing-story><div className="story-trace" aria-hidden="true"><i/><span/></div>
        {features.map((feature, i) => <section key={feature.id} className={cn(['feature-section', `feature-${feature.id}`, i % 2 === 1 && 'reverse'])} id={feature.id} aria-labelledby={`${feature.id}-title`}>
          <div className="feature-inner wrap">
            <div className="feature-copy">
              <Copy as="h2" id={`${feature.id}-title`} zh={feature.title.zh} en={feature.title.en} />
              <button className="feature-link" data-open-agent={feature.route}><Copy zh={feature.cta.zh} en={feature.cta.en} /><Icon name="arrowUpRight" size={17} /></button>
            </div>
            <ProductStory feature={feature} />
          </div>
        </section>)}
      </div>

      <section className="outputs-section wrap" aria-labelledby="outputs-title">
        <div className="outputs-copy"><Copy as="h2" id="outputs-title" zh="每一轮，留下下一版" en="Every round leaves a next version" /><a className="feature-link" href="/docs.html#artifacts"><Copy zh="查看产物" en="View artifacts" /><Icon name="arrowUpRight" size={17}/></a></div>
        <ResultShowcase />
      </section>

      <section className="feature-section markets-section" id="markets" aria-labelledby="markets-title">
        <div className="feature-inner wrap">
          <div className="feature-copy">
            <Copy as="h2" id="markets-title" zh="换个市场，继续研究" en="Switch markets and keep researching" />
            <Copy as="p" zh="研究加密趋势、事件概率、期货换月与美股因子。" en="Research crypto trends, event probabilities, futures rolls and US equity factors." />
          </div>
          <ProductStory feature={marketFilm} />
          <div className="market-picker">
            <div className="market-options" role="group" aria-label="选择策略示例 / Choose a strategy example">{markets.map(m=><button key={m.id} data-market={m.id} data-market-route={m.route} aria-pressed={m.id==='crypto'?'true':'false'}><Icon name={m.icon} size={18} /><Copy zh={m.zh} en={m.en} /></button>)}</div>
            <div className="market-detail"><span id="market-symbol">BTC / USDT</span><p id="market-description" aria-live="polite">Trend, price action and portfolio strategies</p><button className="feature-link" id="market-open"><Copy zh="查看这个市场" en="View this market" /><Icon name="arrowUpRight" size={17} /></button></div>
          </div>
        </div>
      </section>

      <section className="feature-section integration-section reverse" id="integrations" aria-labelledby="integrations-title">
        <div className="feature-inner wrap">
          <div className="feature-copy">
            <Copy as="h2" id="integrations-title" zh="接入新的数据源" en="Connect a new data source" />
            <Copy as="p" zh="说清平台和数据，Super Agent 整理接入方案。" en="Name the platform and data. The Super Agent maps the connection." />
          </div>
          <ProductStory feature={integrationFilm} />
          <form id="integration-form">
            <label htmlFor="integration-prompt"><Copy zh="说说你想接什么" en="Tell the Agent what you need" /></label>
            <div className="integration-input"><textarea id="integration-prompt" rows={2} maxLength={400} required aria-describedby="integration-status" defaultValue="Help me assess the data fields and adapter work for this market API"/><button className="icon-button integration-send" type="submit" aria-label="Open the draft in the workspace"><Icon name="arrowUpRight" size={21} /></button></div>
            <p id="integration-status" role="status"></p>
          </form>
        </div>
      </section>

      <section className="start-section wide" id="start">
        <div className="launch-orbits" aria-hidden="true" data-ambient><i/><i/><i/></div><div className="start-content"><img src="/assets/nerya-logo.webp" alt="" width="52" height="52" loading="lazy" /><Copy as="h2" zh="把下一个想法交给团队" en="Give the team the next idea" /><GitHubButton /></div>
      </section>
    </main>

    <footer className="site-footer wrap"><div className="footer-top"><a className="brand" href="#top"><img src="/assets/nerya-logo.webp" alt="" width="28" height="28" />nerya</a><div><a href="/docs.html"><Copy zh="文档" en="Docs" /></a><a href="/docs.html#skills"><Copy zh="技能" en="Skills" /></a><a href="/docs.html#sdk"><Copy zh="SDK 示例" en="SDK examples" /></a><a href="https://github.com/NeryaAI/Nerya" target="_blank" rel="noopener">GitHub <Icon name="arrowUpRight" size={14} /></a></div></div><div className="footer-bottom"><span>© 2026 Nerya</span><a href="/LICENSE">PolyForm Noncommercial</a></div></footer>

    
    
    
    
    
    
  </>;
}
