import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Deploy target is GitHub Pages project site: https://shahar373.github.io/SHAHAR-Navigation/
// so the production build is served from the '/SHAHAR-Navigation/' sub-path. Dev stays at '/'.
// The Capacitor APK build (M3) sets CAP_BUILD=1 to serve assets relatively from the webview root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? (process.env.CAP_BUILD ? './' : '/SHAHAR-Navigation/') : '/',
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon-180.png'],
      manifest: {
        name: 'ניווט ימי · הרצליה · משיט 30',
        short_name: 'ניווט ימי',
        description:
          'מתכנן מסלולים ימי למשיט 30 מהרצליה — רוח, גלים, זרמים, דלק ובטיחות. עזר תכנון בלבד.',
        lang: 'he',
        dir: 'rtl',
        theme_color: '#07151e',
        background_color: '#07151e',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        scope: './',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // precache the whole app shell (code, styles, fonts, icons) → app works offline
        globPatterns: ['**/*.{js,css,html,svg,woff,woff2,png}'],
        navigateFallback: 'index.html',
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            // raster map tiles — cache what you've actually viewed for offline use
            urlPattern: ({ url }) =>
              /(^|\.)tile\.openstreetmap\.org$|tile\.opentopomap\.org$|server\.arcgisonline\.com$|tiles\.openseamap\.org$/.test(
                url.hostname
              ),
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              // raised for M1b "download this area" (a coastal region spans many tiles)
              expiration: { maxEntries: 12000, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Open-Meteo forecast + marine — network first, fall back to last cached response
            urlPattern: ({ url }) => /(^|\.)open-meteo\.com$/.test(url.hostname),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'forecast',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.js'],
  },
}));
