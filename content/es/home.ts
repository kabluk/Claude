import type { HomeContent } from '@/lib/types'

const c: HomeContent = {
  title: '¿Se llevaron a alguien?\n¿Quiere estar preparado?',
  sub: 'Responda las preguntas y reciba su propia lista de tareas. En lenguaje claro, paso a paso.',
  hub: {
    eyebrow: 'Por dónde empezar',
    cards: [
      {
        tone: 'r',
        label: 'Urgente',
        title: 'Se llevaron a alguien',
        desc: 'Qué hacer en las primeras horas tras una detención repentina.',
        actions: [
          { label: 'Localizar a la persona', page: 'where', primary: true },
          { label: 'Primera llamada', page: 'firstcall' },
        ],
      },
      {
        tone: 'n',
        title: 'Paquete para el abogado',
        desc: 'Arme un PDF ordenado con los documentos — en su propio teléfono.',
        actions: [{ label: 'Armar el paquete', page: 'docpack' }],
      },
      {
        tone: 'n',
        title: 'Un plan por si acaso',
        desc: 'Una lista de tareas para su situación — en 2 minutos.',
        actions: [{ label: 'Responder preguntas', page: 'intake', primary: true }],
      },
    ],
  },
  heroLead: 'Le ayudamos a:',
  heroPoints: [
    'encontrar a la persona en el sistema',
    'recibir su lista de tareas en 2 minutos',
    'establecer contacto con el detenido — llamadas, cartas',
    'conocer cómo consiguen dinero las familias — colectas y fondos',
    'armar el paquete para el abogado',
    'Seguridad: no guardamos nada sobre usted',
  ],
  demoLabel: 'ASÍ FUNCIONA',
  demoTaskLabel: 'SU TAREA',
  demoWhy: 'por qué está en la lista',
  scenarios: [
    {
      q: 'A NOMBRE DE QUIÉN',
      h: '¿A nombre de quién está la renta?',
      a: ['Mío', 'Suyo', 'De los dos'],
      pick: 1,
      t: [
        'Hable con el arrendador antes de un pago atrasado',
        'El contrato no está a su nombre. Esa conversación es distinta antes de un pago atrasado que después.',
        'la renta está a su nombre',
      ],
    },
    {
      q: 'HIJOS',
      h: '¿Quién puede recoger al niño en la escuela?',
      a: ['Los dos', 'Solo él', 'No sé'],
      pick: 1,
      t: [
        'Agréguese en la escuela ahora mismo',
        'Ahora mismo solo él puede recoger al niño. Se arregla con un formulario en la oficina de la escuela.',
        'en la escuela solo figura él',
      ],
    },
    {
      q: 'ABOGADO',
      h: '¿Sabe a qué abogado llamaría si llega el problema?',
      a: ['Sí, tengo el contacto', 'Todavía no', 'No sé'],
      pick: 1,
      t: [
        'Decida con tiempo a qué abogado llamar',
        'El abogado de oficio no existe en el proceso de inmigración. El contacto se elige antes del problema — mostramos dónde buscar y cómo verificar.',
        'el abogado se busca antes de la detención, no después',
      ],
    },
  ],
  benefitsTitle: 'En qué ayuda',
  benefits: [
    {
      b: 'Su propia lista de tareas en 2 minutos',
      p: 'No son consejos generales — son tareas para sus circunstancias. Cada una indica para qué sirve, cómo hacerla y dónde conseguir las cosas.',
    },
    {
      b: 'La primera noche sin pánico',
      p: 'Cómo encontrar a la persona, qué no firmar, a quién no pagar. En lenguaje claro, con lectura en voz alta.',
    },
    {
      b: 'Un paquete listo para el abogado',
      p: 'Llegue con los documentos reunidos — pague por el trabajo en el caso, no por ordenar papeles.',
    },
  ],
  cta: 'Empezar · 2 minutos',
  cta2: 'Primero ver cómo funciona todo',
  trust: ['GRATIS', 'SIN REGISTRO', 'EN · ES · RU'],
  stepsTitle: 'Tres pasos',
  steps: [
    {
      b: 'Responda las preguntas',
      p: 'Sencillas, cada una explica para qué sirve. ¿No sabe la respuesta? Dígalo — es normal.',
    },
    {
      b: 'Reciba su lista',
      p: 'No es un consejo general: son tareas para sus circunstancias. Cada una indica para qué sirve y qué hacer paso a paso.',
    },
    {
      b: 'Siga el mapa',
      p: 'Vea dónde está y qué sigue. Doce pasos desde «lo encontramos» hasta la corte.',
    },
  ],
  dataTitle: 'Sus datos',
  dataBig: {
    b: 'No guardamos nada sobre usted',
    p1: 'Las respuestas, las fotos de documentos y su lista se quedan en su teléfono. No se envían a nuestro servidor — ni una palabra, ni un archivo.',
    p2: 'Por eso no tenemos nada que perder, nada que vender y nada que entregar si nos lo piden.',
  },
  priceTitle: 'Cuánto cuesta',
  freeTitle: 'Todo lo que necesita ahora',
  freeAmt: 'GRATIS',
  freeItems: [
    'Cómo encontrar a una persona y qué significa cuando no aparece en el sistema',
    'Qué hacen los documentos que dan a firmar',
    'La primera llamada: qué preguntar y qué no decir',
    'Verificación del abogado en los registros oficiales',
    'Llamadas, dinero en la cuenta, cartas',
    'Las opciones de salida: qué funciona ahora y las primeras preguntas al abogado',
    'El cuestionario y su lista personal de tareas',
    'Armar el paquete de documentos para el abogado',
  ],
  paidTitle: 'Prepararse con tiempo',
  paidAmt: 'EN PREPARACIÓN',
  paidItems: [
    'El expediente de la familia y el archivo de pruebas',
    'Registro: si no se reporta — se le notifica',
    'Aviso si trasladan a la persona',
    'Acceso compartido para los familiares',
  ],
  priceNote:
    'Por ahora no hay nada de pago. Cuando lo haya, el precio estará aquí — y todo lo de la primera lista seguirá siendo gratis para siempre. Las parroquias y organizaciones podrán comprar acceso directamente para su gente.',
  limitsTitle: 'Lo que no hacemos',
  limits: [
    {
      b: 'No damos asesoría legal',
      p: 'No evaluamos su situación y no decimos cómo terminará.',
    },
    {
      // upl-ok: отрицание — мы говорим, что НЕ советуем адвокатов
      b: 'No recomendamos abogados específicos',
      p: 'Mostramos los registros oficiales — usted verifica por su cuenta.',
    },
    {
      b: 'No redactamos documentos',
      p: 'Explicamos qué hace el documento y señalamos el formulario oficial.',
    },
  ],
}

export default c
