import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './routes'
import '@fontsource-variable/inter'
import './styles.css'

export const createRoot = ViteReactSSG({ routes, basename: '/' })
