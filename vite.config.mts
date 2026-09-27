import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {fileURLToPath,URL} from 'node:url';
export default defineConfig({
  plugins:[react(),tailwindcss()],
  resolve:{alias:{'@':fileURLToPath(new URL('./',import.meta.url))}},
  server:{host:'127.0.0.1',port:4173,strictPort:true},
  preview:{host:'127.0.0.1',port:4173,strictPort:true},
  build:{outDir:'dist',assetsDir:'_app',rollupOptions:{input:{
    home:fileURLToPath(new URL('./index.html',import.meta.url)),
    docs:fileURLToPath(new URL('./docs.html',import.meta.url)),
    skills:fileURLToPath(new URL('./skills.html',import.meta.url)),
    recipes:fileURLToPath(new URL('./recipes.html',import.meta.url)),
  }}},
});
