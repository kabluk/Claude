import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'La primera llamada',
  blocks: [
    {
      kind: 'callout',
      tone: 'r',
      title: 'La llamada se graba',
      body: [
        'Las llamadas desde el centro se graban y se escuchan. La excepción son las líneas registradas de abogados.',
      ],
    },
    { kind: 'h2', text: 'Antes de la llamada' },
    {
      kind: 'callout',
      tone: 'y',
      title: 'Quite el bloqueo de números desconocidos',
      body: [
        'Él llama y el teléfono rechaza la llamada en silencio — la falla más dolorosa de todas. La llamada llegará de un número desconocido.',
        'iPhone: Configuración → Teléfono → apagar «Silenciar desconocidos».',
        'Android: aplicación Teléfono → configuración → números bloqueados.',
        'Revise también el filtro de spam de su operador.',
      ],
    },
    { kind: 'h2', text: 'Qué preguntar — se puede leer en voz alta' },
    {
      kind: 'list',
      items: [
        'Dime el número A completo, dígito por dígito',
        'Cómo se llama exactamente el centro y en qué ciudad está',
        '¿Firmaste algo? ¿Qué exactamente?',
        '¿Necesitas medicamentos?',
        'Cómo se pone dinero para las llamadas',
      ],
    },
    {
      kind: 'callout',
      tone: 'y',
      title: 'Lo que no debe tocarse en esta línea',
      body: [
        'Deportaciones y órdenes anteriores. Arrestos y antecedentes. Detalles del caso y planes de defensa.',
        'La grabación puede ser usada. Eso se habla con un abogado.',
      ],
    },
    { kind: 'h2', text: 'La tarjeta que se aprende de memoria' },
    {
      kind: 'memcard',
      title: 'APRENDER DE MEMORIA',
      lines: ['9233#'],
      alts: [
        'Marcar 9233# es gratis desde adentro del centro — funciona cuando la cuenta está en cero.',
        'Después, en orden: el número de una persona de confianza · el número de un abogado u organización · 1-888-351-4024.',
        'El teléfono es lo primero que quitan. Sin un número aprendido no hay a quién llamar.',
      ],
    },
    { kind: 'h2', text: 'Antes de llamar' },
    {
      kind: 'p',
      dim: true,
      text: 'Tenga papel y lápiz al lado. Habrá poco tiempo y quizá no pueda repetir la pregunta.',
    },
    { kind: 'ilink', page: 'connect', label: 'Llamadas, dinero, cartas' },
  ],
}

export default c
