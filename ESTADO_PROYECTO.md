# ESTADO DEL PROYECTO — Operación E.L.E.
## Documento vivo de arquitectura, estado actual y hoja de ruta
> Última actualización: sesión de layout de misión + auditiva (junio 2026)
> Adjuntar este documento al inicio de cada sesión junto con el Prompt de Rol
> y los archivos de código relevantes.

---

## 1. CONTEXTO TÉCNICO REAL (correcciones críticas al Prompt de Rol)

Hay diferencias importantes entre el Prompt de Rol original y el código real:

**Framework: Next.js 14.2.5 (App Router), NO React+Vite.**
La evaluación y generación viven en route handlers del servidor
(`app/api/chat/route.ts`, `app/api/generar-contenido/route.ts`).

**No hay ELE API externa conectada.** La evaluación la hace directamente
Claude Sonnet (`claude-sonnet-4-6`) desde `lib/ai.ts`.
Pendiente: conectar la ELE API (Fastify + PostgreSQL + PCIC) del usuario
cuando esté lista. Diseño actual preparado para esa migración.

**Persistencia: localStorage** (`lib/gameState.ts`), no base de datos.
El progreso del agente vive en el navegador del estudiante.

**Tres clientes de IA en el proyecto (solo uno activo):**
- `lib/ai.ts` — ACTIVO. Claude Sonnet 4.6, lógica completa con
  evaluación auditiva estructurada y feedback de 3 capas.
- `lib/anthropic.ts` — alternativa Claude Haiku (más barato). Sin soporte
  auditivo estructurado. NO activo.
- `lib/openai.ts` — alternativa GPT-4o-mini. Misma interfaz. NO activo.
- `lib/huggingface.ts` — legacy, obsoleto, no se usa.
Los tres alternativos tienen la misma interfaz pública que `lib/ai.ts`
para poder hacer swap sin tocar las routes.

**Stack confirmado:** Next.js 14.2.5, React 18, TypeScript 5.
`@anthropic-ai/sdk ^0.27.0` como optionalDependency.
`@types/dom-speech-recognition` para reconocimiento de voz (oral).

---

## 2. ARQUITECTURA ACTUAL — MAPA COMPLETO

### Páginas y rutas

```
app/
├── page.tsx                    Boot screen animada
├── layout.tsx                  Layout raíz Next.js
├── globals.css                 Variables CSS + estilos globales Pip-Boy
├── not-found.tsx               404 personalizada
├── diagnostico/page.tsx        Test de clasificación de nivel
├── mapa/page.tsx               Mapa de los 25 niveles con estado
├── mision/
│   ├── [nivel]/page.tsx        Redirect al desafío activo (oral por defecto)
│   └── [nivel]/[habilidad]/
│       ├── page.tsx            PÁGINA PRINCIPAL DE MISIÓN (ver sección 3)
│       └── page.module.css
├── agente/page.tsx             Perfil, atributos, historial (3 subpáginas)
├── inventario/page.tsx         Fichas y audio logs desbloqueados
├── radio/page.tsx              Centro de comunicaciones
└── api/
    ├── chat/route.ts           POST: evaluación + respuesta NPC (paralelo)
    └── generar-contenido/route.ts  POST: contenido inicial del desafío
```

### Componentes principales

```
components/
├── PipBoy/PipBoyLayout.tsx     Shell global: topbar, XP, tabs de navegación
└── Challenges/
    ├── ChatChallenge.tsx       Componente central del desafío (chat + mic)
    ├── ChatChallenge.module.css
    ├── AudioLogPlayer.tsx      Reproductor TTS para comprensión auditiva
    └── AudioLogPlayer.module.css
```

### Datos y lógica

```
lib/
├── ai.ts           Motor IA activo (Claude Sonnet 4.6)
├── types.ts        Tipos TypeScript globales
├── gameState.ts    Progreso en localStorage
├── anthropic.ts    Cliente alternativo (Claude Haiku) — inactivo
├── openai.ts       Cliente alternativo (GPT-4o-mini) — inactivo
└── huggingface.ts  Legacy — obsoleto

data/
└── niveles.json    25 subniveles A1.1–B2.8 con inventarios PCIC completos

hooks/
└── usePipBoySound.ts   Sonidos Pip-Boy (Web Audio API + MP3 opcionales)
```

---

## 3. ESTADO ACTUAL DE LA PÁGINA DE MISIÓN

### Layout de /mision/[nivel]/[habilidad]/page.tsx

Nuevo layout tipo "wizard con tabs" basado en el patrón de /agente:

