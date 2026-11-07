import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
const prefix=process.env.NEXT_PUBLIC_BASE_PATH??'/gakuran-cn';
export default defineConfig({root:path.resolve('static'),publicDir:path.resolve('public'),base:prefix+'/',define:{'process.env.NEXT_PUBLIC_BASE_PATH':JSON.stringify(prefix)},plugins:[react()],build:{outDir:path.resolve('dist/client'),emptyOutDir:true}});
