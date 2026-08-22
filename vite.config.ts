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
  build: {
    // G-CHECKER-TTS-NEURAL: kokoro-js подключается ТОЛЬКО динамическим
    // import() по явному клику «Load neural voice» — весь смысл в том, что
    // страница не платит ни байта за нейроголос до согласия посетителя.
    // Но Vite/SSG по умолчанию вставляет <link rel="modulepreload"> и на
    // чанки динамических импортов, достижимых со страницы, — и браузер
    // начинал тянуть 2.2MB (905KB gzip) библиотеки ПРИ ОТКРЫТИИ страницы,
    // до всякого клика. Поймано проверкой собранного HTML (grep по dist/),
    // не предположением. Фильтр ниже убирает из предзагрузки только
    // kokoro-чанк; остальные preload'ы (роуты, вендоры) не трогаем.
    modulePreload: {
      resolveDependencies: (_url, deps) => deps.filter((d) => !d.includes('kokoro')),
    },
  },
  ssgOptions: {
    dirStyle: 'nested',
    formatting: 'minify',
  },
})
