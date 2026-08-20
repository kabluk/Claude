# Пакет ES-контента на вычитку носителем

Собран автоматически: `node scripts/gen-es-review.mjs`. Пакет читает исходники,
поэтому всегда соответствует текущему сайту.

**Целевой диалект:** US Spanish (мексиканский/центральноамериканский) —
читатели живут в США. НЕ español de España.

**Регистр:** везде **usted**, без исключений. Императивы формы `tú`
(`Responde`, `Recibe`, `Sigue`) — ошибка.

**Аудитория и тон:** семьи людей, задержанных иммиграционной службой, часто
в первые часы после задержания. Нужен спокойный, конкретный, человеческий
язык — не юридический и не корпоративный.

**Важно:** мы не даём юридических советов. Формулировки вида «вы имеете
право», «вам следует», «мы рекомендуем», «ваш лучший вариант» недопустимы
по построению продукта — если такая фраза встретится, это ошибка, сообщите.

**Уже вычитано (в пакет не входит):** `es/home.ts` (16.08.2026), `es/firstcall.ts` (16.08.2026), `es/deadlines.ts` (16.08.2026), `es/journey.ts` (16.08.2026).

**Частично вычитано:** `content/intake/es.ts` — носитель нашёл там отдельные
ошибки (регистр в скрипте разговора, кальки), они исправлены, но файл самый
большой и остаётся в пакете целиком. Это самый важный раздел: опрос формирует
персональный список задач, его читают все.

На главной странице носитель нашёл такие кальки с английского — их стоит
искать и здесь:

| Было | Стало |
|---|---|
| pago perdido | pago atrasado |
| resultado vacío | cuando no aparece en el sistema |
| dice para qué es | indica para qué sirve |
| sobre qué callar | qué no decir |
| abogados concretos | abogados específicos |
| arreglar el contacto | establecer contacto |
| sale su mensaje | se le notifica |
| fondear la cuenta | recargar la cuenta |
| gente viva de al lado | personas que tiene cerca |
| el juego largo | el proceso a largo plazo |
| transcripciones de impuestos | declaraciones de impuestos |
| talones de pago | recibos de nómina |
| verificación de entrada | verificación de inicio de sesión |
| no es por fuga | no es por evadir a la corte |
| jurista | abogado |
| pasta blanda | pasta suave |
| billetera | cartera |
| bodega (= магазин в мекс.) | almacén de depósito (storage) |

Ниже — 1201 фрагментов по разделам. Отмечать нужно только те, где текст
звучит неестественно или неверно; остальное можно пропускать.

**Если времени мало — порядок важности.** Первые три раздела люди читают
в первые часы после задержания, ошибка там дороже всего:

1. `es/where.ts` — как найти человека
2. `es/firstcall.ts` — первый звонок
3. `es/documents.ts` — что означают бумаги и что не подписывать
4. `es/connect.ts`, `es/visit.ts` — связь и свидания
5. `content/intake/es.ts` — опрос (самый объёмный раздел)
6. остальное — справочники, служебные страницы, интерфейс

---

## Dónde encontrar el número A  (`es/anum.ts`)

- Dónde encontrar el número A
- Qué es el número A y dónde encontrarlo (EAD, green card, NTA) · DETNAV
- El Alien Number es la llave de nueve dígitos para el localizador de ICE, la corte y el abogado. Dónde está impreso: el permiso de trabajo (EAD), la green card, el Notice to Appear, cartas de USCIS.
- Es la llave para todo: la búsqueda, el abogado, la corte. Probablemente ya está en su casa.
- La letra `A` y nueve dígitos. A veces con guiones o espacios.
- Ocho dígitos también está bien: se agrega un cero al inicio. El número está en la pulsera.
- Dónde buscar en casa
- Cualquier carta de la corte de inmigración o de USCIS — la agencia que da los permisos de trabajo y las green cards
- El permiso de trabajo, aunque esté vencido
- Recibos de pago de cuotas, copias de solicitudes viejas
- Documentos de un caso anterior, si lo hubo
- La carpeta de documentos que se guarda «por si acaso»
- Si encuentra una carta, fotografíela ya
- Completa, todas las páginas. El número casi seguro está ahí, y el papel se puede perder.
- Si no hay nada en casa
- El número se puede preguntar en la primera llamada. Cómo hacer esa llamada está en otra página.
- La primera llamada

---

## Abogado  (`es/attorney.ts`)

- Tres caminos, todos legítimos. Mostramos todos — cuál sirve lo deciden usted y quienes conocen el caso.
- No existe el abogado de oficio
- En el proceso de inmigración el gobierno no proporciona abogado. La ayuda gratuita existe, pero con listas de espera, y no toman a todos.
- La salida ahora se logra más a menudo por la corte federal — la petición de habeas corpus. Solo un abogado puede prepararla y presentarla, así que el abogado no es una de las opciones sino la figura central del caso.
- Camino 1 · Gratis
- La lista de ayuda gratuita de EOIR — el servicio que administra las cortes de inmigración
- El programa de orientación legal dentro del propio centro
- Organizaciones locales sin fines de lucro — llame a varias a la vez, en todas hay filas
- Pregunte si toman casos de detenidos y si trabajan con este centro
- Lista pro bono de EOIR
- Catálogo de ayuda gratuita y de bajo costo
- El consulado del país de la persona debe ser notificado de la detención de su ciudadano; la ayuda puede ser importante, pero pedirán prueba de parentesco.
- Camino 2 · Representante acreditado
- No es abogado, pero representa legalmente
- Los representantes acreditados del Departamento de Justicia pueden llevar casos en la corte de inmigración. Muchas veces gratis o de bajo costo. El camino más subestimado.
- Se verifican en el registro oficial — el enlace está en la página de verificación.
- Camino 3 · De pago
- Antes de pagar — la verificación en los tres registros, tres minutos
- El contrato escrito es obligatorio: qué incluye, qué no, cómo se calcula el precio
- Pregunte por el anticipo y la unidad mínima de facturación — las conversaciones con la familia también se cobran
- Verificar al abogado
- Si la persona detenida tiene hijos
- Una directiva de ICE (11064.4, julio de 2025) obliga a tener en cuenta los derechos parentales: participación en la corte de familia, contacto con los hijos, organizar el cuidado antes de cualquier traslado o expulsión.
- Es más débil que la anterior, pero sigue vigente — pida al abogado que la invoque si la persona tiene hijos menores.
- Se puede buscar por idioma
- La práctica es federal
- Un abogado con licencia de cualquier estado puede llevar un caso de inmigración en cualquier estado — la entrada al caso se hace con el formulario `EOIR-28`.
- Por eso se puede buscar por idioma y no por la cercanía de la oficina. El directorio de AILA tiene filtro por idioma.
- Buscador de AILA · filtro por idioma
- ABA Free Legal Answers

---

## Si algo anda mal en el centro  (`es/complaints.ts`)

- Si algo anda mal en el centro
- Malos tratos, negación de medicamentos, pertenencias perdidas — esto se documenta y se denuncia. En 2026 la supervisión del gobierno se ha recortado mucho, así que lo principal es registrar y apoyarse en organizaciones y en el abogado.
- Amenaza a la vida o urgencia médica
- Si la persona está en peligro inmediato o le niegan atención médica urgente — llame a la línea de abajo de inmediato y avise al abogado. Puede formar parte de una petición federal de habeas.
- Qué hacer, paso a paso
- Anote todo: fecha, hora, qué pasó, nombres del personal, quién lo vio.
- Llame a la línea gratuita de Freedom for Immigrants — ayudan a documentar las violaciones.
- Avise al abogado: las condiciones y la falta de atención médica pueden influir en el caso y en una petición federal.
- Si lo desea, presente una queja oficial ante DHS (canales abajo).
- 9233# — una línea gratuita desde adentro
- Marcar `9233#` desde un teléfono del centro llega a la línea de Freedom for Immigrants. ICE no la monitorea; los voluntarios hablan muchos idiomas y ayudan a documentar una violación y a conectarlo con defensores.
- Canales oficiales
- DHS OIG — Inspector General
- quejas por abuso, negligencia y malos tratos
- La Oficina de Derechos Civiles y Libertades Civiles de DHS (CRCL) recibe quejas sobre las condiciones en línea — enlace abajo.
- Presentar una queja de derechos civiles (CRCL)
- Con honestidad sobre la supervisión en 2026
- La Oficina del Ombudsman de Detención (OIDO) cerró y la oficina de derechos civiles fue recortada. No cuente con una respuesta rápida del gobierno.
- Por eso la documentación y el abogado importan más que nada: los hechos que reúna funcionan en la corte federal y en manos de las organizaciones de defensa.
- No presentamos quejas por usted y no damos asesoría legal. Mostramos a dónde acude la gente y qué es importante registrar.
- Abogado: tres caminos
- Habeas corpus · corte federal

---

## Cómo comunicarse con la persona  (`es/connect.ts`)

- Cómo comunicarse con la persona
- La regla clave: él puede llamarla a usted. Usted no puede llamarlo a él. Abajo, paso a paso — llamadas, mensajes, video, dinero y cartas.
- Por dónde empezar
- Averigüe qué operador telefónico usa su centro.
- En su propio teléfono, desactive el bloqueo de números desconocidos — si no, él no podrá comunicarse.
- Abra una cuenta y ponga un poco de dinero.
- 1 · Llamadas
- Él llama desde los teléfonos de la unidad de vivienda. Usted no puede llamarlo — solo él puede llamarla. Si la cuenta está en cero, no hay llamadas.
- Cómo activar las llamadas
- Averigüe el operador del centro — casi siempre es `GettingOut` (la empresa ViaPath); algunos usan `Securus` o `ICSolutions`.
- Abra el sitio del operador en el navegador (o su aplicación) y cree una cuenta.
- Vincule la cuenta por el `A-Number` y el centro.
- Elija cómo: recargar su cuenta personal — él llama a cualquiera; o vincularla a su número (AdvancePay) — él la llama solo a usted, y normalmente cuesta menos.
- Ponga poco — el mínimo suele ser `$10`. Si lo trasladan a otro centro, el dinero no se mueve con él.
- Sitio de GettingOut — cuenta para llamadas y mensajes (la aplicación está ahí mismo)
- Sitio de Securus — si el centro usa Securus
- Sitio de ICSolutions — si el centro usa ICSolutions
- 9233# — gratis y sin monitoreo
- Marcar `9233#` desde un teléfono del centro llega a la línea gratuita de Freedom for Immigrants. Las llamadas normales se graban; ICE no monitorea esta.
- Los voluntarios hablan muchos idiomas, ayudan y pueden avisar a su familia dónde está la persona. Horario: lun–vie, 8 a.m.–8 p.m. hora del Pacífico.
- Una llamada normal se graba y tiene tiempo limitado (unos 15–20 minutos). El precio ronda 7 centavos por minuto a nivel nacional, y las internacionales cuestan más; varía según el centro. Decir el A-Number por teléfono es seguro; los detalles del caso no. El programa de llamadas gratuitas que tenían algunos centros lo eliminó ICE en 2026 — cuente con que la comunicación se paga.
- La primera llamada: cómo desbloquear números
- 2 · Mensajes (texto)
- No son mensajes de texto normales a un teléfono. Son mensajes dentro del sistema del operador — él los lee en una tableta.
- Cómo enviar
- El mismo operador y la misma cuenta que para las llamadas.
- Abra la sección «Messages» en el sitio del operador.
- Pague «estampillas» (créditos) — en el sitio, por teléfono o en la aplicación, mínimo suele ser `$10`.
- Con ese mismo dinero puede enviar una foto y un videomensaje de 30 segundos.
- No todos los centros tienen tabletas. La entrega se demora y todo se revisa.
- 3 · Videollamadas
- Algunos centros tienen videollamadas — con cita previa, por el sitio del operador o un quiosco en el vestíbulo. De pago, y la cuenta hace falta con anticipación.
- Esto no es una visita en persona — tiene sus propias reglas y horarios.
- La visita
- 4 · Dinero para lo diario (adentro)
- Esta es una cuenta aparte — no la de las llamadas. De ella la persona compra comida, higiene y a veces tiempo de teléfono adentro. A menudo es otro proveedor.
- Cómo depositar
- Busque las instrucciones de dinero en la página de este centro en ICE (la sección commissary / trust account) — los datos cambian por centro.
- Los métodos, los que haya — depende del lugar: en línea con tarjeta con el proveedor (`Access Corrections`, `TouchPay`, `ViaPath/ConnectNetwork`, `Western Union`); por teléfono con el proveedor; por correo con un money order a la dirección del centro; en persona en un quiosco del vestíbulo.
- Todos piden el nombre completo y el `A-Number` (a menudo también la fecha de nacimiento).
- Deposite solo con el proveedor indicado para este centro. Tras un traslado el dinero se queda atascado y es difícil recuperarlo.
- Si no hay quién ayude
- El Freedom for Immigrants Commissary Fund pone dinero en la cuenta de quienes no tienen a nadie.
- El dinero para lo diario no se puede retirar en efectivo — solo se gasta adentro.
- 5 · Cartas y postales
- Una postal común por correo llega más seguro que cualquier servicio
- El A-Number va en el sobre y en cada envío, siempre
- Libros — solo nuevos y directamente de una tienda o editorial, no de un particular
- La pasta suave pasa más rápido: la dura se revisa más y muchas veces no entra
- Cada centro tiene sus reglas — confirme por teléfono antes de enviar
- El contacto cálido y regular es lo que más protege a la persona adentro.

