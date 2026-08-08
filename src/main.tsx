import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './routes'
import '@fontsource-variable/inter'
// D-072: JetBrains Mono — вторая гарнитура brand book (UI-лейблы label-md, код).
// Variable woff2, self-hosted тем же способом, что Inter (без CDN, CSP чистый);
// в UI используется только weight 500 (label-md) и 400 (код) — один файл на все.
import '@fontsource-variable/jetbrains-mono'
import './styles.css'

export const createRoot = ViteReactSSG({ routes, basename: '/' })
