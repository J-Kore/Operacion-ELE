# NARRATIVA — Operación E.L.E.
## "El Mentor" — trama serializada en 4 temporadas (v2)

> Documento de diseño narrativo — VERSIÓN 2, sustituye a la v1.
> Cambios respecto a v1: (1) un giro de cierre al final de CADA macronivel,
> no solo al final de B2; (2) dentro de cada subnivel, las 4 destrezas
> (EO/EE/CL/CA) son fragmentos secuenciales de UNA misma micro-escena, no
> ejercicios aislados sobre el mismo tema gramatical.
>
> Fuente de verdad para reescribir `descripcionNarrativa` en `niveles.json`
> y los prompts de `lib/ai.ts`. No se implementa en código todavía.

---

## PREMISA CENTRAL (sin cambios respecto a v1)

El estudiante es un agente novato reclutado por el **Coronel/a Marín**,
mentor cercano desde el primer día. A lo largo de la historia, Marín
resulta ser el infiltrado de **la Cofradía** dentro de la Agencia.
La **Agente Solís** es la confidente que ayuda a destapar la verdad.

**Restricción de diseño confirmada:** el estudiante puede editar su nombre
e información personal en su perfil, pero NO el alias ni el código de
agente asignados en A1.1. Esto permite que el código alfanumérico actúe
como ancla narrativa fiable durante toda la trama (aparece en carnets,
informes, y puede ser clave en la prueba final), ya que es el único dato
de identidad garantizado a no cambiar.

---

## ESTRUCTURA: 4 TEMPORADAS, UN GIRO DE CIERRE EN CADA UNA

| Temporada | Subniveles | Tono | Giro de cierre |
|---|---|---|---|
| T1 | A1.1-A1.4 | Confianza total | Algo se pierde/falla; Marín lo encubre de forma extraña |
| T2 | A2.1-A2.5 | Acción normal, primera grieta | Marín pide guardar un secreto "por el bien de la Agencia" |
| T3 | B1.1-B1.8 | Sospecha verbalizable | Solís confiesa que también sospecha; investigan juntos en secreto |
| T4 | B2.1-B2.8 | Resolución | Confirmación (B2.6) + final ramificado según decisión del estudiante (B2.8) |

Cada temporada es autocontenida (cierre con gancho), pero las cuatro
forman una sola trama continua. Un estudiante que solo complete A1 ya
ha vivido una "mini-temporada" con principio y final, no un fragmento
inconcluso — esto es clave para la retención en niveles bajos.

---

## PRINCIPIO DE DISEÑO: LAS 4 DESTREZAS COMO ESCENAS SECUENCIALES

Hasta ahora, EO/EE/CL/CA dentro de un subnivel evaluaban la misma
gramática con 4 ejercicios independientes. A partir de ahora, cada
destreza es un momento distinto de la misma micro-escena, en orden:

1. Expresión Oral (EO) — la interacción en vivo (conversación con un
   personaje). Es el motor de la escena.
2. Expresión Escrita (EE) — lo que el estudiante redacta DESPUÉS de
   esa interacción (un informe, un mensaje, una nota).
3. Comprensión Lectora (CL) — un documento que el estudiante recibe
   o encuentra a continuación (un expediente, una carta, una pista).
4. Comprensión Auditiva (CA) — un mensaje o transmisión que cierra la
   escena, normalmente con una pequeña pieza de información nueva que
   conecta con el siguiente subnivel.

El estudiante que completa las 4 destrezas de un subnivel ha vivido una
escena completa de principio a fin, no 4 repeticiones del mismo ejercicio.

---

# TEMPORADA 1 — "EL RECLUTA" (A1.1-A1.4)

### A1.1 — Contacto e Identidad
Escena: el primer día en la Agencia.
- EO: Marín recibe al estudiante en persona, le pide identificarse:
  nombre, alias, nacionalidad. Le asigna el código de agente (fijo).