---

## Справочник: штаты и учреждения  (`es/directory.ts`)

- Circuito de D.C.
- Circuito de apelación
- La dirección se confunde
- En otros sitios aparece un número distinto. La dirección oficial para correo es la de arriba.
- Cartas y postales
- Una postal por correo normal llega mejor que cualquier servicio
- Libros: solo nuevos y enviados directamente por el vendedor
- Pasta suave: la pasta dura tarda más en revisarse y muchas veces no entra
- El número A es obligatorio en el sobre
- Página del estado
- Cortes, centros y ayuda gratuita — por estado.
- Cortes de inmigración
- Ayuda gratuita
- Lista pro bono de EOIR
- Mapa de centros y recursos de Freedom for Immigrants
- Catálogo de ayuda gratuita y de bajo costo
- En este estado existen programas de representación financiada — vea las listas abajo.
- Las listas y los teléfonos cambian. Última revisión: 27 de julio de 2026.
- {name} ({city}, {st}) — encontrar a un detenido, cartas, plazos · DETNAV
- {name} en {city}, {st}: dirección para cartas, cómo encontrar a una persona detenida en el localizador de ICE, cómo mantener contacto y cuánto suele durar la detención. Gratis, en tres idiomas.
- Centro de detención de ICE en {city}, {st}. Cómo encontrar a una persona, a dónde escribir y qué hacer después.
- Oficina de ICE
- Código postal
- Una persona puede estar aquí — qué hacer
- Encontrar a una persona en el localizador de ICE
- La primera llamada: qué preguntar y qué no decir
- La visita: las reglas y qué llevar
- Llamadas, mensajes y dinero en la cuenta
- La dirección y la asignación vienen de datos de ICE recopilados por el Deportation Data Project (junio de 2026). Los teléfonos y horarios no se publican aquí — confírmelos en la página oficial de ICE o llamando al centro.
- Centros de ICE
- Lista de centros de detención de ICE por estado — direcciones y cómo encontrar a un detenido · DETNAV
- Todos los centros de detención de ICE según datos oficiales: direcciones, estados, circuitos de apelación. Cómo encontrar a una persona detenida y mantener contacto. Gratis, EN/ES/RU.
- Centros de detención según datos oficiales de ICE — por estado. Cada uno con dirección, reglas de correo y plazos típicos.
- La lista se construye con datos de ICE (Deportation Data Project, junio de 2026). Un centro pudo abrir o cerrar después de esa fecha.

---

## Paquete de documentos para el abogado  (`es/docpack.ts`)

- Paquete de documentos para el abogado
- Usted fotografía los documentos — y recibe un PDF ordenado con portada e índice. Todo ocurre en este navegador: los archivos no van a ningún servidor.
- Para qué sirve
- Un abogado que recibe cuarenta fotos sin rotular pasa horas ordenándolas — y esas horas las paga la familia. El mismo paquete con portada e índice toma minutos.
- La portada se arma sola: qué hay dentro por secciones, qué falta todavía, la fecha y el número del paquete.
- No espere a tenerlo todo
- Al abogado le sirve más la mitad de los documentos hoy que todo dentro de un mes. El paquete tiene número: el siguiente simplemente complementa este.
- Cómo funciona
- Cada foto se comprime en el navegador — treinta páginas ocupan unos 10 MB y pasan por cualquier correo
- Las fotos se guardan solo en este navegador, en este dispositivo. Nosotros no las vemos ni las recibimos
- Las páginas se agrupan por secciones del expediente, y cada una se puede rotular: qué es y de qué año
- El PDF se nombra por el número A y la fecha, sin el nombre de la persona
- Un paquete grande se corta en partes automáticamente: el correo no acepta archivos de más de 25 MB
- Después de enviarlo, las fotos se pueden borrar del navegador con un botón
- Lo que no hacemos
- No enviamos los archivos nosotros y no los guardamos: el botón «Compartir» abre el menú de su propio teléfono, y el paquete viaja por su correo o mensajería. Qué necesita un caso concreto lo determina el abogado.
- La lista de tareas: qué documentos juntar
- El cuestionario arma la lista de papeles según sus respuestas.
- Abogado: tres caminos

---

## Qué significan estos papeles  (`es/documents.ts`)

- Qué significan estos papeles
- Los papeles de inmigración explicados: la NTA, órdenes y qué no firmar · DETNAV
- Qué significan los papeles de un caso de inmigración — el Notice to Appear, decisiones, formularios para firmar — y qué no firmar sin un abogado. La página funciona sin internet.
- Esta página funciona sin internet. Guárdela.
- GUARDAR Y COMPARTIR
- Estoy ejerciendo mi derecho a guardar silencio. No firmaré documentos sin un abogado.
- I am exercising my right to remain silent. I will not sign documents without an attorney.
- Tome una captura de pantalla de esta tarjeta y compártala por WhatsApp — funciona sin cuenta y sin internet.
- Qué hace cada documento
- Salida voluntaria
- Significa aceptar irse por cuenta propia y renunciar a la audiencia en la corte. Después de firmar, el caso no llega al juez.
- Orden de deportación estipulada
- Aceptar una orden de expulsión sin audiencia. El juez no revisa el caso.
- «Firma y sales más rápido»
- Esta frase aparece con frecuencia en los relatos de detenciones. Firmar estos documentos termina el caso; no acelera la salida.
- Un detainer (ICE hold) — si la persona sigue en una cárcel local
- Un detainer es una solicitud de ICE a una cárcel local para retener a la persona hasta 48 horas después de cuando debía ser liberada, para que ICE pueda recogerla. Es una solicitud, no una orden judicial.
- La cárcel no está obligada a cumplirla, y si ICE no llega dentro de las 48 horas (los fines de semana y feriados cuentan), la persona debe ser liberada. Esto es una pregunta para el abogado de defensa penal.
- Lo que publican las organizaciones
- ACLU, FIRRP e ILRC publican la recomendación de no firmar ningún documento antes de hablar con un abogado, y de dar solo el nombre propio.
- Diccionario de formularios y avisos

---

## Formularios y avisos: qué son  (`es/forms.ts`)

- Formularios y avisos: qué son
- Un diccionario corto de los papeles que entregan en la detención y en la corte. Solo «qué es», sin consejos. Muestre cualquiera de ellos a un abogado.
- Una orden de ICE suele ser administrativa, no judicial
- La orden de arresto (formulario `I-200`) la firma un oficial de ICE, no un juez. Las organizaciones de defensa (ACLU, NILC) explican: esa orden no da derecho a entrar a una casa sin consentimiento — a diferencia de una orden judicial, que la firma un juez de la corte.
- Se verifica por la firma: una orden judicial tiene la firma de un juez y el nombre de una corte. Puede pedir que le muestren el documento por una ventana o que lo pasen por debajo de la puerta.
- Papeles frecuentes
- I-862 · Notificación de comparecencia (NTA)
- El documento con el que el gobierno inicia un caso de expulsión en la corte de inmigración. Enumera las alegaciones sobre la persona y los cargos. Puede indicar la fecha de la primera audiencia; si no, la corte envía un Aviso de Audiencia aparte.
- I-200 · Orden de arresto
- Una orden administrativa de ICE para la detención (vea el recuadro de arriba — no es judicial).
- I-205 · Orden de expulsión
- Se emite cuando en el caso ya se dictó una orden final de expulsión.
- I-286 · Notificación de determinación de custodia
- La decisión de ICE sobre si mantener a la persona bajo custodia. Aquí puede figurar un monto de fianza, si se fijó uno.
- I-220A · Orden de liberación bajo palabra
- Liberación condicional de la custodia, con la obligación de asistir a todas las audiencias y cumplir las condiciones.
- EOIR-33 · Cambio de dirección
- El formulario de la corte para informar una nueva dirección dentro de los 5 días hábiles de mudarse. No enviar este aviso es una causa frecuente de que una persona falte a una audiencia.
- Formularios oficiales de la corte (EOIR)
- EOIR-33 · cambio de dirección en línea
- No interpretamos sus papeles y no damos consejos. Qué significa un documento concreto y qué hacer con él lo determina solo un abogado.
- Qué no firmar
- No faltar a la audiencia
- Glosario de términos: ICE, EOIR, BIA y más

---

## Glosario de términos  (`es/glossary.ts`)

