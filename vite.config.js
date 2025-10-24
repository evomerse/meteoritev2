import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'public/index.html'),
        carte: resolve(__dirname, 'public/carte.html'),
        main: resolve(__dirname, 'public/main.html'),
        login: resolve(__dirname, 'public/login-page.html'),
        register: resolve(__dirname, 'public/register-page.html'),
        alerts: resolve(__dirname, 'public/alerts-page.html'),
        favorites: resolve(__dirname, 'public/favorites-page.html'),
        settings: resolve(__dirname, 'public/settings-page.html')
      }
    }
  },
  server: {
    open: '/public/index.html',
    port: 3000
  }
});
