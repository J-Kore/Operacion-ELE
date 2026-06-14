# ESTADO DEL PROYECTO — Operación E.L.E. (web app cliente)
## Prompt de continuidad para próximas sesiones

> Pega este documento al inicio de la sesión, junto con el "Prompt de Rol"
> y los archivos de código relevantes. Resume dónde estamos, qué falta y
> qué conviene mejorar. Última actualización: sesión de auditiva (Fase A).

---

## 1. CONTEXTO REAL DEL PROYECTO (correcciones importantes)

Hay tres diferencias entre el "Prompt de Rol" y el código real que SIEMPRE
deben tenerse en cuenta:

1. **Framework real: Next.js 14 (App Router)**, NO React+Vite. La evaluación
   y la generación de contenido viven en *route handlers* del servidor
   (`app/api/chat/route.ts`, `app/api/generar-contenido/route.ts`), no en Vite.

2. **No hay ELE API externa conectada todavía.** La evaluación la hace
   directamente **Anthropic Claude** desde `lib/ai.ts` (modelo configurado:
   claude-sonnet-4-6). El "backend" actual es la route handler de Next + Claude.
   - Pendiente del usuario: conectar su propia ELE API (Fastify + PostgreSQL +
     JWT, basada en el PCIC) MÁS ADELANTE, cuando tenga uso de chat recargado.

3. **Persistencia: localStorage** (`lib/gameState.ts`), no base de datos.
   El progreso del agente vive en el navegador.

Stack confirmado (package.json): next 14.2.5, react 18, typescript 5.
SDKs de IA como optionalDependencies: @anthropic-ai/sdk, openai.
`.env.local` correctamente ignorado por git (sin fuga de claves).

---

## 2. ARQUITECTURA ACTUAL (cómo funciona hoy)

- **Datos**: `data/niveles.json` → 25 subniveles A1.1–B2.8, cada uno con
  inventarios PCIC (verbos, vocabulario, erroresCriticos, gramaticaProhibida,
  feedbackPipboy) y 4 desafíos (oral, escrita, lectora, auditiva).
- **Tipos**: `lib/types.ts` (Subnivel, EvaluacionRespuesta, ProgresoJugador...).
- **Motor IA**: `lib/ai.ts` expone 3 funciones:
  - `generarContenidoDesafio()` → mensaje inicial del NPC / guion.
  - `generarRespuestaNPC()` → respuesta narrativa.
  - `evaluarRespuesta()` → JSON con exito/capa/feedback/xpGanado.
- **Flujo de chat**: `app/api/chat/route.ts` llama EN PARALELO a
  `evaluarRespuesta` y `generarRespuestaNPC` (Promise.all).
- **UI de desafío**: `components/Challenges/ChatChallenge.tsx` (chat + mic
  para oral + ahora reproductor para auditiva).
- **Shell**: `components/PipBoy/PipBoyLayout.tsx`. Sonidos:
  `hooks/usePipBoySound.ts` (Web Audio API + MP3 opcionales).

---

## 3. HECHO EN ESTA SESIÓN — Comprensión Auditiva Fase A

Problema resuelto: la habilidad auditiva NO reproducía audio; mostraba texto
con marcas "[ESTÁTICA]" que el alumno LEÍA. Eso evaluaba lectura, no escucha.

Cambios entregados (3 archivos en `components/Challenges/`):
- **NUEVO `AudioLogPlayer.tsx`**: reproductor TTS con Web Speech API
  (speechSynthesis). Lee el guion en español, rate reducido en A1 (0.8) /
  A2 (0.9). Controles: escuchar / pausar-reanudar / repetir. Maneja el bug de
  carga asíncrona de voces (`voiceschanged`) y el requisito de tap en iOS.
- **NUEVO `AudioLogPlayer.module.css`**: estética Pip-Boy con variables de
  globals.css.
- **MODIFICADO `ChatChallenge.tsx`**: importa el player; en `habilidad ===
  'auditiva'` renderiza el reproductor y oculta el guion del terminal (mensaje 0)
  para que sea escucha real. Instrucción de onboarding actualizada.