- Glosario de términos
- Glosario del caso de inmigración: ICE, EOIR, habeas corpus y más · DETNAV
- Qué significan ICE, EOIR, BIA, NTA, bond, credible fear, habeas corpus y otros términos del caso de inmigración y la detención. Definiciones claras, sin consejos.
- Palabras que aparecen en los papeles, las llamadas y las conversaciones con el abogado. Solo definiciones — qué significa el término, no qué hacer con él.
- Esto es un diccionario, no asesoría legal
- Las definiciones de abajo son generales y no toman en cuenta un caso concreto. Algunas reglas cambian según el estado y el circuito de apelación, y el texto de la ley es más preciso que este resumen breve. Cómo se aplica un término a un caso en particular lo determina un abogado.
- Quién es quién
- Servicio de Inmigración y Control de Aduanas (Immigration and Customs Enforcement). Agencia del Departamento de Seguridad Nacional (DHS) que localiza, detiene y expulsa a personas sin estatus legal dentro del país.
- Enforcement and Removal Operations — la parte de ICE que hace los arrestos, mantiene a las personas bajo custodia y organiza las expulsiones.
- Servicio de Aduanas y Protección Fronteriza (Customs and Border Protection). Opera en la frontera, los puertos y los aeropuertos; es una agencia distinta de ICE.
- Servicio de Ciudadanía e Inmigración (U.S. Citizenship and Immigration Services). Procesa solicitudes de estatus — green card, ciudadanía, permiso de trabajo. No realiza detenciones.
- Departamento de Seguridad Nacional (Department of Homeland Security). La agencia principal de la que dependen ICE, CBP y USCIS.
- Oficina Ejecutiva de Revisión de Inmigración (Executive Office for Immigration Review). Parte del Departamento de Justicia, separada del DHS. Atiende los casos de expulsión.
- Juez de inmigración (Immigration Judge, IJ)
- Un juez de la corte de inmigración de EOIR, nombrado por el Departamento de Justicia — no es lo mismo que un juez federal.
- Junta de Apelaciones de Inmigración (Board of Immigration Appeals). Atiende las apelaciones de las decisiones de un juez de inmigración.
- Oficial del caso (Deportation officer, Officer of Record)
- El oficial de ICE ERO asignado al caso de una persona detenida en particular.
- Field office
- Oficina regional de ICE ERO que cubre un área determinada. Vea la página para buscar la oficina.
- Detención y estatus
- Número A, expediente (A-file)
- Un número de nueve dígitos asignado a una persona en el sistema de inmigración, y el expediente de documentos que se guarda bajo ese número. La llave para buscar en los registros de ICE y EOIR.
- Detainer (retención de ICE)
- Una solicitud de ICE a una cárcel local o a la policía para retener a una persona por un tiempo adicional — normalmente hasta 48 horas — después de cuando debería quedar en libertad, para que ICE pueda tomar custodia.
- Mandatory detention
- Custodia sin audiencia aparte sobre la posibilidad de fianza, cuando aplica al caso — por ejemplo, bajo ciertas causas penales (`INA § 236(c)`).
- Bond (fianza)
- Un pago en dinero con el que se asegura la salida de una persona de la custodia de ICE mientras el caso está pendiente.
- Bond hearing (audiencia de fianza)
- Una audiencia aparte ante un juez de inmigración sobre el monto de la fianza, o sobre si se fija alguna.
- Alternatives to Detention — formas de supervisión fuera de un centro de detención: un grillete electrónico, una aplicación de reportes o citas programadas.
- Intensive Supervision Appearance Program — un programa privado de ATD que opera bajo contrato con ICE la empresa BI Incorporated.
- Check-in (reportarse)
- La obligación de presentarse periódicamente en una oficina de ICE, o de reportarse por teléfono o aplicación, como parte de ATD o después de la liberación.
- Credible fear interview
- Una entrevista con un oficial de USCIS para una persona detenida en la frontera o al reingresar al país, sobre si tiene un temor creíble de persecución en su país.
- Reasonable fear interview
- Una entrevista parecida para una persona con una orden de expulsión previa o ciertas condenas. El nivel que hay que cumplir es más alto que el de credible fear.
- El proceso judicial
- Removal proceedings (proceso de expulsión)
- El proceso judicial en EOIR que decide si una persona debe salir de Estados Unidos.
- NTA, Notice to Appear (formulario I-862)
- El documento con el que empieza el proceso de expulsión: enumera las alegaciones sobre la persona y los cargos.
- Master calendar hearing
- Una audiencia corta y administrativa: el juez revisa el estado del caso, fija la próxima fecha y anota si la persona tiene abogado.
- Individual hearing (merits hearing)
- La audiencia principal sobre el fondo del caso, donde se presentan las pruebas y se toma una decisión.
- Posponer una audiencia para una fecha posterior.
- In absentia order
- Una orden de expulsión dictada cuando la persona no se presentó a una audiencia programada.
- La corte de EOIR donde se atiende un caso en particular. Puede cambiar cuando trasladan a la persona entre centros de detención.
- Docket number (número de caso)
- El número bajo el cual el caso está registrado en la corte.
- Caminos de protección y resultados
- Asylum (asilo)
- Una forma de protección para una persona que no puede regresar a su país por persecución debido a raza, religión, nacionalidad, opinión política o pertenencia a un grupo social determinado.
- Withholding of removal
- Una protección más limitada que el asilo: impide la expulsión a un país específico, pero no lleva a una green card.
- CAT protection
- Protección bajo la Convención contra la Tortura (Convention Against Torture) — contra la expulsión a un país donde la persona enfrentaría tortura por parte del gobierno o con su consentimiento.
- Cancellation of removal
- Cancela una orden de expulsión cuando se cumplen ciertas condiciones. Las reglas son distintas para residentes permanentes legales (LPR) y para el resto.
- Voluntary departure (salida voluntaria)
- Permiso para salir de EE. UU. por cuenta propia y a su costo en lugar de una expulsión forzada. Puede tener un efecto distinto que una orden de expulsión sobre una futura entrada.
- Prosecutorial discretion
- Una decisión de ICE o de un fiscal de EOIR de no continuar un caso, o de cerrarlo, según las prioridades de la agencia.
- Adjustment of status
- Cambiar el estatus a residencia permanente (green card) sin salir de Estados Unidos.
- Order of removal
- La decisión final de la corte de que una persona debe ser expulsada.
- Stay of removal
- Una suspensión temporal de la ejecución de una orden de expulsión.
- Motion to reopen, motion to reconsider
- Una solicitud para que el caso se revise de nuevo, con base en hechos nuevos o en un error de la decisión.
- Appeal to the BIA (apelación)
- Impugnar la decisión de un juez de inmigración ante la Junta de Apelaciones de Inmigración.
- Habeas corpus
- Un caso aparte presentado en una corte federal de distrito — no en EOIR — sobre si la detención en sí es legal, bajo `28 U.S.C. § 2241`. Lo prepara y presenta un abogado.
- Estatus y documentos
- LPR, green card
- Lawful Permanent Resident — el estatus de residente permanente de EE. UU.
- Employment Authorization Document — el permiso de trabajo, distinto de la green card.
- Temporary Protected Status — un estatus temporal para ciudadanos de ciertos países a los que no es seguro regresar (desastre natural, conflicto armado).
- Naturalization (naturalización)
- El proceso para obtener la ciudadanía de EE. UU.
- Sponsor, petitioner (patrocinador)
- La persona u organización que presenta una petición a favor de un familiar o trabajador para que pueda obtener un estatus.
- Dónde encontrar el número A
- Formularios y avisos: qué son
- Habeas corpus — en detalle
- No faltar a la audiencia
- Verificar al abogado

---

## Habeas corpus · corte federal  (`es/habeas.ts`)

- Habeas corpus · corte federal
- El camino por el que más se logra la salida ahora. Explicamos cómo funciona. La petición la prepara y la presenta un abogado — esto es un mapa, no instrucciones para presentarla por su cuenta.
- Qué es
- El habeas corpus es una petición a una corte federal de distrito: un juez examina si el gobierno mantiene detenida a la persona legalmente.
- Es otro sistema, no la corte de inmigración. El juez federal no responde a la agencia: puede exigir explicaciones al gobierno, ordenar una audiencia de salida — u ordenar la salida.
- Por qué se habla de esto ahora
- Desde 2025 la fianza y el parole se conceden muy rara vez, y el centro de gravedad se movió a las cortes federales: en febrero de 2026 se presentaban en el país unas 2,000 peticiones de habeas por semana — un año antes eran unas 20. Jueces federales de todas las posturas fijan audiencias y ordenan salidas cuando la petición está bien preparada.
- Los abogados de AILA, la asociación de abogados de inmigración, lo dicen claro: para un número creciente de detenidos, el habeas en la corte federal es en la práctica el único camino a la libertad.
- Estado a julio de 2026. Es el panorama general, no una predicción para un caso concreto.
- Dos sistemas: dónde se decide la fianza y dónde el habeas
- Dos caminos hacia la libertad
- Bond · fianza
- Corte de inmigración (EOIR)
- La decide un juez de inmigración — EOIR es parte del Departamento de Justicia, un sistema de agencia
- Tras el memo de ICE de 2025 y las decisiones de la BIA, a categorías amplias no les corresponde audiencia de fianza (mandatory detention)
- Incluso una fianza aprobada no resuelve el caso de expulsión — el proceso en la corte continúa
- Habeas corpus
- Corte federal de distrito
- La decide un juez federal independiente (`28 U.S.C. § 2241`) — no responde ni a ICE ni a EOIR
- Se revisa si la detención en sí es legal — incluso donde la agencia negó la fianza
- Junto con la petición, el abogado puede pedir que se prohíba el traslado y se pause la expulsión (TRO / stay)
- Los caminos no se excluyen entre sí. Cuál aplica a un caso concreto, y en qué orden, lo determina el abogado.
- El habeas es sobre la detención — no un escudo contra la deportación
- Presentar la petición no detiene por sí sola una expulsión. La suspensión (stay) o la orden de emergencia (TRO) es una decisión aparte de la corte — el abogado la solicita.
- Si alguien le dice que presentar el habeas protege «automáticamente» contra la deportación, pregúntele al abogado qué está pidiendo exactamente a la corte en ese caso.
- Cómo funciona
- La petición se presenta en la corte federal de distrito del lugar de detención — por eso importa tanto dónde está el centro
- Un traslado a otro estado cambia la corte y las reglas aplicables — una razón más para no esperar
- Junto con la petición, el abogado puede pedir una orden judicial urgente contra el traslado o la deportación (TRO)
- El juez puede fijar una audiencia, ordenar la salida — o negar: el resultado depende del caso concreto
- La petición la prepara y la presenta un abogado con experiencia federal
- Su parte — la preparación
- El expediente de lazos con EE. UU.: dirección, años de residencia, familia, trabajo, comunidad — las tareas están en el cuestionario
- La cronología: cuándo y dónde detuvieron a la persona, cuándo la trasladaron, qué papeles le dieron
- El número A y el nombre exacto del centro
- Documentos médicos, si hay enfermedades
- Su lista de tareas
- Armar el paquete de documentos para el abogado
- Preguntas para el abogado
- Si el habeas encaja en este caso, y por qué
- En qué circuito federal está el centro y qué cambia eso
- Qué hace falta de la familia y para cuándo
- Qué cambia si trasladan a la persona a otro estado
- Lo que no hacemos
- No preparamos ni presentamos peticiones y no damos asesoría legal. Solo un abogado puede determinar si este camino aplica a un caso concreto.
- Si alguien que no es un abogado con licencia verificada promete «presentar el habeas» y una salida rápida por dinero — verifíquelo en los registros.
- Abogado: tres caminos
- La petición de habeas la prepara y la presenta un abogado — ahí empieza el camino.
- Verificar al abogado

---

## Служебные страницы (о сервисе, данные, дисклеймер)  (`es/legal.ts`)

- Acerca de
- DETNAV es un mapa para las familias de personas detenidas por las autoridades de inmigración de EE. UU., y para quienes se preparan con tiempo.
- El principio es un mapa, no un navegador. Mostramos los caminos que existen y explicamos la mecánica de cada uno. Nunca decimos «vaya por aquí»: elegir el camino le corresponde a la persona y a su abogado.
- Lo que no hacemos
- No damos asesoría legal y no evaluamos situaciones
- No recomendamos abogados específicos — mostramos los registros oficiales
- No redactamos documentos legales — explicamos y señalamos el formulario oficial
- Tres idiomas
- El inglés, el español y el ruso son iguales desde la primera pantalla. Cada página existe en los tres idiomas.
- De dónde vienen los datos
- Direcciones de centros, oficinas de ICE y estadísticas de plazos — datos de ICE obtenidos por FOIA y recopilados por el Deportation Data Project (Universidad de California)
- Cortes, formularios y procedimientos — páginas oficiales de EOIR, ICE y USCIS; junto a cada hecho hay un enlace a la fuente primaria
- Cada página muestra su fecha de revisión; las reglas cambian — la fuente primaria siempre está por encima de nuestro resumen
- Sus datos
- No somos abogados
- Una página corta, porque no hay nada que guardar.
- No guardamos nada sobre usted
- Las respuestas del cuestionario, las fotos de documentos y su lista de tareas se quedan en su teléfono. No se envían a nuestro servidor — ni una palabra, ni un archivo.
- Por eso no tenemos nada que perder, nada que vender y nada que entregar si nos lo piden.
- Cómo funciona
- No hay cuentas ni registro
- No hay analítica — ni contadores, ni píxeles, ni scripts de terceros
- El cuestionario funciona por completo en el navegador: cierre la pestaña — no queda nada
- No hay solicitudes externas en absoluto: hasta las fuentes tipográficas están en nuestro servidor
- Seguir enlaces externos no les dice a esos sitios de dónde viene usted
- El sitio de ICE, según su propio aviso, registra las direcciones IP de los visitantes — antes de ir allá lo advertimos con una pantalla aparte.
- No somos abogados y no damos asesoría legal. Todo en este sitio es información de referencia: hechos, la mecánica de los procesos y enlaces a fuentes oficiales.
- No evaluamos su situación y no predecimos resultados
- Las listas de tareas organizan asuntos cotidianos y la recolección de documentos — no son una posición legal
- Los ejemplos de texto son correspondencia cotidiana; no redactamos documentos legales
- Las reglas cambian — las páginas llevan la fecha de la última revisión
- Las preguntas sobre su caso son para un abogado o un representante acreditado del Departamento de Justicia. Cómo verificarlos está en la página de verificación.
- Verificar al abogado

