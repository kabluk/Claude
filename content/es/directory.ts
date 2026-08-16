import type { DirectoryContent } from '@/lib/types'

const c: DirectoryContent = {
  circuitNames: {
    '1': 'Primero',
    '2': 'Segundo',
    '3': 'Tercero',
    '4': 'Cuarto',
    '5': 'Quinto',
    '6': 'Sexto',
    '7': 'Séptimo',
    '8': 'Octavo',
    '9': 'Noveno',
    '10': 'Décimo',
    '11': 'Undécimo',
    DC: 'Circuito de D.C.',
  },
  facility: {
    labels: {
      addr: 'Dirección',
      phone: 'Teléfono',
      tablets: 'Tabletas',
      st: 'Estado',
      circuit: 'Circuito de apelación',
      hours: 'Horario',
    },
    warnByFacility: {
      adelanto: {
        title: 'La dirección se confunde',
        body: ['En otros sitios aparece un número distinto. La dirección oficial para correo es la de arriba.'],
      },
    },
    lettersH2: 'Cartas y postales',
    letters: [
      'Una postal por correo normal llega mejor que cualquier servicio',
      'Libros: solo nuevos y enviados directamente por el vendedor',
      'Pasta blanda: la pasta dura tarda más en revisarse y muchas veces no entra',
      'El número A es obligatorio en el sobre',
    ],
    stateH2: 'Página del estado',
  },
  statePage: {
    lede: 'Cortes, centros y ayuda gratuita — por estado.',
    circuitLine: 'Circuito de apelación',
    courtsH2: 'Cortes de inmigración',
    facilitiesH2: 'Centros',
    helpH2: 'Ayuda gratuita',
    helpLinks: [
      {
        href: 'https://www.justice.gov/eoir/list-pro-bono-legal-service-providers',
        label: 'Lista pro bono de EOIR',
      },
      { href: 'https://www.freedomforimmigrants.org', label: 'Mapa de centros y recursos de Freedom for Immigrants' },
      { href: 'https://www.immigrationlawhelp.org', label: 'Catálogo de ayuda gratuita y de bajo costo' },
    ],
    fundedLine: 'En este estado existen programas de representación financiada — vea las listas abajo.',
    verifyNote: 'Las listas y los teléfonos cambian. Última revisión: 27 de julio de 2026.',
  },
  dirFacility: {
    metaTitle: '{name} ({city}, {st}) — encontrar a un detenido, cartas, plazos · DETNAV',
    metaDesc:
      '{name} en {city}, {st}: dirección para cartas, cómo encontrar a una persona detenida en el localizador de ICE, cómo mantener contacto y cuánto suele durar la detención. Gratis, en tres idiomas.',
    lede: 'Centro de detención de ICE en {city}, {st}. Cómo encontrar a una persona, a dónde escribir y qué hacer después.',
    countyLabel: 'Condado',
    officeLabel: 'Oficina de ICE',
    zipLabel: 'Código postal',
    findH2: 'Una persona puede estar aquí — qué hacer',
    findLinks: [
      { page: 'where', label: 'Encontrar a una persona en el localizador de ICE' },
      { page: 'firstcall', label: 'La primera llamada: qué preguntar y qué no decir' },
      { page: 'visit', label: 'La visita: las reglas y qué llevar' },
      { page: 'connect', label: 'Llamadas, mensajes y dinero en la cuenta' },
    ],
    sourceNote:
      'La dirección y la asignación vienen de datos de ICE recopilados por el Deportation Data Project (junio de 2026). Los teléfonos y horarios no se publican aquí — confírmelos en la página oficial de ICE o llamando al centro.',
  },
  dirIndex: {
    title: 'Centros de ICE',
    metaTitle: 'Lista de centros de detención de ICE por estado — direcciones y cómo encontrar a un detenido · DETNAV',
    metaDesc:
      'Todos los centros de detención de ICE según datos oficiales: direcciones, estados, circuitos de apelación. Cómo encontrar a una persona detenida y mantener contacto. Gratis, EN/ES/RU.',
    lede: 'Centros de detención según datos oficiales de ICE — por estado. Cada uno con dirección, reglas de correo y plazos típicos.',
    note: 'La lista se construye con datos de ICE (Deportation Data Project, junio de 2026). Un centro pudo abrir o cerrar después de esa fecha.',
  },
}

export default c
