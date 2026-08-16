import type { Block, PageContent } from '@/lib/types'
import { SUPPORT_URL } from '@/lib/support'

// El bloque de apoyo aparece solo cuando hay un enlace de Stripe en
// src/lib/support.ts. El pago ocurre por completo en stripe.com — Zero-Data se mantiene.
const support: Block[] = SUPPORT_URL
  ? [
      { kind: 'h2', text: 'Apoyar el proyecto' },
      {
        kind: 'p',
        text: 'Todo lo que una familia necesita en la crisis es gratis y seguirá siendo gratis. Si su organización quiere apoyar el trabajo, se puede hacer con una aportación única.',
      },
      { kind: 'ext', href: SUPPORT_URL, label: 'Apoyar DETNAV' },
      {
        kind: 'p',
        dim: true,
        text: 'El pago ocurre en stripe.com. En detnav.com sigue sin haber formularios de pago, ni cuentas, ni datos sobre usted.',
      },
    ]
  : []

const c: PageContent = {
  title: 'Para parroquias, organizaciones y empleadores',
  lede: 'Cuando llega el problema, su gente acude a usted. Nosotros damos una herramienta que puede ponerles en las manos.',
  blocks: [
    { kind: 'h2', text: 'Qué recibe su gente — gratis' },
    {
      kind: 'list',
      items: [
        'Una lista personal de tareas en 2 minutos — según las circunstancias de la familia, en tres idiomas',
        'La primera noche paso a paso: cómo encontrar a la persona, qué no firmar, a quién no pagar',
        'Verificación del ayudante en los registros oficiales — antes de entregar dinero',
        'El borrador del paquete de documentos para el abogado — ahorro de sus horas cobradas',
        'No guardamos nada: las respuestas se quedan en el teléfono, no tenemos nada que entregar',
      ],
    },
    { kind: 'h2', text: 'Qué ofrecemos a las organizaciones' },
    {
      kind: 'list',
      items: [
        'Tarjetas impresas de la primera noche con su contacto — para repartir con tiempo',
        'Una reunión o webinar «la primera noche» para sus familias — en su idioma',
        'Funciones de preparación para dar a su gente con anticipación: el plan familiar y el paquete de documentos para el abogado',
        'Una línea directa con nosotros: sus preguntas y casos llegan primero al producto',
      ],
    },
    {
      kind: 'callout',
      tone: 'g',
      title: 'Por qué esto está armado con honestidad',
      body: [
        'Todo lo que una familia necesita en la crisis es gratis para todos y seguirá siendo gratis. Las organizaciones pagan por la capacitación, los materiales y el acceso anticipado a las funciones de preparación — no por el rescate.',
        'Nunca tomamos un porcentaje de la fianza y no le vendemos nada a una familia en las primeras 72 horas.',
      ],
    },
    ...support,
    { kind: 'h2', text: 'Hablar con nosotros' },
    {
      kind: 'p',
      text: 'Esta página normalmente la compartimos en persona. Si recibió el enlace — responda a quien se lo envió y acuerde una conversación corta: 20 minutos, sin compromisos.',
    },
    {
      kind: 'p',
      dim: true,
      text: 'No somos abogados y no damos asesoría legal — y a su gente se lo decimos en cada página.',
    },
  ],
}

export default c