Decisiones pedagógicas tomadas:
- **Estáticas eliminadas** (no aportan a la CO real; eran artefacto del prototipo).
  Un regex limpia cualquier "[ESTÁTICA]" residual que la IA pudiera generar.
- **Transcripción escalonada por macronivel** (lee `subnivel.macro`):
  - A1 → transcripción SIEMPRE visible (andamiaje fonema-grafía).
  - A2/B1/B2 → oculta por defecto, con toggle "VER TRANSCRIPCIÓN".
- Para hoy se reutiliza el texto de `/api/generar-contenido` como guion
  (mínimo viable). Se refinará al integrar la ELE API.

Estado: type-check (`tsc --noEmit`) PASA. Probado en navegador por el usuario: FUNCIONA.

### Sesión 2 — Audios cortos y concretos para A1 (auditiva)

Problema detectado en prueba real: el audio generado era demasiado largo y
genérico para A1. Claude producía texto libre narrativo sin límite de longitud.

Cambios realizados (2 archivos):

**`data/niveles.json`** — reescritos los 4 prompts auditivos de A1:
- A1.1: monólogo de identificación → nombre, ciudad, origen ("Soy de…"),
  código alfanumérico de 4 caracteres. Máx. 4 frases.
- A1.2: instrucciones de navegación → destino, 2 direcciones, nº de sala/piso.
- A1.3: informe de rutina → hora de levantarse, 2 acciones con reflexivos,
  hora de inicio del turno.
- A1.4: descripción física → pelo, ojos, ropa (2 prendas+color), estado físico.
Sin [ESTÁTICA] en ninguno. Frases completas, sin huecos.

**`lib/ai.ts`** — función `generarContenidoDesafio` modificada:
- Añadida rama `habilidad === 'auditiva'` con instrucciones adicionales al
  systemPrompt: monólogo en primera persona, máx 4 frases, sin preguntas
  embebidas, sin interrupciones, vocabulario estricto del macronivel.
- `maxTokens` reducido a 250 para auditiva (vs 800 para el resto): doble
  restricción (prompt + tokens) para garantizar brevedad aunque Claude ignore
  las instrucciones de longitud.

Decisión pedagógica confirmada: el mismo criterio (4 datos concretos, 4 frases,
sin huecos) se aplica a TODOS los subniveles A1. En A2+ se revisará cuando
llegue el momento.

---

## 4. PENDIENTE / SIGUIENTES PASOS (en orden sugerido)

### A. Auditiva — Fase B y C (cuando haya presupuesto/integración)
- **Fase B**: TTS de servidor (calidad alta). Crear route handler
  `app/api/audio/route.ts` que genere un MP3 (Azure / Google TTS / OpenAI /
  ElevenLabs) y lo devuelva cacheado. `AudioLogPlayer` solo cambia por dentro:
  reproducir `<audio src=url>` en vez de speechSynthesis. La UI NO cambia.
- **Fase C**: audio pregrabado por locutores para contenido estrella.
- (Opcional) En B1/B2, endurecer la transcripción: mostrarla solo TRAS responder.

### B. Arquitectura de corrección (el otro gran frente, NO empezado)
Problema: hoy el `exito` lo decide SOLO el LLM en una llamada, evaluando
únicamente gramática (los `erroresCriticos`). NO comprueba si la respuesta
contiene la INFORMACIÓN pedida (p. ej. nombre + alias + nacionalidad + número).
Objetivo acordado con el usuario: una respuesta es correcta si cumple
**gramática Y adecuación informativa**.

Diseño acordado (a implementar):
- Añadir `taskContract` por desafío en `niveles.json` (requiredSlots, umbrales).
- En `lib/ai.ts`: el LLM EXTRAE slots (salida estructurada), NO juzga si están.
- Verificación DETERMINISTA en backend: `isApto = (todos los slots presentes)
  AND (correccion >= umbral) AND (coherencia >= umbral)`. Conjunción, no media.