---

## Para parroquias, organizaciones y empleadores  (`es/orgs.ts`)

- Apoyar el proyecto
- Todo lo que una familia necesita en la crisis es gratis y seguirá siendo gratis. Si su organización quiere apoyar el trabajo, se puede hacer con una aportación única.
- Apoyar DETNAV
- El pago ocurre en stripe.com. En detnav.com sigue sin haber formularios de pago, ni cuentas, ni datos sobre usted.
- Para parroquias, organizaciones y empleadores
- Cuando llega el problema, su gente acude a usted. Nosotros damos una herramienta que puede ponerles en las manos.
- Qué recibe su gente — gratis
- Una lista personal de tareas en 2 minutos — según las circunstancias de la familia, en tres idiomas
- La primera noche paso a paso: cómo encontrar a la persona, qué no firmar, a quién no pagar
- Verificación del ayudante en los registros oficiales — antes de entregar dinero
- El borrador del paquete de documentos para el abogado — ahorro de sus horas cobradas
- No guardamos nada: las respuestas se quedan en el teléfono, no tenemos nada que entregar
- Qué ofrecemos a las organizaciones
- Tarjetas impresas de la primera noche con su contacto — para repartir con tiempo
- Una reunión o webinar «la primera noche» para sus familias — en su idioma
- Funciones de preparación para dar a su gente con anticipación: el plan familiar y el paquete de documentos para el abogado
- Una línea directa con nosotros: sus preguntas y casos llegan primero al producto
- Por qué esto está armado con honestidad
- Todo lo que una familia necesita en la crisis es gratis para todos y seguirá siendo gratis. Las organizaciones pagan por la capacitación, los materiales y el acceso anticipado a las funciones de preparación — no por el rescate.
- Nunca tomamos un porcentaje de la fianza y no le vendemos nada a una familia en las primeras 72 horas.
- Hablar con nosotros
- Esta página normalmente la compartimos en persona. Si recibió el enlace — responda a quien se lo envió y acuerde una conversación corta: 20 minutos, sin compromisos.
- No somos abogados y no damos asesoría legal — y a su gente se lo decimos en cada página.

---

## Un plan por si hay una detención  (`es/prepare.ts`)

- El archivo es gratis y seguirá siendo gratis. Si quiere apoyar el trabajo — la cantidad que usted elija, el pago ocurre en stripe.com.
- Apoyar — cualquier cantidad
- Un plan por si hay una detención
- Plan familiar por si hay una detención de ICE — plantilla para imprimir · DETNAV
- Un plan listo para la familia: a quién llamar, quién recoge a los niños, dónde están los papeles, el poder y el banco por adelantado. Se llena a mano en papel — nada se ingresa en línea.
- Complételo a mano en papel y guárdelo en casa, para que su familia sepa qué hacer en la primera hora. No se ingresa nada en línea.
- Por qué en papel y no en una aplicación
- En la primera hora tras una detención, en casa hay pánico y las cosas simples se olvidan: el número de quién, dónde están los papeles, quién recoge a los niños. Una hoja llenada con tiempo responde esas preguntas de inmediato.
- A propósito no hacemos un formulario en línea: ningún servidor, incluido el nuestro, debe ver estos datos. Es una nota para la familia, no un cuestionario.
- Imprima esta página, complétela a mano y déjela donde su familia la encuentre. Actualícela cada pocos meses.
- A quién llamar primero
- Persona de confianza — quién y teléfono
- Segunda persona, si la primera no responde
- Abogado u organización — nombre y teléfono
- Los niños
- Quién recoge a los niños de la escuela o guardería
- Teléfono de esa persona
- Dónde están los documentos de los niños
- La casa y lo cotidiano
- Dónde están los papeles importantes (pasaportes, contratos)
- Quién paga la renta mientras no estoy
- Quién cuida a la mascota
- Los medicamentos que tomo y dónde están
- Condiciones que deben conocerse
- Qué saber de memoria
- El teléfono de la persona de confianza — memorícelo, no solo lo anote
- El código para llamar gratis a la línea de quejas del DHS OIG desde la detención: 9233#
- Arme una lista personal de tareas — con anticipación
- Una encuesta de dos minutos arma una lista de tareas según las circunstancias de la familia — tanto para una detención como para prepararse. Las respuestas se quedan en el navegador. Imprima la lista terminada y guárdela junto con este plan.
- Hacer la encuesta y recibir la lista de tareas
- Entregue el plan a una persona de confianza — hoy
- Entregue con tiempo el plan lleno y el paquete de documentos ya armado a alguien de su confianza. Así empieza a actuar en el momento en que lo detienen, en vez de perder un día en averiguar qué pasó.
- Acuerden una señal simple: cada noche usted le envía una palabra de que todo está bien. Si faltan dos noches seguidas, empieza con los pasos de abajo.
- Qué hace la persona de confianza si usted se queda en silencio
- Lo busca en el localizador de ICE — por nombre y país de nacimiento, o por el número A del plan.
- Llama al abogado o a la organización cuyos teléfonos están anotados arriba en el plan.
- No firma nada por usted ni le paga a nadie sin verificar antes.
- Le entrega al abogado el paquete de documentos que usted le dio con anticipación.
- Dinero y propiedad: solo funciona si se hace antes
- Mientras una persona está detenida, la renta, el préstamo del carro y la cuenta del banco no se detienen. Sus seres queridos solo podrán actuar legalmente por ella con documentos firmados de antemano — después ya no se pueden hacer.
- Poder financiero (durable power of attorney)
- Un poder financiero duradero, firmado ante notario a nombre de una persona de confianza, le permite a esa persona terminar legalmente el contrato de renta, recoger las pertenencias, tratar con el banco y vender el carro. Sin ese documento, el arrendador y el banco ni siquiera están obligados a atenderla.
- Se firma ante notario con anticipación. Qué facultades incluir es una pregunta para un abogado: el texto depende del estado.
- La cuenta del banco
- La verificación de inicio de sesión atada solo a SMS deja de funcionar cuando el teléfono está confiscado o la línea se corta. En la configuración del banco normalmente se puede agregar la verificación por correo electrónico — conservar el acceso al correo es más sencillo.
- Muchos bancos aceptan un poder solo en su propio formulario y solo en persona. Ir a la sucursal junto con la persona de confianza, por adelantado, quita esa barrera.
- La vivienda rentada y las pertenencias
- Un apartamento que se queda sin pagar se convierte en deuda: multas por romper el contrato, cobradores, y las pertenencias van a un almacén de depósito (storage) o a la calle. Una persona con poder puede terminar el contrato según las reglas y recoger las cosas.
- El carro financiado o en arrendamiento (lease)
- Un carro con pagos vencidos el prestamista lo recupera (repossession) y lo vende en subasta. El saldo de la deuda queda a nombre del dueño, y la parte condonada puede contarse como ingreso gravable (formulario 1099-C).
- Los caminos legales que existen: un poder con la facultad de vender el vehículo, o el traspaso oficial del préstamo o del lease a otra persona. Las condiciones están en el contrato y con el prestamista.
- Las cuentas de retiro: 401(k) e IRA
- Los ahorros en un 401(k) o IRA siguen siendo propiedad de la persona sin importar su estatus migratorio o una deportación — no se pierden.
- Al retirarlos antes de los 59½ años normalmente aplica una multa del IRS del 10% más impuestos; por eso muchas veces las cuentas se dejan crecer hasta la edad de retiro. Desde el extranjero, el estatus fiscal se certifica con el formulario W-8BEN. Qué hacer con una cuenta concreta es una pregunta para un asesor de impuestos.
- Formulario W-8BEN — página oficial del IRS
- Tres tareas para esta semana
- Cambiar la verificación de inicio de sesión del banco de SMS a correo electrónico, o agregar el correo como método de respaldo.
- Firmar ante notario un poder financiero y registrarlo en el banco en persona.
- Guardar copias del SSN/ITIN, de los contratos de renta y préstamo y de los papeles del carro en un almacenamiento cifrado, y darle acceso a la persona de confianza.
- Esto es un mapa, no consejo legal
- Qué incluir en el poder, cómo terminar un contrato y qué hacer con una cuenta de retiro dependen del estado y del contrato. Esas decisiones se toman con un abogado y un asesor de impuestos, no con una nota de internet.
- Qué llevar consigo
- El plan lleno se queda en casa. Consigo, solo la tarjeta de derechos, pequeña. Tome una foto de la tarjeta y guárdela en el teléfono.
- TARJETA DE DERECHOS · LLEVAR CONSIGO
- No quiero hablar, responder preguntas ni firmar documentos sin un abogado. No doy consentimiento para entrar a mi casa sin una orden judicial firmada por un juez.
- I do not want to talk, answer questions, or sign documents without a lawyer. I do not consent to entry into my home without a judicial warrant signed by a judge.
- No lleve consigo el plan con nombres y teléfonos
- Si lo encuentran durante una detención, contiene los nombres y direcciones de sus seres queridos. El plan se queda en casa; en el bolsillo, solo la tarjeta de derechos.
- «Qué hacer, paso a paso» — un PDF para imprimir y compartir
- Las secciones clave del sitio en un solo archivo: la primera noche, este plan, la tarjeta de derechos, llamadas y dinero, el camino, el habeas, el glosario — con todos los enlaces. Envíe el archivo a sus seres queridos e imprima una copia para la casa.
- /playbook/detnav-playbook-es.pdf
- Descargar «Qué hacer, paso a paso» (PDF, ~25 páginas)
- Qué significan los papeles y qué no firmar
- Si ya detuvieron a alguien — por dónde empezar

---

## Строки интерфейса  (`es/ui.ts`)

