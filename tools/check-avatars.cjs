const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const avatars=require('../agent-avatars.js');
const root=path.resolve(__dirname,'..');
async function main(){
const {syncRoleAvatars}=await import('./sync-role-avatars.mjs');
const manifest=await syncRoleAvatars({check:true});
assert.equal(manifest.files.length,20);
for(const [name,key] of [['risk_critic','risk'],['reviewer','reviewer'],['市场研究员','researcher'],['market','analyst'],['coding agent','coder']])assert.equal(avatars.resolve(name),key);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(!html.includes('class="role-icon"'));assert(!/<span class="member-orb">[^<]+<\//.test(html));
for(const phrase of ['不是轮流回答','市场可以不同','每次运行，都是','带着好奇心来','A few things worth knowing','An entire research team'])assert(!html.includes(phrase),`Old filler returned: ${phrase}`);
const code=fs.readFileSync(path.join(root,'demo/app.js'),'utf8');assert(code.includes('native-role-avatar'));assert(code.includes('native-agent-identity'));
console.log('PASS: 20 distinct generated PNG assets, byte-identical website/dashboard/demo copies, consistent role mapping, portrait markup and targeted copy cleanup.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
