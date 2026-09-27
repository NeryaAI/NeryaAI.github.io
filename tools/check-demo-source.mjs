// Optional workspace check: no source writes, network or live runtime access.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
const source=path.resolve(process.env.NERYA_DASHBOARD_SOURCE||path.join(root,'../agent/dashboard'));
const manifest=JSON.parse(await fs.readFile(path.join(root,'demo/source-manifest.json'),'utf8'));
const changed=[];
for(const [file,expected] of Object.entries(manifest.sourceFiles)){
 const bytes=await fs.readFile(path.join(source,file)).catch(()=>null);
 if(!bytes||createHash('sha256').update(bytes).digest('hex')!==expected)changed.push(file);
}
const routes=[];
for(const name of await fs.readdir(path.join(source,'app'))){
 if(['api','dev','login','setup'].includes(name))continue;
 if(await fs.stat(path.join(source,'app',name,'page.tsx')).catch(()=>null))routes.push(name);
}
assert.deepEqual(manifest.routes.sort(),routes.sort(),'Page routes changed; rebuild the demo from current source');
assert.deepEqual(changed,[],`Stale UI files: ${changed.join(', ')}. Run npm run build:demo and refresh the recordings.`);
console.log(`PASS: ${Object.keys(manifest.sourceFiles).length} bundled source hashes and ${routes.length} routes match the current Agent working copy.`);