```
[TopBar PipBoy — siempre visible]
[Nav principal: MAPA / AGENTE / MISIÓN / INVENTARIO / RADIO]
─────────────────────── sticky
[Header compacto: MAPA › A1.1 · NOMBRE · ■□□■ progreso]
[SubNav 4 tabs: 📡 E.ORAL | ⌨️ E.ESCRITA | 📄 C.LECTORA | 🎧 C.AUDIO] sticky
───────────────────────
[Contenido del tab activo — hace scroll si necesario]
  └── ChatChallenge
        ├── Header desafío (acordeón, cerrado por defecto)
        ├── AudioLogPlayer (solo auditiva)
        ├── PreguntasAcordeon (solo auditiva, cerrado por defecto)
        ├── InventarioAcordeon (todas las habilidades, cerrado por defecto)
        ├── [textarea + TRANSMITIR] o [mic + textarea + TRANSMITIR]
        ├── Terminal de mensajes (historial, al fondo, sin altura fija)
        └── PipBoy feedback técnico (solo si hay errores persistentes)
```

### Regla de layout aprendida (importante para futuras sesiones)

Antes de aplicar `overflow: hidden` o `height: 100%` a cualquier contenedor
con contenido variable, calcular si todo el contenido interactivo cabe en el
viewport mínimo (375×667px). Si no cabe con margen, el scroll es correcto.
Header y subNav usan `position: sticky` para permanecer visibles al hacer scroll.

---

## 4. MOTOR DE IA — CÓMO FUNCIONA HOY

### Flujo de una interacción

```
Estudiante escribe/habla
        ↓
POST /api/chat
        ↓
Promise.all([
  evaluarRespuesta()     → Claude → JSON: {exito, capa, xp, feedback}
  generarRespuestaNPC()  → Claude → texto narrativo del NPC
])
        ↓
ChatChallenge: terminal + feedback
```

### Generación de contenido inicial

```
Al entrar en una misión → POST /api/generar-contenido
  Si auditiva → JSON: { guionAudio, agentes[4], preguntas[8] }
  Si resto    → string: texto narrativo del NPC para el terminal
```

### Evaluación: qué evalúa y qué NO

**Evalúa HOY:**
- Gramática según erroresCriticos de niveles.json
- Auditiva: información correcta vs. respuestas esperadas (8 preguntas)
- Capa de feedback (1/2/3) según número de intento

**NO evalúa todavía:**
- Adecuación informativa en oral/escrita/lectora
- XP es no determinista (lo decide el LLM, 0-100)
- NPC y evaluador corren en paralelo → pueden contradecirse

---

## 5. COMPRENSIÓN AUDITIVA — ESTADO ACTUAL

### Fase A implementada (Web Speech API, 100% cliente, gratis)

- Voz española (primera `es-*` disponible en el dispositivo)
- Rate adaptado: A1=0.8, A2=0.9, B1/B2=1.0
- Transcripción desplegable (oculta por defecto en todos los niveles)
- Sin [ESTÁTICA] — decisión pedagógica (no aportan a CO real)
- Manejo correcto de `voiceschanged` y tap obligatorio en iOS Safari

### Contenido A1 (4 subniveles con prompts específicos)

- A1.1: 4 agentes (nombre, ciudad, origen, código) + guion + 8 preguntas
- A1.2: navegación por el cuartel (destino, direcciones, nº sala)
- A1.3: informe de rutina (hora levantarse, reflexivos, inicio turno)
- A1.4: descripción física de sospechoso (pelo, ojos, ropa, estado)

Para A2–B2: prompts genéricos en niveles.json (pendiente de refinar).

### Fase B — TTS de servidor (pendiente)

AudioLogPlayer diseñado agnóstico de la fuente: hoy recibe `texto`,
en Fase B recibirá URL de MP3. La UI no cambia al migrar.
Requiere: nuevo route handler `app/api/audio/route.ts` + proveedor TTS
(Azure Speech / Google TTS / OpenAI TTS / ElevenLabs).

---

## 6. DEUDA TÉCNICA — PRIORIZADA

### Alta prioridad (impacto pedagógico directo)

**A. Corrección: adecuación informativa (oral/escrita/lectora)**
El LLM decide `exito` evaluando solo gramática. Una respuesta perfecta
gramaticalmente pero que no cumple la tarea puede aprobar.

Diseño acordado (NO implementado):
- Añadir `taskContract` por desafío en `niveles.json` (requiredSlots)
- LLM extrae slots (no juzga), backend verifica de forma DETERMINISTA
- `isApto = (todos slots presentes) AND (gramática >= umbral)` — conjunción
- Feedback por capa:
  - Capa 1: NPC sospecha, pide el dato que falta (inmersivo)
  - Capa 2: Pip-Boy explícito ("Falta: número de agente" + error gramatical)
  - Capa 3: pausa + tarjeta PCIC + mini-ejercicio

