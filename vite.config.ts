import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

function cloudflareSpaPlugin() {
  return {
    name: 'cloudflare-spa',
    closeBundle() {
      const dist = path.resolve(import.meta.dirname, 'dist');
      const indexHtml = path.join(dist, 'index.html');
      if (fs.existsSync(indexHtml)) {
        fs.copyFileSync(indexHtml, path.join(dist, '200.html'));
        fs.copyFileSync(indexHtml, path.join(dist, '404.html'));
      }
    },
  };
}

export default defineConfig(() => {
  return {
    base: '/',
    plugins: [react(), tailwindcss(), cloudflareSpaPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
