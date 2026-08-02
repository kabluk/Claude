import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Si algo anda mal en el centro',
  lede: 'Malos tratos, negación de medicamentos, pertenencias perdidas — esto se documenta y se denuncia. En 2026 la supervisión del gobierno se ha recortado mucho, así que lo principal es registrar y apoyarse en organizaciones y en el abogado.',
  blocks: [
    {
      kind: 'callout',
      tone: 'r',
      title: 'Amenaza a la vida o urgencia médica',
      body: [
        'Si la persona está en peligro inmediato o le niegan atención médica urgente — llame a la línea de abajo de inmediato y avise al abogado. Puede formar parte de una petición federal de habeas.',
      ],
    },
    { kind: 'h2', text: 'Qué hacer, paso a paso' },
    {
      kind: 'steps',
      items: [
        'Anote todo: fecha, hora, qué pasó, nombres del personal, quién lo vio.',
        'Llame a la línea gratuita de Freedom for Immigrants — ayudan a documentar las violaciones.',
        'Avise al abogado: las condiciones y la falta de atención médica pueden influir en el caso y en una petición federal.',
        'Si lo desea, presente una queja oficial ante DHS (canales abajo).',
      ],
    },
    {
      kind: 'callout',
      tone: 'g',
      title: '9233# — una línea gratuita desde adentro',
      body: [
        'Marcar `9233#` desde un teléfono del centro llega a la línea de Freedom for Immigrants. ICE no la monitorea; los voluntarios hablan muchos idiomas y ayudan a documentar una violación y a conectarlo con defensores.',
      ],
    },
    { kind: 'h2', text: 'Canales oficiales' },
    {
      kind: 'phones',
      entries: [
        {
          num: '1-800-323-8603',
          who: 'DHS OIG — Inspector General',
          note: 'quejas por abuso, negligencia y malos tratos',
        },
      ],
      footer: 'La Oficina de Derechos Civiles y Libertades Civiles de DHS (CRCL) recibe quejas sobre las condiciones en línea — enlace abajo.',
    },
    {
      kind: 'ext',
      href: 'https://www.dhs.gov/file-civil-rights-complaint',
      label: 'Presentar una queja de derechos civiles (CRCL)',
    },
    {
      kind: 'callout',
      tone: 'y',
      title: 'Con honestidad sobre la supervisión en 2026',
      body: [
        'La Oficina del Ombudsman de Detención (OIDO) cerró y la oficina de derechos civiles fue recortada. No cuente con una respuesta rápida del gobierno.',
        'Por eso la documentación y el abogado importan más que nada: los hechos que reúna funcionan en la corte federal y en manos de las organizaciones de defensa.',
      ],
    },
    {
      kind: 'p',
      dim: true,
      text: 'No presentamos quejas por usted y no damos asesoría legal. Mostramos a dónde acude la gente y qué es importante registrar.',
    },
    { kind: 'ilink', page: 'attorney', label: 'Abogado: tres caminos' },
    { kind: 'ilink', page: 'habeas', label: 'Habeas corpus · corte federal' },
  ],
}

export default c
