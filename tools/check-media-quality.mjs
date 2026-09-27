// Local media QA uses retained raw captures; not part of standalone website CI.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile),root=path.resolve(import.meta.dirname,'..');
const sharp=createRequire(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'))('sharp');
const evidence=path.join(root,'docs/ui-refresh-evidence-20260926');await fs.mkdir(evidence,{recursive:true});
const results=[];
for(const name of ['strategy','team','evolution','vault','markets','integrations']){
 const manifest=JSON.parse(await fs.readFile(path.join(root,`assets/product-recordings/${name}.manifest.json`),'utf8'));
 const source=path.join(root,manifest.captureDirectory,manifest.posterSourceFrame);
 const poster=path.join(root,`assets/product-recordings/${name}-poster.webp`);
 const original=await sharp(source).removeAlpha().raw().toBuffer();
 const decoded=await sharp(poster).removeAlpha().raw().toBuffer();
 assert(original.equals(decoded),`${name}: lossless poster pixels differ from raw capture`);
 const media=await sharp(poster).metadata();assert.equal(media.width,2560);assert.equal(media.height,1600);
 results.push({name,pixels:[media.width,media.height],losslessPoster:true,sourceFrames:manifest.frames.length});
 if(name==='strategy'){
  const t=manifest.frames.find(frame=>frame.file===manifest.posterSourceFrame).t;
  const gifFrame=path.join(evidence,'decoded-hd-gif.png');
  await exec('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss',String(t),'-i',path.join(root,'assets/product-recordings/strategy.gif'),'-frames:v','1',gifFrame]);
  const crop={left:650,top:230,width:900,height:230};
  // A controlled same-frame comparison, explicitly labelled as a simulated
  // 1x path; no sharpening, redrawing or AI enhancement is applied.
  const low=await sharp(source).resize(1280,800).png().toBuffer();
  const enlarged=await sharp(low).resize(2560,1600).png().toBuffer();
  const before=await sharp(enlarged).extract(crop).png().toBuffer();
  const after=await sharp(gifFrame).extract(crop).png().toBuffer();
  const labels=Buffer.from('<svg width="1848" height="48"><rect width="1848" height="48" fill="#f7f6fa"/><text x="16" y="31" font-family="Arial" font-size="20" fill="#373040">1x capture path (simulated)</text><text x="932" y="31" font-family="Arial" font-size="20" fill="#373040">New GIF: native 2x capture</text></svg>');
  await sharp({create:{width:1848,height:294,channels:3,background:'#f7f6fa'}}).composite([{input:labels,left:0,top:0},{input:before,left:16,top:48},{input:after,left:932,top:48}]).png().toFile(path.join(evidence,'density-comparison.png'));
 }
}
await fs.writeFile(path.join(evidence,'media-quality.json'),JSON.stringify({capturePixels:[2560,1600],cssViewport:[1280,800],deviceScaleFactor:2,maximumFilmCssWidth:1160,retinaRequiredWidth:2320,comparison:'Same current UI; old1x resampling path simulated, newGIF decoded directly.',results},null,2));
console.log('PASS: all six 2560x1600 posters are pixel-identical to their raw2x captures; decoded-GIF comparison saved.');