**B. XP determinista**
Hoy: LLM inventa un número 0-100 (inconsistente entre sesiones).
Solución: calcular en backend según capa/intento:
  Capa 1 éxito: 80-100 XP | Capa 2: 50-70 XP | Capa 3: 20-40 XP

**C. Coordinar NPC y evaluador**
Promise.all → el NPC puede celebrar mientras el evaluador suspende.
Solución: evaluar primero → pasar resultado como contexto al NPC.

### Media prioridad

**D. Modelo hardcodeado**
`const MODEL = 'claude-sonnet-4-6'` → mover a variable de entorno.

**E. Archivos .bak en el repositorio**
Acumulados durante el desarrollo. Limpiar antes de producción.
Afecta a: ChatChallenge.tsx.bak, page.tsx.bak, ai.ts.bak, etc.

**F. Sin tests automatizados**
Prioritario cuando se implemente la verificación de slots (punto A).

### Baja prioridad

**G. Audio Fase B y C** — TTS de servidor (ver sección 5)
**H. Hilo argumental entre misiones** — coherencia narrativa
**I. Páginas incompletas** — Inventario y Radio son UI sin funcionalidad real

---

## 7. INTEGRACIÓN CON ELE API (PCIC) — PENDIENTE

### Qué es

API propia del usuario (Fastify + TypeScript + PostgreSQL + JWT) basada
en el PCIC del Instituto Cervantes. 31 endpoints: auth, actividades,
inteligencia adaptativa, progreso.

### Estado

Pendiente. El usuario la desarrolla en paralelo. Se integrará cuando
la API esté lista y haya uso de chat disponible.

### Cómo está preparado el código

Las 3 funciones públicas de `lib/ai.ts` tienen firmas estables.
Al conectar la ELE API, solo cambia su interior. Routes y componentes
NO necesitan cambios. Es un reemplazo localizado.

### Qué aportará la ELE API sobre el sistema actual

- `taskContract` como fuente de verdad (reemplaza niveles.json parcialmente)
- Evaluación con inventarios PCIC completos
- Progreso en base de datos (reemplaza localStorage)
- Modelo adaptativo del estudiante
- Auth JWT (habrá que añadir manejo de token expirado en el cliente)

### Endpoints clave para la migración

```
POST /v1/auth/login                    → JWT
GET  /v1/curriculum/levels             → 25 subniveles (complementa niveles.json)
POST /v1/activities/:id/submit         → evaluación + feedback (reemplaza evaluarRespuesta)
GET  /v1/users/:userId/next-activity   → siguiente actividad recomendada
GET  /v1/users/:userId/student-model   → modelo adaptativo completo
GET  /v1/users/:userId/progress        → progreso general
```

---

## 8. ESTADO POR SECCIÓN DE LA APP

| Sección | Estado | Notas |
|---|---|---|
| Boot screen | ✅ Funciona | Animación Pip-Boy completa |
| Mapa | ✅ Funciona | 25 nodos, locked/active/completed |
| Misión | ✅ Funciona | Nuevo layout tabs + acordeones |
| Agente | ✅ Funciona | 3 subpáginas funcionales |
| Inventario | ⚠️ Básico | UI existe, sin funcionalidad real |
| Radio | ⚠️ Básico | UI existe, acceso rápido a desafíos |
| Diagnóstico | ⚠️ Básico | Test de clasificación sin motor IA real |
| 404 | ✅ Funciona | Personalizada estilo Pip-Boy |

---

## 9. REGLAS DE TRABAJO (Claude en este proyecto)

1. Leer el código real antes de proponer cualquier cambio.
2. Cambiar SOLO lo pedido — no tocar lo que funciona.
3. Antes de `overflow: hidden`, calcular si el contenido cabe en 375×667px.
4. `tsc --noEmit` antes de entregar código.
5. Un componente = una responsabilidad, máx. 150 líneas.
6. Variables de entorno para todo lo sensible.
7. Nunca pushear `.env.local` (en `.gitignore` ✅).
8. Confirmar con el usuario antes de hacer cambios estructurales.

---

## 10. PRÓXIMOS PASOS RECOMENDADOS

1. Limpiar archivos `.bak` del repositorio
2. Corrección determinista con slots (sección 6.A)
3. XP determinista (sección 6.B)
4. Coordinar NPC y evaluador (sección 6.C)
5. Audio Fase B — TTS de servidor
6. Integración ELE API
7. Hilo argumental entre misiones
8. Tests automatizados para lógica de corrección

---

## 11. CALIDAD COMUNICATIVA — PENDIENTE DE ANÁLISIS

### El problema pedagógico de fondo

Este es el problema más importante del proyecto a nivel didáctico, más allá
de los aspectos técnicos ya documentados en la sección 6.

Las misiones actuales tienen dos déficits comunicativos que Juan José necesita
analizar y decidir cómo resolver:

