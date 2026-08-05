import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

// Отдельный сайт каталога доступности (второй продукт в репо).
// Делит node_modules с detnav, но собирается своим конфигом:
//   dev:   npm run dev:a11y-site
//   build: npm run build:a11y-site  (→ a11y-site/dist)
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  resolve: {
    alias: {
      '@dir': fileURLToPath(new URL('./src', import.meta.url)),
      '@data': fileURLToPath(new URL('../data', import.meta.url)),
    },
  },
  plugins: [react(), tailwindcss()],
  ssgOptions: {
    dirStyle: 'nested',
    formatting: 'minify',
  },
})
