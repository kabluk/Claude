import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Un plan por si hay una detención',
  metaTitle: 'Plan familiar por si hay una detención de ICE — plantilla para imprimir · DETNAV',
  metaDesc:
    'Un plan listo para la familia: a quién llamar, quién recoge a los niños, dónde están los papeles, el poder y el banco por adelantado. Se llena a mano en papel — nada se ingresa en línea.',
  lede: 'Complételo a mano en papel y guárdelo en casa, para que su familia sepa qué hacer en la primera hora. No se ingresa nada en línea.',
  blocks: [
    {
      kind: 'callout',
      tone: 'g',
      title: 'Por qué en papel y no en una aplicación',
      body: [
        'En la primera hora tras una detención, en casa hay pánico y las cosas simples se olvidan: el número de quién, dónde están los papeles, quién recoge a los niños. Una hoja llenada con tiempo responde esas preguntas de inmediato.',
        'A propósito no hacemos un formulario en línea: ningún servidor, incluido el nuestro, debe ver estos datos. Es una nota para la familia, no un cuestionario.',
      ],
    },
    {
      kind: 'p',
      text: 'Imprima esta página, complétela a mano y déjela donde su familia la encuentre. Actualícela cada pocos meses.',
    },
    { kind: 'tool', tool: 'print' },
    {
      kind: 'fields',
      title: 'A quién llamar primero',
      items: [
        'Persona de confianza — quién y teléfono',
        'Segunda persona, si la primera no responde',
        'Abogado u organización — nombre y teléfono',
      ],
    },
    {
      kind: 'fields',
      title: 'Los niños',
      items: [
        'Quién recoge a los niños de la escuela o guardería',
        'Teléfono de esa persona',
        'Dónde están los documentos de los niños',
      ],
    },
    {
      kind: 'fields',
      title: 'La casa y lo cotidiano',
      items: [
        'Dónde están los papeles importantes (pasaportes, contratos)',
        'Quién paga la renta mientras no estoy',
        'Quién cuida a la mascota',
      ],
    },
    {
      kind: 'fields',
      title: 'Salud',
      items: [
        'Los medicamentos que tomo y dónde están',
        'Condiciones que deben conocerse',
      ],
    },
    {
      kind: 'fields',
      title: 'Qué saber de memoria',
      items: [
        'El teléfono de la persona de confianza — memorícelo, no solo lo anote',
        'El código para llamar gratis a la línea de quejas del DHS OIG desde la detención: 9233#',
      ],
    },
    { kind: 'h2', text: 'Arme una lista personal de tareas — con anticipación' },
    {
      kind: 'p',
      text: 'Una encuesta de dos minutos arma una lista de tareas según las circunstancias de la familia — tanto para una detención como para prepararse. Las respuestas se quedan en el navegador. Imprima la lista terminada y guárdela junto con este plan.',
    },
    { kind: 'ilink', page: 'intake', label: 'Hacer la encuesta y recibir la lista de tareas' },
    { kind: 'h2', text: 'Entregue el plan a una persona de confianza — hoy' },
    {
      kind: 'p',
      text: 'Entregue con tiempo el plan lleno y el paquete de documentos ya armado a alguien de su confianza. Así empieza a actuar en el momento en que lo detienen, en vez de perder un día en averiguar qué pasó.',
    },
    {
      kind: 'p',
      text: 'Acuerden una señal simple: cada noche usted le envía una palabra de que todo está bien. Si faltan dos noches seguidas, empieza con los pasos de abajo.',
    },
    {
      kind: 'steps',
      title: 'Qué hace la persona de confianza si usted se queda en silencio',
      items: [
        'Lo busca en el localizador de ICE — por nombre y país de nacimiento, o por el número A del plan.',
        'Llama al abogado o a la organización cuyos teléfonos están anotados arriba en el plan.',
        'No firma nada por usted ni le paga a nadie sin verificar antes.',
        'Le entrega al abogado el paquete de documentos que usted le dio con anticipación.',
      ],
    },
    { kind: 'h2', text: 'Dinero y propiedad: solo funciona si se hace antes' },
    {
      kind: 'p',
      text: 'Mientras una persona está detenida, la renta, el préstamo del carro y la cuenta del banco no se detienen. Sus seres queridos solo podrán actuar legalmente por ella con documentos firmados de antemano — después ya no se pueden hacer.',
    },
    {
      kind: 'callout',
      tone: 'n',
      title: 'Poder financiero (durable power of attorney)',
      body: [
        'Un poder financiero duradero, firmado ante notario a nombre de una persona de confianza, le permite a esa persona terminar legalmente el contrato de renta, recoger las pertenencias, tratar con el banco y vender el carro. Sin ese documento, el arrendador y el banco ni siquiera están obligados a atenderla.',
        'Se firma ante notario con anticipación. Qué facultades incluir es una pregunta para un abogado: el texto depende del estado.',
      ],
    },
    {
      kind: 'callout',
      tone: 'n',
      title: 'La cuenta del banco',
      body: [
        'La verificación de entrada atada solo a SMS deja de funcionar cuando el teléfono está confiscado o la línea se corta. En la configuración del banco normalmente se puede agregar la verificación por correo electrónico — conservar el acceso al correo es más sencillo.',
        'Muchos bancos aceptan un poder solo en su propio formulario y solo en persona. Ir a la sucursal junto con la persona de confianza, por adelantado, quita esa barrera.',
      ],
    },
    {
      kind: 'callout',
      tone: 'n',
      title: 'La vivienda rentada y las pertenencias',
      body: [
        'Un apartamento que se queda sin pagar se convierte en deuda: multas por romper el contrato, cobradores, y las pertenencias van a una bodega o a la calle. Una persona con poder puede terminar el contrato según las reglas y recoger las cosas.',
      ],
    },
    {
      kind: 'callout',
      tone: 'n',
      title: 'El carro financiado o en lease',
      body: [
        'Un carro con pagos vencidos el prestamista lo recupera (repossession) y lo vende en subasta. El saldo de la deuda queda a nombre del dueño, y la parte condonada puede contarse como ingreso gravable (formulario 1099-C).',
        'Los caminos legales que existen: un poder con la facultad de vender el vehículo, o el traspaso oficial del préstamo o del lease a otra persona. Las condiciones están en el contrato y con el prestamista.',
      ],
    },
    {
      kind: 'callout',
      tone: 'n',
      title: 'Las cuentas de retiro: 401(k) e IRA',
      body: [
        'Los ahorros en un 401(k) o IRA siguen siendo propiedad de la persona sin importar su estatus migratorio o una deportación — no se pierden.',
        'Al retirarlos antes de los 59½ años normalmente aplica una multa del IRS del 10% más impuestos; por eso muchas veces las cuentas se dejan crecer hasta la edad de retiro. Desde el extranjero, el estatus fiscal se certifica con el formulario W-8BEN. Qué hacer con una cuenta concreta es una pregunta para un asesor de impuestos.',
      ],
    },
    {
      kind: 'ext',
      href: 'https://www.irs.gov/forms-pubs/about-form-w-8-ben',
      label: 'Formulario W-8BEN — página oficial del IRS',
    },
    {
      kind: 'steps',
      title: 'Tres tareas para esta semana',
      items: [
        'Cambiar la verificación de entrada al banco de SMS a correo electrónico, o agregar el correo como método de respaldo.',
        'Firmar ante notario un poder financiero y registrarlo en el banco en persona.',
        'Guardar copias del SSN/ITIN, de los contratos de renta y préstamo y de los papeles del carro en un almacenamiento cifrado, y darle acceso a la persona de confianza.',
      ],
    },
    {
      kind: 'callout',
      tone: 'y',
      title: 'Esto es un mapa, no consejo legal',
      body: [
        'Qué incluir en el poder, cómo terminar un contrato y qué hacer con una cuenta de retiro dependen del estado y del contrato. Esas decisiones se toman con un abogado y un asesor de impuestos, no con una nota de internet.',
      ],
    },
    { kind: 'h2', text: 'Qué llevar consigo' },
    {
      kind: 'p',
      text: 'El plan lleno se queda en casa. Consigo, solo la tarjeta de derechos, pequeña. Tome una foto de la tarjeta y guárdela en el teléfono.',
    },
    {
      kind: 'memcard',
      title: 'TARJETA DE DERECHOS · LLEVAR CONSIGO',
      lines: [
        'No quiero hablar, responder preguntas ni firmar documentos sin un abogado. No doy consentimiento para entrar a mi casa sin una orden judicial firmada por un juez.',
      ],
      alts: [
        'I do not want to talk, answer questions, or sign documents without a lawyer. I do not consent to entry into my home without a judicial warrant signed by a judge.',
        'Я не хочу говорить, отвечать на вопросы и подписывать документы без адвоката. Я не даю согласия войти в дом без судебного ордера, подписанного судьёй.',
      ],
    },
    {
      kind: 'callout',
      tone: 'y',
      title: 'No lleve consigo el plan con nombres y teléfonos',
      body: [
        'Si lo encuentran durante una detención, contiene los nombres y direcciones de sus seres queridos. El plan se queda en casa; en el bolsillo, solo la tarjeta de derechos.',
      ],
    },
    { kind: 'ilink', page: 'documents', label: 'Qué significan los papeles y qué no firmar' },
    { kind: 'ilink', page: 'intake', label: 'Si ya detuvieron a alguien — por dónde empezar' },
  ],
}

export default c
