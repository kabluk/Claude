import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Paquete de documentos para el abogado',
  lede: 'Usted fotografía los documentos — y recibe un PDF ordenado con portada e índice. Todo ocurre en este navegador: los archivos no van a ningún servidor.',
  blocks: [
    {
      kind: 'callout',
      tone: 'n',
      title: 'Para qué sirve',
      body: [
        'Un abogado que recibe cuarenta fotos sin rotular pasa horas ordenándolas — y esas horas las paga la familia. El mismo paquete con portada e índice toma minutos.',
        'La portada se arma sola: qué hay dentro por secciones, qué falta todavía, la fecha y el número del paquete.',
      ],
    },
    {
      kind: 'callout',
      tone: 'y',
      title: 'No espere a tenerlo todo',
      body: [
        'Al abogado le sirve más la mitad de los documentos hoy que todo dentro de un mes. El paquete tiene número: el siguiente simplemente complementa este.',
      ],
    },
    { kind: 'tool', tool: 'docpack' },
    { kind: 'h2', text: 'Cómo funciona' },
    {
      kind: 'list',
      items: [
        'Cada foto se comprime en el navegador — treinta páginas ocupan unos 10 MB y pasan por cualquier correo',
        'Las fotos se guardan solo en este navegador, en este dispositivo. Nosotros no las vemos ni las recibimos',
        'Las páginas se agrupan por secciones del expediente, y cada una se puede rotular: qué es y de qué año',
        'El PDF se nombra por el número A y la fecha, sin el nombre de la persona',
        'Un paquete grande se corta en partes automáticamente: el correo no acepta archivos de más de 25 MB',
        'Después de enviarlo, las fotos se pueden borrar del navegador con un botón',
      ],
    },
    {
      kind: 'callout',
      tone: 'r',
      title: 'Lo que no hacemos',
      body: [
        'No enviamos los archivos nosotros y no los guardamos: el botón «Compartir» abre el menú de su propio teléfono, y el paquete viaja por su correo o mensajería. Qué necesita un caso concreto lo determina el abogado.',
      ],
    },
    { kind: 'ilink', page: 'intake', label: 'La lista de tareas: qué documentos juntar' },
    { kind: 'ilink', page: 'attorney', label: 'Abogado: tres caminos' },
  ],
}

export default c