- ← Atrás
- Escuchar esta página
- Este navegador no puede leer en voz alta
- Todas las páginas
- No somos abogados y no damos asesoría legal. Aquí solo hay hechos y enlaces a fuentes oficiales.
- Información actualizada el 28 de julio de 2026. Las reglas cambian — mire la fecha.
- Actualizado el 28 de julio de 2026
- Cómo encontrarlo
- Dónde está el número A
- Qué significan estos papeles
- La primera llamada
- Verificar al abogado
- Llamadas, dinero, cartas
- La visita
- El camino
- Habeas corpus
- Paquete para el abogado
- No faltar a la audiencia
- Su lista de tareas
- Si algo anda mal
- Diccionario de formularios
- Glosario de términos
- Un plan por si hay una detención
- Para organizaciones
- Acerca de
- Sus datos
- No somos abogados
- La primera noche
- Va a abrir el sitio de ICE
- Según su propio aviso de privacidad, registra la dirección IP y el dominio de cada visitante.
- Nosotros no le enviamos ningún dato sobre usted.
- Pedir a otra persona que lo haga
- Comparta esta dirección con alguien que pueda hacer la búsqueda:
- Variantes de escritura del nombre — todo queda en este navegador
- Nombre y apellido tal como los conoce
- El nombre debe coincidir letra por letra. Marque con las casillas las variantes ya probadas.
- Verificar el formato del número A
- Solo dígitos, 8 o 9
- Ocho dígitos también está bien: se agrega un cero al inicio. El número está en la pulsera — se puede pedir que lo lean en voz alta.
- Imprimir esta página
- Su respuesta se queda solo en este navegador
- Lo que muestran los datos del país
- La mediana de duración de una detención es de {days} días (casos concluidos, 2024–2026).
- Alrededor del {pct}% de estas detenciones terminaron en expulsión. Al resto lo liberaron de distintas formas o lo trasladaron a otro centro.
- Es un agregado de datos pasados (Deportation Data Project), no un pronóstico para una persona concreta.
- Oficina de ICE — a dónde acudir y dónde reportarse
- Ciudad o estado
- Escriba una ciudad o estado, en inglés. La base tiene 270 oficinas de ICE (Deportation Data Project).
- Oficina de campo
- Pertenece a
- No se encontró una oficina para esa búsqueda. Pruebe el nombre del estado o la ciudad grande más cercana.
- Aquí no se publican horarios ni teléfonos — confírmelos en la página oficial de ICE o llamando a la oficina.
- Aún no hay datos. No publicamos teléfonos ni direcciones sin verificar.
- Cómo se ve un aviso (un mapa)
- Notice to Appear · I-862
- Número A: la letra A y 9 dígitos
- Fecha y hora de la audiencia (puede faltar)
- Nombre y dirección de la corte
- Alegaciones y cargos
- Firmado por un oficial de ICE — no un juez
- Esto es un mapa, no su documento. Las secciones y los números cambian para cada persona — compárelo con su propio papel.
- Siguiente paso
- Páginas relacionadas
- Fuentes externas
- El centro donde tienen a la persona
- Ciudad, nombre o estado
- Escriba una ciudad, el nombre del centro o el estado — en inglés o como aparece en los documentos. La base tiene 196 centros.
- Página del centro: correo, cartas, estado
- Este centro todavía no está en nuestra base
- Puede ser un punto de detención temporal o un centro nuevo. El camino confiable es una llamada a donde tienen a la persona. El teléfono está en la página oficial de ICE abajo.
- Una llamada — toda la respuesta. Pregunte:
- En qué unidad de vivienda está la persona y qué horario de visitas tiene esa unidad
- Si hay que apuntarse antes, y cómo
- Qué documentos necesitan los visitantes
- Si pueden venir niños, y cuál es el código de vestimenta
- Cuántas personas pueden venir por visita
- Si las visitas están canceladas esta semana
- La lista de centros de ICE con horarios de visita
- Si no logra comunicarse con el centro: 1-888-351-4024 — la línea oficial de ICE (DRIL), lun–vie 8 a.m.–8 p.m. hora del Este, hay español.
- Lo maneja la oficina de ICE
- Circuito federal
- En este circuito federal el gobierno insiste en la detención obligatoria — aquí es más difícil lograr la salida. Qué caminos son reales lo determina un abogado (vea «Los caminos de salida»). Estado a julio de 2026.
- El horario de visitas cambia por unidad de vivienda y sin aviso. Para el actual: abra la página de este centro en ICE o llame y pregunte en qué unidad está la persona y las horas de esa unidad.
- Buscar el horario de este centro
- Direcciones y circuitos: datos de ICE recopilados por el Deportation Data Project (junio de 2026). Los horarios y teléfonos no se publican ahí — confirme en la página de ICE o por teléfono.
- Se muestran los primeros 12 — precise la búsqueda: ciudad o nombre exacto.
- Cuánto suelen estar detenidas las personas en este centro
- Mediana {med} días; para la mitad de las personas, de {p25} a {p75}. Según {n} casos concluidos en 2024–2026.
- Es un dato de datos pasados, no un pronóstico para una persona concreta. Fuente: Deportation Data Project.
- Dirección y vivienda
- Años de residencia
- Asistencia a la corte
- Papeles de la corte y de la agencia
- + Foto
- Qué es y de qué año
- Número A, si lo sabe — para el nombre del archivo, sin el nombre de la persona
- Solo dígitos, se puede dejar vacío
- Armar el paquete PDF
- vacío por ahora
- Abrir para imprimir
- Este dispositivo no tiene «Compartir» del sistema — descargue el archivo y adjúntelo usted mismo.
- Borrar todas las fotos del navegador
- ¿Borrar de verdad? Toque otra vez
- Las fotos se guardan solo en este navegador. No las vemos ni las recibimos. Después de enviar el paquete se pueden borrar con un botón.
- El paquete está listo
- «Compartir» abre el menú de su propio teléfono: correo, WhatsApp — lo que usted usa. Nuestro servidor no participa.
- Paquete de documentos para el abogado
- Paquete n.º
- Complementa el paquete n.º {n} del {date}
- Número A no indicado
- Qué hay dentro
- Qué falta todavía
- La lista de lo que falta es más honesta que la de logros: le ahorra al abogado la primera conversación.
- Parte {i} de {n}
- Armado por la familia en el navegador vía detnav.com. Los archivos no pasaron por ningún servidor. No somos abogados; qué debe llevar el paquete lo determina el abogado.

---

## Verificar al abogado  (`es/verify.ts`)

- Verificar al abogado
- Tres registros oficiales. La verificación toma tres minutos y no cuesta nada.
- 1 · Colegio de abogados del estado
- Licencia vigente y sin sanciones. Cada estado tiene su propio registro — busque «state bar» y el nombre del estado.
- 2 · Representantes acreditados del Departamento de Justicia
- No son abogados, pero pueden representar en la corte de inmigración. Muchas veces gratis o de bajo costo: es ayuda legítima.
- 3 · Lista disciplinaria de EOIR
- Quiénes tienen prohibido ejercer ante las cortes de inmigración. EOIR es el servicio del gobierno que administra todas las cortes de inmigración del país; sus listas son oficiales.
- Lista disciplinaria de EOIR
- Registro de representantes acreditados
- Notario público ≠ abogado
- En América Latina un notario público es un profesional del derecho. En Estados Unidos es alguien que certifica firmas. No puede representar a nadie en la corte de inmigración.
- Esa diferencia entre países es la base del fraude más común.
- Señales de alarma
- Promesa de salida en una fecha concreta
- Garantía del resultado del caso
- Pago por adelantado en efectivo sin contrato escrito
- Negarse a dar el número de licencia
- Un contrato en un idioma que usted no entiende
- Una «renta de grillete» mensual encima de un porcentaje de la fianza — la compañía Libre by Nexus recibió una sentencia de $811 millones por ese esquema (2024)
- «Sale hoy con una petición ya lista»
- Una petición de habeas exige que la persona ya esté bajo custodia, señalando el centro concreto. No existe una petición preparada de antemano para una salida inmediata.

---

## La visita  (`es/visit.ts`)

- La visita
- Visitar a una persona en un centro de ICE: reglas, cita, documentos · DETNAV
- Cómo visitar a una persona detenida por ICE: horarios y citas, qué identificación necesita el visitante, reglas de cada centro y qué confirmar con una sola llamada.
- Cómo ver a la persona: horarios, registro, documentos, reglas. Escriba el centro — armamos la respuesta. Si no está en nuestra base, mostramos cómo saberlo todo con una llamada.
- Reglas que valen casi en todas partes
- Llegue al menos 15 minutos antes — a los que llegan tarde no los dejan pasar
- Identificación con foto oficial para cada adulto (licencia, pasaporte o ID del estado); algunos centros piden un segundo documento. Al entrar se llena un formulario con el nombre y el número A de la persona
- Límite de visitantes por visita — normalmente hasta tres, los niños cuentan
- Los niños suelen necesitar un acta de nacimiento; el niño está bajo la supervisión de un adulto todo el tiempo, y el comportamiento ruidoso es motivo para terminar la visita
- No se entra con nada: teléfonos y bolsos se quedan en el carro o en un casillero en la entrada
- En la visita no se entregan cosas — los libros y las cartas tienen sus propios canales
- El día de la visita llame y confirme que las visitas no están canceladas: un cierre las cancela sin aviso
- Vístase más estricto de lo que piden las reglas
- Los requisitos típicos: largo hasta la rodilla, nada transparente, ajustado ni revelador, zapatos cerrados. Pero los interpreta la guardia en el lugar, y la interpretación cambia de turno en turno.
- En el centro Delaney Hall regresaron a familias por leggings, shorts y Crocs — les negaron la entrada incluso a niños. Es más seguro vestirse bastante más conservador que las reglas, todos, niños incluidos.
- Si usted mismo no tiene estatus
- Los visitantes llenan un formulario y muestran documentos; en algunos centros verifican a los visitantes en las bases de datos.
- Las organizaciones de ayuda legal aquí remiten al abogado: hable del riesgo de la visita antes del viaje. La videollamada, las llamadas normales y las cartas son formas de contacto sin visita.
- Si no puede hacer el viaje
- Videollamadas y mensajes — por el operador telefónico del centro
- Llamadas normales: la persona llama cuando hay dinero en la cuenta
- Las cartas y postales por correo llegan más seguro que cualquier servicio
- El contacto: llamadas, dinero, cartas
- Cada centro tiene sus propias reglas y cambian sin aviso. Estado a julio de 2026 — confirme por teléfono el día de la visita.
- El camino completo
- Dónde está ahora y qué sigue — doce pasos desde «lo encontramos» hasta la corte.
- Primero encontrarlo: dónde está

---

## Cómo encontrarlo  (`es/where.ts`)

- Cómo encontrarlo
- Cómo encontrar a una persona detenida por ICE — localizador por número A o nombre · DETNAV
- Paso a paso: cómo buscar en el localizador oficial de ICE por número A o por nombre y país de nacimiento. Por qué la persona no aparece de inmediato y qué hacer si no hay resultado.
- La búsqueda la hace el sistema oficial. Aquí explicamos cómo usarlo y qué significa el resultado.
- Qué necesita
- El número A — la letra A y nueve dígitos
- O bien: nombre y apellido, país de nacimiento, fecha de nacimiento
- El nombre debe coincidir letra por letra
- Muchos encuentran a la persona al tercer o cuarto intento: otro orden de los nombres, el segundo apellido, otra forma de escribirlo.
- La herramienta de abajo arma variantes de escritura. Todo queda en este navegador.
- Abrir el localizador oficial
- Que no aparezca no quiere decir que no esté
- Los registros se cargan con retraso: el propio sistema advierte que la persona puede aparecer hasta 72 horas después del arresto.
- Que no aparezca en el sistema en las primeras horas es común.
- Qué significa el resultado
- `In Custody` — encontrado: se ve el centro, y las visitas y llamadas se vuelven concretas
- `Not in Custody` — liberado o deportado en los últimos 60 días
- Vacío — no encontrado: la actualización tarda de 20 minutos a 8 horas, más un procesamiento inicial en la oficina de ICE de alrededor de un día
- Cuando el sistema no lo mostrará
- En las primeras horas con la agencia fronteriza la persona no se ve; a quienes CBP retiene más de 48 horas sí los muestra este mismo localizador
- Los menores de edad no aparecen en este localizador
- Durante un traslado los datos pueden desaparecer por varios días
- Trasladan personas entre estados
- No avisan a la familia. Pueden llevarlo a miles de kilómetros sin aviso y el centro cambiará solo en el sistema.
- Vuelva a revisar, aunque ayer lo haya encontrado.
- Si la búsqueda no da nada
- DRIL · línea oficial de ICE
- localizar a una persona, problemas en detención, separación de un hijo · lun–vie 8:00–20:00 ET · hay español
- Línea Nacional de Detención
- sin fines de lucro, no gubernamental · contacto con la familia, documentación de abusos
- La primera línea la maneja ICE. La segunda, una organización sin fines de lucro. La elección es suya.
- Oficina de ICE: a dónde acudir y dónde reportarse
- Si a la persona le ordenaron reportarse (grillete, ISAP) o necesita saber qué oficina cubre la zona, busque la oficina más cercana por ciudad o estado.
- Todos los centros de detención de ICE — direcciones por estado

