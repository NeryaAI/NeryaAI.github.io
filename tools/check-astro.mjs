import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectPublicFiles, listFiles, root } from './prepare-public.mjs';

const sections = ['workspace', 'strategy', 'team', 'evolution', 'vault', 'markets', 'integrations', 'start'];
const voidTags = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
const decode = value => value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt);/gi, (_, entity) => {
  if (entity[0] === '#') return String.fromCodePoint(parseInt(entity.slice(entity[1].toLowerCase() === 'x' ? 2 : 1), entity[1].toLowerCase() === 'x' ? 16 : 10));
  return { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' }[entity.toLowerCase()];
});

// Deliberately limited to literal, generated HTML. Runtime-created URLs need browser QA.
export function parseHtml(html) {
  // Astro serializes island slots in inert templates as well as visible SSR
  // HTML. Template content is not part of the document tree until instantiated.
  const stripped = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<template\b[^>]*>[\s\S]*?<\/template\s*>/gi, '').replace(/<(script|style)\b([^>]*)>[\s\S]*?<\/\1\s*>/gi, '<$1$2></$1>');
  const nodes = [], stack = [];
  for (const match of stripped.matchAll(/<(\/?)([a-z][\w:-]*)\b((?:"[^"]*"|'[^']*'|[^'">])*)>/gi)) {
    const [, closing, rawName, body] = match;
    const name = rawName.toLowerCase();
    if (closing) {
      const index = stack.findLastIndex(node => node.name === name);
      if (index >= 0) stack.length = index;
      continue;
    }
    const attrs = {};
    for (const attr of body.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
      attrs[attr[1].toLowerCase()] = decode(attr[2] ?? attr[3] ?? attr[4] ?? '');
    }
    const node = { name, attrs, parent: stack.at(-1) };
    nodes.push(node);
    if (!voidTags.has(name) && !/\/\s*$/.test(body)) stack.push(node);
  }
  return nodes;
}

function inside(node, parent) {
  for (let current = node.parent; current; current = current.parent) if (current === parent) return true;
  return false;
}

export function localUrl(value, from) {
  value = value.trim();
  if (!value || /^(?:[a-z][\w+.-]*:|\/\/)/i.test(value)) return null;
  const url = new URL(value, `https://static.test/${from}`);
  const pathname = decodeURIComponent(url.pathname);
  return { path: pathname.slice(1), fragment: decodeURIComponent(url.hash.slice(1)) };
}