**A. Los textos del NPC no están calibrados al nivel**
El NPC puede generar respuestas demasiado largas, con vocabulario fuera del
inventario del subnivel, o con estructuras gramaticales que el estudiante no
debería ver en ese momento. En A1.1 el NPC debería usar exclusivamente
presente de indicativo, vocabulario de identidad básica y frases cortas.
Hoy no hay ningún mecanismo que lo garantice más allá del prompt.

**B. El NPC acepta respuestas que no cumplen la tarea**
Si la misión pide "identifícate con nombre, alias, nacionalidad y número de
agente" y el estudiante solo dice "Hola, me llamo Juan", el NPC puede dar
la interacción por válida porque la gramática es correcta. No existe
verificación de que la tarea comunicativa específica se haya completado.
Esto va más allá del taskContract técnico (sección 6.A) — es una decisión
pedagógica sobre qué constituye "éxito" en cada misión.

### Qué hay que analizar y decidir (trabajo pendiente del usuario)

Juan José necesita revisar subnivel por subnivel y definir:
- ¿Qué debe decir/escribir/leer/escuchar exactamente el estudiante en cada
  desafío para que la tarea se considere cumplida?
- ¿Cuál es el nivel de complejidad lingüística aceptable en las respuestas
  del NPC para cada macronivel (A1/A2/B1/B2)?
- ¿Hay tareas que necesitan rediseñarse para que sean más significativas
  comunicativamente (no solo ejercicios de gramática disfrazados)?

Estas decisiones pedagógicas son previas a cualquier implementación técnica.
Una vez definidas, se traducen en: prompts más precisos en niveles.json,
taskContracts con los slots correctos, y restricciones de vocabulario/
gramática en el systemPrompt del NPC.

### Nota sobre la conexión con la ELE API

Cuando se integre la ELE API basada en el PCIC, los inventarios léxicos
y gramaticales por subnivel serán la fuente de verdad para calibrar tanto
las tareas como las respuestas del NPC. Esto resolverá parte del problema
de forma estructural. Pero las decisiones pedagógicas sobre qué constituye
una tarea comunicativa válida siguen siendo decisiones humanas que hay que
tomar antes de la integración.

---

## 12. CAMBIOS SESIÓN 16 JUNIO 2026

### Boot screen — insignia Sílabos y legibilidad

**Archivos modificados:** `app/page.tsx`, `app/page.module.css`

- Icono 🤖 eliminado. Sustituido por el SVG de la insignia de Sílabos
  (constelación de Orión estilo Tron) inline en el JSX, con efecto
  `pulse-glow` y `drop-shadow` neón.
- Subtitle "OPERACIÓN E·L·E" ya no se parte en dos líneas:
  `white-space: nowrap` + `clamp` mínimo bajado de `1rem` a `0.85rem`.
- Opacidad de `.tagline` subida de `0.4` a `0.75` (ESPIONAJE · ESPAÑOL ·
  SUPERVIVENCIA era ilegible).
- Opacidad de `.versionInfo` subida de `0.25` a `0.75` (OPERACIÓN E.L.E.
  v1.0 · NIVELES A1-B2 · 25 MISIONES · 100 DESAFÍOS era ilegible).

### Fix crítico de deploy — Vercel

Commit `6c56a3d` fallaba en build con:
`Module not found: Can't resolve './page.module.css'`
en `app/mision/[nivel]/page.tsx`.

Causa: ese archivo era una copia incorrecta del page.tsx de
`[nivel]/[habilidad]/` que se coló en la carpeta `[nivel]/` durante
una sesión anterior. Importaba `./page.module.css` que no existe ahí.

Solución: restaurar `app/mision/[nivel]/page.tsx` a su función correcta
— un redirect simple a `/mision/${nivelId}/oral`.

---

## 13. NARRATIVA — "EL MENTOR" (diseño completo, ver NARRATIVA_OPERACION_ELE.md)

Trama serializada en 4 temporadas (una por macronivel A1/A2/B1/B2), con
giro de cierre al final de cada una — no solo un giro final en B2.8, para
que estudiantes que abandonan en niveles bajos tengan una historia con
principio y fin igualmente.

Premisa: el Coronel/a Marín, mentor del estudiante, resulta ser el
infiltrado de "la Cofradía" dentro de la Agencia. La Agente Solís es la
confidente que ayuda a destaparlo. La sospecha solo se verbaliza en la
trama a partir de B1.5 (subjuntivo de duda) — nunca antes de que el
estudiante tenga la gramática para expresarla.

Dentro de cada subnivel, las 4 destrezas (EO/EE/CL/CA) dejan de ser
ejercicios aislados sobre la misma gramática: son 4 momentos secuenciales
de una misma micro-escena (EO = interacción en vivo, EE = lo que se
redacta después, CL = documento que se encuentra, CA = cierre que conecta
con el siguiente subnivel).

