// GPT Pro Think manual recovery: the current ChatGPT UI uses new message markup.
// Reads only the generated image in the task-owned OpenCLI session. Never sends.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';

const [session, output, promptFile] = process.argv.slice(2);
if (!session || !output || !promptFile) throw Error('Usage: node tools/collect-generated-image.mjs SESSION OUTPUT PROMPT');
const expression = `(() => {
  const busy = [...document.querySelectorAll('button[aria-label]')].some(b => /^(停止|停止生成|Stop|Stop generating)$/i.test(b.getAttribute('aria-label')));
  const images = [...document.querySelectorAll('main img,[role=main] img')].filter(i => /已生成图像|Generated image/i.test(i.alt) && i.complete && i.naturalWidth > 800);
  const i = images.at(-1);
  return { busy, url: location.href, image: i ? {src: i.currentSrc, width: i.naturalWidth, height: i.naturalHeight, alt: i.alt} : null };
})()`;
const raw = execFileSync('opencli', ['browser', session, 'eval', expression], { encoding: 'utf8', maxBuffer: 30 * 1024 * 1024 });
const data = JSON.parse(raw);
if (data.busy || !data.image) throw Error('Generation not complete; do not resend. Retry extraction later.');
const match = data.image.src.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/s);
if (!match) throw Error('Expected visible generated-image data URL; inspect current UI before changing extractor.');
const bytes = Buffer.from(match[2], 'base64');
const path = resolve(output);
mkdirSync(dirname(path), { recursive: true });
writeFileSync(path, bytes);
const manifest = {
  provider: 'ChatGPT web via GPT Pro Think manual recovery / OpenCLI',
  modelSelection: 'Latest', reasoningEffort: 'Extra high', imageModel: 'not exposed by UI',
  userApprovedSelection: true, session, conversation: data.url,
  prompt: readFileSync(promptFile, 'utf8'), file: path, width: data.image.width,
  height: data.image.height, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
  extractedAt: new Date().toISOString(),
};
writeFileSync(path + '.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ file: path, width: manifest.width, height: manifest.height, bytes: bytes.length, sha256: manifest.sha256 }));
