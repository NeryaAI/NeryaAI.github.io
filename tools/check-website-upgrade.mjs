// Offline regression contract. Does not call a model, broker, or browser.
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {sections} from '../src/data/manual.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=file=>readFile(path.join(root,file));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const names=['strategy','team','evolution','vault','markets','integrations'];
const variants=['zh-light','zh-dark','en-light','en-dark'];
let frameCount=0,mediaBytes=0;
for(const name of names){
  const posterHashes=new Set();
  for(const variant of variants){
    const prefix=`assets/product-recordings/${name}-${variant}`;
    const m=JSON.parse(await read(prefix+'.manifest.json'));
    assert.equal(m.status,'verified');assert.equal(m.variant,variant);assert.equal(m.name,name);
    assert.deepEqual(m.sourceInputs,m.sourceInputsAfter);assert.deepEqual(m.demoErrors,[]);
    const u=new URL(m.sourceUrl);assert.equal(u.pathname,'/demo/index.html');
    const [lang,theme]=variant.split('-');assert.equal(u.searchParams.get('lang'),lang);assert.equal(u.searchParams.get('theme'),theme);
    assert(m.safety.csp.includes("connect-src 'none'"));assert.equal(m.safety.settings,lang);assert.equal(m.safety.light,theme==='light');
    assert(m.frames.length>=15);assert(m.frames.some(f=>f.file===m.posterSourceFrame));frameCount+=m.frames.length;
    assert.equal(m.outputs.length,3);
    for(const item of m.outputs){
      assert(item.file.startsWith(`${name}-${variant}`));assert.equal(item.width,1280);assert.equal(item.height,800);
      const bytes=await read('assets/product-recordings/'+item.file);assert.equal(hash(bytes),item.sha256);assert.equal(bytes.length,item.bytes);mediaBytes+=bytes.length;
      const published=await read('dist/assets/product-recordings/'+item.file);assert.equal(hash(published),item.sha256,'Build must publish the verified bytes');
      if(item.file.endsWith('.webp'))posterHashes.add(item.sha256);
      else assert(item.duration>=6&&item.duration<18);
    }
    // Capture inputs must still match the served isolated demo, not a later build.
    for(const input of m.sourceInputs)assert.equal(hash(await read('dist/'+input.file)),input.sha256,`Recording source drift: ${input.file}`);
  }
  assert.equal(posterHashes.size,4,`${name}: four genuinely distinct locale/theme posters`);
}
assert.equal(sections.length,18);assert.equal(new Set(sections.map(s=>s.id)).size,18);
const ids=new Set(sections.flatMap(s=>[s.id,...(s.aliases||[])]));
for(const id of ['sdk','artifacts','architecture','skills','security','quickstart','trading','self-evolution','gateway','memory','modules','status'])assert(ids.has(id));
for(const section of sections){
  assert(section.title[0]&&section.title[1]);assert(section.content.length);
  for(const block of section.content){
    if(['p','h3','note'].includes(block.type))assert(block.zh&&block.en,`${section.id} bilingual content missing`);
    if(block.type==='code')assert(!/^nerya service start$/m.test(block.text),'Do not document a nonexistent CLI subcommand');
  }
}
const showcase=String(await read('src/components/ResultShowcase.tsx'));
for(const kind of ['strategy','backtest','market','research'])assert(showcase.includes(`data-result-panel="${kind}"`));
assert(showcase.includes('示例数据')&&showcase.includes('Illustrative data'));
assert.equal(String(await read('demo-src/theme.js')),String(await read('demo/theme.js')));
await stat(path.join(root,'dist/docs-v2.js'));await stat(path.join(root,'dist/docs-v2.css'));
console.log(`PASS: 24 locale/theme recordings, ${frameCount} native frames, 72 published media files (${(mediaBytes/1024/1024).toFixed(1)} MiB), source/byte provenance, 18 bilingual sections, legacy anchors and four disclosed result types.`);
