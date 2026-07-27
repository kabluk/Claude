import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'No faltar a la audiencia',
  lede: 'Faltar a una audiencia es la pérdida irreversible más común. Y casi siempre — por un cambio de dirección.',
  blocks: [
    {
      kind: 'callout',
      tone: 'r',
      title: 'No llegó — el caso se decide sin él',
      body: [
        'Si la persona no se presenta a una audiencia programada, el juez puede emitir una orden de deportación en ausencia.',
        'La mayoría de las veces no es por fuga, sino por una mudanza: la notificación llega a la dirección vieja.',
      ],
    },
    { kind: 'h2', text: 'Qué hacer' },
    {
      kind: 'list',
      items: [
        'Revise la fecha de la audiencia en el sistema oficial — por el número A',
        'Ponga recordatorios 14, 3 y 1 día antes',
        'Después de mudarse, presente el cambio de dirección a la corte con su propio formulario, `EOIR-33`',
        'Guarde la constancia de la presentación',
      ],
    },
    { kind: 'ext', href: 'https://acis.eoir.justice.gov', label: 'Revisar la fecha de la audiencia' },
    { kind: 'ext', href: 'https://www.justice.gov/eoir/form-eoir-33', label: 'Formulario de cambio de dirección EOIR-33' },
    {
      kind: 'callout',
      tone: 'y',
      title: 'El cambio de dirección en la corte va aparte de todo lo demás',
      body: [
        'Avisar al correo, al banco o a USCIS no cambia la dirección en la corte de inmigración. La corte recibe su propio formulario.',
      ],
    },
  ],
}

export default c
