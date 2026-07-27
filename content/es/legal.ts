import type { PageContent } from '@/lib/types'

export const about: PageContent = {
  title: 'Acerca de',
  lede: 'DETNAV es un mapa para las familias de personas detenidas por las autoridades de inmigración de EE. UU., y para quienes se preparan con tiempo.',
  blocks: [
    {
      kind: 'p',
      text: 'El principio es un mapa, no un navegador. Mostramos los caminos que existen y explicamos la mecánica de cada uno. Nunca decimos «vaya por aquí»: elegir el camino le corresponde a la persona y a su abogado.',
    },
    { kind: 'h2', text: 'Lo que no hacemos' },
    {
      kind: 'list',
      items: [
        'No damos asesoría legal y no evaluamos situaciones',
        // upl-ok: отрицание — мы говорим, что НЕ советуем адвокатов
        'No recomendamos abogados concretos — mostramos los registros oficiales',
        'No redactamos documentos legales — explicamos y señalamos el formulario oficial',
      ],
    },
    { kind: 'h2', text: 'Tres idiomas' },
    {
      kind: 'p',
      text: 'El inglés, el español y el ruso son iguales desde la primera pantalla. Cada página existe en los tres idiomas.',
    },
    { kind: 'ilink', page: 'data', label: 'Sus datos' },
    { kind: 'ilink', page: 'disclaimer', label: 'No somos abogados' },
  ],
}

export const data: PageContent = {
  title: 'Sus datos',
  lede: 'Una página corta, porque no hay nada que guardar.',
  blocks: [
    {
      kind: 'callout',
      tone: 'g',
      title: 'No guardamos nada sobre usted',
      body: [
        'Las respuestas del cuestionario, las fotos de documentos y su lista de tareas se quedan en su teléfono. No se envían a nuestro servidor — ni una palabra, ni un archivo.',
        'Por eso no tenemos nada que perder, nada que vender y nada que entregar si nos lo piden.',
      ],
    },
    { kind: 'h2', text: 'Cómo funciona' },
    {
      kind: 'list',
      items: [
        'No hay cuentas ni registro',
        'No hay analítica — ni contadores, ni píxeles, ni scripts de terceros',
        'El cuestionario funciona por completo en el navegador: cierre la pestaña — no queda nada',
        'Las únicas solicitudes externas son las fuentes tipográficas',
        'Seguir enlaces externos no les dice a esos sitios de dónde viene usted',
      ],
    },
    {
      kind: 'p',
      dim: true,
      text: 'El sitio de ICE, según su propio aviso, registra las direcciones IP de los visitantes — antes de ir allá lo advertimos con una pantalla aparte.',
    },
  ],
}

export const disclaimer: PageContent = {
  title: 'No somos abogados',
  blocks: [
    {
      kind: 'p',
      text: 'No somos abogados y no damos asesoría legal. Todo en este sitio es información de referencia: hechos, la mecánica de los procesos y enlaces a fuentes oficiales.',
    },
    {
      kind: 'list',
      items: [
        'No evaluamos su situación y no predecimos resultados',
        'Las listas de tareas organizan asuntos cotidianos y la recolección de documentos — no son una posición legal',
        'Los ejemplos de texto son correspondencia cotidiana; no redactamos documentos legales',
        'Las reglas cambian — las páginas llevan la fecha de la última revisión',
      ],
    },
    {
      kind: 'p',
      dim: true,
      text: 'Las preguntas sobre su caso son para un abogado o un representante acreditado del Departamento de Justicia. Cómo verificarlos está en la página de verificación.',
    },
    { kind: 'ilink', page: 'verify', label: 'Verificar a quién le paga' },
  ],
}
