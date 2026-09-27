import { copyFile, lstat, mkdir, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));

// Explicit source allowlist. Never copy the repository, assets/, or demo/ wholesale.
// React entry HTML is handled by Vite, not copied into public/.
const requiredFiles = [
  'docs.css', 'docs-fx.js', 'docs-v2.css', 'docs-v2.js', 'native-parts.css',
  'i18n.js', 'i18n.zh.js', 'i18n.zh.json',
  'icons.css', 'icon-paths.js', 'icons.js',
  'landing-theme.js', 'themes.css', 'agent-avatars.js', 'avatars.css',
  'demo/index.html', 'demo/app.js', 'demo/app.css', 'demo/global.css',
  'demo/theme.js', 'demo/source-manifest.json',
  'demo/runtime.js', 'demo/native-fixtures.js',
  'demo/branding/Logo.png', 'demo/branding/Nerya.png',
  ...['lead','researcher','analyst','reviewer','risk','coder','macro','quant','execution','data','sentiment','onchain','portfolio','backtest','security','connector','prediction','futures','equities','evolution'].flatMap(role => [
    `assets/agent-avatars/${role}.png`, `demo/avatars/${role}.png`,
  ]),
  'assets/agent-avatars/NOTICE.md', 'demo/avatars/NOTICE.md',
  'assets/vendor/anime.esm.min.js',
];

const optionalFiles = [
  'CNAME', 'robots.txt', 'favicon.ico', 'LICENSE',
  ...[
    'nerya-author.png', 'nerya-author.webp', 'nerya-cutout.png', 'nerya-cutout.webp',
    'nerya-evolution-keyframe.jpg', 'nerya-evolution-keyframe.webp', 'nerya-evolution.mp4',
    'nerya-evolve.jpg', 'nerya-evolve.mp4', 'nerya-evolve.webp',
    'nerya-evolver.png', 'nerya-evolver.webp', 'nerya-guard-kf.jpg', 'nerya-guard-kf.webp',
    'nerya-guard.mp4', 'nerya-guard.png', 'nerya-guard.webp',
    'nerya-hero-ambient.jpg', 'nerya-hero-ambient.webp', 'nerya-hero-green.png', 'nerya-hero-green.webp',
    'nerya-launch-green.png', 'nerya-launch-green.webp', 'nerya-launch-kf.png', 'nerya-launch-kf.webp',
    'nerya-launch.mp4', 'nerya-logo.png', 'nerya-logo.webp', 'nerya-mascot.png', 'nerya-mascot.webp',
    'nerya-rewriter.png', 'nerya-rewriter.webp', 'nerya-star-cutout.png', 'nerya-star-cutout.webp',
    'nerya-star.png', 'nerya-star.webp', 'nerya-team-kf.jpg', 'nerya-team-kf.webp',
    'nerya-team.mp4', 'nerya-team.png', 'nerya-team.webp',
    'generated/nerya-observatory.png', 'generated/nerya-observatory.webp',
    'generated/nerya-reference-studio.png', 'generated/nerya-reference-studio.webp',
    'generated/nerya-reference-workspace.png', 'generated/nerya-reference-workspace.webp',
  ].map(file => `assets/${file}`),
];

async function statWithoutSymlinks(base, relative) {
  let current = base;
  for (const segment of relative.split('/')) {
    current = join(current, segment);
    let stat;
    try { stat = await lstat(current); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    if (stat.isSymbolicLink()) throw new Error(`Refusing to publish a symlink: ${current}`);
  }
  return lstat(current);
}

export async function collectPublicFiles(sourceRoot = root) {
  const files = [];
  for (const file of [...requiredFiles, ...optionalFiles]) {
    const stat = await statWithoutSymlinks(sourceRoot, file);
    if (!stat && optionalFiles.includes(file)) continue;
    if (!stat?.isFile()) throw new Error(`Missing public source file: ${file}`);
    files.push(file);
  }

  // The lead owns this optional source directory. Only direct media files are public;
  // provenance JSON, source maps, notes, hidden files and subdirectories stay private.
  for (const mediaDir of ['assets/product-demos', 'assets/product-recordings']) {
    const mediaStat = await statWithoutSymlinks(sourceRoot, mediaDir);
    if (mediaStat) {
      if (!mediaStat.isDirectory()) throw new Error(`${mediaDir} must be a directory`);
      for (const entry of await readdir(join(sourceRoot, mediaDir), { withFileTypes: true })) {
        if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.(mp4|webm|gif|png|jpe?g|webp|avif)$/i.test(entry.name)) continue;
        if (!entry.isFile()) throw new Error(`Public media must be a regular file: ${entry.name}`);
        files.push(`${mediaDir}/${entry.name}`);
      }
    }
  }
  return files.sort();
}

export async function listFiles(directory, prefix = '') {
  const stat = await lstat(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`Expected a real directory: ${directory}`);
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = `${prefix}${entry.name}`;
    if (entry.isSymbolicLink()) throw new Error(`Unexpected published symlink: ${relative}`);
    if (entry.isDirectory()) files.push(...await listFiles(join(directory, entry.name), `${relative}/`));
    else if (entry.isFile()) files.push(relative);
    else throw new Error(`Unexpected published file type: ${relative}`);
  }
  return files.sort();
}

export async function preparePublic() {
  const files = await collectPublicFiles();
  const publicDir = join(root, 'public');
  await mkdir(publicDir, { recursive: true });
  const allowed = new Set([...files, '.nojekyll']);
  const unexpected = (await listFiles(publicDir)).filter(file => !allowed.has(file));
  // Fail closed instead of deleting existing files or silently publishing stale/private material.
  if (unexpected.length) throw new Error(`Unlisted files in generated public/; inspect before retrying: ${unexpected.join(', ')}`);
  for (const file of files) {
    await mkdir(dirname(join(publicDir, file)), { recursive: true });
    await copyFile(join(root, file), join(publicDir, file));
  }
  await writeFile(join(publicDir, '.nojekyll'), '');
  console.log(`Prepared ${files.length} allowlisted public files and .nojekyll; original sources untouched.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await preparePublic();
