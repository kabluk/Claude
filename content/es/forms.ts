import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Formularios y avisos: qué son',
  lede: 'Un diccionario corto de los papeles que entregan en la detención y en la corte. Solo «qué es», sin consejos. Muestre cualquiera de ellos a un abogado.',
  blocks: [
    {
      kind: 'callout',
      tone: 'y',
      title: 'Una orden de ICE suele ser administrativa, no judicial',
      body: [
        'La orden de arresto (formulario `I-200`) la firma un oficial de ICE, no un juez. Las organizaciones de defensa (ACLU, NILC) explican: esa orden no da derecho a entrar a una casa sin consentimiento — a diferencia de una orden judicial, que la firma un juez de la corte.',
        'Se verifica por la firma: una orden judicial tiene la firma de un juez y el nombre de una corte. Puede pedir que le muestren el documento por una ventana o que lo pasen por debajo de la puerta.',
      ],
    },
    { kind: 'tool', tool: 'docmap' },
    { kind: 'h2', text: 'Papeles frecuentes' },
    {
      kind: 'callout',
      tone: 'n',
      title: 'I-862 · Notificación de comparecencia (NTA)',
      body: [
        'El documento con el que el gobierno inicia un caso de expulsión en la corte de inmigración. Enumera las alegaciones sobre la persona y los cargos. Puede indicar la fecha de la primera audiencia; si no, la corte envía un Aviso de Audiencia aparte.',
      ],
    },
    {
      kind: 'callout',
      tone: 'n',
      title: 'I-200 · Orden de arresto',
      body: ['Una orden administrativa de ICE para la detención (vea el recuadro de arriba — no es judicial).'],
    },
    {
      kind: 'callout',
      tone: 'n',
      title: 'I-205 · Orden de expulsión',
      body: ['Se emite cuando en el caso ya se dictó una orden final de expulsión.'],
    },
    {
      kind: 'callout',
      tone: 'n',
      title: 'I-286 · Notificación de determinación de custodia',
      body: [
        'La decisión de ICE sobre si mantener a la persona bajo custodia. Aquí puede figurar un monto de fianza, si se fijó uno.',
      ],
    },
    {
      kind: 'callout',
      tone: 'n',
      title: 'I-220A · Orden de liberación bajo palabra',
      body: [
        'Liberación condicional de la custodia, con la obligación de asistir a todas las audiencias y cumplir las condiciones.',
      ],
    },
    {
      kind: 'callout',
      tone: 'n',
      title: 'EOIR-33 · Cambio de dirección',
      body: [
        'El formulario de la corte para informar una nueva dirección dentro de los 5 días hábiles de mudarse. No enviar este aviso es una causa frecuente de que una persona falte a una audiencia.',
      ],
    },
    {
      kind: 'onward',
      sources: [
        { href: 'https://www.justice.gov/eoir/eoir-forms', label: 'Formularios oficiales de la corte (EOIR)' },
        { href: 'https://respondentaccess.eoir.justice.gov/en/forms/eoir33ic/', label: 'EOIR-33 · cambio de dirección en línea' },
      ],
    },
    {
      kind: 'p',
      dim: true,
      text: 'No interpretamos sus papeles y no damos consejos. Qué significa un documento concreto y qué hacer con él lo determina solo un abogado.',
    },
    { kind: 'ilink', page: 'documents', label: 'Qué no firmar' },
    { kind: 'ilink', page: 'deadlines', label: 'No faltar a la audiencia' },
    { kind: 'ilink', page: 'glossary', label: 'Glosario de términos: ICE, EOIR, BIA y más' },
  ],
}

export default c
