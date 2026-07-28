import type { HomeContent } from '@/lib/types'

const c: HomeContent = {
  title: '¿Se llevaron a alguien?\nEsto es lo que hay que hacer.',
  sub: 'Responda las preguntas y reciba su propia lista de tareas. En lenguaje claro, paso a paso.',
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
        'Hable con el arrendador antes de un pago perdido',
        'El contrato no está a su nombre. Esa conversación es distinta antes de un pago perdido que después.',
        'la renta está a nombre de él',
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
      q: 'FIANZA',
      h: '¿Hay cerca un ciudadano de EE. UU. o alguien con green card?',
      a: ['Sí, hay', 'Tengo que pensarlo', 'No hay nadie'],
      pick: 2,
      t: [
        'Mire los fondos de fianza',
        'Las organizaciones sin fines de lucro pueden pagar la fianza por quien no tiene a nadie que la pague.',
        'no hay personas adecuadas',
      ],
    },
  ],
  benefitsTitle: 'En qué ayuda',
  benefits: [
    {
      b: 'Su propia lista de tareas en 2 minutos',
      p: 'No son consejos generales — son tareas para sus circunstancias. Cada una dice para qué es, cómo hacerla y dónde conseguir las cosas.',
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
      b: 'Responde las preguntas',
      p: 'Sencillas, cada una explica para qué sirve. ¿No sabe la respuesta? Dígalo — es normal.',
    },
    {
      b: 'Recibe su lista',
      p: 'No es un consejo general: son tareas para sus circunstancias. Cada una dice para qué es y qué hacer paso a paso.',
    },
    {
      b: 'Sigue el mapa',
      p: 'Se ve dónde está y qué sigue. Quince pasos desde «lo encontramos» hasta la corte.',
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
    'Cómo encontrar a una persona y qué significa un resultado vacío',
    'Qué hacen los documentos que dan a firmar',
    'La primera llamada: qué preguntar y sobre qué callar',
    'Verificación del abogado en los registros oficiales',
    'Llamadas, dinero en la cuenta, cartas',
    'La fianza: cómo funciona y qué no dejar pasar',
    'El cuestionario y su lista personal de tareas',
    'Armar el paquete de documentos para el abogado',
  ],
  paidTitle: 'Prepararse con tiempo',
  paidAmt: 'EN PREPARACIÓN',
  paidItems: [
    'El expediente de la familia y el archivo de pruebas',
    'Registro: si no se reporta — sale su mensaje',
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
      b: 'No recomendamos abogados concretos',
      p: 'Mostramos los registros oficiales — usted verifica por su cuenta.',
    },
    {
      b: 'No redactamos documentos',
      p: 'Explicamos qué hace el documento y señalamos el formulario oficial.',
    },
  ],
}

export default c
