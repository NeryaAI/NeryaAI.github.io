// Download the selected public-domain portraits once. No runtime avatar API.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'../assets/agent-avatars');
const roles=[['lead','Nerya-Lead','e9dff4'],['researcher','Nerya-Researcher','dcece5'],['analyst','Nerya-Analyst','dfe8f5'],['reviewer','Nerya-Reviewer','f2e5d7'],['risk','Nerya-Risk','e8dfe9'],['coder','Nerya-Coder','dfe5f0']];
await fs.mkdir(root,{recursive:true});
const files=[];
for(const [role,seed,color] of roles){
 const url=new URL('https://api.dicebear.com/10.x/lorelei/png');
 url.search=new URLSearchParams({seed,backgroundColor:color,size:'192'}).toString();
 const file=path.join(root,role+'.png');
 let bytes,exists=true;
 try { bytes=await fs.readFile(file); }
 catch(error){if(error.code!=='ENOENT')throw error;exists=false;bytes=execFileSync('curl',['--fail','--silent','--show-error','--http1.1','--max-time','30',url.href],{maxBuffer:1024*1024});}
 if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Not a PNG');
 if(!exists)await fs.writeFile(file,bytes,{flag:'wx'});
 files.push({role,file:role+'.png',source:url.href,width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),sha256:createHash('sha256').update(bytes).digest('hex')});
 console.log(`${role}: ${bytes.length} bytes`);
}
await fs.writeFile(path.join(root,'provenance.json'),JSON.stringify({library:'DiceBear',style:'Lorelei',artworkCreator:'Lisa Wischofsky',license:'CC0 1.0',licenseSource:'https://www.dicebear.com/styles/lorelei/',originalArtwork:'https://www.figma.com/community/file/1198749693280469639',format:'PNG',downloadedAt:new Date().toISOString(),files},null,2)+'\n');