B2.7-B2.8 tienen final ramificado: el estudiante elige exponer/confrontar/
tender una trampa a Marín; la elección es un dato estructurado aparte,
independiente de la evaluación lingüística (no se mezcla con la
corrección gramatical).

Pendiente de implementación en código: reescribir `descripcionNarrativa`
de los 25 subniveles, añadir `personajesActivos`, y que los prompts de
`lib/ai.ts` reciban el contexto narrativo además del curricular.

**Decisión de arquitectura:** la narrativa vive en `operación-ele`
(niveles.json o archivo propio), NO en ELE-API. ELE-API solo conoce
currículo PCIC y resultados numéricos — nunca personajes ni trama.

**Pendiente de decisión del usuario:** el género del estudiante
(pregunta explícita "El agente / La agente" en el alta) para los pocos
puntos donde el español lo exige gramaticalmente (adjetivos/participios
en 1ª persona o cuando un NPC describe al estudiante). Diseño aceptado,
implementación pendiente.

---

## 14. INTEGRACIÓN ELE-API — IMPLEMENTADA (sesión 17 jun 2026)

### Estado de la API del usuario

Desplegada y operativa en Railway: `silabos-ele-api-production.up.railway.app`.
Fastify + TypeScript + PostgreSQL. Currículo PCIC completo (25 subniveles +
inventarios + actividades seed). Auth JWT funcionando.

Contrato completo en `ELE-API_Contrato.md` (compartido por el usuario).
Cliente tipado ya provisto por el usuario: `lib/ele-api-client.ts`
(login, refresh automático, todos los endpoints).

### Decisión de arquitectura de integración

**Reparto por destreza:**
- **CL (lectora) y CA (auditiva):** ELE-API primero (`GET /v1/activities`
  filtrado por levelId+skill). Si no hay actividad cargada para el
  subnivel → **fallback transparente a Claude** (no bloqueante).
- **EO (oral) y EE (escrita):** siempre Claude (necesitan evaluación de
  texto libre, no encajan en opción múltiple de ELE-API).

**Progreso:** vive en ELE-API (tabla `user_level`), no en localStorage.
localStorage pasa a ser caché de lectura, nunca fuente de verdad.

**Traducción Claude → ELE-API:** el resultado de Claude (exito/capa) se
mapea a un score [0-1] (capa 1 éxito=0.9, capa 2=0.7, capa 3=0.5,
fallo=0.2) y se registra en ELE-API contra una actividad "contenedor"
EO/EE del subnivel, para que el progreso se vea unificado independiente
de qué motor evaluó.

### Archivos creados

- **`lib/ele-api-client.ts`** — cliente tipado (provisto por el usuario,
  copiado sin cambios). Login, refresh automático ante 401, todos los
  endpoints del contrato.
- **`lib/eleApiOrchestrator.ts`** — NUEVO. Capa de orquestación entre
  ELE-API y Claude. Decide por destreza qué fuente usar, con fallback
  transparente. Traduce resultados de Claude a score ELE-API. Cliente
  singleton con login cacheado por proceso de servidor. Caché de
  `passThreshold` por subnivel (evita pedir el currículo en cada submit).
- **`app/api/generar-contenido/route.ts`** — MODIFICADO. Usa
  `obtenerContenidoDesafio()` del orquestador en vez de llamar a
  `lib/ai.ts` directamente. Contrato de respuesta hacia el frontend
  SIN CAMBIOS (compatibilidad total con ChatChallenge.tsx actual).
- **`app/api/chat/route.ts`** — MODIFICADO. Usa
  `evaluarYRegistrarProgreso()`. Acepta `userId`/`activityId`/`answers`
  como campos OPCIONALES — si no llegan (frontend actual no los envía
  todavía), se comporta exactamente igual que antes de esta sesión.
- **`.env.local.example`** — añadidas `ELE_API_URL`, `ELE_API_EMAIL`,
  `ELE_API_PASSWORD` (usuario de prueba, pendiente rotar antes de
  producción).

Type-check (`tsc --noEmit`) completo del proyecto: PASA.

### IMPORTANTE — lo que falta para que la integración funcione de verdad

1. **`ChatChallenge.tsx` todavía no envía `userId`.** El sistema funciona
   hoy en modo retrocompatible (Claude puro, como antes), pero el
   progreso NO se está sincronizando con ELE-API todavía porque no hay
   userId real. Esto requiere decidir cómo se identifica al estudiante
   en operación-ele (¿login propio? ¿el mismo JWT de ELE-API por
   estudiante, no solo el de servicio?) — DECISIÓN PENDIENTE, no resuelta
   hoy. Es la pieza que falta para cerrar el círculo.
