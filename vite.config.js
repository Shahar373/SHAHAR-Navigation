import { defineConfig } from 'vite';

// base: './' keeps the build host-agnostic (works on any static host / sub-path)
// and is required for it to load correctly inside the Capacitor Android webview (M3).
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.js'],
  },
});
