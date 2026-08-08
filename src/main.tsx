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

export const createRoot = ViteReactSSG({ routes, basename: '/' })
