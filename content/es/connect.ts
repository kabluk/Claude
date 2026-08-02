import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Cómo comunicarse con la persona',
  lede: 'La regla clave: él puede llamarla a usted. Usted no puede llamarlo a él. Abajo, paso a paso — llamadas, mensajes, video, dinero y cartas.',
  blocks: [
    { kind: 'h2', text: 'Por dónde empezar' },
    {
      kind: 'steps',
      items: [
        'Averigüe qué operador telefónico usa su centro.',
        'En su propio teléfono, desactive el bloqueo de números desconocidos — si no, él no podrá comunicarse.',
        'Abra una cuenta y ponga un poco de dinero.',
      ],
    },

    { kind: 'h2', text: '1 · Llamadas' },
    {
      kind: 'p',
      text: 'Él llama desde los teléfonos de la unidad de vivienda. Usted no puede llamarlo — solo él puede llamarla. Si la cuenta está en cero, no hay llamadas.',
    },
    {
      kind: 'steps',
      title: 'Cómo activar las llamadas',
      items: [
        'Averigüe el operador del centro — casi siempre es `GettingOut` (la empresa ViaPath); algunos usan `Securus` o `ICSolutions`.',
        'Abra el sitio del operador en el navegador (o su aplicación) y cree una cuenta.',
        'Vincule la cuenta por el `A-Number` y el centro.',
        'Elija cómo: fondear su cuenta personal — él llama a cualquiera; o vincularla a su número (AdvancePay) — él la llama solo a usted, y normalmente cuesta menos.',
        'Ponga poco — el mínimo suele ser `$10`. Si lo trasladan a otro centro, el dinero no se mueve con él.',
      ],
    },
    {
      kind: 'ext',
      href: 'https://www.gettingout.com',
      label: 'Sitio de GettingOut — cuenta para llamadas y mensajes',
    },
    {
      kind: 'callout',
      tone: 'g',
      title: '9233# — gratis y sin monitoreo',
      body: [
        'Marcar `9233#` desde un teléfono del centro llega a la línea gratuita de Freedom for Immigrants. Las llamadas normales se graban; ICE no monitorea esta.',
        'Los voluntarios hablan muchos idiomas, ayudan y pueden avisar a su familia dónde está la persona. Horario: lun–vie, 8 a.m.–8 p.m. hora del Pacífico.',
      ],
    },
    {
      kind: 'p',
      dim: true,
      text: 'Una llamada normal se graba y tiene tiempo limitado (unos 15–20 minutos). El precio ronda 7 centavos por minuto a nivel nacional, y las internacionales cuestan más; varía según el centro. Decir el A-Number por teléfono es seguro; los detalles del caso no. El programa de llamadas gratuitas que tenían algunos centros lo eliminó ICE en 2026 — cuente con que la comunicación se paga.',
    },
    { kind: 'ilink', page: 'firstcall', label: 'La primera llamada: cómo desbloquear números' },

    { kind: 'h2', text: '2 · Mensajes (texto)' },
    {
      kind: 'p',
      text: 'No son mensajes de texto normales a un teléfono. Son mensajes dentro del sistema del operador — él los lee en una tableta.',
    },
    {
      kind: 'steps',
      title: 'Cómo enviar',
      items: [
        'El mismo operador y la misma cuenta que para las llamadas.',
        'Abra la sección «Messages» en el sitio del operador.',
        'Pague «estampillas» (créditos) — en el sitio, por teléfono o en la aplicación, mínimo suele ser `$10`.',
        'Con ese mismo dinero puede enviar una foto y un videomensaje de 30 segundos.',
      ],
    },
    {
      kind: 'p',
      dim: true,
      text: 'No todos los centros tienen tabletas. La entrega se demora y todo se revisa.',
    },

    { kind: 'h2', text: '3 · Videollamadas' },
    {
      kind: 'p',
      text: 'Algunos centros tienen videollamadas — con cita previa, por el sitio del operador o un quiosco en el vestíbulo. De pago, y la cuenta hace falta con anticipación.',
    },
    {
      kind: 'p',
      dim: true,
      text: 'Esto no es una visita en persona — tiene sus propias reglas y horarios.',
    },
    { kind: 'ilink', page: 'visit', label: 'La visita' },

    { kind: 'h2', text: '4 · Dinero para lo diario (adentro)' },
    {
      kind: 'p',
      text: 'Esta es una cuenta aparte — no la de las llamadas. De ella la persona compra comida, higiene y a veces tiempo de teléfono adentro. A menudo es otro proveedor.',
    },
    {
      kind: 'steps',
      title: 'Cómo depositar',
      items: [
        'Busque las instrucciones de dinero en la página de este centro en ICE (la sección commissary / trust account) — los datos cambian por centro.',
        'Los métodos, los que haya — depende del lugar: en línea con tarjeta con el proveedor (`Access Corrections`, `TouchPay`, `ViaPath/ConnectNetwork`, `Western Union`); por teléfono con el proveedor; por correo con un money order a la dirección del centro; en persona en un quiosco del vestíbulo.',
        'Todos piden el nombre completo y el `A-Number` (a menudo también la fecha de nacimiento).',
        'Deposite solo con el proveedor indicado para este centro. Tras un traslado el dinero se queda atascado y es difícil recuperarlo.',
      ],
    },
    {
      kind: 'callout',
      tone: 'n',
      title: 'Si no hay quién ayude',
      body: [
        'El Freedom for Immigrants Commissary Fund pone dinero en la cuenta de quienes no tienen a nadie.',
      ],
    },
    {
      kind: 'p',
      dim: true,
      text: 'El dinero para lo diario no se puede retirar en efectivo — solo se gasta adentro.',
    },

    { kind: 'h2', text: '5 · Cartas y postales' },
    {
      kind: 'list',
      items: [
        'Una postal común por correo llega más seguro que cualquier servicio',
        'El A-Number va en el sobre y en cada envío, siempre',
        'Libros — solo nuevos y directamente de una tienda o editorial, no de un particular',
        'La pasta blanda pasa más rápido: la dura se revisa más y muchas veces no entra',
        'Cada centro tiene sus reglas — confirme por teléfono antes de enviar',
      ],
    },
    {
      kind: 'p',
      dim: true,
      text: 'El contacto cálido y regular es lo que más protege a la persona adentro.',
    },
  ],
}

export default c
