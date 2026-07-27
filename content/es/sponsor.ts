import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Obligado de fianza',
  lede: 'El detenido no paga su propia fianza. Hace falta una persona con estatus — o una organización.',
  blocks: [
    {
      kind: 'callout',
      tone: 'y',
      title: 'Primero — averiguar si habrá audiencia de fianza',
      body: [
        'Desde julio de 2025 la posición del gobierno es que una persona que entró al país sin inspección está sujeta a detención obligatoria y no tiene fianza. Los circuitos de apelación se dividieron; el Quinto Circuito — Texas, Luisiana, Misisipi — apoyó al gobierno. Se espera la revisión de la Corte Suprema.',
        'La respuesta depende de dónde está detenida la persona, y cambia con un traslado. Solo un abogado puede determinar si esto aplica a una persona concreta — haga esa pregunta primero.',
        'Aquí se describe el estado de la disputa al 27 de julio de 2026 — cambia rápido, mire la fecha.',
      ],
    },
    { kind: 'h2', text: 'Quién puede pagar la fianza' },
    {
      kind: 'list',
      items: [
        'Un ciudadano de EE. UU. o titular de green card, mayor de 18 años',
        'Bufetes de abogados',
        'Organizaciones sin fines de lucro y fondos de fianza',
      ],
    },
    { kind: 'h2', text: 'Qué necesitará el obligado' },
    {
      kind: 'list',
      items: [
        'Pasaporte de EE. UU., acta de nacimiento o green card',
        'La misma escritura de sus datos en el documento, la cuenta bancaria y el perfil',
        'Disposición a pagar por transferencia',
      ],
    },
    { kind: 'h2', text: 'Qué arriesga y qué no' },
    {
      kind: 'list',
      items: [
        'El dinero se devuelve al final del caso — a quien pagó',
        'Eso puede tardar años: los plazos no dependen de ninguno de los dos',
        'El recibo `I-305` es el documento para la devolución — se guarda como dinero',
      ],
    },
    { kind: 'h2', text: 'Cómo pedirlo' },
    {
      kind: 'p',
      text: 'Personas con el estatus adecuado suele haber muy pocas, y la petición es seria — por eso se pospone hasta el final. Es mejor empezar la conversación antes del día de la audiencia.',
    },
    {
      kind: 'callout',
      tone: 'n',
      title: 'Ejemplo · ajústelo a sus palabras',
      body: [
        'Necesito pedirte algo serio. Para que suelten a una persona, la fianza la debe pagar un ciudadano o alguien con green card — yo no puedo hacerlo. El dinero se devuelve cuando termina el caso, pero puede tardar mucho tiempo. Entenderé cualquier respuesta. ¿Puedo explicarte cómo funciona?',
      ],
    },
    { kind: 'h2', text: 'Si no hay una persona adecuada' },
    {
      kind: 'list',
      items: [
        'Una organización sin fines de lucro puede actuar como obligado — para muchos es el único camino',
        'Busque fondos que trabajen en el estado del centro, y pregunte si toman este centro',
        'Pregunte por la fila de espera y las condiciones',
        'Verifique la organización en los mismos registros que a un abogado',
      ],
    },
    {
      kind: 'callout',
      tone: 'y',
      title: 'Los fondos cambian',
      body: ['Algunos cierran. Asegúrese de que la organización funciona ahora.'],
    },
    { kind: 'ilink', page: 'bondpay', label: 'Pagar la fianza' },
  ],
}

export default c
