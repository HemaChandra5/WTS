import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // In dev (npm run dev)  → base is '/'  so localhost:5173/ works directly
  // In build (npm run build) → base is '/FTS/' for GitHub Pages
  base: command === 'build' ? '/FTS/' : '/',
  build: {
    outDir: 'docs',
  },
  server: {
    port: 5173,
  },
}));