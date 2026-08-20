import type { PlaybookContent } from '@/lib/types'

const c: PlaybookContent = {
  mapTitle: 'Mapa de este documento',
  mapSub: 'Todo el camino en una página. Cada punto está explicado en detalle adentro — el número de la sección coincide con el número del punto.',
  phases: [
    {
      id: 'A',
      title: 'Se llevaron a alguien · las primeras horas',
      goal: 'Ahora mismo solo importan dos cosas: saber dónde está y no perder su llamada. No firme nada, no le pague a nadie.',
      items: [
        {
          n: 'A1',
          what: 'Encontrar dónde está',
          how: 'localizador de ICE: por número A o por nombre',
          why: 'Mientras no sepa en qué edificio está, nada más funciona: ni llamadas, ni dinero en la cuenta, ni la visita del abogado. Que la búsqueda salga vacía en las primeras horas es normal: el registro aparece hasta en 72 horas. Vuelva a buscar.',
        },
        {
          n: 'A2',
          what: 'Preparar su teléfono',
          how: 'quitar el bloqueo de números desconocidos, volumen al máximo',
          why: 'Usted no puede llamarlo — solo él puede llamarla, desde un número desconocido. Si su teléfono rechaza a los desconocidos en silencio, su única llamada se pierde.',
        },
        {
          n: 'A3',
          what: 'Abrir una cuenta de llamadas y ponerle dinero',
          how: 'GettingOut / Securus / ICSolutions — según el centro',
          why: 'Las llamadas desde adentro son de paga, y paga usted. Mientras la cuenta esté en cero, él físicamente no puede marcar su número. El dinero en la cuenta es su voz.',
        },
        {
          n: 'A4',
          what: 'Su primera llamada — con un plan corto',
          how: '3 preguntas en papel: centro · número A · salud',
          why: 'Los minutos son pocos y la línea se graba. Con las preguntas escritas de antemano, no se va a quedar en blanco, va a saber lo esencial y no va a decir de más.',
        },
      ],
    },
    {
      id: 'B',
      title: 'El abogado — lo principal · los primeros días',
      goal: 'El gobierno no da un abogado gratuito en los casos de inmigración — lo busca la familia. Con abogado, la gente sale tres veces más seguido.',
      items: [
        {
          n: 'B5',
          what: 'Dónde buscar',
          how: 'AILA (filtro por idioma) · lista pro bono de la corte · organizaciones del estado',
          why: 'Un abogado puede llevar el caso desde cualquier estado — busque por idioma, no por ciudad. Hay caminos gratuitos y de bajo costo: las listas y los teléfonos están adentro.',
        },
        {
          n: 'B6',
          what: 'Verificar antes de pagar',
          how: 'licencia en el registro del estado · 2 minutos',
          why: 'Con estas desgracias hay quien se aprovecha: toman el dinero y desaparecen. Un «notario» en EE. UU. no es abogado. La verificación toma dos minutos y salva miles de dólares.',
        },
        {
          n: 'B7',
          what: 'Preparar la primera cita',
          how: 'paquete de documentos + cronología + número A',
          why: 'El abogado cobra por horas. Si los papeles ya están juntos y ordenados, trabaja en el caso desde la primera hora, en vez de ordenar su carpeta con su dinero.',
        },
      ],
    },
    {
      id: 'C',
      title: 'Caminos de salida · se habla con el abogado',
      goal: 'Para salir de la custodia hay dos caminos. Elige el abogado — pero cuando usted conoce los dos, entiende qué está haciendo y puede preguntar por qué eligió ese.',
      fork: {
        a: {
          h: 'Bond · fianza',
          sub: 'corte de inmigración (EOIR)',
          text: 'Dinero como promesa de ir a todas las audiencias. Ahora a categorías amplias no les corresponde audiencia de fianza — esta puerta suele estar cerrada.',
        },
        b: {
          h: 'Habeas corpus',
          sub: 'corte federal de distrito',
          text: 'Una queja ante un juez federal independiente: «revise si es legal que me tengan detenido». Funciona incluso donde negaron la fianza. La presenta un abogado.',
        },
      },
    },
    {
      id: 'D',
      title: 'El camino largo · semanas',
      goal: 'La crisis de los primeros días pasó — empieza el maratón. Tres cosas que mantienen a la familia a flote por meses.',
      items: [
        {
          n: 'D8',
          what: 'El camino del caso',
          how: '12 pasos desde «lo encontramos» hasta la corte',
          why: 'El caso dura meses, y lo que más asusta es no saber. El mapa muestra dónde está usted y qué sigue. Regla de hierro: faltar a una audiencia = orden de expulsión en ausencia.',
        },
        {
          n: 'D9',
          what: 'El plan familiar en papel',
          how: 'campos para llenar a mano + la tarjeta de derechos',
          why: 'Si la desgracia se repite, la familia no va a buscar teléfonos en pánico — todo ya está escrito y guardado en casa. Se llena en una tarde.',
        },
        {
          n: 'D10',
          what: 'Glosario y todos los enlaces',
          how: '45 términos + todas las direcciones en una página',
          why: 'Palabras como habeas y NTA asustan hasta que se entienden. Y la página de enlaces se puede fotografiar y mandar a un familiar en una sola foto.',
        },
      ],
    },
  ],

  spreads: [
    {
      part: 'A',
      title: 'Las primeras horas: encontrarlo, la llamada, el contacto',
      lede: 'La meta de estas horas son dos cosas: saber dónde está y no perder su llamada. No firme nada, no le pague a nadie sin verificar.',
      sections: [
        {
          id: 'A1',
          h: 'Encontrar dónde está',
          blocks: [
            {
              kind: 'cols',
              cards: [
                {
                  h: 'Cómo buscar',
                  items: [
                    'El localizador oficial de ICE: locator.ice.gov. Se necesita el número A (la letra A y 9 dígitos) o el nombre + país de nacimiento.',
                    'El nombre debe coincidir letra por letra. La gente encuentra a la persona al 3.º o 4.º intento: otro orden de nombres, un segundo apellido, otra transliteración. La herramienta del sitio arma variantes de escritura.',
                    'Resultados: `In Custody` — encontrado, se ve el centro; `Not In Custody` — liberado o expulsado en los últimos 60 días; vacío — todavía no está en el sistema.',
                  ],
                },
                {
                  h: 'Si no aparece',
                  items: [
                    'Que no aparezca no quiere decir que no esté. El registro aparece hasta en 72 horas después del arresto — el propio sistema lo advierte.',
                    'En las primeras horas con la agencia fronteriza (CBP) la persona no se ve; retenida por CBP más de 48 horas — aparece en este mismo localizador.',
                    'Los menores de edad no aparecen en el localizador.',
                    'Durante un traslado el registro puede desaparecer por varios días.',
                  ],
                },
              ],
            },
            { kind: 'act', href: 'https://locator.ice.gov', label: 'Abrir el localizador oficial' },
            {
              kind: 'why',
              text: 'Mientras no sepa el centro, nada más funciona: ni llamadas, ni dinero, ni abogado. Y vuelva a buscar aunque lo haya encontrado ayer: a la gente la trasladan entre estados sin avisar a la familia.',
            },
          ],
        },
        {
          id: 'A2',
          h: 'Preparar su teléfono para su llamada',
          blocks: [
            {
              kind: 'cols',
              cards: [
                {
                  h: 'Hacer ahora mismo',
                  items: [
                    'iPhone: Configuración → Teléfono → apagar «Silenciar desconocidos».',
                    'Android: aplicación «Teléfono» → configuración → bloqueo de números — quitarlo.',
                    'Revisar el filtro de spam con su operador — también silencia a los desconocidos.',
                    'Volumen al máximo, el teléfono no en silencio. Avisar a toda la familia.',
                  ],
                },
                {
                  h: 'Por qué es crítico',
                  items: [
                    'Usted no puede hacer la llamada — solo él puede llamarla, desde un número desconocido.',
                    'Si el teléfono rechaza la llamada en silencio, su única llamada se pierde, y la siguiente puede tardar mucho.',
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'A3',
          h: 'Abrir una cuenta de llamadas y ponerle dinero',
          blocks: [
            {
              kind: 'cols',
              cards: [
                {
                  h: 'Cómo funciona',
                  items: [
                    'Él llama — desde los teléfonos de la unidad de vivienda. Las llamadas son de paga, y paga usted. Cuenta en cero = no puede marcar su número.',
                    'Averigüe el operador del centro: casi siempre `GettingOut` (la empresa ViaPath); algunos usan `Securus` o `ICSolutions`.',
                    'En el sitio del operador cree una cuenta y vincúlela por el número A y el centro.',
                  ],
                },
                {
                  h: 'Dos formas de recargar',
                  items: [
                    'Su cuenta personal — él puede llamar a cualquiera.',
                    'Vincular a su número (AdvancePay) — él la llama solo a usted; normalmente cuesta menos.',
                    'Las cartas funcionan siempre: una postal común llega mejor que cualquier servicio. El número A es obligatorio en el sobre.',
                  ],
                },
              ],
            },
            { kind: 'act', href: 'https://www.gettingout.com', label: 'GettingOut — cuenta, llamadas; la aplicación está ahí mismo' },
            { kind: 'act', href: 'https://securustech.net', label: 'Securus — si el centro usa Securus' },
            { kind: 'act', href: 'https://www.icsolutions.com', label: 'ICSolutions — si el centro usa ICSolutions' },
          ],
        },
        {
          id: 'A4',
          h: 'Su primera llamada — con un plan corto',
          blocks: [
            {
              kind: 'cols',
              cards: [
                {
                  h: 'Tres preguntas — anotar las respuestas en papel',
                  num: true,
                  items: [
                    'Dígame el número A completo, dígito por dígito.',
                    '¿Cómo se llama exactamente el centro y en qué ciudad está?',
                    '¿Firmó algo? ¿Qué exactamente? ¿Necesita medicamentos?',
                  ],
                },
                {
                  h: 'De qué no hablar en esta llamada',
                  items: [
                    'La llamada se graba y se escucha (excepto las líneas de abogados registradas).',
                    'No hablar de: deportaciones y órdenes pasadas, arrestos, detalles del caso, planes de defensa. Eso — solo con el abogado.',
                  ],
                },
              ],
            },
            {
              kind: 'mem',
              title: 'Si la cuenta está en cero',
              body: [
                'Marcar 9233# es gratis desde adentro del centro — la línea de ayuda de Freedom for Immigrants, no se escucha, funciona con la cuenta en cero.',
                'La línea oficial de ICE para familias: DRIL 1-888-351-4024.',
                'El teléfono se lo van a quitar — los números deben estar escritos en un papel en su bolsillo.',
              ],
            },
            {
              kind: 'why',
              text: 'Los minutos son pocos y la línea se puede cortar. Con las tres preguntas a la vista, no se queda en blanco, averigua lo esencial para buscar abogado y no dice de más en una línea grabada.',
            },
          ],
        },
      ],
    },

    {
      part: 'B',
      title: 'El abogado: encontrar, verificar, preparar la cita',
      lede: 'El gobierno no da un abogado gratuito en los casos de inmigración — lo busca la familia. Es la tarea principal de los primeros días: con abogado, la gente sale tres veces más seguido (42% contra 14%).',
      sections: [
        {
          id: 'B5',
          h: 'Dónde buscar',
          blocks: [
            {
              kind: 'cols',
              cards: [
                {
                  h: 'Tres caminos — todos legítimos',
                  items: [
                    'Un abogado privado. El directorio de AILA tiene filtro por idioma. La práctica es federal: un abogado de cualquier estado puede llevar un caso en cualquier estado — busque por idioma, no por ciudad.',
                    'Gratis (pro bono). La lista oficial de la corte EOIR por estado; en Nueva York — el programa NYIFUP (representación gratuita para detenidos).',
                    'Organizaciones. Según el estado del centro: CHIRLA (California), RAICES (Texas), LaAID (Luisiana), Americans for Immigrant Justice (Florida) — los enlaces están en la página de enlaces.',
                  ],
                },
                {
                  h: 'Sobre el dinero — preguntar desde el inicio',
                  items: [
                    '¿La consulta se paga y cuánto?',
                    '¿Tarifa fija por etapa o por hora? ¿Qué incluye exactamente?',
                    '¿Se puede pagar en partes?',
                    'Cualquier acuerdo — solo con contrato por escrito.',
                  ],
                },
              ],
            },
            { kind: 'act', href: 'https://www.ailalawyer.com', label: 'Buscador de AILA — filtro por idioma' },
            {
              kind: 'why',
              text: 'Los precios de los abogados varían mucho, y en pánico es fácil aceptar cualquier cosa. Tres preguntas sobre el dinero antes de empezar ahorran miles y quitan sorpresas.',
            },
          ],
        },
        {
          id: 'B6',
          h: 'Verificar antes de pagar',
          blocks: [
            {
              kind: 'cols',
              cards: [
                {
                  h: 'Verificación de dos minutos',
                  items: [
                    'Licencia: el registro del colegio de abogados del estado (state bar) — por nombre.',
                    'La lista disciplinaria de EOIR — que no esté suspendido de la práctica.',
                    'Representantes acreditados del DOJ — una alternativa legal al abogado en organizaciones sin fines de lucro.',
                  ],
                },
                {
                  h: 'Señales de fraude',
                  items: [
                    'Un «notario» en EE. UU. no es abogado. En América Latina el notario es un profesional del derecho; en EE. UU. no — sobre eso se construye una estafa clásica.',
                    'Promete un resultado exacto («lo saco al cien por ciento») — así no funciona.',
                    'Pide un «porcentaje de la fianza», dinero sin contrato ni recibo, efectivo «rápido».',
                  ],
                },
              ],
            },
            {
              kind: 'callout',
              tone: 'r',
              title: 'Aquí es donde las familias pierden más dinero',
              body: [
                'Hay quien se aprovecha de las familias en pánico: toman un adelanto y desaparecen, o «presentan papeles» que no existen. Dos minutos de verificación en el registro es la mejor inversión de esta semana.',
              ],
            },
          ],
        },
        {
          id: 'B7',
          h: 'Preparar la primera cita',
          blocks: [
            {
              kind: 'cols',
              cards: [
                {
                  h: 'Armar el paquete de documentos',
                  items: [
                    'Identificaciones y papeles de inmigración — cualquiera: visas viejas, permisos, cartas de USCIS.',
                    'Una cronología: cuándo y dónde lo detuvieron, cuándo lo trasladaron, qué papeles le dieron.',
                    'Pruebas de los lazos con EE. UU. — lo que el juez mira en la audiencia de fianza: dirección y años viviendo aquí, familia, historia de trabajo, impuestos (tax transcripts — gratis en irs.gov), participación en la comunidad.',
                    'Documentos médicos, si hay enfermedades.',
                    'El número A y el nombre exacto del centro — en la primera hoja.',
                  ],
                },
                {
                  h: 'Cómo se recupera',
                  items: [
                    'El abogado cobra por horas. Con los papeles juntos y ordenados, trabaja en el caso desde la primera hora, en vez de ordenar su carpeta con su dinero.',
                    'El armador del sitio junta todo en un PDF directamente en su teléfono — sin enviar nada a ningún lado.',
                  ],
                },
              ],
            },
          ],
        },
      ],
    },

    {
      part: 'C',
      title: 'Caminos de salida: bond y habeas — cómo funcionan juntos',
      lede: 'Todo como es, sin «cuál es mejor»: elegir el camino es trabajo del abogado. Estas páginas ayudan a entender su lógica y a hacer las preguntas correctas.',
      sections: [
        {
          id: 'C1',
          h: 'Primero lo primero: de qué depende el plan',
          blocks: [
            {
              kind: 'p',
              text: 'Todo lo determina el artículo de la ley bajo el cual tienen a la persona. Simplificando, hay tres categorías:',
            },
            {
              kind: 'list',
              items: [
                'Detención regular — se puede pedir fianza a un juez de inmigración.',
                'Detención obligatoria (ciertas causas penales) — no corresponde audiencia de fianza.',
                '«Recién llegados» — desde julio de 2025 la agencia cuenta aquí incluso a gente que vive en EE. UU. hace años, si alguna vez entró sin inspección. La posición de la agencia: no corresponde fianza en absoluto.',
              ],
            },
            {
              kind: 'why',
              label: 'Por qué saberlo',
              text: 'La primera pregunta al abogado: «¿Bajo qué artículo lo tienen?» La respuesta determina si la puerta de la fianza está abierta — o si hay que ir directo a la corte federal.',
            },
          ],
        },
        {
          id: 'C2',
          h: 'Bond · fianza — el análisis completo',
          blocks: [
            {
              kind: 'cols',
              cards: [
                {
                  h: 'Cuánto es ahora',
                  items: [
                    'Los jueces fijan más seguido $5,000 o $10,000. La mediana — $7,500 (inicio de 2026; un año antes — $6,000), el promedio — cerca de $11,000. Hay de $15,000–$25,000 y más.',
                    'El mínimo formal por ley es $1,500, pero esas cantidades casi no se ven ahora.',
                    'El dinero se devuelve al fiador cuando el caso termina, si la persona fue a todas las audiencias.',
                  ],
                },
                {
                  h: 'Quién paga y quién responde',
                  items: [
                    'La fianza la deposita un fiador (obligor) — una persona de 18+ años con estatus legal en EE. UU.; lo más seguro, un ciudadano o alguien con green card. Se necesitan ID y número de contribuyente (SSN/ITIN).',
                    'Firma un contrato con ICE (formulario `I-352`), deposita toda la cantidad de una vez y asume la responsabilidad: la persona va a todas las audiencias.',
                    'Fue a todas — el dinero vuelve al fiador. Faltó — se pierde.',
                  ],
                },
              ],
            },
            {
              kind: 'cols',
              cards: [
                {
                  h: 'De qué dependen la cantidad y la decisión',
                  items: [
                    'El juez decide dos preguntas: si la persona es peligrosa y si va a venir a la corte. La carga de la prueba es del detenido.',
                    'Los factores (Matter of Guerra): años en EE. UU., dirección fija, familia aquí, historia de trabajo, violaciones pasadas, forma de entrada, audiencias perdidas antes. La capacidad de pagar también se toma en cuenta.',
                    'Un expediente listo de los lazos con EE. UU. — dirección, trabajo, familia — es exactamente lo que junta el paquete de documentos de la parte B.',
                  ],
                },
                {
                  h: 'Vale la pena saber',
                  items: [
                    'Negaron — se puede apelar a la BIA y pedir una nueva audiencia cuando cambian las circunstancias.',
                    'La fianza libera a la persona pero no resuelve el caso — el proceso de expulsión continúa.',
                    'Realidad de 2026: más de dos tercios de las peticiones de fianza se niegan. Con abogado las aprueban tres veces más seguido (42% contra 14%).',
                    'Pagar solo directamente en una oficina de ICE con el formulario `I-352`. Nadie legítimo cobra un «porcentaje de la fianza».',
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'C3',
          h: 'Habeas corpus — el análisis completo',
          blocks: [
            {
              kind: 'cols',
              cards: [
                {
                  h: 'Cómo funciona',
                  items: [
                    'Un caso aparte en la corte federal de distrito donde tienen a la persona — contra quien la tiene detenida. La cuota es $5; el costo real es el trabajo del abogado.',
                    'Un juez independiente revisa si la detención en sí es legal. No responde ni a ICE ni a la corte de inmigración.',
                    'Bases típicas: lo tienen sin audiencia de fianza; lo clasificaron como «recién llegado» aunque vive aquí hace años; lo tienen demasiado tiempo sin revisión.',
                  ],
                },
                {
                  h: 'Qué puede y qué no puede el juez',
                  items: [
                    'Puede: ordenar una audiencia de fianza (a veces con la carga de la prueba para el gobierno), liberar, prohibir un traslado (TRO), pausar la expulsión (stay) — con una moción aparte del abogado.',
                    'No puede: anular una orden de expulsión ni dar estatus — esos son otros procedimientos.',
                    'Realidad de 2026: cerca de 2,000 peticiones por semana en el país (hace un año — cerca de 20). Las aprueban jueces nombrados por administraciones muy distintas: lo que decide es la calidad de la petición y los hechos.',
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'C4',
          h: 'Cómo se conectan — la idea clave',
          blocks: [
            {
              kind: 'callout',
              tone: 'g',
              title: 'No es «uno o el otro»',
              body: [
                'Son dos puertas en edificios distintos — y el habeas muchas veces abre la que la agencia cerró de golpe. La conexión típica ahora: la agencia dice «no corresponde fianza» → el abogado presenta el habeas → el juez federal revisa si eso es cierto — y puede ordenar una audiencia de fianza o liberar.',
              ],
            },
            {
              kind: 'list',
              items: [
                '¿Se puede al mismo tiempo? Sí — son sistemas distintos y no se estorban. Juntos, por turnos y cuál primero — es la estrategia del abogado para el caso concreto.',
                'La geografía decide. Los circuitos federales se dividieron: el Segundo, el Tercero y el Sexto — por las audiencias de fianza; el Quinto y el Octavo — por la agencia. La Corte Suprema tomó la pregunta; los argumentos se esperan en octubre de 2026. Por eso «en qué estado está el centro» = «las reglas del juego», y un traslado a otro estado lo cambia todo.',
              ],
            },
            {
              kind: 'callout',
              tone: 'y',
              title: 'El habeas no es un escudo contra la deportación',
              body: [
                'La petición por sí sola no detiene una expulsión: la suspensión (stay) es una decisión aparte de la corte, y el abogado la solicita. Si alguien promete «con el habeas la deportación es imposible», no es cierto.',
              ],
            },
          ],
        },
        {
          id: 'C5',
          h: '«¿Y cuál es mejor?» — la respuesta honesta',
          blocks: [
            {
              kind: 'p',
              text: 'La pregunta «cuál es mejor» no tiene una respuesta general — lo que corresponde depende del artículo de detención, del circuito y de los hechos del caso concreto. Ese es exactamente el trabajo del abogado. Lo nuestro es que usted entienda su plan y pueda preguntar:',
            },
            {
              kind: 'cols',
              cards: [
                {
                  h: 'Preguntas al abogado — copiar en papel',
                  num: true,
                  items: [
                    '¿Bajo qué artículo lo tienen? ¿Corresponde audiencia de fianza?',
                    'Si no corresponde — ¿hay bases para el habeas? ¿Cuáles exactamente?',
                    '¿En qué circuito federal está el centro y qué cambia eso para nosotros?',
                    '¿Qué presentamos primero y por qué? ¿Presentamos en paralelo?',
                    '¿Pedimos stay/TRO — protección contra el traslado y la expulsión mientras corre el caso?',
                  ],
                },
              ],
            },
            {
              kind: 'table',
              head: ['Bond · fianza', 'Habeas corpus'],
              rows: [
                ['Dónde se decide', 'corte de inmigración (EOIR, agencia del Depto. de Justicia)', 'corte federal de distrito, un juez independiente'],
                ['La pregunta', 'si lo sueltan con dinero mientras corre el caso', 'si es legal tenerlo detenido'],
                ['Quién prepara', 'un abogado (se puede solo — vea la estadística)', 'un abogado con práctica federal'],
                ['Costo de entrada', 'la cantidad de la fianza, normal $5,000–$10,000 (se devuelve al fiador)', 'cuota de $5 + el trabajo del abogado'],
                ['Si niegan', 'apelación a la BIA; nueva audiencia si algo cambia', 'apelación a la corte federal de apelaciones'],
                ['Efecto en el caso de expulsión', 'no lo resuelve', 'no lo resuelve; el stay va aparte'],
              ],
            },
            {
              kind: 'p',
              dim: true,
              text: 'Fuentes: TRAC Immigration (informes 722, 738), Matter of Guerra (BIA), formulario I-352 de ICE, ILRC (dic. 2025), 28 U.S.C. § 2241, INA § 236. A agosto de 2026 — las reglas cambian; la Corte Suprema toma la pregunta en el otoño de 2026.',
            },
          ],
        },
      ],
    },

    {
      part: 'D',
      title: 'Semanas y meses: el camino y el plan de la familia',
      lede: 'La crisis de los primeros días pasó — empieza el maratón. Aquí está lo que mantiene a la familia a flote por meses.',
      sections: [
        {
          id: 'D8',
          h: 'El camino del caso — 12 pasos',
          blocks: [
            {
              kind: 'cols',
              cards: [
                {
                  h: 'Cómo está armado el caso',
                  items: [
                    'Un mapa de 12 pasos: desde «lo encontramos», pasando por la primera cita en la corte (master calendar — una audiencia corta y administrativa), hasta la audiencia principal de fondo (individual hearing) y la decisión.',
                    'El caso dura meses y años. Cada paso en el sitio explica qué pasa y qué hace la familia.',
                  ],
                },
                {
                  h: 'Dos reglas de hierro',
                  items: [
                    'Faltar a una audiencia = orden de expulsión en ausencia (in absentia). La causa más común no es esconderse sino una mudanza: el aviso llegó a la dirección vieja.',
                    'Se mudaron — el formulario `EOIR-33` a la corte dentro de 5 días hábiles. Avisar al correo, al banco o a USCIS no basta: la corte recibe su propio formulario.',
                  ],
                },
              ],
            },
            {
              kind: 'why',
              text: 'Lo que más asusta es no saber. Cuando la familia ve el mapa — dónde estamos, qué viene el próximo mes — el pánico se convierte en plan. Y la regla del EOIR-33 evita el desastre más doloroso: perder el caso por una carta a la dirección vieja.',
            },
          ],
        },
        {
          id: 'D9',
          h: 'El plan familiar en papel',
          blocks: [
            {
              kind: 'cols',
              cards: [
                {
                  h: 'Qué hay adentro — campos para la pluma',
                  items: [
                    'A quién llamar primero: la persona de confianza, un respaldo, el abogado.',
                    'Niños: quién los recoge de la escuela, el teléfono, dónde están los documentos.',
                    'Casa: dónde están los papeles, quién paga la renta, la mascota.',
                    'Salud: medicamentos y condiciones que deben conocerse.',
                    'De memoria: el teléfono de la persona de confianza y 9233#.',
                  ],
                },
                {
                  h: 'Dinero y propiedad — solo por adelantado',
                  items: [
                    'Un poder financiero (durable POA) a una persona con estatus: sin él, el arrendador y el banco no tienen obligación de hablar con la familia.',
                    'El banco: verificación de inicio de sesión de SMS a correo; registrar el poder en la sucursal por adelantado.',
                    'El carro financiado, el apartamento, las cuentas 401(k) — qué pasa con ellos y qué caminos legales existen está explicado en el sitio.',
                  ],
                },
              ],
            },
            {
              kind: 'mem',
              title: 'La tarjeta de derechos · llevar consigo (3 idiomas)',
              body: [
                '«No quiero hablar, responder preguntas ni firmar documentos sin un abogado. No doy consentimiento para entrar a mi casa sin una orden judicial firmada por un juez.»',
              ],
            },
            {
              kind: 'callout',
              tone: 'y',
              title: 'El plan con nombres y teléfonos se queda en casa — no en el bolsillo',
              body: [
                'Si lo encuentran durante una detención, contiene los nombres y direcciones de sus seres queridos. Consigo — solo la tarjeta de derechos.',
              ],
            },
            {
              kind: 'why',
              text: 'Se llena en una tarde. Si la desgracia se repite, la familia no busca números en pánico — todo está escrito en casa, y la persona de confianza sabe qué hacer desde la primera hora.',
            },
          ],
        },
      ],
    },
  ],

  linksTitle: 'Todos los enlaces — una página',
  linksLede: 'Cada dirección de este documento en un solo lugar. Fotografíe esta página y mándela en una sola foto. En la versión digital todo es clicable.',
  linksGroups: {
    official: 'Oficiales y servicios',
    orgs: 'Organizaciones de ayuda por estado',
    site: 'Páginas de detnav.com con herramientas',
  },
}

export default c