2. **Actividades CL/CA por completar en ELE-API.** El fallback a Claude
   cubre los huecos, pero para que la integración aporte valor real hay
   que ir cargando actividades de opción múltiple en ELE-API subnivel
   a subnivel (trabajo del usuario, en paralelo, no bloqueante).
3. **Actividad "contenedor" EO/EE en ELE-API.** Para que
   `registrarEnEleApiSinBloquear` no falle siempre con 404, hace falta
   crear en ELE-API al menos una actividad de tipo EO y otra EE por
   subnivel (aunque sea un placeholder), solo para tener dónde registrar
   el score que traduce el resultado de Claude.
4. **Usuario de servicio dedicado** (no `profesor@ele.test`) antes de
   producción — ya anotado en el informe del usuario.

### Próximo paso recomendado

Decidir el sistema de identidad del estudiante en operación-ele (punto 1
de arriba) es el bloqueante real para que el progreso empiece a
sincronizarse. Sin eso, la integración está "câblée" pero no se activa.

---

## 15. SEGURIDAD — ACTUALIZACIÓN DE NEXT.JS (sesión 17 jun 2026)

### Hecho hoy

`next` actualizado de `14.2.5` → `14.2.35` en package.json/package-lock.json.
Resuelve la vulnerabilidad crítica de RCE en App Router divulgada en
diciembre 2025 (CVE-2025-55182 y relacionadas) — la versión 14.2.5 que
tenía el proyecto estaba expuesta. `npm audit fix` aplicado también para
una vulnerabilidad de severidad alta en `form-data` (dependencia
indirecta), resuelta sin cambios de versión mayor.

### Pendiente — NO hacer hoy, requiere sesión dedicada

`npm audit` sigue reportando 2 vulnerabilidades (1 alta, 1 moderada) en
`next` y `postcss`, cuyo único fix disponible es saltar a `next@16.2.9`
(cambio de versión MAYOR, 14→16). Next.js dejó de dar parches de
seguridad completos a la rama 14.x más allá de la 14.2.35.

Riesgo real evaluado: las vulnerabilidades restantes (DoS en Image
Optimizer, XSS con CSP nonces, cache poisoning, request smuggling,
bypass de middleware en i18n) requieren condiciones que el proyecto
hoy no cumple en su mayoría — no se usa `next/image` con remotePatterns
externos, no se usa i18n del Pages Router (el proyecto es 100% App
Router). Riesgo bajo-medio en el corto plazo, pero no nulo.

**Plan recomendado:** dedicar una sesión específica a evaluar el salto
a Next 16 — probar build completo, revisar breaking changes de la
guía oficial de migración, verificar que las rutas dinámicas
(`[nivel]/[habilidad]`) y los route handlers de `app/api/` sigan
funcionando igual. NO mezclar con cambios funcionales (narrativa,
integración ELE-API) para poder aislar cualquier regresión.

**No ejecutar `npm audit fix --force` sin probar antes en una copia** —
instalaría next@16.2.9 directamente y es muy probable que rompa algo.

---

## 16. IDENTIDAD DEL ESTUDIANTE — IMPLEMENTADA (sesión 18 jun 2026)

### Decisión de arquitectura

Tres piezas separadas a propósito, sin acoplarse entre sí:

| Pieza | Vive en | Qué guarda |
|---|---|---|
| Identidad del estudiante (email/password) | Base de datos nueva (Prisma Postgres vía Vercel) | Cuenta, contraseña hasheada, sesión |
| Currículo PCIC + progreso lingüístico | ELE-API (Railway) | Subniveles, scores CE/CO/EE/EO |
| Narrativa y trama | `niveles.json` en operación-ele | Personajes, escenas, giros |

**Por qué esta separación:** la ELE-API del usuario va a servir a otros
proyectos en el futuro, no solo a operación-ele. Por eso NUNCA debe
conocer el email/contraseña de un estudiante — solo conoce un `userId`
(UUID) sin saber cómo esa persona inició sesión. Así, otro proyecto
futuro puede usar la ELE-API con su propio sistema de identidad sin
fricción ni acoplamiento.

**Modelo de negocio:** hoy 100% gratuito para fase de testeo. El modelo
de pago (suscripción/freemium) queda pendiente de decidir más adelante;
esta arquitectura no lo bloquea — añadir Stripe/planes más adelante no
requiere rehacer la identidad, solo añadir un campo de "plan" al modelo
User de Prisma.

### Stack elegido y por qué

- **Auth.js v5** (antes NextAuth.js) — estándar de la industria para
  Next.js, gratuito, soporta credentials (email/password) y OAuth social
  (Google, pendiente de añadir más adelante) con la misma configuración.
- **Prisma 7** como ORM — ⚠️ versión MUY reciente (lanzada 19 nov 2025),
  con cambios grandes de configuración respecto a v6 (ver más abajo).
  Se decidió migrar a la última versión en vez de bajar a v6, a pesar
  del esfuerzo extra de adaptación.
