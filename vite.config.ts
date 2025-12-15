import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    proxy: {
      // Proxy setup to bypass CORS during local development
      '/omi-proxy': {
        target: 'https://api.omi.me',
        changeOrigin: true,
        secure: false, // IMPORTANT: Must be false for many APIs when proxying from localhost
        rewrite: (path) => path.replace(/^\/omi-proxy/, '')
      }
    }
  }
});