import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'La primera llamada',
  metaTitle: 'La primera llamada desde un centro de ICE: qué preguntar y qué no decir · DETNAV',
  metaDesc:
    'Las llamadas desde la detención se graban. Un plan corto: qué averiguar — el centro, el número A, la salud —, qué no hablar por una línea grabada y cómo prepararse para la siguiente llamada.',
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
    { kind: 'h2', text: 'La tarjeta que se aprende de memoria y se lleva en papel' },
    {
      kind: 'memcard',
      title: 'APRENDER Y COPIAR EN PAPEL',
      lines: ['9233#'],
      alts: [
        'Marcar 9233# es gratis desde adentro del centro — conecta con la línea de ayuda sin fines de lucro. Funciona cuando la cuenta está en cero.',
        'Después, en orden: el número de una persona de confianza · el número de un abogado u organización · 1-888-351-4024 (DRIL, la línea oficial de ICE).',
        'El teléfono es lo primero que quitan. Un papel en la billetera o el bolsillo es lo único que queda con la persona.',
      ],
    },
    {
      kind: 'list',
      items: [
        'Copie los números en papel a mano — el teléfono no entra adentro',
        'Agregue el número de la persona de confianza y del abogado cuando esté elegido',
        'Guarde una copia en la billetera y otra en casa; dé copias a los suyos',
        'Si aún no hay abogado — el 9233# conecta con la línea sin fines de lucro, donde se puede preguntar dónde buscar ayuda gratuita',
      ],
    },
    { kind: 'tool', tool: 'print' },
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
