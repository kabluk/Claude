import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Dónde encontrar el número A',
  lede: 'Es la llave para todo: la búsqueda, el abogado, la fianza, la corte. Probablemente ya está en su casa.',
  blocks: [
    {
      kind: 'callout',
      tone: 'g',
      title: 'Formato',
      body: [
        'La letra `A` y nueve dígitos. A veces con guiones o espacios.',
        'Ocho dígitos también está bien: se agrega un cero al inicio. El número está en la pulsera.',
      ],
    },
    { kind: 'h2', text: 'Dónde buscar en casa' },
    {
      kind: 'list',
      items: [
        'Cualquier carta de la corte de inmigración o de USCIS — la agencia que da los permisos de trabajo y las green cards',
        'El permiso de trabajo, aunque esté vencido',
        'Recibos de pago de cuotas, copias de solicitudes viejas',
        'Documentos de un caso anterior, si lo hubo',
        'La carpeta de documentos que se guarda «por si acaso»',
      ],
    },
    {
      kind: 'callout',
      tone: 'y',
      title: 'Si encuentra una carta, fotografíela ya',
      body: ['Completa, todas las páginas. El número casi seguro está ahí, y el papel se puede perder.'],
    },
    { kind: 'h2', text: 'Si no hay nada en casa' },
    {
      kind: 'p',
      dim: true,
      text: 'El número se puede preguntar en la primera llamada. Cómo hacer esa llamada está en otra página.',
    },
    { kind: 'ilink', page: 'firstcall', label: 'La primera llamada' },
  ],
}

export default c
