// Offline integration checks. Browser timing, geometry and hit targets are
// covered separately by qa-scroll-effects.mjs, not inferred from source text.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import { parseHtml } from './check-astro.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=file=>readFile(path.join(root,file),'utf8');
const require=createRequire(path.join(root,'package.json'));
const pkg=JSON.parse(await read('package.json'));
for(const name of ['react','react-dom','framer-motion','lucide-react'])assert(pkg.dependencies[name],`Missing dependency ${name}`);
for(const name of ['vite','@vitejs/plugin-react','@tailwindcss/vite','tailwindcss','typescript'])assert(pkg.devDependencies[name]);
assert(!pkg.devDependencies.astro&&!pkg.devDependencies['@astrojs/react'],'No Astro runtime/build dependency');
const config=JSON.parse(await read('components.json'));
assert.equal(config.aliases.ui,'@/components/ui');assert.equal(config.tailwind.css,'src/styles/tailwind.css');assert.equal(config.rsc,false);
const component=await read('components/ui/container-scroll-animation.tsx');
assert(component.includes('useScroll')&&component.includes('useTransform')&&component.includes('useReducedMotion'));
assert(!component.includes('pt-[1000px]'));
assert(component.includes('const cardTranslate = useTransform(progress, [0, .28, 1], [-240, 0, 0])'),'Mock should begin behind the slogan without placing its own copy on top of the hero description');
assert(component.includes("const blur = useTransform(progress, [0, .32, 1], ['blur(3px)', 'blur(0px)', 'blur(0px)'])"),'Mock should sharpen as it stands upright');
const index=await read('src/App.tsx');assert(index.includes('<ContainerScroll titleComponent='));assert(!index.includes('data-start'));
assert(!index.includes('id="effects-toggle"'),'Remove the top-right AI/effects icon');
const workspace=await read('src/components/AgentWorkspace.tsx');assert(!workspace.includes('workspace-reveal.ts'),'Only one controller may own the scroll transform');
assert(workspace.includes('allow-scripts allow-same-origin allow-downloads'));
const nodes=parseHtml(await read('dist/index.html'));
const links=nodes.filter(n=>'data-get-started' in n.attrs);
assert.equal(links.length,3,'Header, hero and footer CTA all link to GitHub');
for(const link of links){assert.equal(link.name,'a');assert.equal(link.attrs.href,'https://github.com/NeryaAI/Nerya');assert(link.attrs.rel.includes('noopener'));}
assert(!nodes.some(n=>n.attrs.id==='start-dialog'));
assert.equal(nodes.filter(n=>'data-container-scroll' in n.attrs).length,1);
assert.equal(nodes.filter(n=>n.attrs.id==='agent-frame').length,1);
const effects=await read('src/scripts/effects.ts');
assert((await read('icons.js')).includes('[data-no-icons],#react-root'),'Legacy glyph upgrades must not mutate React roots');
assert((await read('landing-theme.js')).includes("!button.hasAttribute('data-react-theme')"),'Theme bootstrap must not rewrite React buttons');
assert(!/scrollTo\(|scrollIntoView\(|setInterval\(/.test(effects));
assert(effects.includes('document.hidden')&&effects.includes('IntersectionObserver')&&effects.includes('cancelAnimationFrame'));
const css=await read('src/styles/effects.css');assert(css.includes('prefers-reduced-motion'));assert(css.includes('body.workspace-expanded .container-scroll-perspective'));
assert(css.includes('.hero .workspace-shell{padding:0;border:1px solid var(--line);background:var(--surface)'),'Mock frame should not have a thick dark bezel');
assert(css.includes('.container-scroll-card{position:relative;width:min(1140px,calc(100% - 104px));margin:16px auto 0'),'Mock should sit below the slogan in normal flow');
assert(css.includes('.hero-copy:before{content:none}'),'Remove the white radial glow behind the slogan');

// Actually server-render the public component API and prove that its children
// and headline survive without a browser. Do not execute any Agent surface.
const entry=`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {ContainerScroll} from './components/ui/container-scroll-animation';export const html=renderToStaticMarkup(React.createElement(ContainerScroll,{titleComponent:React.createElement('h1',null,'Motion integration')},React.createElement('div',{'data-test-child':true},'Preserved child')));`;
const compiled=await build({stdin:{contents:entry,resolveDir:root,loader:'tsx'},bundle:true,platform:'node',packages:'external',format:'cjs',write:false,tsconfig:path.join(root,'tsconfig.json'),logLevel:'silent'});
await mkdir(path.join(root,'.tmp'),{recursive:true});const temp=path.join(root,'.tmp/check-scroll-ssr.cjs');await writeFile(temp,compiled.outputFiles[0].text);
const rendered=require(temp).html;assert(rendered.includes('Motion integration'));assert(rendered.includes('Preserved child'));assert(rendered.includes('data-scroll-card'));
console.log('PASS: React ContainerScroll SSR/props, shadcn aliases, Tailwind setup, single transform owner, three GitHub CTAs, reduced-motion and pause boundaries.');
