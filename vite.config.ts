import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'

// Офлайн — только для страниц «документы» (BUILD-SPEC: vite-plugin-pwa,
// офлайн только для страницы «документы»). Precache: js/css плюс три
// языковые версии этой страницы. Остальные страницы в офлайн не попадают.
const DOCS_PAGES = [
  'en/what-papers-mean/index.html',
  'es/que-significan-los-papeles/index.html',
  'ru/chto-znachat-bumagi/index.html',
]

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@content': fileURLToPath(new URL('./content', import.meta.url)),
      '@data': fileURLToPath(new URL('./data', import.meta.url)),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['assets/**/*.{js,css}', ...DOCS_PAGES],
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'font-css' },
          },
        ],
      },
      manifest: {
        name: 'DETNAV',
        short_name: 'DETNAV',
        start_url: '/',
        display: 'browser',
        background_color: '#14171A',
        theme_color: '#14171A',
        icons: [],
      },
    }),
  ],
  ssgOptions: {
    dirStyle: 'nested',
    formatting: 'minify',
  },
})
