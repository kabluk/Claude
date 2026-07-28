import type { DirectoryContent } from '@/lib/types'

const c: DirectoryContent = {
  circuitNames: { '2': 'Segundo', '5': 'Quinto', '9': 'Noveno', '11': 'Undécimo' },
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
}

export default c
