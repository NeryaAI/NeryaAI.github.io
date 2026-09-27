// Mechanical cropping of the inspected GPT-generated 5x4 atlas, not new artwork.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import portraits from '../agent-avatars.js';
const root=path.resolve(import.meta.dirname,'..');
const dependency=createRequire(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'));
const sharp=dependency('sharp');
const source=path.join(root,'assets/generated/mascot-roles/atlas/nerya-role-atlas-01.png');
const target=path.join(root,'assets/agent-avatars');
const atlas=await fs.readFile(source),meta=await sharp(atlas).metadata();
if(portraits.roles.length!==20||!meta.width||!meta.height||Math.abs(meta.width/meta.height-5/4)>.02)throw Error('Expected inspected twenty-role 5x4 atlas');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const records=[];const outputs=[];
for(let i=0;i<20;i++){
 const col=i%5,row=Math.floor(i/5);
 const left=Math.round(col*meta.width/5),top=Math.round(row*meta.height/4);
 const width=Math.round((col+1)*meta.width/5)-left,height=Math.round((row+1)*meta.height/4)-top;
 const bytes=await sharp(atlas).extract({left,top,width,height}).resize(256,256,{fit:'fill'}).png({palette:true,colours:256,effort:10,compressionLevel:9}).toBuffer();
 records.push({role:portraits.roles[i],file:portraits.roles[i]+'.png',width:256,height:256,sourceCell:{row:row+1,column:col+1,left,top,width,height},sha256:sha(bytes),bytes:bytes.length});
 outputs.push(bytes);
}
if(new Set(records.map(r=>r.sha256)).size!==20)throw Error('All twenty portraits must be distinct');
const old=await fs.readFile(path.join(target,'provenance.json'),'utf8').catch(()=>null);
if(old&&/DiceBear|dicebear|CC0/.test(old)){
 const backup=path.join(root,'.tmp/legacy-role-avatars-20260926');await fs.mkdir(backup,{recursive:true});
 for(const file of ['lead.png','researcher.png','analyst.png','reviewer.png','risk.png','coder.png','NOTICE.md','provenance.json']){
  try{await fs.copyFile(path.join(target,file),path.join(backup,file),1);}catch(e){if(e.code!=='EEXIST'&&e.code!=='ENOENT')throw e;}
 }
}
await fs.mkdir(target,{recursive:true});
for(let i=0;i<20;i++)await fs.writeFile(path.join(target,records[i].file),outputs[i]);
const generation=JSON.parse(await fs.readFile(source.replace('-01.png','-manifest.json'),'utf8'));
const references=[];
for(const file of ['assets/nerya-mascot.webp','assets/nerya-logo.webp'])references.push({file,sha256:sha(await fs.readFile(path.join(root,file)))});
const provenance={version:2,provider:'ChatGPT web via GPT Pro Think / Ego',modelSelection:'Latest',reasoningEffort:'Extra high',conversation:generation.conversationUrl,generatedAt:generation.generatedAt,referenceUploadVerified:true,references,sourceAtlas:{file:path.relative(root,source),width:meta.width,height:meta.height,sha256:sha(atlas),rows:4,columns:5},process:'Twenty distinct characters generated as one inspected atlas; exact grid crops and resize only.',license:'Project artwork; see project LICENSE',files:records};
await fs.writeFile(path.join(target,'provenance.json'),JSON.stringify(provenance,null,2)+'\n');
console.log(JSON.stringify({portraits:records.length,size:256,source:path.relative(root,source),totalBytes:records.reduce((n,r)=>n+r.bytes,0)}));
