import { defineConfig } from 'vite';
import { resolve } from 'path';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [cloudflare()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main:       resolve(__dirname, 'index.html'),
        mock:       resolve(__dirname, 'mock.html'),
        helpdesk:   resolve(__dirname, 'helpdesk.html'),
        pages:      resolve(__dirname, 'pages.html'),
        keamportal: resolve(__dirname, 'keamportal.html'),
      }
    }
  },
  server: {
    port: 3000,
    host: true,
  }
});