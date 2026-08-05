import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

// AccessAtlas — каталог агентств аудита цифровой доступности.
// Static-first: Vite + vite-react-ssg, данные из data/a11y/*.json.
//   dev:   npm run dev
//   build: npm run build  (→ dist/)
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@data': fileURLToPath(new URL('./data', import.meta.url)),
    },
  },
  plugins: [react(), tailwindcss()],
  ssgOptions: {
    dirStyle: 'nested',
    formatting: 'minify',
  },
})
