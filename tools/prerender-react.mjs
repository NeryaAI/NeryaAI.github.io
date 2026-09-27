// Build-time React rendering keeps the complete website readable and indexable
// without JavaScript. Vite owns assets; React owns every authored page.
import {build} from 'esbuild';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(path.join(root,'package.json'));
await mkdir(path.join(root,'.tmp'),{recursive:true});
const result=await build({stdin:{contents:`import React from 'react';import {renderToString} from 'react-dom/server';import App from './src/App';import Manual from './src/Manual';export const home=renderToString(React.createElement(App));export const docs=renderToString(React.createElement(Manual));`,loader:'tsx',resolveDir:root},bundle:true,platform:'node',format:'cjs',packages:'external',loader:{'.css':'empty'},write:false,tsconfig:path.join(root,'tsconfig.json'),define:{'process.env.NODE_ENV':'"production"'},logLevel:'silent'});
const file=path.join(root,'.tmp/prerender-react.cjs');await writeFile(file,result.outputFiles[0].text);
const html=require(file);
for(const page of ['index.html','docs.html','skills.html','recipes.html']){
  const target=path.join(root,'dist',page);const template=await readFile(target,'utf8');
  if(!template.includes('<div id="react-root"></div>'))throw new Error(`Missing React root marker: ${page}`);
  await writeFile(target,template.replace('<div id="react-root"></div>',`<div id="react-root">${page==='index.html'?html.home:html.docs}</div>`));
}
console.log('Prerendered four React entry pages; homepage and 18-section manual are readable without JavaScript.');
