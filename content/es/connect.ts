import type { PageContent } from '@/lib/types'

const c: PageContent = {
  title: 'Llamadas, dinero, cartas',
  lede: 'Él la llama a usted — usted a él casi nunca. Las llamadas se pagan según las tarifas del operador y tienen tiempo limitado.',
  blocks: [
    {
      kind: 'callout',
      tone: 'g',
      title: '9233# — gratis desde adentro',
      body: [
        'Marcar `9233#` conecta con la Línea Nacional de Detención y es gratis desde el centro. Funciona cuando la cuenta está en cero — es decir, en el momento más difícil.',
      ],
    },
    { kind: 'h2', text: 'Cómo funciona la cuenta de llamadas' },
    {
      kind: 'list',
      items: [
        'Mientras no haya dinero en la cuenta, no hay contacto — no se puede llamar hacia adentro, solo él llama',
        'Opción 1: recargar el saldo personal del detenido — él llama a quien quiera',
        'Opción 2: vincular una cuenta a su número — llamadas solo a usted, normalmente cuesta menos según las tarifas del propio operador',
        'El operador depende del centro: GettingOut, Securus, ConnectNetwork. En Adelanto hay tabletas Talton',
      ],
    },
    {
      kind: 'callout',
      tone: 'y',
      title: 'En la aplicación GettingOut el pago no funciona',
      body: [
        'La aplicación muestra el saldo y los mensajes, pero no permite poner dinero. Hay que recargar por el sitio web del operador en el navegador.',
        'Con otros operadores pasa igual: si la aplicación no tiene botón de pago — busque el sitio web, no reinstale la aplicación.',
      ],
    },
    {
      kind: 'callout',
      tone: 'y',
      title: 'Un traslado a otro centro cambia el operador',
      body: [
        'El dinero en la cuenta del operador anterior no viaja con la persona. No deposite mucho de una vez.',
      ],
    },
    { kind: 'h2', text: 'Antes de la primera llamada' },
    {
      kind: 'p',
      text: 'Quite el bloqueo de números desconocidos — la llamada llegará de un número desconocido. Las instrucciones para iOS y Android están en la página de la primera llamada.',
    },
    { kind: 'ilink', page: 'firstcall', label: 'La primera llamada' },
    { kind: 'h2', text: 'Cartas y postales' },
    {
      kind: 'list',
      items: [
        'Una postal por correo normal llega mejor que cualquier servicio',
        'Libros: solo nuevos y enviados directamente por una tienda o editorial, no por un particular',
        'Pasta blanda: la pasta dura tarda más en revisarse y muchas veces no entra',
        'El número A es obligatorio en el sobre y en todo lo que envíe',
        'Cada centro tiene sus propias reglas — confirme por teléfono antes de enviar',
      ],
    },
    {
      kind: 'p',
      dim: true,
      text: 'El contacto cálido y regular es lo que más protege a una persona adentro.',
    },
  ],
}

export default c