---

## Опрос и задачи  (`content/intake/es.ts`)

- Si no sabe — dígalo así. Es una respuesta normal, y también se convierte en una tarea.
- Su lista
- Armada con sus respuestas. Nada se fue a nuestro servidor — la lista vive solo en este navegador. Toque una tarea para abrirla.
- No se preocupe: con todo esto se puede, y no en un solo día. Vaya paso a paso desde arriba — dentro de cada tarea se indica para qué sirve, cómo hacerla y dónde conseguir las cosas. Muchas tareas tienen enlace a una página con la instrucción completa. Guarde o imprima la lista para que no se pierda.
- Instrucción completa
- Esta semana
- Cuando haya tiempo
- por qué está en la lista
- Para qué
- Dónde conseguirlo exactamente
- Qué decir
- EJEMPLO · AJÚSTELO A SUS PALABRAS
- Sobre la etiqueta «prueba»
- Así se marcan las tareas que reúnen pruebas documentadas de los lazos con EE. UU.: dirección, tiempo de residencia, lazos familiares, trabajo, asistencia a la corte, antecedentes. Los abogados usan este expediente en el caso. No evaluamos su situación y no predecimos el resultado — solo enumeramos lo que normalmente se respalda con documentos.
- Qué hacer con esta lista ahora
- Descárguela o imprímala — es el borrador del paquete para el abogado. Los abogados cobran por minutos: una familia que llega con la lista ordenada y los documentos paga por el trabajo en el caso, no por ordenar papeles. Prepare también las respuestas a las preguntas que el abogado hará primero: año y forma de entrada, casos y órdenes anteriores, detenciones anteriores. Aquí no se preguntan y no se muestran en pantalla — esa conversación es solo con el abogado.
- Guardar o imprimir
- Empezar de nuevo
- No somos abogados y no damos asesoría legal. Esto es una lista de tareas, no una posición legal. Los ejemplos son correspondencia cotidiana; no redactamos documentos legales.
- ¿Está llenando esto por usted o por otra persona?
- Las listas salen distintas. Por usted — es preparación para el futuro; por otro — qué hacer ahora mismo.
- Por mí
- Quiero prepararme con tiempo
- Por otra persona
- Lo detuvieron o es posible
- ¿Cuál es su situación?
- ¿Qué pasó?
- De esto depende qué va primero en la lista: pasos urgentes o preparación con calma.
- Todo tranquilo — me preparo con tiempo
- Por ahora no ha pasado nada
- Hay un caso abierto en la corte
- Lo detuvieron antes, ahora está libre
- Lo detuvieron hoy o ayer
- Ya lo encontramos en el sistema
- Ya hubo una audiencia
- ¿Sabe su número A?
- ¿Se conoce su número A?
- La letra A y nueve dígitos. Está en el permiso de trabajo, la green card, las cartas de la corte y de USCIS — la agencia que da los permisos de trabajo y las green cards.
- Sí, lo sé
- No, pero hay documentos en casa
- No, y no hay documentos
- No sé qué es eso
- ¿Sabe su nombre completo, fecha de nacimiento y país de nacimiento?
- Si no se conoce el número A, la búsqueda usa estos tres campos. La escritura del nombre debe coincidir con el documento.
- Lo sé todo
- Sé una parte
- Casi nada
- ¿Cuántos años lleva en EE. UU.?
- ¿Cuántos años lleva él en EE. UU.?
- El tiempo de residencia es una de las cosas que el abogado respalda con documentos en el caso.
- Menos de un año
- De uno a cinco
- De cinco a diez
- Más de diez
- No sé
- ¿El contrato de renta o la propiedad están a su nombre?
- ¿A nombre de quién está la vivienda?
- El contrato de renta y los recibos muestran que la persona tiene vivienda permanente. Los abogados usan documentos así en el caso.
- Sí, a mi nombre
- Al mío
- Al suyo
- De los dos
- No, de otra persona
- No hay contrato
- ¿Tiene en EE. UU. familiares cercanos con ciudadanía o green card?
- ¿Tiene él en EE. UU. familiares cercanos con ciudadanía o green card?
- Los jueces dan un peso especial a cónyuges e hijos que son ciudadanos o titulares de green card.
- Sí, cónyuge o hijos
- Sí, otros familiares
- ¿Cómo está el trabajo para usted?
- ¿Cómo está el trabajo para él?
- El trabajo también es prueba de lazos. Le indicaremos exactamente con qué respaldarlo.
- Formal, con un empleador
- Como contratista o en efectivo
- Negocio propio
- No trabaja
- ¿Ha tenido citas en la corte de inmigración?
- ¿Ha tenido él citas en la corte de inmigración?
- La historia de asistencia muestra que la persona no se escondió de la corte. Se documenta aparte.
- Sí, y fue a todas
- Sí, con algunas faltas
- No hubo
- Quién depende
- ¿Tiene hijos menores de 18?
- ¿Tiene él hijos menores de 18?
- Si hay hijos, aparecen tareas aparte: la escuela, el consentimiento médico, quién los cuida.
- ¿Figura en la escuela alguien más aparte de usted?
- ¿Figura en la escuela alguien más aparte de él?
- Si en la escuela hay un solo adulto registrado, no entregarán al niño a nadie más — ni siquiera a la abuela.
- Sí, hay una segunda persona
- Solo uno
- ¿Hay un adulto dispuesto a hacerse cargo de los niños?
- Importa que esa persona tenga estatus y no esté ella misma en riesgo de detención.
- Sí, y tiene estatus
- Sí, pero no tiene estatus
- No hay una persona así
- ¿Cuida usted a personas mayores o enfermas?
- ¿Cuida él a personas mayores o enfermas?
- El cuidado de mayores y enfermos se corta el mismo día. Esto normalmente se olvida.
- ¿Toma medicamentos de forma permanente?
- ¿Toma él medicamentos de forma permanente?
- Una pausa en los medicamentos adentro es un peligro real. Hace falta una lista exacta con dosis.
- ¿Puede alguien cercano hablar con sus médicos?
- Si detienen a la persona, sus médicos no pueden hablar con los suyos sin un formulario firmado — ni decir los medicamentos ni entregar los registros. Arreglarlo con tiempo toma unos minutos.
- Sí, está arreglado
- Qué se desarma
- ¿Hay algo importante solo a su nombre: el carro, la cuenta, la renta, el negocio?
- ¿Hay algo importante solo a nombre de él: el carro, la cuenta, la renta, el negocio?
- Si algo está a nombre de una sola persona, los demás no pueden disponer de ello: ni venderlo, ni pagar desde ahí.
- Sí, hay
- No, todo es compartido
- ¿Tiene pagos regulares obligatorios?
- ¿Tiene él pagos regulares obligatorios?
- La renta, el préstamo del carro, el seguro, los servicios.
- ¿Hay una persona que sepa qué hacer si lo detienen a usted?
- No «a quién llamar», sino quién va a actuar: buscarlo, llamar al abogado, recoger a los niños.
- Sí, lo hablamos todo
- Hay una persona, pero no lo hemos hablado
- ¿Se sabe de memoria al menos un número de teléfono necesario?
- ¿Se sabe él de memoria al menos un número de teléfono?
- El teléfono es lo primero que quitan. Sin un número aprendido no hay a quién llamar.
- ¿Tiene documentos de inmigración y cartas de la corte?
- ¿Tiene él documentos de inmigración y cartas de la corte?
- En esas cartas están el número A y el número del caso. Es la forma más rápida de saber los dos.
- Los tengo a la mano
- Sé dónde están
- ¿Ha tenido arrestos o condenas?
- ¿Ha tenido él arrestos o condenas?
- Si los hubo — hacen falta constancias oficiales de la corte, no recuerdos.
- Hubo, con documentos
- Hubo, sin documentos
- ¿Una persona de confianza guarda copias de sus documentos?
- Los originales se pierden: quedan en el carro, en la vivienda, se van con la persona. Las copias son lo que queda.
- Anote el número A aparte y fotografíelo
- Lo van a necesitar todos: el localizador, el abogado, la corte.
- El número A es el único identificador confiable en el sistema. La búsqueda por nombre es imprecisa: transliteración, orden de los nombres, errores de tipeo.
- Escríbalo en papel y fotografíe la nota
- Envíeselo a usted mismo por mensajería y a una persona de confianza
- Verifique que sean nueve dígitos
- Busque el número A en los documentos de casa
- Casi seguro está en papeles que ya tiene.
- Un documento viejo cierra varias preguntas a la vez: el número, el número del caso, qué corte, qué pasó antes.
- El permiso de trabajo, aunque esté vencido
- La green card, si hay
- Cualquier carta de la corte de inmigración o de USCIS — la agencia que da los permisos de trabajo y las green cards
- Recibos de pago de cuotas
- Fotografíe todas las páginas, incluidos los sobres
- El registro de entrada I-94 — gratis y al momento
- i94.cbp.dhs.gov
- La búsqueda en el sistema, cuando tenga el número
- locator.ice.gov
- Si el sitio de ICE da Access Denied — apague el VPN o pruebe otra red. El sitio bloquea algunas direcciones; la búsqueda no está rota.
- Consiga el número A en la primera conversación
- Pida que lo dicten dígito por dígito.
- Sin el número no funciona ni la búsqueda, ni el contacto con el abogado, ni el seguimiento del caso en la corte.
- Pida que lo dicten despacio y repítalo en voz alta
- Anótelo en papel de inmediato
- Pregunte también el nombre exacto del centro y la ciudad
- La llamada desde el centro se graba. Decir el número A es seguro — la agencia ya lo tiene. Los casos y arrestos anteriores no se hablan por esta línea.
- Reúna los datos básicos para la búsqueda
- El nombre completo como en los documentos, fecha de nacimiento, país de nacimiento.
- Sin número A la búsqueda en el localizador usa estos tres campos, y la escritura del nombre debe coincidir con el documento.
- Nombre y apellido exactamente como en el pasaporte
- Fecha de nacimiento
- País de nacimiento, no de ciudadanía
- Confirme con los familiares si tiene dudas
- Reúna la prueba de dirección permanente
- El contrato de renta, los recibos, los documentos de la vivienda.
- La prueba de una dirección permanente en EE. UU. es parte del expediente que el abogado usa en el caso.
- El contrato de renta o los documentos de propiedad
- Recibos de servicios de varios meses
- Comprobantes de pago de la vivienda: cheques, money orders
- Cartas que llegaron a esta dirección
- Si el contrato está a nombre de otro — una carta del arrendador sobre la residencia
- El contrato de renta y sus anexos
- con el arrendador o la administración
- El historial de recibos por mes
- la cuenta del proveedor — luz, agua, internet
- Buenos días. Le pido que confirme por carta que vivo en esta dirección desde ___. Basta un formato libre: quién vive, desde qué fecha, su firma y contacto. Es para unos documentos.
- Reúna las pruebas de los años vividos en EE. UU.
- Cuanto más larga la línea continua, mejor.
- El tiempo de residencia es un factor propio de la lista. No se prueba con un documento sino con muchos pequeños. La regla principal: cualquier año se cierra con cualquier documento que tenga el nombre de la persona y una fecha. No hace falta el documento «correcto» — hace falta al menos uno por cada año.
- Vaya por años, no por tipos de documento
- Por cada año — al menos un documento con nombre y fecha
- Contratos de renta, recibos, registros médicos y escolares
- Estados de cuenta y transferencias
- Fotos con fecha, si no hay nada más
- Declaraciones de impuestos (tax transcripts) de cada año — gratis
- irs.gov/individuals/get-transcript
- La línea de ayuda del IRS
- El registro de entrada I-94
- Reúna los documentos de los lazos familiares
- Sobre todo de familiares ciudadanos y titulares de green card.
- Los lazos familiares están en la lista de factores, y los jueces dan un peso especial a cónyuges e hijos con ciudadanía o green card.
- Actas de nacimiento de los hijos
- Acta de matrimonio
- Copias de pasaportes o green cards de los familiares
- Documentos de residencia compartida
- Fotos con fecha con los hijos a lo largo de los años
- Constancia de inscripción escolar
- la oficina de la escuela, la dan a pedido del padre o la madre
- Boletas de calificaciones
- la oficina de la escuela o el portal del distrito
- Registros médicos y el IEP
- el coordinador de educación especial de la escuela
- Pida la constancia de trabajo
- Una carta, recibos de nómina, impuestos.
- La historia laboral es parte del expediente sobre los lazos con EE. UU. que se junta para el abogado.
- Una carta con el puesto, la antigüedad y la nota de que el lugar se conserva
- Talones de pago de varios meses
- W-2 o 1099 de todos los años
- Reúna a medida que lleguen, no lo deje para después
- Talones de pago
- recursos humanos o el sistema de nómina — ADP, Paychex
- Declaraciones de impuestos (tax transcripts)
- Reúna la prueba de ingresos sin carta del empleador
- El trabajo en efectivo también se puede documentar.
- No tener empleador formal no significa no tener pruebas — se reúnen de otras fuentes.
- Transferencias y depósitos en la cuenta
- Mensajes con los clientes
- Recibos, facturas, fotos de las obras
- Confirmación por escrito de los clientes
- El historial de envíos
- la aplicación Remitly, Wise, Western Union
- Estados de cuenta por mes
- la cuenta del banco
- Declaraciones de impuestos (tax transcripts), si se presentaron
- La carta de asignación del ITIN — el número para pagar impuestos cuando no hay SSN
- de su propio archivo de documentos
- Reúna los documentos de su negocio
- Registro, facturas, contratos, impuestos.
- El negocio propio prueba tanto la ocupación como el lazo con el lugar.
- Documentos de registro
- Contratos con clientes y proveedores
- Declaraciones de impuestos
- La renta del local o del equipo
- Reúna las constancias de asistencia a la corte
- Si hubo citas y usted fue a ellas — eso está a su favor.
- La historia de asistencia a la corte está en la lista de factores. El juez mira si la persona fue cuando la citaron.
- Las notificaciones de audiencias
- Las constancias de asistencia
- Cualquier correspondencia con la corte
- El expediente completo del caso anterior
- Pida constancias de la corte de todos los casos
- Documentos oficiales, no recuerdos.
- Los antecedentes están en la lista de factores, y el abogado necesita constancias oficiales de disposición para evaluar la situación. Un relato de memoria no sirve.
- Pida el certificate of disposition en la corte donde fue el caso
- Hacen falta todos los casos, incluso viejos y cerrados
- Si hay varios casos — uno por cada uno
- Si después del caso hubo programas, cursos, voluntariado — reúna también esas constancias
- Esto toma tiempo, empiece ya
- No hable de los detalles por la línea telefónica grabada del centro. Ese es un tema para el abogado.
- Decida con tiempo a qué abogado llamar
- En el momento de la detención ya es tarde para buscar — el número ya debe existir.
- El abogado de oficio no existe en el proceso de inmigración. Cuando el contacto está elegido de antemano, el primer día se va en el caso y no en la búsqueda — y la elección en pánico no lleva a un estafador.
- Mire los dos caminos: organizaciones gratuitas y abogados de pago — las direcciones exactas están abajo
- Reúna 2–3 candidatos: la práctica es federal, se puede buscar por idioma y no por ciudad
- Verifique a cada uno en los tres registros — toma tres minutos
- Una consulta con tiempo es la forma de conocerse y entender la situación antes del problema
- El número del abogado elegido — a la tarjeta que se aprende de memoria y a la persona de confianza
- GRATIS · la lista pro bono de EOIR por estados
- justice.gov/eoir/list-pro-bono-legal-service-providers
- GRATIS · el catálogo de ayuda gratuita y de bajo costo
- immigrationlawhelp.org
- GRATIS · preguntar a un abogado en línea
- americanbar.org/groups/legal_services/flh-home
- DE PAGO · búsqueda de AILA con filtro por idioma
- VERIFICAR A CUALQUIERA · la lista disciplinaria de EOIR
- justice.gov/eoir/list-of-currently-disciplined-practitioners
- En qué se diferencian. Gratis — organizaciones sin fines de lucro y representantes acreditados del Departamento de Justicia: es ayuda plenamente legítima, pero hay filas y no toman a todos. De pago — un abogado con contrato escrito, con tarifa o precio por fase, normalmente disponible más rápido. A unos y otros se les verifica en los mismos registros.
- Reúna las pruebas de participación en la comunidad
- La parroquia, organizaciones, voluntariado, las actividades de los hijos.
- Los lazos con la comunidad son parte del expediente que el abogado usa en el caso. Crece con el tiempo: cuanto antes se empieza, más completo queda.
- Una carta o constancia de participación de la parroquia
- Membresía en organizaciones, ligas, clubes
- Voluntariado — constancias de las organizaciones
- Las actividades y clubes de los hijos: recibos y constancias
- Fotos con fecha de eventos de la comunidad
- Encuentre personas para cartas de apoyo
- El empleador, los vecinos, la parroquia, las organizaciones.
- Los abogados suelen incluir cartas de apoyo en el paquete para la audiencia: dan fe de los lazos y la reputación. Pedirlas a última hora es tarde — la gente necesita tiempo para escribir.
- Haga una lista: el empleador, un vecino, el sacerdote, el entrenador de los hijos, un compañero de trabajo
- Pida el consentimiento con tiempo — una persona necesita varios días
- Una carta firmada con los contactos del autor — no una anónima
- La forma y el contenido los determina el abogado; su parte es encontrar a la gente y reunir los contactos
- Buenos días. Nuestra familia va a necesitar cartas de apoyo para un caso. El abogado explicará la forma — de usted solo hace falta el consentimiento y un poco de tiempo. ¿Puedo pasar su contacto al abogado?
- No redactamos cartas para la corte. Qué debe ir exactamente en la carta lo determina el abogado según el caso concreto.
- Pregunte al abogado qué caminos de salida son reales en este caso
- Esta pregunta va primero. Determina todo lo demás.
- Desde julio de 2025 el gobierno trata la detención como obligatoria para la mayoría, y los caminos viejos casi se cerraron: según los datos de TRAC, en abril de 2026 salieron bajo fianza 755 personas en todo el país, y el parole, según NILC (julio de 2026), se concedió en este año fiscal a una persona de las catorce que lo pidieron. Lo que funciona ahora es más a menudo otra cosa — la petición federal de habeas corpus: los abogados de AILA la llaman, para muchos, el único camino que funciona en la práctica. La prepara y la presenta un abogado.
- Haga esta pregunta al abogado primero, antes que todo lo demás
- Pregunte directamente por el habeas corpus y qué hace falta para él
- Averigüe en qué circuito federal está el centro y qué cambia con un traslado a otro estado
- Prepare dos planes en paralelo: para la salida y para una detención que dure meses
- Los documentos de esta lista hacen falta en cualquier camino — siga juntándolos
- Si aún no hay abogado · ayuda gratuita por estados
- El catálogo de ayuda gratuita y de bajo costo
- Búsqueda de pago con filtro por idioma
- Si alguien promete una salida rápida por dinero, es una señal de fraude: verifíquelo en la página «Verificar al abogado». Qué caminos aplican a un caso concreto lo determina solo el abogado. Estado a julio de 2026 — mire la fecha.
- Agregue a una segunda persona en la escuela
- Ahora mismo solo un adulto puede recoger al niño.
- La escuela entrega al niño solo a quienes están en su tarjeta. Se arregla con un formulario en la oficina y no requiere corte.
- Vaya a la oficina de la escuela en persona
- Pida el formulario de authorized pickup o emergency contact
- Lleve un documento con foto
- Pida una copia del formulario lleno para usted
- Indique aparte a quién no se le puede entregar
- Buenos días. Quiero agregar a una persona a la lista de quienes pueden recoger al niño y actualizar los contactos de emergencia. ¿Me dice qué formulario lleno?
- Arregle el documento del cuidado de los niños
- Un familiar recibe la posibilidad de llevarlos a la escuela y al médico sin corte.
- En California, el Caregiver’s Authorization Affidavit permite a un familiar inscribir al niño en la escuela y dar consentimiento médico. No hace falta la tutela por corte.
- Es un formulario establecido por ley. No lo redactamos — use el formato oficial. No quita los derechos de los padres.
- Fuera de California el procedimiento es distinto. Revise las reglas del estado.
- Encuentre para los niños a un adulto con estatus
- El cuidador no debe estar él mismo en riesgo de detención.
- Si la persona asignada a cuidar a los niños no tiene estatus, el plan puede caerse el mismo día. Las organizaciones aconsejan elegir a un ciudadano o titular de green card.
- Haga una lista de adultos adecuados
- Hable con tiempo, no lo ponga ante el hecho
- Asegúrese de que sabe dónde están los documentos
- Que se aprenda los teléfonos necesarios
- Piense quién cuidará a los dependientes
- Los mayores y los enfermos quedan sin cuidado el mismo día.
- Los planes de preparación suelen armarse alrededor de los niños, y los adultos a cargo quedan fuera. El cuidado se corta de inmediato.
- Quién viene y con qué frecuencia
- Dónde están los medicamentos y las recetas
- Quién puede hablar con los médicos
- Quién paga y con qué
- Haga la lista de medicamentos
- Nombres y dosis, no «pastillas para la presión».
- En el centro hay que nombrar los medicamentos con exactitud. Una pausa en la toma es un riesgo real para la salud.
- Nombres completos y dosis
- Contactos de los médicos tratantes
- Diagnósticos, si hay documentos
- Pida al médico copias de los registros médicos — también sirven para el caso
- Lleve una copia consigo y deje otra a una persona de confianza
- Arregle el acceso a la información médica
- Sin él, un familiar no podrá hablar con los médicos.
- El formulario HIPAA es un papel con el que la persona permite a los médicos hablar de su salud con quien está nombrado ahí. Con la forma firmada, la persona de confianza puede recibir los registros médicos y hablar con los médicos. Hace falta para la salud y como prueba para el caso.
- El formato lo da el centro médico; el formulario es estándar. No lo redactamos. El formulario para el hospital y el consentimiento para que la agencia comparta información son papeles distintos.
- Resuelva el poder notarial
- Un documento cubre el carro, la cuenta y los contratos.
- Los bienes a nombre de una sola persona quedan inaccesibles para los demás. El carro no se puede vender, la cuenta no se puede manejar, el contrato no se puede pasar.
- El poder es un documento legal. No lo redactamos y no damos modelos. El orden habitual: se toma el formulario oficial del estado o el formulario del propio banco, se llena, y la firma se certifica — en California ante un notary public o con dos testigos. Ojo: en EE. UU. el notary public solo certifica firmas — no es abogado y no redacta documentos. Si la persona ya está detenida — el procedimiento de firma es otro; esa es una pregunta para el abogado.
- Defina qué es exactamente lo que hay que cubrir
- Confirme si el banco o la agencia exige su propio formulario
- Haga copias y diga dónde está el original
- Haga la lista de pagos obligatorios
- Con fechas y montos. Alguien tiene que cubrirlos.
- Las moras empiezan en silencio: la renta, el préstamo del carro, el seguro. En unas semanas se llevan el carro y se pierde la vivienda.
- Anote todos los pagos regulares con fechas
- Marque de dónde se cobran
- Marque quién tiene acceso a ese dinero
- Empiece por el de fecha más cercana
- Apréndase de memoria dos números de teléfono
- El teléfono es lo primero que quitan.
- Las organizaciones de ayuda lo ponen entre los primeros pasos: sin un número aprendido, la persona en el centro no puede llamar a nadie, aun teniendo la posibilidad de llamar.
- Un número de una persona cercana
- El segundo — de un abogado o una organización
- Verifique que los recuerda sin ayuda
- Anótelos también en papel y guárdelo aparte del teléfono
- Reúna los documentos en una carpeta
- Y haga copias.
- Los originales se pierden: quedan en el carro, en la vivienda, se van con la persona.
- Pasaportes, actas de nacimiento y de matrimonio
- Todos los documentos y cartas de inmigración
- Registros médicos y escolares
- Fotografíe todo, incluidos los reversos
- Entregue copias a una persona de confianza
- Guarde los originales aparte.
- Las organizaciones aconsejan guardar copias donde una persona confiable pueda alcanzarlas si usted no está.
- Elija a una persona que no esté ella misma en riesgo
- Entregue las copias y diga dónde están los originales
- Duplique en la nube
- El plan y los documentos no se llevan encima. Guárdelos en un lugar seguro, y dónde — solo lo saben personas de confianza.
- Póngase de acuerdo con su persona de confianza
- No «a quién llamar», sino quién va a actuar.
- Los papeles reunidos no valen nada si nadie sabe que existen y dónde están. La detención llega de golpe, y después actúa no quien se llevaron, sino quien quedó.
- Elija a una persona que no esté ella misma en riesgo de detención
- Muéstrele dónde están los documentos y las copias
- Que se aprenda su número A
- Acuerden a quién llama primero
- Diga quién recoge a los niños y quién sabe de los medicamentos
- Quiero pedirle un favor, por si acaso. Si algo me pasa y dejo de comunicarme — aquí están mis documentos, a estas personas hay que llamar. Espero que no haga falta. ¿Se los puedo mostrar?
- No lleve el plan y los documentos encima. Guárdelos en un lugar confiable, y dónde exactamente — solo lo saben personas de confianza.
- Encuentre a la persona que va a actuar
- Mientras no exista, toda la preparación descansa solo en usted.
- Si nadie sabe de su situación, en el primer día después de la detención no pasará nada: nadie lo buscará, nadie sacará los documentos, nadie recogerá a los niños.
- Sirven un compañero de trabajo, un vecino, alguien de la comunidad o la parroquia
- No tiene que ser familiar ni amigo cercano
- Lo importante es que acepte y no esté él mismo en riesgo
- Con una persona basta, pero dos es mejor
- Tenga las fechas de audiencia bajo control
- Faltar a una audiencia es la pérdida irreversible más común.
- Si la persona no llega a una audiencia programada, el caso puede decidirse sin ella y en ausencia. La mayoría de las veces no es por evadir a la corte sino por un cambio de dirección: la notificación llega a la vieja.
- Revise la fecha de su audiencia en el sistema oficial
- Ponga recordatorios 14, 3 y 1 día antes
- Al mudarse, presente el cambio de dirección a la corte con el formulario aparte EOIR-33
- Guarde la constancia de la presentación
- Revisar la fecha de la audiencia
- acis.eoir.justice.gov
- El formulario de cambio de dirección
- justice.gov/eoir/form-eoir-33
- Consiga los documentos del caso anterior
- Lo que pasó antes determina muchísimo.
- Una detención pasada o un caso cerrado deja huella en el sistema, y el abogado necesita documentos, no recuerdos. Es lo primero que va a preguntar.
- Todas las notificaciones y decisiones del caso anterior
- El número del caso anterior, si se conserva
- Si no hay papeles — un pedido a la corte o a través del abogado
- Fotografíe todo lo que encuentre
- No hable de casos anteriores por la línea telefónica grabada del centro. Ese es un tema para el abogado.
- Arregle el contacto y el dinero para llamadas
- Dos formas de pagar, y la diferencia de costo es considerable.
- No se puede llamar hacia adentro — solo él llama. Mientras no haya dinero en la cuenta, no hay contacto. El contacto cálido y regular es lo que más protege a una persona adentro.
- Averigüe qué operador de teléfono tiene ese centro
- Opción 1: recargar el saldo personal del detenido — él llama a quien quiera
- Opción 2: vincular una cuenta a su número — llamadas solo a usted, normalmente cuesta menos
- Ponga el número A en todo lo que envíe
- Las aplicaciones de los operadores
- GettingOut · Securus · ConnectNetwork
- Cartas y postales a los centros
- Importante sobre la recarga: en la aplicación GettingOut no se puede poner dinero — la aplicación muestra el saldo y los mensajes, pero el pago no funciona en ella. Hay que recargar por el sitio web del operador en el navegador, desde una computadora o el teléfono. Con otros operadores pasa igual — si la aplicación no tiene botón de pago, busque el sitio, no reinstale la aplicación.
- Libros — solo nuevos y directamente de una tienda o editorial, no de un particular. La pasta suave pasa más rápido: la dura tarda más en revisarse y muchas veces no entra. Cada centro tiene sus reglas — confirme por teléfono antes de enviar.
- Mire dónde consiguen el dinero las familias
- El abogado, la renta, las llamadas — los gastos llegan juntos. Los mecanismos existen.
- Las colectas por GoFundMe y las redes de apoyo mutuo son un mecanismo reconocido: las familias reúnen decenas de miles de dólares para el abogado y la vida durante el caso. Pedir ayuda públicamente aquí es normal — lo hacen cientos de familias.
- Una colecta (GoFundMe y similares): describa la situación con honestidad, con la meta y el monto — abogado, renta, llamadas
- Pida a la parroquia, a una organización, a los compañeros que la compartan — la colecta funciona por confianza, no con desconocidos
- Redes de apoyo mutuo en comunidades e iglesias — pregunte en la suya
- Anote lo reunido y lo gastado: la confianza de los donantes es el recurso principal de la colecta
- No damos consejos financieros y no recolectamos dinero. Verifique a quién le envía: la colecta debe llevarla una persona que usted conoce en persona.
- Reparta la carga y manténgase cerca de la gente
- El miedo y el insomnio aquí son una reacción normal.
- Los casos duran meses. Quien carga con todo solo se quema antes de que termine el proceso. La aplicación es una herramienta, no un reemplazo del apoyo humano.
- Reparta las tareas entre los familiares, no lo tome todo usted
- Mantenga sus rutinas: sueño, comida, trabajo
- Apóyese en las personas que tiene cerca
- La línea de crisis, las 24 horas y gratis
- 988 — llamada o mensaje
- Crisis Text Line
- envíe HOME al 741741
- Ante un peligro inmediato
- Esto es información general de referencia, no ayuda médica ni psicológica.
- No firmar nada sin abogado
- Algunos documentos significan renunciar a la corte.
- La salida voluntaria y la orden estipulada significan aceptar irse y renunciar a la audiencia. Después de firmar, el caso no llega al juez.
- Transmita esto en la primera conversación
- La fórmula es simple: no firmo nada sin abogado
- Pregunte si ya firmó algo, y qué exactamente
- ACLU, FIRRP e ILRC publican la recomendación de no firmar documentos antes de hablar con un abogado y dar solo el nombre propio.
- Verifique al abogado, antes de pagar
- Tres registros oficiales, tres minutos.
- En EE. UU. el notario no es abogado y no puede representar en la corte de inmigración. En América Latina el notario público sí es abogado. Sobre esa diferencia está construido el fraude más común.
- El colegio de abogados del estado — licencia vigente
- El registro de representantes acreditados del Departamento de Justicia
- La lista disciplinaria de EOIR
- Búsqueda de abogado con filtro por idioma
- Señales de alarma: promesa de salida en una fecha concreta, garantía del resultado, pago adelantado en efectivo sin contrato, negarse a dar el número de licencia.
- Busque una consulta legal gratuita
- Las organizaciones sin fines de lucro hacen evaluaciones gratuitas.
- Las organizaciones mantienen catálogos nacionales de ayuda migratoria gratuita y de bajo costo. La evaluación ayuda a entender qué opciones existen en general.
- Llame a varias a la vez — en todas hay filas
- Pregunte si toman casos de detenidos
- Confirme si trabajan con ese centro
- La lista pro bono de EOIR por estados
- Respuestas gratuitas de abogados
- El abogado de oficio no existe en el proceso de inmigración. La ayuda gratuita existe, pero con filas.
- el número se conoce
- hay documentos en casa
- no hay número
- faltan datos para la búsqueda
- la persona ya está detenida
- los gastos llegan juntos — abogado, renta, llamadas
- hace falta una evaluación legal
- el caso va para largo
- hay una persona de confianza
- no hay acuerdo
- no hay quien actúe por usted
- el caso en la corte sigue
- lo detuvieron antes
- hay contrato de vivienda
- no hay contrato — hacen falta otras pruebas de dirección
- tiempo de residencia
- hay familiares con estatus
- los lazos con la comunidad son parte del expediente
- las cartas suelen pedirse para la audiencia
- trabajo formal
- trabajo en efectivo
- negocio propio
- hubo citas en la corte
- hubo arrestos
- los caminos de salida — la primera pregunta al abogado
- el abogado se busca antes de la detención, no después
- en la escuela figura un solo adulto
- hay un adulto con estatus
- el cuidador está en riesgo o no existe
- hay dependientes además de los niños
- toma medicamentos
- el acceso a los médicos no está arreglado
- los bienes están a nombre de una sola persona
- hay pagos regulares
- los teléfonos no están aprendidos
- los documentos existen
- los documentos no aparecen
- la persona de confianza no tiene copias

