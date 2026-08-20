// Резолвер vite-алиаса «@/ → src/» для запуска контент-файлов нодой
// (используется генератором плейбука через module.register).
export async function resolve(specifier, context, next) {
  if (specifier.startsWith('@/')) {
    const url = new URL('../src/' + specifier.slice(2) + '.ts', import.meta.url)
    return next(url.href, context)
  }
  return next(specifier, context)
}
