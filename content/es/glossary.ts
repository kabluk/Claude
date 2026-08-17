import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Glosario de términos',
  metaTitle: 'Glosario del caso de inmigración: ICE, EOIR, habeas corpus y más · DETNAV',
  metaDesc:
    'Qué significan ICE, EOIR, BIA, NTA, bond, credible fear, habeas corpus y otros términos del caso de inmigración y la detención. Definiciones claras, sin consejos.',
  lede: 'Palabras que aparecen en los papeles, las llamadas y las conversaciones con el abogado. Solo definiciones — qué significa el término, no qué hacer con él.',
  blocks: [
    {
      kind: 'callout',
      tone: 'n',
      title: 'Esto es un diccionario, no asesoría legal',
      body: [
        'Las definiciones de abajo son generales y no toman en cuenta un caso concreto. Algunas reglas cambian según el estado y el circuito de apelación, y el texto de la ley es más preciso que este resumen breve. Cómo se aplica un término a un caso en particular lo determina un abogado.',
      ],
    },

    { kind: 'h2', text: 'Quién es quién' },
    {
      kind: 'terms',
      items: [
        {
          term: 'ICE',
          def: 'Servicio de Inmigración y Control de Aduanas (Immigration and Customs Enforcement). Agencia del Departamento de Seguridad Nacional (DHS) que localiza, detiene y expulsa a personas sin estatus legal dentro del país.',
        },
        {
          term: 'ERO',
          def: 'Enforcement and Removal Operations — la parte de ICE que hace los arrestos, mantiene a las personas bajo custodia y organiza las expulsiones.',
        },
        {
          term: 'CBP',
          def: 'Servicio de Aduanas y Protección Fronteriza (Customs and Border Protection). Opera en la frontera, los puertos y los aeropuertos; es una agencia distinta de ICE.',
        },
        {
          term: 'USCIS',
          def: 'Servicio de Ciudadanía e Inmigración (U.S. Citizenship and Immigration Services). Procesa solicitudes de estatus — green card, ciudadanía, permiso de trabajo. No realiza detenciones.',
        },
        {
          term: 'DHS',
          def: 'Departamento de Seguridad Nacional (Department of Homeland Security). La agencia principal de la que dependen ICE, CBP y USCIS.',
        },
        {
          term: 'EOIR',
          def: 'Oficina Ejecutiva de Revisión de Inmigración (Executive Office for Immigration Review). Parte del Departamento de Justicia, separada del DHS. Atiende los casos de expulsión.',
        },
        {
          term: 'Juez de inmigración (Immigration Judge, IJ)',
          def: 'Un juez de la corte de inmigración de EOIR, nombrado por el Departamento de Justicia — no es lo mismo que un juez federal.',
        },
        {
          term: 'BIA',
          def: 'Junta de Apelaciones de Inmigración (Board of Immigration Appeals). Atiende las apelaciones de las decisiones de un juez de inmigración.',
        },
        {
          term: 'Oficial del caso (Deportation officer, Officer of Record)',
          def: 'El oficial de ICE ERO asignado al caso de una persona detenida en particular.',
        },
        {
          term: 'Field office',
          def: 'Oficina regional de ICE ERO que cubre un área determinada. Vea la página para buscar la oficina.',
        },
      ],
    },

    { kind: 'h2', text: 'Detención y estatus' },
    {
      kind: 'terms',
      items: [
        {
          term: 'Número A, expediente (A-file)',
          def: 'Un número de nueve dígitos asignado a una persona en el sistema de inmigración, y el expediente de documentos que se guarda bajo ese número. La llave para buscar en los registros de ICE y EOIR.',
        },
        {
          term: 'Detainer (retención de ICE)',
          def: 'Una solicitud de ICE a una cárcel local o a la policía para retener a una persona por un tiempo adicional — normalmente hasta 48 horas — después de cuando debería quedar en libertad, para que ICE pueda tomar custodia.',
        },
        {
          term: 'Mandatory detention',
          def: 'Custodia sin audiencia aparte sobre la posibilidad de fianza, cuando aplica al caso — por ejemplo, bajo ciertas causas penales (`INA § 236(c)`).',
        },
        {
          term: 'Bond (fianza)',
          def: 'Un pago en dinero con el que se asegura la salida de una persona de la custodia de ICE mientras el caso está pendiente.',
        },
        {
          term: 'Bond hearing (audiencia de fianza)',
          def: 'Una audiencia aparte ante un juez de inmigración sobre el monto de la fianza, o sobre si se fija alguna.',
        },
        {
          term: 'ATD',
          def: 'Alternatives to Detention — formas de supervisión fuera de un centro de detención: un grillete electrónico, una aplicación de reportes o citas programadas.',
        },
        {
          term: 'ISAP',
          def: 'Intensive Supervision Appearance Program — un programa privado de ATD que opera bajo contrato con ICE la empresa BI Incorporated.',
        },
        {
          term: 'Check-in (reportarse)',
          def: 'La obligación de presentarse periódicamente en una oficina de ICE, o de reportarse por teléfono o aplicación, como parte de ATD o después de la liberación.',
        },
        {
          term: 'Credible fear interview',
          def: 'Una entrevista con un oficial de USCIS para una persona detenida en la frontera o al reingresar al país, sobre si tiene un temor creíble de persecución en su país.',
        },
        {
          term: 'Reasonable fear interview',
          def: 'Una entrevista parecida para una persona con una orden de expulsión previa o ciertas condenas. El nivel que hay que cumplir es más alto que el de credible fear.',
        },
      ],
    },

    { kind: 'h2', text: 'El proceso judicial' },
    {
      kind: 'terms',
      items: [
        {
          term: 'Removal proceedings (proceso de expulsión)',
          def: 'El proceso judicial en EOIR que decide si una persona debe salir de Estados Unidos.',
        },
        {
          term: 'NTA, Notice to Appear (formulario I-862)',
          def: 'El documento con el que empieza el proceso de expulsión: enumera las alegaciones sobre la persona y los cargos.',
        },
        {
          term: 'Master calendar hearing',
          def: 'Una audiencia corta y administrativa: el juez revisa el estado del caso, fija la próxima fecha y anota si la persona tiene abogado.',
        },
        {
          term: 'Individual hearing (merits hearing)',
          def: 'La audiencia principal sobre el fondo del caso, donde se presentan las pruebas y se toma una decisión.',
        },
        {
          term: 'Continuance',
          def: 'Posponer una audiencia para una fecha posterior.',
        },
        {
          term: 'In absentia order',
          def: 'Una orden de expulsión dictada cuando la persona no se presentó a una audiencia programada.',
        },
        {
          term: 'Venue',
          def: 'La corte de EOIR donde se atiende un caso en particular. Puede cambiar cuando trasladan a la persona entre centros de detención.',
        },
        {
          term: 'Docket number (número de caso)',
          def: 'El número bajo el cual el caso está registrado en la corte.',
        },
      ],
    },

    { kind: 'h2', text: 'Caminos de protección y resultados' },
    {
      kind: 'terms',
      items: [
        {
          term: 'Asylum (asilo)',
          def: 'Una forma de protección para una persona que no puede regresar a su país por persecución debido a raza, religión, nacionalidad, opinión política o pertenencia a un grupo social determinado.',
        },
        {
          term: 'Withholding of removal',
          def: 'Una protección más limitada que el asilo: impide la expulsión a un país específico, pero no lleva a una green card.',
        },
        {
          term: 'CAT protection',
          def: 'Protección bajo la Convención contra la Tortura (Convention Against Torture) — contra la expulsión a un país donde la persona enfrentaría tortura por parte del gobierno o con su consentimiento.',
        },
        {
          term: 'Cancellation of removal',
          def: 'Cancela una orden de expulsión cuando se cumplen ciertas condiciones. Las reglas son distintas para residentes permanentes legales (LPR) y para el resto.',
        },
        {
          term: 'Voluntary departure (salida voluntaria)',
          def: 'Permiso para salir de EE. UU. por cuenta propia y a su costo en lugar de una expulsión forzada. Puede tener un efecto distinto que una orden de expulsión sobre una futura entrada.',
        },
        {
          term: 'Prosecutorial discretion',
          def: 'Una decisión de ICE o de un fiscal de EOIR de no continuar un caso, o de cerrarlo, según las prioridades de la agencia.',
        },
        {
          term: 'Adjustment of status',
          def: 'Cambiar el estatus a residencia permanente (green card) sin salir de Estados Unidos.',
        },
        {
          term: 'Order of removal',
          def: 'La decisión final de la corte de que una persona debe ser expulsada.',
        },
        {
          term: 'Stay of removal',
          def: 'Una suspensión temporal de la ejecución de una orden de expulsión.',
        },
        {
          term: 'Motion to reopen, motion to reconsider',
          def: 'Una solicitud para que el caso se revise de nuevo, con base en hechos nuevos o en un error de la decisión.',
        },
        {
          term: 'Appeal to the BIA (apelación)',
          def: 'Impugnar la decisión de un juez de inmigración ante la Junta de Apelaciones de Inmigración.',
        },
        {
          term: 'Habeas corpus',
          def: 'Un caso aparte presentado en una corte federal de distrito — no en EOIR — sobre si la detención en sí es legal, bajo `28 U.S.C. § 2241`. Lo prepara y presenta un abogado.',
        },
      ],
    },

    { kind: 'h2', text: 'Estatus y documentos' },
    {
      kind: 'terms',
      items: [
        {
          term: 'LPR, green card',
          def: 'Lawful Permanent Resident — el estatus de residente permanente de EE. UU.',
        },
        {
          term: 'EAD',
          def: 'Employment Authorization Document — el permiso de trabajo, distinto de la green card.',
        },
        {
          term: 'TPS',
          def: 'Temporary Protected Status — un estatus temporal para ciudadanos de ciertos países a los que no es seguro regresar (desastre natural, conflicto armado).',
        },
        {
          term: 'Naturalization (naturalización)',
          def: 'El proceso para obtener la ciudadanía de EE. UU.',
        },
        {
          term: 'Sponsor, petitioner (patrocinador)',
          def: 'La persona u organización que presenta una petición a favor de un familiar o trabajador para que pueda obtener un estatus.',
        },
      ],
    },

    {
      kind: 'onward',
      related: [
        { page: 'anum', label: 'Dónde encontrar el número A' },
        { page: 'forms', label: 'Formularios y avisos: qué son' },
        { page: 'habeas', label: 'Habeas corpus — en detalle' },
        { page: 'deadlines', label: 'No faltar a la audiencia' },
        { page: 'verify', label: 'Verificar al abogado' },
      ],
    },
  ],
}

export default c
