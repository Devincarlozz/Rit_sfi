import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  // This config file helps Cloudflare Wrangler identify the project structure
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './index.html',
        mock: './mock.html',
        helpdesk: './helpdesk.html',
        pages: './pages.html',
        keamportal: './keamportal.html'
      }
    }
  },
  server: {
    port: 3000,
    host: true,
  }
});
