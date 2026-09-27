const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
let frames=0;
for(const name of ['strategy','team','evolution','vault','markets','integrations']){
 const dir=path.join(root,'assets/product-recordings');
 const manifest=JSON.parse(fs.readFileSync(path.join(dir,`${name}.manifest.json`)));
 assert.equal(manifest.status,'encoded-and-verified');
 assert.match(manifest.capture.method,/Page\.captureScreenshot native DPR2/);
 assert.equal(manifest.viewport.deviceScaleFactor,2);
 assert.equal(manifest.capture.pixelWidth,2560);assert.equal(manifest.capture.pixelHeight,1600);
 assert.equal(manifest.sourceStable,true);assert.deepEqual(manifest.demoErrors,[]);
 assert.equal(new URL(manifest.sourceUrl).pathname,'/demo/index.html');
 assert(manifest.frames.length>=25);frames+=manifest.frames.length;
 assert(new Set(manifest.frames.map(frame=>frame.sha256)).size>=5,'Walkthrough must contain changing native frames');
 assert(manifest.frames.some(frame=>frame.file===manifest.posterSourceFrame),'Poster must refer to an actual captured frame');
 assert.deepEqual(manifest.sourceInputs,manifest.sourceInputsAfter);
 for(const role of ['lead','researcher','reviewer','analyst','risk','coder']){
  const input=manifest.sourceInputs.find(input=>input.url.endsWith(`/avatars/${role}.png`));assert(input);
  assert.equal(input.sha256,hash(fs.readFileSync(path.join(root,`assets/agent-avatars/${role}.png`))));
 }
 for(const ext of ['mp4','gif','webp']){
  const file=ext==='webp'?`${name}-poster.webp`:`${name}.${ext}`;
  const output=manifest.outputs.find(output=>output.file===file);assert(output,file);
  assert.equal(output.sha256,hash(fs.readFileSync(path.join(dir,file))));
  assert.equal(output.width,2560);assert.equal(output.height,1600);
  if(ext!=='webp')assert(output.duration>=10&&output.duration<=24);
 }
}
console.log(`PASS: six native-screen recordings, ${frames} genuine captured frames, generated-role hashes and actual-frame posters.`);