- **Prisma Postgres** (integración de marketplace en Vercel → Storage)
  como base de datos. Variables de entorno reales generadas con prefijo
  `POSTGRES_` (nombres específicos de esta integración, distintos de
  los que usaba el antiguo "Vercel Postgres" nativo):
  - `POSTGRES_URL` — conexión directa, usada por el CLI (migraciones)
  - `POSTGRES_PRISMA_DATABASE_URL` — conexión con pooling, usada por el
    cliente en runtime

### Particularidades de Prisma 7 (documentar para el futuro)

Cambio grande respecto a v6: la URL de conexión YA NO se pone en
`schema.prisma` (`url`/`directUrl` ahí ya no son válidos). Ahora vive en
un archivo nuevo `prisma.config.ts` en la raíz del proyecto. Además,
`PrismaClient` ya no se puede instanciar sin más (`new PrismaClient()`
falla) — requiere pasarle explícitamente un "driver adapter"
(`@prisma/adapter-pg` para Postgres).

`dotenv/config` (usado por `prisma.config.ts`) busca por defecto un
archivo `.env`, NO `.env.local` (que es la convención de Next.js). Hubo
que cargar dotenv explícitamente apuntando a `.env.local`.

### Archivos creados

- **`prisma/schema.prisma`** — modelos `User` (con campo extra `genero`
  y `passwordHash`), `Account`, `Session`, `VerificationToken` (estos 3
  últimos requeridos por el adaptador de Auth.js). Sin `url`/`directUrl`
  (sintaxis Prisma 7).
- **`prisma.config.ts`** (raíz) — configuración del CLI, carga
  `.env.local` explícitamente, usa `POSTGRES_URL`.
- **`auth.config.ts`** (raíz) — configuración edge-safe: provider
  Credentials (forma del formulario), callback `authorized` que protege
  `/mision`, `/mapa`, `/agente`, `/inventario`, `/radio`, `/diagnostico`.
  Incluye aviso documentado sobre CVE-2025-29927 (bypass de middleware):
  esta capa es solo primera barrera de UX, no la única protección.
- **`auth.ts`** (raíz) — configuración completa con adaptador Prisma y
  el `authorize()` real (bcrypt.compare contra `passwordHash`). Exporta
  `handlers`, `auth`, `signIn`, `signOut`.
- **`proxy.ts`** (raíz) — middleware que aplica `authorized()` de
  auth.config.ts a las rutas de página.
- **`lib/prisma.ts`** — cliente singleton con adaptador `PrismaPg`
  (patrón obligatorio Prisma 7).
- **`app/api/auth/[...nextauth]/route.ts`** — `export const { GET, POST }
  = handlers` (desestructurado del objeto `handlers`, NO reexportado
  directamente — error cometido y corregido en esta sesión).
- **`app/api/registro/route.ts`** — crea el usuario con
  `bcrypt.hash(password, 12)`. Mensaje de error genérico si el email ya
  existe en uso (sin revelar más para evitar enumeración de cuentas).
- **`app/registro/page.tsx`** + CSS — formulario con email, contraseña,
  y selector "El agente / La agente" (campo `genero`). Auto-login tras
  registro exitoso.
- **`app/login/page.tsx`** — formulario simple de login.
- **`components/Providers.tsx`** — wrapper cliente con `SessionProvider`
  de next-auth/react, necesario porque `app/layout.tsx` es Server
  Component y no puede usar el contexto de sesión directamente.
- **`app/layout.tsx`** — MODIFICADO: envuelve `children` en
  `<Providers>`. De paso, corregido el aviso de consola "apple-mobile-
  web-app-capable is deprecated" añadiendo también el meta
  `mobile-web-app-capable`.
- **`components/Challenges/ChatChallenge.tsx`** — MODIFICADO: usa
  `useSession()` para obtener `userId` real y lo envía en las dos
  llamadas fetch (`/api/generar-contenido` y `/api/chat`), conectando
  por fin con el orquestador ELE-API construido en la sesión anterior.

### Verificado funcionando en local (confirmado por el usuario)

- `npx prisma generate` y `npx prisma db push` — tablas creadas en la
  base de datos real.
- Registro de usuario de prueba → contraseña hasheada guardada
  correctamente (confirmado: `POST /api/registro 200`).
- Auto-login tras registro y login manual — ambos funcionando tras
  corregir el bug del route handler.

### Bugs encontrados y corregidos en esta sesión

1. Nombres de variables de entorno asumidos incorrectamente al inicio
   (`POSTGRES_PRISMA_URL`/`POSTGRES_URL_NON_POOLING`) — corregido a los
   reales de la integración Prisma Postgres de Vercel.
