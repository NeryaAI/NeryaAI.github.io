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
