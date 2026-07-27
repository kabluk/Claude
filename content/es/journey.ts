import type { JourneyContent } from '@/lib/types'

const c: JourneyContent = {
  title: 'El camino',
  lede: 'Quince pasos después de encontrar a la persona. No es su plan — es un mapa del proceso: mostramos todos los pasos que existen. Seis están abiertos, el resto en preparación.',
  soonLabel: 'EN PREPARACIÓN',
  steps: [
    { t: 'Encontrado · dónde está', p: 'El centro, el estado, el circuito. Desde aquí todo se vuelve concreto.', page: 'where' },
    { t: 'Mantener el contacto', p: 'La cuenta de llamadas, cartas y postales, libros. Por qué no se puede llamar hacia adentro.', page: 'connect' },
    { t: 'La visita', p: 'Horarios, cómo apuntarse, documentos, qué no se puede llevar.' },
    { t: 'Dos caminos: fianza o no', p: 'Qué categorías existen y quién lo determina. Una pregunta para el abogado.' },
    { t: 'Abogado', p: 'Gratis, representante acreditado, de pago. Se puede buscar por idioma.', page: 'attorney' },
    { t: 'Cómo se cuenta el dinero del abogado', p: 'Tarifas, fases, el anticipo, qué debe estar en el contrato.' },
    { t: 'Obligado', p: 'Quién puede pagar la fianza, cómo pedirlo, qué hacer si no hay nadie.', page: 'sponsor' },
    { t: 'Documentos', p: 'Una fila de tareas, de una en una. Fotos del teléfono — un PDF limpio para el abogado.' },
    { t: 'La audiencia de fianza', p: 'Quién asiste, qué mira el juez, qué pasa después de la decisión.' },
    { t: 'Dieron fianza · cómo pagar', p: 'CeBONDS, formulario I-352, recibo I-305, fiadores.', page: 'bondpay' },
    { t: 'Negaron la fianza', p: 'Qué mecanismos existen en general. Elegir el camino — con el abogado.' },
    { t: 'Salió · qué sigue', p: 'Presentaciones, control electrónico, cambio de dirección. El caso continúa.' },
    { t: 'La primera audiencia en la corte', p: 'La audiencia inicial y en qué se diferencia de la audiencia de fondo.' },
    { t: 'No faltar', p: 'Recordatorios 14, 3 y 1 día antes. Formulario EOIR-33 al mudarse.', page: 'deadlines' },
    { t: 'El juego largo', p: 'El caso dura meses y años. Qué seguir acumulando todo ese tiempo.' },
  ],
  tracksTitle: 'Vías paralelas',
  tracks: [
    { t: 'Hijos', p: 'La escuela, el consentimiento médico, qué decirle al niño. En preparación.' },
    { t: 'El dinero de la familia', p: 'La renta, el salario perdido, la conversación con el empleador. En preparación.' },
    { t: 'Lo trasladaron', p: 'Un traslado reinicia al abogado, el dinero de la cuenta y al obligado. Qué rehacer. En preparación.' },
    { t: 'Salud', p: 'Medicamentos, enfermedades crónicas, acceso a la información médica. En preparación.' },
  ],
  note: 'Los pasos sin terminar están marcados honestamente «en preparación». Ver la escala del camino completo es útil en sí: el caso no termina con la salida.',
}

export default c
