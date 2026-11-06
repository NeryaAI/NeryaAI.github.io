import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {collectPublicFiles,listFiles,root} from './prepare-public.mjs';
import {parseHtml,localUrl} from './check-astro.mjs';
const read=file=>readFile(join(root,file));
const published=await listFiles(join(root,'dist')),paths=new Set(published);
const pages=['index.html','docs.html','skills.html','recipes.html'];
const copied=await collectPublicFiles();
const allowed=new Set([...copied,...pages,'.nojekyll']);
for(const file of published)assert(allowed.has(file)||/^_app\/[\w./-]+\.(js|css|woff2?|svg|png|webp)$/.test(file),`Unlisted public file: ${file}`);
for(const file of copied){assert(paths.has(file));assert((await read('dist/'+file)).equals(await read(file)),`Public copy mismatch: ${file}`);}
const docs=new Map();
for(const file of published.filter(f=>f.endsWith('.html'))){
  const html=String(await read('dist/'+file)),nodes=parseHtml(html);
  const ids=nodes.filter(n=>'id' in n.attrs).map(n=>n.attrs.id);
  assert.equal(ids.length,new Set(ids).size,`Duplicate ids in ${file}`);
  docs.set(file,{html,nodes,ids:new Set(ids)});
}
let references=0;
function verify(url,from){
  const target=localUrl(url,from);if(!target)return;
  const file=[target.path,`${target.path.replace(/\/$/,'')}/index.html`,`${target.path}index.html`].find(f=>paths.has(f));
  assert(file,`${from}: missing ${url}`);
  if(target.fragment&&docs.has(file))assert(docs.get(file).ids.has(target.fragment),`${from}: missing fragment ${url}`);
  references++;
}
for(const [file,doc]of docs){for(const node of doc.nodes){for(const attr of ['src','href','poster','data-src'])if(node.attrs[attr])verify(node.attrs[attr],file);}}
for(const file of published.filter(f=>f.endsWith('.css'))){const css=String(await read('dist/'+file));for(const m of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g))if(!m[1].startsWith('#'))verify(m[1],file);}
for(const page of pages){
  const doc=docs.get(page);assert(doc);assert(doc.ids.has('react-root'));
  assert.equal(doc.nodes.filter(n=>n.name==='h1').length,1,`${page}: single prerendered H1`);
  assert(!doc.html.includes('astro-island'));assert(doc.html.includes('/_app/'));
  assert(!(await read(page)).equals(await read('dist/'+page)),`Expected prerendered React output: ${page}`);
}
const home=docs.get('index.html');
assert(home.html.includes('NERYA / STRATEGY EVOLUTION SYSTEM'),'Hero should identify the product role');
assert(home.nodes.some(n=>n.name==='h1')&&home.html.includes('Quant Super Agent'),'Hero should use the requested positioning');
assert(home.html.includes('研究行情、写策略、跑回测')&&home.html.includes('以 Recursive Self-Improvement 持续迭代策略'),'Hero should explain the concrete work and RSI');
assert(home.html.includes('Research markets, build strategies, run backtests')&&home.html.includes('Iterate with Recursive Self-Improvement'),'English hero should explain the concrete work and RSI');
assert(!home.html.includes('向下探索'),'Remove redundant hero microcopy');
assert(!home.html.includes('hero-team'),'Do not frame the hero as Agent roleplay');
assert(!home.html.includes('RSI design principles'),'Remove decorative RSI labels');
assert(home.html.includes('每跑一轮，策略就多一版')&&home.html.includes('SUPER AGENT 工作流'),'The RSI section should describe strategy iteration');
assert(home.html.includes('策略草稿 · 可以继续改'),'The strategy output card should describe the next pass naturally');
assert(home.html.includes('Super Agent 生成第一版策略')&&home.html.includes('分析行情'),'The visible strategy story should use concrete actions');
assert(!home.html.includes('全部演示页面'),'The workspace should keep the product story focused');
for(const className of ['workspace-page-links','workspace-caption','rsi-loop-badges','scene-label','rsi-stage-rail','story-controls','story-chapters'])assert(!home.nodes.some(n=>(n.attrs.class||'').split(' ').includes(className)), 'Remove redundant landing annotation: '+className);
assert(home.html.includes('团队并行投研与审阅')&&home.html.includes('多方研究，交叉审阅'),'Agent Team should focus on research and review');
assert(!home.html.includes('策略作者')&&!home.html.includes('团队写出第一版策略'),'Do not present Agent Team as the strategy author');
assert(home.html.includes('API 密钥，交给 Vault 保管')&&home.html.includes('Keep your API keys in Vault'),'Vault should explain key storage in both languages');
assert(home.nodes.some(n=>n.attrs['data-open-agent']==='/env-vault'),'Vault CTA should open the existing Vault page');
assert(!home.html.includes('strategy://btc-trend')&&!home.html.includes('把结果带回工作台'),'Vault must not be presented as strategy result storage');
const demoSource=String(await read('demo-src/mock.ts'));
assert(demoSource.includes("const directRuntimeInfo=url.pathname==='/runtime/info'&&method==='GET'"),'The isolated demo must satisfy the Agent runtime handshake locally');
assert(demoSource.includes("if(path==='/assistants'&&method==='GET')return {ok:true,assistants:assistantProfiles"),'The current assistant UI needs the actual inventory contract');
assert(demoSource.includes("if(path==='/assistants/conversations'&&method==='GET')"),'The current sidebar needs the task-conversation list contract');
assert(demoSource.includes("if(path==='/assistants/session'&&method==='GET')"),'The current chat header needs the assistant-session binding contract');
assert(!demoSource.includes("url.origin!==location.origin||!url.pathname.startsWith('/api/')"),'The isolated runtime handshake must be allowed without opening general network access');
assert.deepEqual(home.nodes.filter(n=>'data-story'in n.attrs).map(n=>n.attrs['data-story']),['strategy','team','evolution','vault','markets','integrations']);
assert.equal(home.nodes.filter(n=>n.name==='video').length,0);
assert.equal(home.nodes.filter(n=>n.attrs.id==='agent-frame').length,1);
assert.equal(home.nodes.filter(n=>'data-native-component'in n.attrs).length,2);
for(const id of ['workspace','strategy','team','evolution','vault','markets','integrations','start','research-report'])assert(home.ids.has(id));
assert.equal(home.nodes.filter(n=>'data-get-started'in n.attrs).length,3);
assert.equal(docs.get('docs.html').nodes.filter(n=>n.attrs.class==='doc-section').length,18);
for(const id of ['sdk','quickstart','security','artifacts','trading','gateway','memory','modules','status'])assert(docs.get('docs.html').ids.has(id));
const demo=docs.get('demo/index.html');assert(demo.html.includes("connect-src 'none'"));
const pkg=JSON.parse(await read('package.json'));assert(!pkg.dependencies.astro&&!pkg.devDependencies.astro);assert.equal(pkg.scripts.dev,'vite');
console.log(`PASS: React/Vite build, ${published.length} allowlisted files, ${references} references, four prerendered pages, 18-section manual, six animated scenes and isolated Mock.`);
