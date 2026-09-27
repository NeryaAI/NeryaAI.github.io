import {build,transform} from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {withRolePortraits} from './avatar-adapter.mjs';
import rolePortraits from '../agent-avatars.js';
const root=path.resolve(import.meta.dirname,'..');
const source=path.resolve(process.env.NERYA_DASHBOARD_SOURCE||path.join(root,'../agent/dashboard'));
const requireFromAgent=createRequire(path.join(source,'package.json'));
const out=path.join(root,'demo'); await fs.mkdir(out,{recursive:true});
const sourceFiles=new Map();
// The current brief explicitly restores connector/venue capability presentation.
const routes=[];
for(const name of await fs.readdir(path.join(source,'app'))){
  if(['api','dev','login','setup'].includes(name))continue;
  try{await fs.access(path.join(source,'app',name,'page.tsx'));routes.push(name);}catch{}
}
const plugins=[{name:'real-dashboard',setup(b){
  b.onResolve({filter:/^@dashboard\//},a=>({path:path.join(source,a.path.slice(11))}));
  b.onResolve({filter:/^next\/(navigation|link|dynamic|image)$/},a=>({path:a.path,namespace:'next-shim'}));
  b.onLoad({filter:/.*/,namespace:'next-shim'},a=>({contents:a.path==='next/navigation'?`export * from ${JSON.stringify(path.join(root,'demo-src/navigation.tsx'))};`:`export {${({'next/link':'Link','next/dynamic':'dynamic','next/image':'Image'})[a.path]} as default} from ${JSON.stringify(path.join(root,'demo-src/navigation.tsx'))};`,loader:'tsx',resolveDir:root}));
  b.onResolve({filter:/^demo-pages$/},()=>({path:'pages',namespace:'pages'}));
  b.onLoad({filter:/.*/,namespace:'pages'},()=>({contents:routes.map((name,i)=>`import P${i} from ${JSON.stringify(path.join(source,'app',name,'page.tsx'))};`).join('\n')+`\nexport default {${routes.map((name,i)=>`${JSON.stringify('/'+name)}:P${i}`).join(',')}};`,loader:'tsx',resolveDir:source}));
  // Authentication is not simulated by borrowing a real token. This entire app
  // has a deny-by-default in-memory transport and cannot access a real service.
  b.onResolve({filter:/\/auth$|^\.\/auth$/},a=>a.importer.startsWith(source)?({path:'auth',namespace:'demo-auth'}):null);
  b.onLoad({filter:/.*/,namespace:'demo-auth'},()=>({contents:`export const AUTH_EVENT='demo-auth';export const AUTH_TOKEN_KEY='unused-demo';export const AUTH_EXPIRES_KEY='unused-demo';export const isLocalDashboardHost=()=>true;export const getStoredAuthToken=()=>'';export const authHeaders=(h)=>new Headers(h);export const handleAuthFailure=()=>{};export const redirectToLogin=()=>{};export const clearStoredAuthToken=()=>{};export const setStoredAuthToken=()=>{};`,loader:'js'}));
  b.onLoad({filter:/\.(tsx?|jsx?|json|css)$/},async a=>{
    if(!a.path.startsWith(source+path.sep))return;
    const original=await fs.readFile(a.path,'utf8');sourceFiles.set(path.relative(source,a.path),createHash('sha256').update(original).digest('hex'));
    let content=original.replaceAll('"/branding/','"./branding/').replaceAll("'/branding/","'./branding/")
      .replaceAll('new URLSearchParams(window.location.search)', 'new URLSearchParams(window.location.hash.split("?")[1] || window.location.search)')
      .replaceAll('new URL(window.location.href)', 'new URL(window.location.origin + (window.location.hash.slice(1) || "/"))');
    if(a.path.endsWith('lib/settings.ts'))content=content.replace('darkMode: "dark"','darkMode: "light"');
    content=withRolePortraits(content,path.relative(source,a.path),path.join(root,'demo-src/RoleAvatar.tsx'));
    return {contents:content,loader:a.path.endsWith('.module.css')?'local-css':path.extname(a.path).slice(1),resolveDir:path.dirname(a.path)};
  });
}}];
const result=await build({entryPoints:[path.join(root,'demo-src/entry.tsx')],outfile:path.join(out,'app.js'),bundle:true,format:'esm',platform:'browser',jsx:'automatic',target:['es2022'],minify:true,metafile:true,plugins,nodePaths:[path.join(source,'../node_modules')],define:{'process.env.NODE_ENV':'"production"','process.env.NEXT_PUBLIC_NERYA_PERMISSION_MODE':'"confirm"'},logLevel:'warning'});
const rawConfig=await fs.readFile(path.join(source,'tailwind.config.ts'),'utf8');
const configCode=await transform(rawConfig,{loader:'ts',format:'cjs'});const module={exports:{}};
new Function('module','exports',configCode.code)(module,module.exports);
const config=module.exports.default;
config.content=[path.join(source,'app/**/*.{ts,tsx}'),path.join(source,'components/**/*.{ts,tsx}'),path.join(source,'lib/**/*.{ts,tsx}')];
const postcss=requireFromAgent('postcss'),tailwind=requireFromAgent('tailwindcss');
const cssPath=path.join(source,'app/globals.css');const css=await fs.readFile(cssPath,'utf8');
sourceFiles.set('app/globals.css',createHash('sha256').update(css).digest('hex'));
const styles=await postcss([tailwind(config),requireFromAgent('autoprefixer')]).process(css,{from:cssPath});
await fs.writeFile(path.join(out,'global.css'),styles.css);
await fs.mkdir(path.join(out,'branding'),{recursive:true});
for(const name of ['Logo.png','Nerya.png'])await fs.copyFile(path.join(source,'public/branding',name),path.join(out,'branding',name));
await fs.copyFile(path.join(root,'demo-src/index.html'),path.join(out,'index.html'));
await fs.copyFile(path.join(root,'demo-src/theme.js'),path.join(out,'theme.js'));
for(const name of ['runtime.js','native-fixtures.js'])await fs.copyFile(path.join(root,'demo-src',name),path.join(out,name));
await fs.mkdir(path.join(out,'avatars'),{recursive:true});
for(const name of rolePortraits.roles)await fs.copyFile(path.join(root,'assets/agent-avatars',name+'.png'),path.join(out,'avatars',name+'.png'));
await fs.copyFile(path.join(root,'assets/agent-avatars/NOTICE.md'),path.join(out,'avatars/NOTICE.md'));
await fs.writeFile(path.join(out,'source-manifest.json'),JSON.stringify({source:'Nerya agent/dashboard working tree',builtAt:new Date().toISOString(),routes,sourceFiles:Object.fromEntries(sourceFiles),adaptations:['Next navigation -> local hash routing','authentication -> isolated public demo, no credentials','all API transport -> in-memory, deny unknown writes','provider identities retained for capability showcases','branding paths -> relative static paths','role-specific local PNG portraits in member tabs, conversations, Agent library and workflow nodes','theme preference synchronized from landing; original light/dark styles retained'],outputs:Object.keys(result.metafile.outputs).map(p=>path.basename(p))},null,2)+'\n');
console.log(`Built the real dashboard: ${sourceFiles.size} source files, ${routes.length} page routes. Source dashboard was not edited.`);
