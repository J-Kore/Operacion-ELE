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
