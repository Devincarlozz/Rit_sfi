import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  // This config file helps Cloudflare Wrangler identify the project structure
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    host: true,
  }
});
