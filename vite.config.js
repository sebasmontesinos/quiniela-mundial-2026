import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      devOptions: {
        enabled: false,
      },
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Quiniela Mundial 2026',
        short_name: 'Mundial 2026',
        description: 'Quiniela de la oficina para el Mundial FIFA 2026',
        theme_color: '#F5A623',
        background_color: '#0A0E1A',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com/,
            handler: 'NetworkFirst',
            options: { cacheName: 'firestore-cache' },
          },
          {
            urlPattern: /^https:\/\/crests\.football-data\.org/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'crests-cache',
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: 'localhost',
    port: 5173,
  },
})
