import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Habeas corpus · corte federal',
  lede: 'El camino por el que más se logra la salida ahora. Explicamos cómo funciona. La petición la prepara y la presenta un abogado — esto es un mapa, no instrucciones para presentarla por su cuenta.',
  blocks: [
    {
      kind: 'callout',
      tone: 'n',
      title: 'Qué es',
      body: [
        'El habeas corpus es una petición a una corte federal de distrito: un juez examina si el gobierno mantiene detenida a la persona legalmente.',
        'Es otro sistema, no la corte de inmigración. El juez federal no responde a la agencia: puede exigir explicaciones al gobierno, ordenar una audiencia de salida — u ordenar la salida.',
      ],
    },
    { kind: 'h2', text: 'Por qué se habla de esto ahora' },
    {
      kind: 'p',
      text: 'Desde 2025 la fianza y el parole se conceden muy rara vez, y el centro de gravedad se movió a las cortes federales: en febrero de 2026 se presentaban en el país unas 2,000 peticiones de habeas por semana — un año antes eran unas 20. Jueces federales de todas las posturas fijan audiencias y ordenan salidas cuando la petición está bien preparada.',
    },
    {
      kind: 'p',
      text: 'Los abogados de AILA, la asociación de abogados de inmigración, lo dicen claro: para un número creciente de detenidos, el habeas en la corte federal es en la práctica el único camino a la libertad.',
    },
    {
      kind: 'p',
      dim: true,
      text: 'Estado a julio de 2026. Es el panorama general, no una predicción para un caso concreto.',
    },
    { kind: 'h2', text: 'Cómo funciona' },
    {
      kind: 'list',
      items: [
        'La petición se presenta en la corte federal de distrito del lugar de detención — por eso importa tanto dónde está el centro',
        'Un traslado a otro estado cambia la corte y las reglas aplicables — una razón más para no esperar',
        'Junto con la petición, el abogado puede pedir una orden judicial urgente contra el traslado o la deportación (TRO)',
        'El juez puede fijar una audiencia, ordenar la salida — o negar: el resultado depende del caso concreto',
        'La petición la prepara y la presenta un abogado — es trabajo para un jurista con práctica federal',
      ],
    },
    { kind: 'h2', text: 'Su parte — la preparación' },
    {
      kind: 'list',
      items: [
        'El expediente de lazos con EE. UU.: dirección, años de residencia, familia, trabajo, comunidad — las tareas están en el cuestionario',
        'La cronología: cuándo y dónde detuvieron a la persona, cuándo la trasladaron, qué papeles le dieron',
        'El número A y el nombre exacto del centro',
        'Documentos médicos, si hay enfermedades',
      ],
    },
    { kind: 'ilink', page: 'intake', label: 'Su lista de tareas' },
    { kind: 'ilink', page: 'docpack', label: 'Armar el paquete de documentos para el abogado' },
    { kind: 'h2', text: 'Preguntas para el abogado' },
    {
      kind: 'list',
      items: [
        'Si el habeas encaja en este caso, y por qué',
        'En qué circuito federal está el centro y qué cambia eso',
        'Qué hace falta de la familia y para cuándo',
        'Qué cambia si trasladan a la persona a otro estado',
      ],
    },
    {
      kind: 'callout',
      tone: 'r',
      title: 'Lo que no hacemos',
      body: [
        'No preparamos ni presentamos peticiones y no damos asesoría legal. Solo un abogado puede determinar si este camino aplica a un caso concreto.',
        'Si alguien que no es un abogado con licencia verificada promete «presentar el habeas» y una salida rápida por dinero — verifíquelo en los registros.',
      ],
    },
    { kind: 'ilink', page: 'attorney', label: 'Abogado: tres caminos' },
    { kind: 'ilink', page: 'verify', label: 'Verificar al abogado' },
  ],
}

export default c