- EE: El estudiante rellena la ficha de registro oficial con sus datos.
- CL: Lee su propio carnet de agente recién impreso — primera vez que
  ve su código alfanumérico por escrito.
- CA: Un mensaje de radio de bienvenida de Marín, grabado de antemano
  para todos los reclutas — cálido, casi protocolario.

### A1.2 — Entorno del Cuartel
Escena: tour por las instalaciones.
- EO: Marín guía el tour, pregunta dónde está cada sala y qué hay en
  ella. Menciona: "la sala de archivos restringidos, ahí no entra nadie
  sin mi permiso" (pista invisible aún).
- EE: El estudiante anota en su libreta la ubicación de las salas
  clave para no perderse.
- CL: Lee el plano oficial del cuartel, con las zonas restringidas
  marcadas.
- CA: Escucha un anuncio por megafonía sobre el horario de acceso a
  zonas restringidas.

### A1.3 — Rutinas del Agente
Escena: Marín supervisa el primer día de rutina.
- EO: Marín pregunta por los horarios habituales del estudiante:
  cuándo se levanta, cuándo empieza turno.
- EE: El estudiante redacta su horario semanal para entregárselo
  a Marín.
- CL: Lee el cuadrante de turnos de la Agencia, donde aparece por
  primera vez el nombre de la Agente Solís.
- CA: Escucha el aviso de cambio de turno por radio, dado por Solís.

### A1.4 — Estado del Operativo — GIRO DE CIERRE T1
Escena: algo se pierde y Marín lo encubre.
- EO: Chequeo físico de rutina — Marín pregunta cómo se encuentra el
  estudiante. Al final, comenta que "un material de entrenamiento se ha
  perdido, no es nada, ya está solucionado" — visiblemente más tenso de
  lo normal para algo "sin importancia".
- EE: El estudiante redacta un parte de estado simple, rutinario.
- CL: Lee un memo interno (filtrado, casi por casualidad) que dice
  que el material perdido en realidad nunca se reportó oficialmente.
- CA: Cierre de temporada: un audio breve de Marín hablando con
  alguien por radio, diciendo "tranquilo, lo tengo controlado" — el
  estudiante no debería haber escuchado eso.

---

# TEMPORADA 2 — "AGENTE DE CAMPO" (A2.1-A2.5)

### A2.1 — Protocolo de Extracción: El Plan
Escena: primera misión de campo real.
- EO: Marín da el plan de extracción de un maletín con material
  clasificado. El estudiante confirma el plan en voz alta.
- EE: El estudiante redacta el plan de acción por escrito antes
  de salir.
- CL: Lee el briefing oficial de la misión con los detalles del
  maletín a recuperar.
- CA: Escucha la cuenta atrás por radio antes de iniciar la operación.

### A2.2 — Orden Inmediata y Reporte
Escena: la extracción en curso.
- EO: Marín da órdenes directas durante la operación tensa
  ("¡corre!", "¡espera ahí!"). El estudiante reporta lo que acaba de
  hacer.
- EE: Tras la misión, redacta el reporte inmediato de lo ocurrido.
- CL: Lee la confirmación escrita de que el maletín fue entregado...
  a Marín personalmente, "directo a Comando" (Marín dice).
- CA: Escucha el parte de cierre de operación por radio.

### A2.3 — Informe de Campo: El Suceso
Escena: redacción del informe oficial.
- EO: Marín pregunta al estudiante, en una reunión, qué pasó
  exactamente durante el incidente de la semana anterior.
- EE: El estudiante redacta su primer informe oficial completo
  sobre el suceso finalizado.
- CL: Lee el informe de otro agente sobre el mismo suceso — los
  detalles no coinciden del todo con la versión de Marín.
- CA: Escucha la felicitación grabada de Marín por la precisión
  del informe (genuina, no falsa — el vínculo de confianza sigue siendo
  real).

