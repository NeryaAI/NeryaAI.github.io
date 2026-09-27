// Standalone landing acceptance; the sibling dashboard is not needed in CI.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const roles=require('../agent-avatars.js').roles;
const read=file=>fs.readFileSync(path.join(root,file));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const manifest=JSON.parse(read('assets/agent-avatars/provenance.json'));
assert.equal(roles.length,20);assert.equal(manifest.files.length,20);
assert.match(manifest.provider,/GPT Pro Think/);
assert.equal(manifest.referenceUploadVerified,true);
assert.equal(manifest.references.length,2);
assert.equal(manifest.sourceAtlas.rows,4);assert.equal(manifest.sourceAtlas.columns,5);
assert.equal(hash(read(manifest.sourceAtlas.file)),manifest.sourceAtlas.sha256);
for(const ref of manifest.references)assert.equal(hash(read(ref.file)),ref.sha256);
const distinct=new Set();
for(const role of roles){
 const entry=manifest.files.find(file=>file.role===role);assert(entry,role);
 const bytes=read(`assets/agent-avatars/${role}.png`);
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(bytes.readUInt32BE(16),256);assert.equal(bytes.readUInt32BE(20),256);
 assert.equal(hash(bytes),entry.sha256);distinct.add(entry.sha256);
 assert(bytes.equals(read(`demo/avatars/${role}.png`)),`Demo avatar drift: ${role}`);
}
assert.equal(distinct.size,20);
console.log('PASS: 20 distinct reference-generated portraits, source atlas/reference provenance and byte-identical demo copies.');
