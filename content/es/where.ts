import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Cómo encontrarlo',
  lede: 'La búsqueda la hace el sistema oficial. Aquí explicamos cómo usarlo y qué significa el resultado.',
  blocks: [
    { kind: 'h2', text: 'Qué necesita' },
    {
      kind: 'list',
      items: [
        'El número A — la letra A y nueve dígitos',
        'O bien: nombre y apellido, país de nacimiento, fecha de nacimiento',
      ],
    },
    { kind: 'tool', tool: 'anumber' },
    {
      kind: 'callout',
      tone: 'y',
      title: 'El nombre debe coincidir letra por letra',
      body: [
        'Muchos encuentran a la persona al tercer o cuarto intento: otro orden de los nombres, el segundo apellido, otra forma de escribirlo.',
        'La herramienta de abajo arma variantes de escritura. Todo queda en este navegador.',
      ],
    },
    { kind: 'tool', tool: 'namevariants' },
    { kind: 'ext', href: 'https://locator.ice.gov', label: 'Abrir el localizador oficial', gate: true },
    {
      kind: 'callout',
      tone: 'y',
      title: 'Vacío no quiere decir que no esté',
      body: [
        'Los registros se cargan con retraso: el propio sistema advierte que la persona puede aparecer hasta 72 horas después del arresto.',
        'Un resultado vacío en las primeras horas es común.',
      ],
    },
    { kind: 'h2', text: 'Qué significa el resultado' },
    {
      kind: 'list',
      items: [
        '`In Custody` — encontrado: se ve el centro, y las visitas y llamadas se vuelven concretas',
        '`Not in Custody` — liberado o deportado en los últimos 60 días',
        'Vacío — no encontrado: la actualización tarda de 20 minutos a 8 horas, más un procesamiento inicial en la oficina de ICE de alrededor de un día',
      ],
    },
    { kind: 'h2', text: 'Cuando el sistema no lo mostrará' },
    {
      kind: 'list',
      items: [
        'En las primeras horas con la agencia fronteriza la persona no se ve; a quienes CBP retiene más de 48 horas sí los muestra este mismo localizador',
        'Los menores de edad no aparecen en este localizador',
        'Durante un traslado los datos pueden desaparecer por varios días',
      ],
    },
    {
      kind: 'callout',
      tone: 'r',
      title: 'Trasladan personas entre estados',
      body: [
        'No avisan a la familia. Pueden llevarlo a miles de kilómetros sin aviso y el centro cambiará solo en el sistema.',
        'Vuelva a revisar, aunque ayer lo haya encontrado.',
      ],
    },
    { kind: 'h2', text: 'Si la búsqueda no da nada' },
    {
      kind: 'phones',
      entries: [
        {
          num: '1-888-351-4024',
          who: 'DRIL · línea oficial de ICE',
          note: 'localizar a una persona, problemas en detención, separación de un hijo · lun–vie 8:00–20:00 ET · hay español',
        },
        {
          num: '1-800-898-7180',
          who: 'Línea Nacional de Detención',
          note: 'sin fines de lucro, no gubernamental · contacto con la familia, documentación de abusos',
        },
      ],
      footer: 'La primera línea la maneja ICE. La segunda, una organización sin fines de lucro. La elección es suya.',
    },
    { kind: 'h2', text: 'Oficina de ICE: a dónde acudir y dónde reportarse' },
    {
      kind: 'p',
      text: 'Si a la persona le ordenaron reportarse (grillete, ISAP) o necesita saber qué oficina cubre la zona, busque la oficina más cercana por ciudad o estado.',
    },
    { kind: 'tool', tool: 'officefinder' },
  ],
}

export default c
