import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        carte: resolve(__dirname, 'carte.html'),
        main: resolve(__dirname, 'main.html'),
        login: resolve(__dirname, 'login-page.html'),
        register: resolve(__dirname, 'register-page.html'),
        alerts: resolve(__dirname, 'alerts-page.html'),
        favorites: resolve(__dirname, 'favorites-page.html'),
        settings: resolve(__dirname, 'settings-page.html')
      }
    }
  },
  server: {
    open: '/index.html',
    port: 3000
  }
});
