import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './routes'
// CN-BRANDBOOK-V2 (D-072 пересмотрен): Geist Variable — гарнитура нового
// макета владельца (Stitch, 2026-08-08), self-hosted @fontsource, без CDN
// (D-072 §CDN-шрифты запрещены). Заменяет Inter Variable — Inter больше нигде
// в проекте не используется, зависимость удалена из package.json.
import '@fontsource-variable/geist'
// JetBrains Mono — вторая гарнитура brand book (UI-лейблы label-md/label-sm, код).
// Variable woff2, self-hosted тем же способом, что Geist (без CDN, CSP чистый);
// в UI используется только weight 500 (label-md/label-sm) и 400 (код) — один файл на все.
import '@fontsource-variable/jetbrains-mono'
import './styles.css'

// D-153: авто-восстановление от протухших чанков после деплоя. Новый билд
// перехэшировывает чанки; у вкладки, открытой ДО деплоя, ленивый import()
// старого чанка даёт 404 → Vite шлёт событие `vite:preloadError`, а React
// Router показывает «Importing a module script failed» (владелец поймал живьём
// после серии деплоев). Один полный reload тянет свежий HTML + актуальные чанки
// и чинит навсегда. Защита от петли перезагрузок (реальный сбой сети/CDN, а не
// протухший чанк) — короткий TTL в sessionStorage: не чаще одного reload в 10с;
// если sessionStorage недоступен (приватный режим) — молча не перезагружаем,
// пользователь видит прежнее поведение (ручной refresh), но петли нет.
const setupClient = (): void => {
  if (typeof window === 'undefined') return
  window.addEventListener('vite:preloadError', () => {
    try {
      const KEY = 'vrs:preload-reload-at'
      const last = Number(window.sessionStorage.getItem(KEY) || 0)
      if (Date.now() - last > 10_000) {
        window.sessionStorage.setItem(KEY, String(Date.now()))
        window.location.reload()
      }
    } catch {
      /* sessionStorage недоступен — не перезагружаем, чтобы не словить петлю */
    }
  })
}

export const createRoot = ViteReactSSG({ routes, basename: '/' }, setupClient)
