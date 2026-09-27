// One-time, bounded migration of the inspected website sources. Originals are
// archived locally before replacement. Not part of the build or runtime.
import {readFile,writeFile,mkdir,copyFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const archive=path.join(root,'.tmp/react-migration-inputs');
await mkdir(archive,{recursive:true});
async function save(file){await mkdir(path.dirname(path.join(archive,file)),{recursive:true});await copyFile(path.join(root,file),path.join(archive,file));}
const parts=['AgentWorkspace','Copy','Icon','NativePart','ProductFilm','ProductStory','ResultShowcase'];
for(const file of [...parts.map(n=>`src/components/${n}.astro`),'src/pages/index.astro','astro.config.mjs','index.html','docs.html','skills.html','recipes.html'])await save(file);
function jsx(text){
  return text.replaceAll('.astro\'','\'').replaceAll('.astro"','"')
    .replace(/class:list=\{(\[[\s\S]*?\])\}/g,'className={cn($1)}')
    .replace(/\bclass=/g,'className=')
    .replace(/\btabindex="(\d+)"/g,'tabIndex={$1}')
    .replace(/\btabindex=/g,'tabIndex=')
    .replace(/\breferrerpolicy=/g,'referrerPolicy=')
    .replace(/style=\{`(--[\w-]+):\$\{(\w+)\}`\}/g,"style={{ '$1': $2 } as CSSProperties}")
    .replace(/\b(stroke-width|stroke-linecap|stroke-linejoin|stop-color|stop-opacity|fill-rule|clip-rule|stroke-dasharray|stroke-dashoffset)=/g,m=>m.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()));
}
for(const name of ['AgentWorkspace','ProductStory','ResultShowcase']){
  const source=await readFile(path.join(root,`src/components/${name}.astro`),'utf8');
  const [,front,body]=source.split(/^---\s*$/m);
  let declarations=jsx(front).replace('const { feature } = Astro.props;','').replace('const id = feature.id;','');
  const imports=declarations.match(/^import .*$/gm)||[];
  declarations=declarations.replace(/^import .*$/gm,'');
  let content=jsx(body).trim();
  // Key every first-level mapping; all loops in these inspected components
  // have stable local ids/roles or a fixed scene index.
  content=content.replace(/\.map\(\(\[route, zh, en\], i\) => <button/g,'.map(([route, zh, en], i) => <button key={route}');
  content=content.replace(/\.map\(\(\[id,zh,en\],i\)=><button/g,'.map(([id,zh,en],i)=><button key={id}');
  content=content.replace(/\.map\(\(\[icon,zh,en\],i\)=><div/g,'.map(([icon,zh,en],i)=><div key={icon}');
  content=content.replace(/\.map\(\(\[role,zh,en,subZh,subEn\],i\)=><div/g,'.map(([role,zh,en,subZh,subEn],i)=><div key={role}');
  content=content.replace(/\.map\(\(\[mark,zh,en\],i\)=><span/g,'.map(([mark,zh,en],i)=><span key={mark}');
  content=content.replace(/\.map\(\(y,i\)=><g/g,'.map((y,i)=><g key={i}');
  content=content.replace(/\.map\(\(step,i\)=><button/g,'.map((step,i)=><button key={i}');
  content=content.replace(/\.map\(role=><img/g,'.map(role=><img key={role}');
  content=content.replace(/\.map\(\(\[n,zh,en,bodyZh,bodyEn\]\)=><section/g,'.map(([n,zh,en,bodyZh,bodyEn])=><section key={n}');
  content=content.replace('return <g className','return <g key={i} className');
  if(name==='ProductStory')declarations=declarations.replace('const title = titles[id as keyof typeof titles];','');
  const signature=name==='ProductStory'?`({feature}: {feature: {id:string;steps: ReadonlyArray<{zh:string;en:string}>}})`:'()';
  const locals=name==='ProductStory'?'const id=feature.id; const title=titles[id as keyof typeof titles];':'';
  const code=`import React, {type CSSProperties} from 'react';\nimport {cn} from '@/lib/utils';\n${imports.join('\n')}\n${declarations}\nexport default function ${name}${signature}{\n${locals}\nreturn <>${content}</>;\n}\n`;
  await writeFile(path.join(root,`src/components/${name}.tsx`),code);
}
// Homepage JSX is preserved; only the host and hydration boundary change.
const source=await readFile(path.join(root,'src/pages/index.astro'),'utf8');
const [,front,document]=source.split(/^---\s*$/m);
let declarations=jsx(front).replaceAll("'../components/","'./components/").replaceAll("'../../components/","'../components/").replaceAll("'../data/","'./data/");
declarations=declarations.replace(/^import .*\.css';\s*$/gm,'');
let body=jsx(document.match(/<body>([\s\S]*)<\/body>/)[1]);
body=body.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<noscript>[\s\S]*?<\/noscript>/g,'');
const start=body.indexOf('<ContainerScroll client:load>');
const titleStart=body.indexOf('<div slot="title-component"',start);
const titleEnd=body.indexOf('\n        <AgentWorkspace',titleStart);
const title=body.slice(titleStart,titleEnd).replace(' slot="title-component"','');
body=body.slice(0,start)+`<ContainerScroll titleComponent={${title}}>\n`+body.slice(titleEnd);
body=body.replace('features.map((feature, i) => <section','features.map((feature, i) => <section key={feature.id}');
body=body.replace('.map(role=><img','.map(role=><img key={role}');
body=body.replace('.map(([role,zh,en])=><span','.map(([role,zh,en])=><span key={role}');
body=body.replace('markets.map(m=><button','markets.map(m=><button key={m.id}');
const app=`import React, {useEffect} from 'react';\nimport {cn} from '@/lib/utils';\n${declarations}\nlet controllers: Promise<unknown> | undefined;\nexport default function App(){\nuseEffect(()=>{\n window.__neryaMarkets=markets;\n controllers ??= import('./scripts/site').then(()=>Promise.all([import('./scripts/results'),import('./scripts/stories'),import('./scripts/effects')]));\n controllers.then(()=>{document.documentElement.dataset.reactReady='true';}).catch(error=>{console.error('Nerya website controls failed',error);document.documentElement.dataset.reactReady='error';});\n},[]);\nreturn <>${body}</>;\n}\n`;
await writeFile(path.join(root,'src/App.tsx'),app);
// Explicitly retire Astro source; archived copies are outside all build inputs.
for(const file of [...parts.map(n=>`src/components/${n}.astro`),'src/pages/index.astro','astro.config.mjs'])await rename(path.join(root,file),path.join(archive,file));
// Public HTML copies are generated output, not the authored root inputs.
for(const name of ['docs.html','skills.html','recipes.html']){
  try{await rename(path.join(root,'public',name),path.join(archive,'public-'+name));}catch(e){if(e.code!=='ENOENT')throw e;}
}
const iconSource=await readFile(path.join(root,'icon-paths.js'),'utf8');
const icons=JSON.parse(iconSource.slice(iconSource.indexOf('Object.freeze(')+14,iconSource.lastIndexOf(');')));
await writeFile(path.join(root,'src/data/icon-paths.json'),JSON.stringify(icons,null,2)+'\n');
for(const name of ['index.html','docs.html','skills.html','recipes.html']){
  const home=name==='index.html';
  const template=`<!doctype html>\n<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#faf9fc"><title>${home?'Nerya · 你的 Agent 策略团队':'Nerya Docs · Agent 与 SDK'}</title><meta name="description" content="${home?'用 Nerya Agent 团队研究市场、编写策略、核查证据。':'Nerya Agent 与 SDK：会话、工具、图表产物、策略与安全。'}"><meta property="og:type" content="website"><meta property="og:title" content="Nerya · Agent strategy workspace"><meta property="og:image" content="/assets/nerya-logo.webp"><link rel="icon" href="/assets/nerya-logo.webp"><link rel="stylesheet" href="/icons.css">${home?'<link rel="stylesheet" href="/native-parts.css">':''}<script src="/landing-theme.js"></script><script defer src="/icon-paths.js"></script><script defer src="/icons.js"></script></head><body><div id="react-root"></div><script type="module" src="/src/${home?'main':'docs'}.tsx"></script><noscript><style>.container-scroll-card,.container-scroll-header{transform:none!important}.container-scroll-card{margin-top:0!important}.hero-atmosphere *,.launch-orbits *{animation:none!important}.reveal-ready{opacity:1!important;transform:none!important}</style></noscript></body></html>\n`;
  await writeFile(path.join(root,name),template);
}
console.log('Migrated four React page entrypoints and feature components; prior inputs archived under .tmp/react-migration-inputs.');