2. Sintaxis de Prisma 6 usada por error inicialmente (`url`/`directUrl`
   en schema.prisma) — proyecto instalado era Prisma 7, sintaxis
   incompatible. Migrado a `prisma.config.ts` + driver adapter.
3. `dotenv/config` no encontraba `.env.local` (buscaba `.env`) —
   corregido cargando dotenv explícitamente con esa ruta.
4. Import relativo incorrecto en `auth.ts` (`'../auth.config'` en vez de
   `'./auth.config'` — ambos archivos están en la raíz, mismo nivel).
5. Route handler de NextAuth mal escrito (`export { GET, POST } from
   '@/auth'` cuando `auth.ts` no exporta GET/POST directamente, sino un
   objeto `handlers` que los contiene) — corregido a `export const {
   GET, POST } = handlers`.

### IMPORTANTE — pendiente para la próxima sesión

**Conflicto entre dos sistemas de progreso sin resolver.** El
`localStorage` antiguo (`operacion-ele-progreso`, gestionado por
`gameState.ts`, de antes de esta sesión) sigue activo y desconectado de
la cuenta real nueva. `PipBoyLayout` redirige directo a `/mapa` si
detecta ese localStorage, aunque el usuario logueado no tenga ninguna
relación con ese progreso. Decisión pendiente (es de producto, no solo
técnica): ¿migrar el progreso de localStorage a la cuenta la primera vez
que alguien se loguea, o empezar de cero y dejar el localStorage viejo
como reliquia sin usar?

**Sigue sin probarse el círculo completo con la ELE-API.** Aunque
`ChatChallenge.tsx` ya envía `userId` real, no se ha verificado todavía
en esta sesión que ese `userId` llegue correctamente al orquestador de
ayer y que el progreso se registre de verdad en la base de datos de la
ELE-API (Railway). Es el siguiente paso lógico de verificación.

**No se ha añadido login social (Google) todavía** — decisión aplazada
a propósito, la base con Credentials ya está lista para añadirlo encima
sin cambios estructurales cuando se quiera.

### Próximo paso recomendado

1. Verificar el círculo completo: registrar usuario → completar un
   desafío → confirmar en la base de datos de la ELE-API (o vía
   `getProgress(userId)`) que el score se registró.
2. Decidir y resolver el conflicto de los dos sistemas de progreso
   (localStorage viejo vs. cuenta nueva).
3. Limpiar archivos `.backup` que el usuario pudo haber creado al
   sobreescribir `layout.tsx` y `ChatChallenge.tsx` (recordatorio dado
   durante la sesión, verificar que no se suban a git).

---

## 17. INCIDENTE DE DEPLOY — Prisma generate no se ejecutaba en Vercel (18 jun 2026)

### Síntoma

Tras añadir Prisma, el build en Vercel fallaba con:
```
Type error: Module '"@prisma/client"' has no exported member 'PrismaClient'.
```
aunque en local todo funcionaba bien y el `package.json` tenía correctamente
`"build": "prisma generate && next build"`.

### Causa raíz

El log de Vercel mostraba `> next build` sin el `prisma generate` delante,
a pesar de que el script en GitHub era correcto. La configuración de
**Project Settings → Build Command** en el dashboard de Vercel estaba en
modo automático (detección de framework), lo cual en este caso ignoraba
el script `build` real de `package.json` y ejecutaba directamente
`next build`.

### Solución

1. Vercel → proyecto → Settings → Build and Deployment → Framework
   Settings → activar el toggle "Override" en **Build Command** y
   escribir explícitamente `npm run build`.
2. Esto NO aplica retroactivamente a deployments ya construidos — hace
   falta disparar un deployment NUEVO después de guardar el override.
3. El primer intento de redeploy automático (vía push) no se disparó
   solo (webhook puntualmente no reaccionó). Se resolvió con
   **Deployments → Create Deployment** → pegar la URL del commit
   (`https://github.com/.../tree/main`) → "Deploy to Production",
   forzando manualmente la construcción del commit correcto con la
   configuración ya corregida.

### Lección para el futuro

Si un cambio en `package.json` (scripts de build) no se refleja en el
comportamiento de Vercel aunque esté bien en GitHub: revisar primero
Settings → Build and Deployment → Framework Settings, por si el "Build
Command" tiene su propio valor con override activado (o necesita
activarse) que sobrescribe lo que dice `package.json`.

### Confirmado en producción

Build verde completo. Log muestra `✔ Generated Prisma Client (v7.8.0)`
ejecutándose correctamente antes de `next build`. Todas las rutas nuevas
de identidad compiladas: `/login`, `/registro`, `/api/auth/[...nextauth]`,
`/api/registro`. La integración de identidad del estudiante (sección 16)
queda confirmada funcionando también en producción, no solo en local.
