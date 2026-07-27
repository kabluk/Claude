import type { UIStrings } from '@/lib/types'

const ui: UIStrings = {
  back: '← Atrás',
  listen: 'Escuchar esta página',
  stop: 'Detener',
  noSpeech: 'Este navegador no puede leer en voz alta',
  allPages: 'Todas las páginas',
  disclaimer:
    'No somos abogados y no damos asesoría legal. Aquí solo hay hechos y enlaces a fuentes oficiales.',
  updated: 'Información actualizada el 27 de julio de 2026. Las reglas cambian — mire la fecha.',
  nav: {
    where: 'Cómo encontrarlo',
    anum: 'Dónde está el número A',
    documents: 'Qué significan estos papeles',
    firstcall: 'La primera llamada',
    verify: 'Verificar a quién le paga',
    connect: 'Llamadas, dinero, cartas',
    journey: 'El camino',
    attorney: 'Abogado',
    sponsor: 'Obligado de fianza',
    bondpay: 'Pagar la fianza',
    deadlines: 'No faltar a la audiencia',
    intake: 'Su lista de tareas',
    'facility-adelanto': 'Adelanto',
    'state-ca': 'California',
    about: 'Acerca de',
    data: 'Sus datos',
    disclaimer: 'No somos abogados',
  },
  iceGate: {
    title: 'Va a abrir el sitio de ICE',
    body: [
      'Según su propio aviso de privacidad, registra la dirección IP y el dominio de cada visitante.',
      'Nosotros no le enviamos ningún dato sobre usted.',
    ],
    open: 'Abrir',
    ask: 'Pedir a otra persona que lo haga',
    askHint: 'Comparta esta dirección con alguien que pueda hacer la búsqueda:',
  },
  nameVariants: {
    label: 'Variantes de escritura del nombre — todo queda en este navegador',
    placeholder: 'Nombre y apellido tal como los conoce',
    hint: 'El nombre debe coincidir letra por letra. Marque con las casillas las variantes ya probadas.',
    // min-ok: подпись инструмента, данные не покидают браузер
  },
  aNumber: {
    label: 'Verificar el formato del número A',
    placeholder: 'Solo dígitos, 8 o 9',
    copy: 'Copiar',
    copied: 'Copiado',
    hint: 'Ocho dígitos también está bien: se agrega un cero al inicio. El número está en la pulsera — se puede pedir que lo lean en voz alta.',
  },
  dirEmpty: 'Aún no hay datos. No publicamos teléfonos ni direcciones sin verificar.',
}

export default ui
