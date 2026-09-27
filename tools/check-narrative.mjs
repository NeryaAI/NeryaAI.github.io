import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const read=name=>readFile(new URL('../'+name,import.meta.url),'utf8');
const parts=JSON.parse(await read('src/data/native-parts.json'));
const provenance=JSON.parse(await read('src/data/native-parts.provenance.json'));
for(const component of ['components/backtest/SummaryCards.tsx','components/chat/ResearchReplyCards.tsx']){
  assert(provenance.sourceFiles[component],`Missing native source provenance: ${component}`);
  const bytes=await readFile(new URL('../../agent/dashboard/'+component,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),provenance.sourceFiles[component],`Source component changed: refresh snapshot ${component}`);
}
for(const name of ['market','backtest']){assert(parts[name].zh!==parts[name].en);assert(parts[name].zh.length>300);assert(parts[name].en.length>300);}
const market=parts.market.zh+parts.market.en;
const ids=[...market.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,'Locale SVG IDs must not collide');
const html=await read('dist/index.html');assert(!/<video\b|<animateMotion\b/.test(html));
assert(!/src="[^"]*product-recordings/.test(html),'No active recording media');
const controller=await read('src/scripts/stories.ts');
assert(!/scrollTo|scrollIntoView|setInterval/.test(controller),'Story playback must never move the viewport');
assert(controller.includes('document.hidden')&&controller.includes('IntersectionObserver')&&controller.includes('prefers-reduced-motion'));
assert(controller.includes('cancelAnimationFrame'));
console.log('PASS: source-native bilingual excerpts, unique SVG IDs, no screen recordings, viewport-aware and reduced-motion playback.');
