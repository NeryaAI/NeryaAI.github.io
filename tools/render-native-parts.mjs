// Explicit offline snapshot pass. Reads two real dashboard components; never
// starts the Agent, renders effects, hydrates actions, or invokes an API.
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const source=path.resolve(root,'../agent/dashboard');
const require=createRequire(path.join(source,'package.json'));
const work=path.join(root,'.tmp/native-parts');
await mkdir(work,{recursive:true});
const entry=`
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {NextIntlClientProvider} from 'next-intl';
import {SummaryCards} from ${JSON.stringify(path.join(source,'components/backtest/SummaryCards.tsx'))};
import {ResearchAssetCard} from ${JSON.stringify(path.join(source,'components/chat/ResearchReplyCards.tsx'))};
import {zh,en} from ${JSON.stringify(path.join(source,'messages/index.ts'))};
const snapshot=(locale,node)=>renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages:locale==='zh'?zh:en,timeZone:'UTC',now:new Date('2026-01-01T00:00:00Z')},node),{identifierPrefix:'native-'+locale+'-'});
const cards=[{label:'total_return_pct',value:12.8,tone:'positive'},{label:'max_drawdown_pct',value:-4.2},{label:'trades',value:64}];
const series=Array.from({length:24},(_,i)=>({time:1704067200+i*14400,open:81200+i*125,close:81260+i*125+Math.sin(i)*160,high:81500+i*125,low:81000+i*125}));
const instrument={id:'sample:BTC/USDT',market:'BTC/USDT',venue:'sample',name:'Bitcoin',interval:'4h',chartIds:['sample-market'],news:[],newsAsOf:'',newsStatus:'not_requested',seenAt:1704398400};
const block={kind:'chart',version:'v1',chart_id:'sample-market',chart_kind:'candlestick',title:'Illustrative market snapshot',series:[{type:'candlestick',name:'BTC',data:series}],source:{skill:'website',action:'illustration',as_of:'2024-01-04T00:00:00Z'},time:{timezone:'UTC',format:'unix_seconds'},path:'inline'};
const backtest={component:'components/backtest/SummaryCards.tsx'},market={component:'components/chat/ResearchReplyCards.tsx#ResearchAssetCard'};
for(const locale of ['zh','en']){backtest[locale]=snapshot(locale,React.createElement(SummaryCards,{cards}));market[locale]=snapshot(locale,React.createElement(ResearchAssetCard,{instrument,block}));}
export default {backtest,market};`;
const built=await build({stdin:{contents:entry,resolveDir:source,loader:'tsx'},outfile:path.join(work,'render.cjs'),bundle:true,format:'cjs',platform:'node',jsx:'automatic',target:'node22',metafile:true,minify:false,treeShaking:true,nodePaths:[path.join(source,'node_modules'),path.join(source,'../node_modules')],define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'offline-component-snapshot',setup(b){
  b.onResolve({filter:/^(react(?:\/.*)?|react-dom(?:\/.*)?|next-intl)$/},a=>({path:require.resolve(a.path),external:true}));
  b.onResolve({filter:/^next\/(link|navigation|dynamic)$/},a=>({path:a.path,namespace:'static-next'}));
  b.onLoad({filter:/.*/,namespace:'static-next'},a=>({contents:a.path==='next/link'?`import React from 'react';export default function Link({children,...props}){return React.createElement('a',props,children)}`:a.path==='next/dynamic'?`export default function dynamic(){return ()=>null;}`:`export const useRouter=()=>({push(){},replace(){},refresh(){}});export const usePathname=()=>'/';export const useSearchParams=()=>new URLSearchParams();`,loader:'jsx',resolveDir:source}));
}}]});
// No effect or event handler executes during renderToStaticMarkup.
const snapshots=require(path.join(work,'render.cjs')).default;
await writeFile(path.join(root,'src/data/native-parts.json'),JSON.stringify(snapshots,null,2)+'\n');
let css='';try{css=await readFile(path.join(work,'render.css'),'utf8')}catch(e){if(e.code!=='ENOENT')throw e;}
// CSS Modules already have unique classes. Scope every selector to the excerpt
// so a future product style cannot affect the surrounding marketing page.
const postcss=require('postcss');
const ast=postcss.parse(css);ast.walkRules(rule=>{if(rule.parent?.type==='atrule'&&/keyframes$/.test(rule.parent.name))return;rule.selectors=rule.selectors.map(s=>`.native-part ${s}`);});
await writeFile(path.join(root,'native-parts.css'),ast.toString());
const inputs={};for(const file of Object.keys(built.metafile.inputs)){const absolute=path.resolve(file);if(!absolute.startsWith(source+path.sep))continue;inputs[path.relative(source,absolute)]=createHash('sha256').update(await readFile(absolute)).digest('hex');}
await writeFile(path.join(root,'src/data/native-parts.provenance.json'),JSON.stringify({source:'Nerya agent/dashboard working tree',method:'React renderToStaticMarkup with inline synthetic fixtures; no effects, hydration, requests or image recreation',components:[snapshots.backtest.component,snapshots.market.component],sourceFiles:inputs},null,2)+'\n');
console.log('Rendered two source-native excerpts in both languages; source product files unchanged.');
