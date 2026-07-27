import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Dieron fianza · cómo pagar',
  lede: 'La mecánica del dinero, sin valoraciones: quién paga, por dónde, qué guardar. Al 27 de julio de 2026.',
  blocks: [
    { kind: 'h2', text: 'Montos' },
    {
      kind: 'list',
      items: [
        'El mínimo por ley es `$1,500`; los jueces suelen fijar más',
        'Los gastos después son mensuales, no de una sola vez: llamadas, compras en el centro, viajes a las visitas',
      ],
    },
    { kind: 'h2', text: 'Cómo se paga' },
    {
      kind: 'list',
      items: [
        'Paga un ciudadano de EE. UU. o titular de green card por el sistema `CeBONDS`, formulario `I-352`',
        'El pago es por `Fedwire` o `ACH`',
        'La salida real toma tiempo después del pago — de horas a días',
      ],
    },
    {
      kind: 'callout',
      tone: 'r',
      title: 'Guarde el I-305',
      body: [
        'El recibo `I-305` es el documento para recuperar el dinero. Sin él no hay devolución.',
        'La devolución llega al final del caso, a quien pagó. Pueden ser años. La solicitud de devolución es el formulario `I-391`.',
      ],
    },
    { kind: 'h2', text: 'Fiadores comerciales' },
    {
      kind: 'callout',
      tone: 'y',
      title: 'El 15–20% no se devuelve',
      body: [
        'Un fiador comercial se queda con el 15–20% del monto de la fianza de forma permanente, normalmente más un grillete con cuota mensual.',
        'Ejemplo: con una fianza de `$75,000` al fiador se le pagan alrededor de `$11,000–15,000`, y no se devuelven. Quien paga la suma completa por su cuenta la recibe de vuelta al final del caso.',
        'Esa es la estructura de su servicio, no una valoración. Compare condiciones por escrito.',
      ],
    },
    {
      kind: 'callout',
      tone: 'y',
      title: 'El derecho a la audiencia de fianza está en disputa',
      body: [
        'La respuesta depende del circuito donde está la persona, y cambia con un traslado. Esta es la primera pregunta para el abogado — antes de buscar el dinero o a quien lo pague.',
      ],
    },
    { kind: 'ilink', page: 'sponsor', label: 'Quién paga la fianza' },
  ],
}

export default c
