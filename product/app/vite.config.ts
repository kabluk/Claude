import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Detention Navigator',
        short_name: 'Navigator',
        description: 'Информационный инструмент для семей в кризисе задержания. Не юридическая фирма.',
        theme_color: '#1F3550',
        background_color: '#FBF7F2',
        display: 'standalone',
        icons: []
      },
      workbox: { navigateFallback: 'index.html' }
    })
  ],
  base: './'
})