export async function checkAstro() {
  const dist = join(root, 'dist');
  let published;
  try { published = await listFiles(dist); }
  catch (error) {
    if (error.code === 'ENOENT') throw new Error('No dist/ build. Finish src/pages/index.astro, then run npm run build before npm run check.');
    throw error;
  }
  const paths = new Set(published);
  assert(paths.has('index.html'), 'Missing Astro dist/index.html');
  assert(paths.has('.nojekyll'), 'Missing dist/.nojekyll for GitHub Pages');
  const copied = await collectPublicFiles();
  const allowed = new Set([...copied, 'index.html', '.nojekyll']);
  for (const file of published) {
    assert(allowed.has(file) || /^_astro\/[\w./-]+\.(css|js|woff2?|ttf|otf|png|jpe?g|gif|webp|avif|svg|ico)$/.test(file), `Unlisted/private file published: ${file}`);
  }
  for (const file of copied) {
    assert(paths.has(file), `Missing preserved public file: ${file}`);
    assert((await readFile(join(dist, file))).equals(await readFile(join(root, file))), `Public file differs from its source: ${file}`);
  }
  assert(!(await readFile(join(dist, 'index.html'))).equals(await readFile(join(root, 'index.html'))), 'Legacy root index.html was published instead of Astro');

  const documents = new Map();
  for (const file of published.filter(file => file.endsWith('.html'))) {
    const html = await readFile(join(dist, file), 'utf8');
    const nodes = parseHtml(html);
    const ids = nodes.filter(node => 'id' in node.attrs).map(node => node.attrs.id);
    assert.equal(new Set(ids).size, ids.length, `Duplicate IDs in ${file}`);
    documents.set(file, { html, nodes, ids: new Set(ids) });
  }
  let checkedLinks = 0;
  function verifyUrl(value, from, requireLocal = false) {
    const target = localUrl(value, from);
    if (!target) { assert(!requireLocal, `${from}: expected a local resource: ${value}`); return null; }
    const file = [target.path, `${target.path.replace(/\/$/, '')}/index.html`, `${target.path}index.html`].find(candidate => paths.has(candidate));
    assert(file, `${from}: missing local resource ${value}`);
    if (target.fragment && documents.has(file)) assert(documents.get(file).ids.has(target.fragment), `${from}: missing anchor ${value}`);
    checkedLinks++;
    return file;
  }
  function verifyCss(css, from) {
    for (const match of css.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]+))\s*\)/gi)) {
      const url = match[1] ?? match[2] ?? match[3];
      // An SVG filter fragment belongs to the embedding document, not a CSS file.
      if (!url.startsWith('#')) verifyUrl(url, from);
    }
    for (const match of css.matchAll(/@import\s+["']([^"']+)["']/gi)) verifyUrl(match[1], from);
  }
  for (const [file, document] of documents) {
    for (const node of document.nodes) {
      for (const attribute of ['href', 'src', 'poster', 'data-gif-src', 'data-src']) {
        if (node.attrs[attribute]) verifyUrl(node.attrs[attribute], file);
      }
      if (node.attrs.srcset && !node.attrs.srcset.includes('data:')) {
        for (const candidate of node.attrs.srcset.split(',')) verifyUrl(candidate.trim().split(/\s+/)[0], file);
      }
      if (node.attrs.style) verifyCss(node.attrs.style, file);
    }
    for (const match of document.html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) verifyCss(match[1], file);
  }
  for (const file of published.filter(file => file.endsWith('.css'))) verifyCss(await readFile(join(dist, file), 'utf8'), file);

  const home = documents.get('index.html');
  assert(home.nodes.some(node => node.name === 'main'), 'Landing needs a main landmark');
  assert.equal(home.nodes.filter(node => node.name === 'h1').length, 1, 'Landing needs one H1');
  for (const section of sections) assert(home.ids.has(section), `Missing landing section #${section}`);
  // The follow-up replaces full-screen recordings with authored, localized DOM
  // animations. Legacy files remain publishable, but are not used by the page.
  const stories = home.nodes.filter(node => node.attrs['data-story']);
  assert.deepEqual(stories.map(node=>node.attrs['data-story']), ['strategy','team','evolution','vault','markets','integrations']);
  assert.equal(home.nodes.filter(node=>node.name==='video').length,0,'The new homepage must not play screen recordings');
  for (const story of stories) {
    const descendants=home.nodes.filter(node=>inside(node,story));
    assert.equal(descendants.filter(node=>'data-story-chapter' in node.attrs).length,3,'Each scene needs three seekable chapters');
    assert(descendants.some(node=>node.attrs.class?.includes('story-toggle')&&node.attrs['aria-label']),'Each scene needs labeled playback controls');
  }
  const hero=home.nodes.find(node=>node.attrs.id==='top');
  assert(!home.nodes.some(node=>'data-results' in node.attrs&&inside(node,hero)),'No upper-right result card in the hero');
  assert(home.nodes.some(node=>node.attrs.id==='workspace'&&inside(node,hero)),'Workspace belongs in the hero composition');
  const native=home.nodes.filter(node=>'data-native-component' in node.attrs);
  assert.equal(native.length,2,'Keep two actual component excerpts');
  for(const node of native)assert('inert' in node.attrs,'Pre-rendered component actions must not pretend to be live');
  const navigation = home.nodes.find(node => node.name === 'nav' && node.attrs.id === 'navigation');
  assert(!home.nodes.some(node => node.name === 'a' && node.attrs.href === '#vault' && inside(node, navigation)), 'Security is not a navigation entry');

  const frame = home.nodes.find(node => node.name === 'iframe' && node.attrs.id === 'agent-frame');
  assert(frame, 'Missing native #agent-frame demo');
  assert.equal(verifyUrl(frame.attrs.src || '', 'index.html', true), 'demo/index.html');
  const demo = documents.get('demo/index.html');
  const csp = demo.nodes.find(node => node.name === 'meta' && node.attrs['http-equiv']?.toLowerCase() === 'content-security-policy');
  assert(/(?:^|;)\s*connect-src\s+'none'\s*(?:;|$)/.test(csp?.attrs.content || ''), 'Demo must retain its deny-network CSP');
  const manifest = JSON.parse(await readFile(join(dist, 'demo/source-manifest.json'), 'utf8'));
  assert(Object.keys(manifest.sourceFiles || {}).length > 100, 'Demo must preserve its source-backed bundled artifact');
  for (const component of ['components/AppShell.tsx', 'components/home/CommandHome.tsx', 'components/chat/ChatView.tsx', 'components/chat/ChatInput.tsx', 'components/shell/CodexSidebar.tsx']) {
    assert(manifest.sourceFiles[component], `Demo provenance missing ${component}`);
  }
  console.log(`PASS: Astro static build; ${published.length} files, ${checkedLinks} local references, six authored scenes, two native excerpts, centered hero and isolated workspace.`);
}

function selfTest() {
  const nodes = parseHtml('<main><figure class="product-film"><video controls poster="a > b.png"><source src=film.mp4></video><a href="film.gif?a=1&amp;b=2">GIF</a></figure><script>"<img src=missing>"</script></main>');
  assert.equal(nodes.length, 6);
  assert('controls' in nodes.find(node => node.name === 'video').attrs);
  assert.equal(nodes.find(node => node.name === 'a').attrs.href, 'film.gif?a=1&b=2');
  assert(inside(nodes.find(node => node.name === 'source'), nodes.find(node => node.name === 'figure')));
  assert.deepEqual(localUrl('demo/index.html?lang=zh', 'index.html'), { path: 'demo/index.html', fragment: '' });
  assert.deepEqual(localUrl('../docs.html#start', 'demo/index.html'), { path: 'docs.html', fragment: 'start' });
  assert.deepEqual(localUrl('/assets/film.mp4', 'index.html'), { path: 'assets/film.mp4', fragment: '' });
  assert.equal(localUrl('https://example.com/download', 'index.html'), null);
  console.log('PASS: static checker parser, film ancestry, entities and root-hosted local URLs.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--self-test')) selfTest();
  else await checkAstro();
}
