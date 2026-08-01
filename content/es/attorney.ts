import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Abogado',
  lede: 'Tres caminos, todos legítimos. Mostramos todos — cuál sirve lo deciden usted y quienes conocen el caso.',
  blocks: [
    {
      kind: 'callout',
      tone: 'r',
      title: 'No existe el abogado de oficio',
      body: [
        'En el proceso de inmigración el gobierno no proporciona abogado. La ayuda gratuita existe, pero con listas de espera, y no toman a todos.',
        'La salida ahora se logra más a menudo por la corte federal — la petición de habeas corpus. Solo un abogado puede prepararla y presentarla, así que el abogado no es una de las opciones sino la figura central del caso.',
      ],
    },
    { kind: 'h2', text: 'Camino 1 · Gratis' },
    {
      kind: 'list',
      items: [
        'La lista de ayuda gratuita de EOIR — el servicio que administra las cortes de inmigración',
        'El programa de orientación legal dentro del propio centro',
        'Organizaciones locales sin fines de lucro — llame a varias a la vez, en todas hay filas',
        'Pregunte si toman casos de detenidos y si trabajan con este centro',
      ],
    },
    {
      kind: 'ext',
      href: 'https://www.justice.gov/eoir/list-pro-bono-legal-service-providers',
      label: 'Lista pro bono de EOIR',
    },
    { kind: 'ext', href: 'https://www.immigrationlawhelp.org', label: 'Catálogo de ayuda gratuita y de bajo costo' },
    {
      kind: 'p',
      dim: true,
      text: 'El consulado del país de la persona debe ser notificado de la detención de su ciudadano; la ayuda puede ser importante, pero pedirán prueba de parentesco.',
    },
    { kind: 'h2', text: 'Camino 2 · Representante acreditado' },
    {
      kind: 'callout',
      tone: 'g',
      title: 'No es abogado, pero representa legalmente',
      body: [
        'Los representantes acreditados del Departamento de Justicia pueden llevar casos en la corte de inmigración. Muchas veces gratis o de bajo costo. El camino más subestimado.',
        'Se verifican en el registro oficial — el enlace está en la página de verificación.',
      ],
    },
    { kind: 'h2', text: 'Camino 3 · De pago' },
    {
      kind: 'list',
      items: [
        'Antes de pagar — la verificación en los tres registros, tres minutos',
        'El contrato escrito es obligatorio: qué incluye, qué no, cómo se calcula el precio',
        'Pregunte por el anticipo y la unidad mínima de facturación — las conversaciones con la familia también se cobran',
      ],
    },
    { kind: 'ilink', page: 'verify', label: 'Verificar al abogado' },
    { kind: 'h2', text: 'Se puede buscar por idioma' },
    {
      kind: 'callout',
      tone: 'g',
      title: 'La práctica es federal',
      body: [
        'Un abogado con licencia de cualquier estado puede llevar un caso de inmigración en cualquier estado — la entrada al caso se hace con el formulario `EOIR-28`.',
        'Por eso se puede buscar por idioma y no por la cercanía de la oficina. El directorio de AILA tiene filtro por idioma.',
      ],
    },
    {
      kind: 'onward',
      sources: [
        { href: 'https://www.ailalawyer.com', label: 'Buscador de AILA · filtro por idioma' },
        {
          href: 'https://www.americanbar.org/groups/legal_services/flh-home/',
          label: 'ABA Free Legal Answers',
        },
      ],
    },
  ],
}

export default c
