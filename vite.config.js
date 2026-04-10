import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [],
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

