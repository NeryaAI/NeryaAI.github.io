// Encode native captures in a normal Node process, separate from Ego.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
const exec=promisify(execFile),root=fileURLToPath(new URL('../',import.meta.url));
const out=path.join(root,'assets/product-recordings'),work=path.join(root,'.tmp/localized-films');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const variants=process.env.NERYA_FILM_VARIANTS?.split(',')||['zh-light','zh-dark','en-light','en-dark'];
const scenes=process.env.NERYA_FILM_SCENES?.split(',')||['strategy','team','evolution','vault','markets','integrations'];
for(const variant of variants)for(const name of scenes){
  const stem=`${name}-${variant}`;assert(/^(strategy|team|evolution|vault|markets|integrations)-(zh|en)-(light|dark)$/.test(stem));
  const folder=path.join(work,stem),m=JSON.parse(await readFile(path.join(folder,'capture.json'),'utf8'));
  assert.equal(m.status,'captured');assert.deepEqual(m.sourceInputs,m.sourceInputsAfter);assert.deepEqual(m.demoErrors,[]);
  assert(m.frames.length>=15);assert(m.frames.some(f=>f.file===m.posterSourceFrame));
  for(const frame of m.frames)assert.equal(hash(await readFile(path.join(folder,frame.file))),frame.sha256,'Capture changed after recording');
  const duration=m.capture.duration;
  await exec('/opt/homebrew/bin/ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',path.join(folder,'frames.txt'),'-t',String(duration),'-r','10','-c:v','libx264','-preset','fast','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,stem+'.mp4')],{maxBuffer:1024*1024});
  await exec('/opt/homebrew/bin/ffmpeg',['-hide_banner','-loglevel','error','-y','-i',path.join(out,stem+'.mp4'),'-filter_complex','fps=8,split[a][b];[a]palettegen=stats_mode=diff:max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=3','-loop','0',path.join(out,stem+'.gif')],{maxBuffer:1024*1024});
  await sharp(path.join(folder,m.posterSourceFrame)).webp({quality:88}).toFile(path.join(out,stem+'-poster.webp'));
  const outputs=[];
  for(const ext of ['mp4','gif','webp']){
    const file=stem+(ext==='webp'?'-poster.webp':'.'+ext),bytes=await readFile(path.join(out,file));
    let metadata;
    if(ext==='webp')metadata=await sharp(bytes).metadata();
    else {const {stdout}=await exec('/opt/homebrew/bin/ffprobe',['-v','error','-show_streams','-show_format','-of','json',path.join(out,file)]);const probe=JSON.parse(stdout);metadata={...probe.streams[0],duration:Number(probe.format.duration)};}
    assert.equal(metadata.width,1280);assert.equal(metadata.height,800);
    // The first screenshot can arrive late while the native route renders.
    // Encode the observed interval, not the pre-capture wait; never speed it up
    // or invent frames to make every clip exactly eight seconds long.
    if(ext!=='webp') {
      const observedDuration = duration - m.frames[0].time;
      assert(metadata.duration >= 6 && metadata.duration < 18);
      assert(Math.abs(metadata.duration - observedDuration) < .4,
        `${file}: encoded duration must preserve the captured elapsed time`);
    }
    outputs.push({file,bytes:bytes.length,sha256:hash(bytes),width:1280,height:800,...(ext!=='webp'?{duration:metadata.duration}: {})});
  }
  await writeFile(path.join(out,stem+'.manifest.json'),JSON.stringify({...m,status:'verified',outputs},null,2));
  console.log('VERIFIED',stem,m.frames.length,'native frames',outputs.reduce((n,o)=>n+o.bytes,0),'bytes');
}
const completed=[];
for(const variant of ['zh-light','zh-dark','en-light','en-dark'])for(const name of ['strategy','team','evolution','vault','markets','integrations']){
  try {const {frames,...m}=JSON.parse(await readFile(path.join(out,`${name}-${variant}.manifest.json`),'utf8'));completed.push({...m,frameCount:frames.length});}catch(e){if(e.code!=='ENOENT')throw e;}
}
await mkdir(path.join(root,'docs/website-upgrade-evidence'),{recursive:true});
await writeFile(path.join(root,'docs/website-upgrade-evidence/localized-recordings.json'),JSON.stringify({completed},null,2));
console.log('TOTAL',completed.length,'verified localized recordings');