- Ampliar `EvaluacionRespuesta` en `types.ts` con `slotsFaltantes`.
- Feedback escalado por capa (decisión del usuario):
  - Capa 1: el NPC sospecha y pide el dato que falta (inmersivo, sin nombrarlo).
  - Capa 2: Pip-Boy explícito ("Falta: número de agente" + error gramatical).
  - Capa 3: pausa + tarjeta PCIC + mini-ejercicio.
- Mantener `evaluarRespuesta()` con FIRMA ESTABLE para que, al conectar la ELE
  API, solo cambie su interior (llamar a `/v1/activities/:id/submit`).

### C. Integración ELE API (cuando el usuario lo decida)
- La ELE API (PCIC) será la fuente de verdad de los `taskContract` y de la
  evaluación. Sustituir el interior de las funciones de `lib/ai.ts` por
  llamadas a la API, sin tocar componentes ni route handlers.
- Auth JWT (Bearer), base URL por `VITE_`/env, manejo de token expirado.

---

## 5. PUNTOS A MEJORAR (deuda técnica detectada)

1. **xpGanado lo inventa el LLM** (0-100 a su criterio) → progresión irregular.
   Debería calcularse de forma determinista (por capa/intento).
2. **NPC y evaluador van en paralelo e independientes** (Promise.all en
   chat/route.ts) → pueden contradecirse (el NPC te "cree" y el evaluador te
   suspende). Conviene coordinarlos cuando se rehaga la corrección.
3. **Reconocimiento de voz (oral)**: solo Chrome/Edge; Safari cae a texto.
   Documentado, aceptable para MVP.
4. **TTS Fase A**: calidad de voz dependiente del dispositivo. Es el motivo
   de existir de la Fase B.
5. **Sin tests automatizados.** Considerar al menos pruebas de la verificación
   determinista de slots cuando se implemente.
6. **Modelo en lib/ai.ts hardcodeado** (claude-sonnet-4-6). Conviene leerlo
   de env para cambiarlo sin tocar código.

---

## 6. CÓMO ARRANCAR LA PRÓXIMA SESIÓN

Sugerencia de mensaje inicial:
"Adjunto el Prompt de Rol, este ESTADO_PROYECTO.md y los archivos X. Hoy quiero
trabajar en [la arquitectura de corrección / la fase B de audio / integrar mi
ELE API]. Revisa primero el código antes de proponer cambios."

Archivos clave a adjuntar según el frente:
- Corrección: `lib/ai.ts`, `lib/types.ts`, `data/niveles.json`,
  `app/api/chat/route.ts`, `components/Challenges/ChatChallenge.tsx`.
- Audio Fase B: `components/Challenges/AudioLogPlayer.tsx`, `lib/ai.ts`.
- Integración API: `lib/ai.ts`, las dos route handlers, `lib/types.ts`.

### Sesión 3 — Preguntas de comprensión auditiva estructuradas (8 ítems, 4 agentes)

Problema detectado: el desafío auditivo no tenía preguntas visibles. El estudiante
escuchaba pero no sabía qué debía responder ni cómo se evaluaría.

**Cambio de arquitectura importante:** `/api/generar-contenido` para auditiva ya no
devuelve `{ contenido: string }` sino un `ContenidoAuditivo` estructurado con
guionAudio, agentes (×4) y preguntas (×8). Todo en una sola llamada.

**Archivos modificados:** `lib/types.ts`, `lib/ai.ts`, `app/api/generar-contenido/route.ts`,
`app/api/chat/route.ts`, `components/Challenges/ChatChallenge.tsx` y `.module.css`.

**Evaluador actualizado:** verifica INFORMACIÓN CORRECTA + GRAMÁTICA. Acepta
variaciones naturales. Información incorrecta → exito=false aunque la gramática sea perfecta.

**Flujo resultante:** Carga → Claude genera 4 agentes + guion en cadena + 8 preguntas.
Pantalla: reproductor + panel de 8 preguntas visible. Estudiante escucha y responde
todas juntas en el terminal. Evaluador cruza con respuestas esperadas.

**Punto 2 del usuario (hilo argumental):** Anotado — implementar en sesión futura.
