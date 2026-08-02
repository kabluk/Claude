import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Qué significan estos papeles',
  lede: 'Esta página funciona sin internet. Guárdela.',
  blocks: [
    {
      kind: 'memcard',
      title: 'GUARDAR Y COMPARTIR',
      lines: ['Estoy ejerciendo mi derecho a guardar silencio. No firmaré documentos sin un abogado.'],
      alts: [
        'I am exercising my right to remain silent. I will not sign documents without an attorney.',
        'Я пользуюсь правом хранить молчание. Я не буду подписывать документы без адвоката.',
      ],
    },
    {
      kind: 'p',
      dim: true,
      text: 'Tome una captura de pantalla de esta tarjeta y compártala por WhatsApp — funciona sin cuenta y sin internet.',
    },
    { kind: 'h2', text: 'Qué hace cada documento' },
    {
      kind: 'callout',
      tone: 'r',
      title: 'Salida voluntaria',
      body: [
        'Significa aceptar irse por cuenta propia y renunciar a la audiencia en la corte. Después de firmar, el caso no llega al juez.',
      ],
    },
    {
      kind: 'callout',
      tone: 'r',
      title: 'Orden de deportación estipulada',
      body: ['Aceptar una orden de expulsión sin audiencia. El juez no revisa el caso.'],
    },
    {
      kind: 'callout',
      tone: 'y',
      title: '«Firma y sales más rápido»',
      body: [
        'Esta frase aparece con frecuencia en los relatos de detenciones. Firmar estos documentos termina el caso; no acelera la salida.',
      ],
    },
    {
      kind: 'callout',
      tone: 'n',
      title: 'Un detainer (ICE hold) — si la persona sigue en una cárcel local',
      body: [
        'Un detainer es una solicitud de ICE a una cárcel local para retener a la persona hasta 48 horas después de cuando debía ser liberada, para que ICE pueda recogerla. Es una solicitud, no una orden judicial.',
        'La cárcel no está obligada a cumplirla, y si ICE no llega dentro de las 48 horas (los fines de semana y feriados cuentan), la persona debe ser liberada. Esto es una pregunta para el abogado de defensa penal.',
      ],
    },
    { kind: 'h2', text: 'Lo que publican las organizaciones' },
    {
      kind: 'p',
      dim: true,
      text: 'ACLU, FIRRP e ILRC publican la recomendación de no firmar ningún documento antes de hablar con un abogado, y de dar solo el nombre propio.',
    },
    { kind: 'ext', href: 'https://www.aclu.org', label: 'ACLU' },
    { kind: 'ext', href: 'https://firrp.org', label: 'FIRRP' },
    { kind: 'ext', href: 'https://www.ilrc.org', label: 'ILRC' },
  ],
}

export default c
