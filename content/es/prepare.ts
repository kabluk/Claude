import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Un plan por si hay una detención',
  lede: 'Complételo a mano en papel y guárdelo en casa, para que su familia sepa qué hacer en la primera hora. No se ingresa nada en línea.',
  blocks: [
    {
      kind: 'callout',
      tone: 'g',
      title: 'Por qué en papel y no en una aplicación',
      body: [
        'En la primera hora tras una detención, en casa hay pánico y las cosas simples se olvidan: el número de quién, dónde están los papeles, quién recoge a los niños. Una hoja llenada con tiempo responde esas preguntas de inmediato.',
        'A propósito no hacemos un formulario en línea: ningún servidor, incluido el nuestro, debe ver estos datos. Es una nota para la familia, no un cuestionario.',
      ],
    },
    {
      kind: 'p',
      text: 'Imprima esta página, complétela a mano y déjela donde su familia la encuentre. Actualícela cada pocos meses.',
    },
    { kind: 'tool', tool: 'print' },
    {
      kind: 'fields',
      title: 'A quién llamar primero',
      items: [
        'Persona de confianza — quién y teléfono',
        'Segunda persona, si la primera no responde',
        'Abogado u organización — nombre y teléfono',
      ],
    },
    {
      kind: 'fields',
      title: 'Los niños',
      items: [
        'Quién recoge a los niños de la escuela o guardería',
        'Teléfono de esa persona',
        'Dónde están los documentos de los niños',
      ],
    },
    {
      kind: 'fields',
      title: 'La casa y lo cotidiano',
      items: [
        'Dónde están los papeles importantes (pasaportes, contratos)',
        'Quién paga la renta mientras no estoy',
        'Quién cuida a la mascota',
      ],
    },
    {
      kind: 'fields',
      title: 'Salud',
      items: [
        'Los medicamentos que tomo y dónde están',
        'Condiciones que deben conocerse',
      ],
    },
    {
      kind: 'fields',
      title: 'Qué saber de memoria',
      items: [
        'El teléfono de la persona de confianza — memorícelo, no solo lo anote',
        'El código para llamar gratis a la línea de quejas del DHS OIG desde la detención: 9233#',
      ],
    },
    { kind: 'h2', text: 'Qué llevar consigo' },
    {
      kind: 'p',
      text: 'El plan lleno se queda en casa. Consigo, solo la tarjeta de derechos, pequeña. Tome una foto de la tarjeta y guárdela en el teléfono.',
    },
    {
      kind: 'memcard',
      title: 'TARJETA DE DERECHOS · LLEVAR CONSIGO',
      lines: [
        'No quiero hablar, responder preguntas ni firmar documentos sin un abogado. No doy consentimiento para entrar a mi casa sin una orden judicial firmada por un juez.',
      ],
      alts: [
        'I do not want to talk, answer questions, or sign documents without a lawyer. I do not consent to entry into my home without a judicial warrant signed by a judge.',
        'Я не хочу говорить, отвечать на вопросы и подписывать документы без адвоката. Я не даю согласия войти в дом без судебного ордера, подписанного судьёй.',
      ],
    },
    {
      kind: 'callout',
      tone: 'y',
      title: 'No lleve consigo el plan con nombres y teléfonos',
      body: [
        'Si lo encuentran durante una detención, contiene los nombres y direcciones de sus seres queridos. El plan se queda en casa; en el bolsillo, solo la tarjeta de derechos.',
      ],
    },
    { kind: 'ilink', page: 'documents', label: 'Qué significan los papeles y qué no firmar' },
    { kind: 'ilink', page: 'intake', label: 'Si ya detuvieron a alguien — por dónde empezar' },
  ],
}

export default c
