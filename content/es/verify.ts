import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Verificar a quién le paga',
  lede: 'Tres registros oficiales. La verificación toma tres minutos y no cuesta nada.',
  blocks: [
    {
      kind: 'callout',
      tone: 'n',
      title: '1 · Colegio de abogados del estado',
      body: [
        'Licencia vigente y sin sanciones. Cada estado tiene su propio registro — busque «state bar» y el nombre del estado.',
      ],
    },
    {
      kind: 'callout',
      tone: 'n',
      title: '2 · Representantes acreditados del Departamento de Justicia',
      body: [
        'No son abogados, pero pueden representar en la corte de inmigración. Muchas veces gratis o de bajo costo: es ayuda legítima.',
      ],
    },
    {
      kind: 'callout',
      tone: 'n',
      title: '3 · Lista disciplinaria de EOIR',
      body: [
        'Quiénes tienen prohibido ejercer ante las cortes de inmigración. EOIR es la oficina del Departamento de Justicia que administra las cortes de inmigración.',
      ],
    },
    {
      kind: 'ext',
      href: 'https://www.justice.gov/eoir/list-of-currently-disciplined-practitioners',
      label: 'Lista disciplinaria de EOIR',
    },
    {
      kind: 'ext',
      href: 'https://www.justice.gov/eoir/recognition-accreditation-roster-reports',
      label: 'Registro de representantes acreditados',
    },
    { kind: 'h2', text: 'Notario' },
    {
      kind: 'callout',
      tone: 'r',
      title: 'Notario público ≠ abogado',
      body: [
        'En América Latina un notario público es un profesional del derecho. En Estados Unidos es alguien que certifica firmas. No puede representar a nadie en la corte de inmigración.',
        'Esa diferencia entre países es la base del fraude más común.',
      ],
    },
    { kind: 'h2', text: 'Señales de alarma' },
    {
      kind: 'list',
      items: [
        'Promesa de salida en una fecha concreta',
        'Garantía del resultado del caso',
        'Pago por adelantado en efectivo sin contrato escrito',
        'Negarse a dar el número de licencia',
      ],
    },
    {
      kind: 'callout',
      tone: 'y',
      title: '«Sale hoy con una petición ya lista»',
      body: [
        'Una petición de habeas exige que la persona ya esté bajo custodia, señalando el centro concreto. No existe una petición preparada de antemano para una salida inmediata.',
      ],
    },
  ],
}

export default c
