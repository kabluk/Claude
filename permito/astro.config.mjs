import { defineConfig } from 'astro/config';

// Статический pSEO-каталог. Канонический домен подставляется при деплое
// через SITE_URL; для локальной сборки достаточен плейсхолдер.
export default defineConfig({
  site: process.env.SITE_URL || 'https://permito.example.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
