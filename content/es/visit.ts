import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'La visita',
  metaTitle: 'Visitar a una persona en un centro de ICE: reglas, cita, documentos · DETNAV',
  metaDesc:
    'Cómo visitar a una persona detenida por ICE: horarios y citas, qué identificación necesita el visitante, reglas de cada centro y qué confirmar con una sola llamada.',
  lede: 'Cómo ver a la persona: horarios, registro, documentos, reglas. Escriba el centro — armamos la respuesta. Si no está en nuestra base, mostramos cómo saberlo todo con una llamada.',
  blocks: [
    { kind: 'tool', tool: 'visitfinder' },
    { kind: 'h2', text: 'Reglas que valen casi en todas partes' },
    {
      kind: 'list',
      items: [
        'Llegue al menos 15 minutos antes — a los que llegan tarde no los dejan pasar',
        'Identificación con foto oficial para cada adulto (licencia, pasaporte o ID del estado); algunos centros piden un segundo documento. Al entrar se llena un formulario con el nombre y el número A de la persona',
        'Límite de visitantes por visita — normalmente hasta tres, los niños cuentan',
        'Los niños suelen necesitar un acta de nacimiento; el niño está bajo la supervisión de un adulto todo el tiempo, y el comportamiento ruidoso es motivo para terminar la visita',
        'No se entra con nada: teléfonos y bolsos se quedan en el carro o en un casillero en la entrada',
        'En la visita no se entregan cosas — los libros y las cartas tienen sus propios canales',
        'El día de la visita llame y confirme que las visitas no están canceladas: un cierre las cancela sin aviso',
      ],
    },
    {
      kind: 'callout',
      tone: 'y',
      title: 'Vístase más estricto de lo que piden las reglas',
      body: [
        'Los requisitos típicos: largo hasta la rodilla, nada transparente, ajustado ni revelador, zapatos cerrados. Pero los interpreta la guardia en el lugar, y la interpretación cambia de turno en turno.',
        'En el centro Delaney Hall regresaron a familias por leggings, shorts y Crocs — les negaron la entrada incluso a niños. Es más seguro vestirse bastante más conservador que las reglas, todos, niños incluidos.',
      ],
    },
    {
      kind: 'callout',
      tone: 'r',
      title: 'Si usted mismo no tiene estatus',
      body: [
        'Los visitantes llenan un formulario y muestran documentos; en algunos centros verifican a los visitantes en las bases de datos.',
        'Las organizaciones de ayuda legal aquí remiten al abogado: hable del riesgo de la visita antes del viaje. La videollamada, las llamadas normales y las cartas son formas de contacto sin visita.',
      ],
    },
    { kind: 'h2', text: 'Si no puede hacer el viaje' },
    {
      kind: 'list',
      items: [
        'Videollamadas y mensajes — por el operador telefónico del centro',
        'Llamadas normales: la persona llama cuando hay dinero en la cuenta',
        'Las cartas y postales por correo llegan más seguro que cualquier servicio',
      ],
    },
    { kind: 'ilink', page: 'connect', label: 'El contacto: llamadas, dinero, cartas' },
    {
      kind: 'p',
      dim: true,
      text: 'Cada centro tiene sus propias reglas y cambian sin aviso. Estado a julio de 2026 — confirme por teléfono el día de la visita.',
    },
    {
      kind: 'onward',
      next: {
        page: 'journey',
        label: 'El camino completo',
        desc: 'Dónde está ahora y qué sigue — doce pasos desde «lo encontramos» hasta la corte.',
      },
      related: [{ page: 'where', label: 'Primero encontrarlo: dónde está' }],
    },
  ],
}

export default c