### A2.4 — Perfil del Objetivo: El Escenario
Escena: investigación de un sospechoso externo.
- EO: El estudiante describe a un sospechoso (falsa pista de la
  Cofradía) ante el equipo.
- EE: Redacta el perfil completo del objetivo por escrito.
- CL: Lee el expediente del sospechoso — resulta ser un señuelo,
  no el verdadero topo.
- CA: Escucha la confirmación por radio de que el sospechoso ha
  sido descartado.

### A2.5 — Debriefing: El Contraste — GIRO DE CIERRE T2
Escena: Marín pide un secreto.
- EO: En el debriefing, Marín explica una irregularidad ("mientras
  vigilabas la puerta norte, alguien entró por la sur") y le resta
  importancia. Al final, le pide al estudiante, en privado: "no
  menciones esto en tu informe oficial, por el bien de la Agencia" —
  primera vez que su autoridad se siente extraña.
- EE: El estudiante redacta el informe oficial, decidiendo si incluir
  o no la irregularidad (el ejercicio no juzga la decisión moral, solo
  la corrección lingüística del texto).
- CL: Lee el protocolo oficial de la Agencia sobre qué debe reportarse
  siempre, sin excepción — contradice lo que pidió Marín.
- CA: Cierre de temporada: un audio ambiguo de fondo, una voz que el
  estudiante no reconoce, hablando brevemente con Marín en un pasillo.

---

# TEMPORADA 3 — "INFILTRADO" (B1.1-B1.8)

### B1.1 — Reclutamiento y Deseos
Escena: selección de un nuevo recluta.
- EO: El estudiante participa en la entrevista de un nuevo candidato,
  expresando qué cualidades desea en un agente.
- EE: Redacta sus deseos y expectativas para la Agencia este año.
- CL: Lee la ficha del candidato — Solís comenta al margen: "ojalá
  todos los veteranos fueran tan transparentes como parecen".
- CA: Escucha la grabación de la entrevista para evaluarla.

### B1.2 — Radar de Emociones
Escena: una misión sale mal por una filtración menor.
- EO: El estudiante expresa cómo le afecta el fallo de la misión
  ante el equipo.
- EE: Escribe una nota personal sobre cómo se siente respecto a la
  filtración (primera vez que la palabra aparece explícita en la trama).
- CL: Lee el informe oficial del incidente, que minimiza la palabra
  "filtración" y la sustituye por "error operativo".
- CA: Escucha a dos agentes hablando en voz baja, preocupados.

### B1.3 — El Canal de Influencia
Escena: convencer a un agente reticente.
- EO: El estudiante debe convencer a un compañero de seguir un
  protocolo nuevo, impuesto por Marín, dando consejos y argumentos.
- EE: Redacta una nota de instrucciones para el protocolo.
- CL: Lee el protocolo nuevo — beneficia de forma sospechosa la
  discreción de Comando sobre cierto tipo de informes.
- CA: Escucha la queja del compañero, ya convencido pero incómodo.

### B1.4 — Crónica del Pasado: El Origen
Escena: investigación de un caso antiguo.
- EO: El estudiante pregunta a un archivero sobre un caso cerrado
  hace años.
- EE: Redacta un resumen cronológico de los hechos antiguos.
- CL: Lee el archivo del caso: "ya había concluido la operación
  cuando él llegó" — sobre Marín, en un informe de hace años.
- CA: Escucha una vieja grabación de radio del caso original.

### B1.5 — Hipótesis en el Campo — PRIMERA SOSPECHA VERBALIZADA
Escena: Solís plantea la duda en voz alta, por primera vez.
- EO: Solís le dice al estudiante, con cautela: "es posible que
  alguien esté informando a la Cofradía desde dentro" — el estudiante
  practica el subjuntivo de duda justo cuando la trama empieza a
  pedírselo de verdad.
- EE: El estudiante redacta sus propias hipótesis sobre quién podría
  ser, sin acusar a nadie en concreto todavía.
- CL: Lee una lista de movimientos sospechosos del último mes, anónima.
- CA: Escucha un audio distorsionado, posible pista, que no puede
  identificar del todo.

### B1.6 — Opinión y Contraespionaje
Escena: desmentir un rumor falso.
- EO: Un rumor falso (sembrado por la Cofradía) acusa a un agente
  inocente. El estudiante debe desmentirlo con argumentos.
- EE: Redacta un informe defendiendo al agente acusado en falso.
- CL: Lee el comunicado oficial de Marín apoyando públicamente al
  agente acusado — gesto que parece noble.
- CA: Escucha la reacción de alivio del agente exonerado.

### B1.7 — Condiciones de la Misión
Escena: condiciones para la operación de alto riesgo.
- EO: El estudiante negocia las condiciones de una operación destinada
  a investigar la filtración: "si encuentro pruebas, las entregaré
  directamente a Comando" — frase premonitoria que no sabe que lo es.
- EE: Redacta las condiciones oficiales por escrito.
- CL: Lee la aprobación de Comando para la operación.
- CA: Escucha el briefing final antes de salir a la misión.

### B1.8 — El Reporte Final (B1) — GIRO DE CIERRE T3
Escena: Solís confiesa que también sospecha.
- EO: Solís, en privado, le confiesa al estudiante: "yo también
  sospecho, y creo que deberíamos investigar juntos, sin decírselo a
  nadie más" — pacto secreto entre ambas.
- EE: El estudiante redacta el reporte consolidado de todo lo
  investigado hasta ahora, combinando descripción, narración y
  valoración, sin nombrar aún a Marín directamente.
- CL: Lee una nota cifrada que Solís le entrega, con los primeros
  pasos del plan de investigación conjunta.
- CA: Cierre de temporada: un audio que Solís grabó en secreto, con
  la voz de Marín diciendo algo que no debería haber dicho.

---

# TEMPORADA 4 — "DOBLE AGENTE" (B2.1-B2.8)

### B2.1 — El Pasado de la Sospecha
Escena: análisis de la prueba física.
- EO: El estudiante y Solís analizan, con futuro perfecto de
  probabilidad, qué habrá pasado realmente en los casos antiguos.
- EE: Redacta el análisis formal de las pruebas reunidas.
- CL: Encuentra un informe con la caligrafía de Marín en un documento
  que nunca debió haber visto.
- CA: Escucha una grabación antigua que conecta los hechos.

### B2.2 — Protocolos Hipotéticos
Escena: explorar la hipótesis impensable.
- EO: El estudiante y Solís plantean escenarios improbables: "¿y si
  el topo fuera alguien de máxima confianza?" — sin acusar todavía a
  nadie en concreto.
- EE: Redacta hipótesis alternativas por escrito.
- CL: Lee un perfil psicológico genérico de "el infiltrado ideal" —
  coincide, incómodamente, con Marín.
- CA: Escucha una conversación hipotética simulada para entrenar la
  reacción ante una confrontación futura.

### B2.3 — Cortesía en la Embajada
Escena: misión diplomática para conseguir archivos externos.
- EO: El estudiante pide, con máxima cortesía formal, acceso a
  archivos de otra agencia que podrían confirmar la identidad del topo.
- EE: Redacta la solicitud formal por escrito.
- CL: Lee la respuesta oficial, llena de formalidades pero con una
  pista real dentro.
- CA: Escucha la grabación protocolaria de la reunión diplomática.

### B2.4 — El Dilema del Informante
Escena: un informante de la Cofradía se ofrece a hablar.
- EO: El informante exige que el estudiante valore moralmente sus
  propias decisiones pasadas antes de hablar.
- EE: Redacta una valoración escrita de las consecuencias de colaborar
  con un informante de la Cofradía.
- CL: Lee la transcripción parcial de lo que el informante ya reveló:
  "alguien con rango de Coronel".
- CA: Escucha la voz distorsionada del informante en la grabación de
  la negociación.

### B2.5 — Arrepentimiento del Espía
Escena: la última escena antes de la confirmación.
- EO: El estudiante confronta, con condicional compuesto e imperfecto
  de subjuntivo, lo que podría haber evitado si hubiera dudado antes.
- EE: Redacta una reflexión personal sobre el arrepentimiento.
- CL: Lee una carta antigua y ambigua, posiblemente escrita por Marín
  hace años, que ahora se lee de forma muy distinta.
- CA: Escucha el último audio antes de la revelación — tensión máxima,
  sin confirmar nada todavía.

### B2.6 — El Informe del Infiltrado — CONFIRMACIÓN DEL GIRO CENTRAL
Escena: se revela que Marín es el topo.
- EO: Solís y el estudiante confrontan las pruebas juntas; la evidencia
  ya no deja dudas.
- EE: El estudiante redacta, en estilo indirecto, el informe formal
  que recoge todo lo que Marín dijo e hizo, citado de memoria, como
  prueba ante Comando.
- CL: Lee la prueba documental definitiva: la confesión indirecta de
  Marín en un memo interceptado.
- CA: Escucha la grabación real (no simulada) de Marín hablando con
  un contacto de la Cofradía — la prueba sonora final.

### B2.7 — Negociación y Obstáculos — DECISIÓN RAMIFICADA
Escena: planear la operación final.
- EO: El estudiante negocia con Comando las condiciones de la
  operación final, usando concesivas y finales. Aquí se plantea la
  decisión explícita de tres vías: exponer a Marín públicamente,
  confrontarlo directamente, o tenderle una trampa para capturarlo
  con pruebas irrefutables. El estudiante expresa su elección en
  español con la gramática del subnivel.
- EE: Redacta el plan de la operación elegida por escrito.
- CL: Lee los recursos y aliados de Marín — los obstáculos a superar
  según la vía elegida.
- CA: Escucha el briefing final de Comando, adaptado a la decisión
  tomada.

Nota técnica: la elección de vía (exponer/confrontar/trampa) es un dato
estructurado independiente de la evaluación lingüística — se registra
aparte y determina qué variante de B2.8 se genera. No afecta a la
corrección gramatical de la respuesta.

### B2.8 — Archivo Clasificado (B2) — FINAL RAMIFICADO
Escena: cierre de la operación, variable según B2.7.
- EO: Confrontación final con Marín — el contenido exacto de la escena
  depende de la vía elegida (pública/directa/encubierta), pero la
  exigencia gramatical es la misma para las tres variantes.
- EE: El estudiante redacta el informe final completo del caso,
  integrando descripción, narración, hipótesis y valoración — todo lo
  aprendido en los 25 subniveles, condensado en un documento que él
  mismo escribe con sus palabras.
- CL: Lee la respuesta de Comando al desenlace elegido.
- CA: Escucha el cierre narrativo: un mensaje final que varía según el
  desenlace (Marín capturado, huido, o doble juego revelado), pero
  siempre termina con un reconocimiento explícito al estudiante por
  su dominio del español a lo largo de las cuatro temporadas.

---

## IMPLEMENTACIÓN TÉCNICA — PENDIENTE (no se toca código hoy)

1. Reescribir `descripcionNarrativa` de los 25 subniveles en
   `data/niveles.json` con las micro-escenas de este documento.
2. Añadir campo `personajesActivos` por subnivel.
3. Añadir campo o usar el orden fijo EO->EE->CL->CA para que cada
   prompt de `generarContenidoDesafio` sepa qué fragmento de la escena
   le toca generar y mantenga continuidad con las otras 3.
4. Para B2.7: nuevo campo de datos (no en niveles.json, sino en el
   progreso del estudiante en `gameState.ts` o futura ELE API) que
   registre la vía elegida y la pase como contexto a B2.8.
5. Decisión pendiente: si la capa narrativa vive en `niveles.json` o
   migra a un campo propio cuando se conecte la ELE API — no urgente.
