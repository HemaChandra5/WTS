import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/FMS/' : '/',
  build: {
    outDir: 'docs',
  },
  server: {
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 10000,
    allowedHosts: ['fms-1-2614.onrender.com'],
  },
}));