---

## Заметки по штатам и организации помощи  (`data/states.json`)

- **TX:** El Quinto Circuito apoyó al gobierno en la detención obligatoria. A Texas trasladan a menudo a personas desde otros estados. A julio de 2026.
- **LA:** El Quinto Circuito apoyó al gobierno en la detención obligatoria. A Luisiana trasladan a menudo a personas desde otros estados. A julio de 2026.
- **NY:** Nueva York tiene un programa de representación con fondos públicos para inmigrantes detenidos (NYIFUP). Confirme la cobertura actual con las organizaciones de abajo. A agosto de 2026.
- **FL:** Florida está en el Undécimo Circuito y tiene muchos centros de detención, incluidos Krome y el sitio del sur de Florida. A las personas se las traslada a menudo dentro del estado. A agosto de 2026.
- **CA · CHIRLA:** Coalition for Humane Immigrant Rights — servicios legales y apoyo a familias en toda California.
- **TX · RAICES:** Organización sin fines de lucro que ofrece ayuda legal migratoria gratuita y de bajo costo en todo Texas.
- **LA · LAAID:** Louisiana Advocates for Immigrants in Detention — voluntarios que ayudan cerca de los centros de detención de Luisiana: transporte, visitas, apoyo después de la liberación.
- **NY · NYIFUP:** New York Immigrant Family Unity Project — representación con fondos públicos para neoyorquinos detenidos que no pueden pagar un abogado, explicado por el Vera Institute.
- **FL · Americans for Immigrant Justice:** Immigrant Families Defense Fund — representación legal gratuita en los centros de detención de Florida.
