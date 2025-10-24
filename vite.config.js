import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './main.html',
        login: './login-page.html',
        register: './register-page.html',
        alerts: './alerts-page.html',
        favorites: './favorites-page.html',
        settings: './settings-page.html'
      }
    }
  },
  server: {
    open: '/login-page.html',
    port: 3000
  }
});
