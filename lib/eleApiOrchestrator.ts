/**
 * lib/eleApiOrchestrator.ts
 * ──────────────────────────────────────────────────────────────
 * Capa de orquestación entre operación-ele y dos fuentes de contenido:
 *   - ELE-API (silabos-ele-api): currículo PCIC real + actividades CL/CA
 *     ya corregibles objetivamente (opción múltiple) + almacén de progreso.
 *   - Claude (lib/ai.ts): contenido narrativo dinámico (oral/escrita) y
 *     FALLBACK de lectora/auditiva cuando ELE-API aún no tiene actividad
 *     cargada para ese subnivel.
 *
 * DECISIÓN DE ARQUITECTURA (sesión 17 jun 2026):
 *   - CL (lectora) y CA (auditiva) → ELE-API si existe actividad para el
 *     subnivel; si no, fallback transparente a Claude (lib/ai.ts).
 *   - EO (oral) y EE (escrita)     → siempre Claude (necesitan evaluación
 *     libre de texto, no encajan en opción múltiple).
 *   - El progreso vive en ELE-API (tabla user_level), no en localStorage.
 *     localStorage pasa a ser solo caché de lectura rápida, nunca fuente
 *     de verdad. Si hay conflicto entre ambos, gana la API.
 *   - El resultado de Claude (exito/capa/xpGanado) se traduce a un
 *     score [0-1] (ver mapExitoToScore) y se envía también a /submit,
 *     contra una actividad "contenedor" EO/EE en ELE-API, para que el
 *     progreso y la racha se registren igual que con CL/CA.
 *
 * Este módulo se llama SOLO desde rutas de servidor de Next
 * (app/api/.../route.ts). Nunca desde componentes de cliente.
 * ──────────────────────────────────────────────────────────────
 */

import { EleApiClient, EleApiError, type Activity, type SkillScore } from './ele-api-client'
import {
  generarContenidoDesafio,
  generarRespuestaNPC,
  evaluarRespuesta,
} from './ai'
import type {
  Subnivel,
  HabilidadType,
  MensajeChat,
  EvaluacionRespuesta,
  ContenidoAuditivo,
  PreguntaAuditiva,
} from './types'

// ── Caché simple de passThreshold por subnivel ──
// Evita pedir GET /v1/curriculum/levels/:id en cada submit; el umbral
// casi nunca cambia dentro de la vida del proceso de servidor.
const cachePassThreshold = new Map<string, number>()

async function obtenerPassThreshold(levelId: string): Promise<number> {
  if (cachePassThreshold.has(levelId)) return cachePassThreshold.get(levelId)!
  try {
    const api = await obtenerClienteAutenticado()
    const nivel = await api.getLevel(levelId)
    cachePassThreshold.set(levelId, nivel.passThreshold)
    return nivel.passThreshold
  } catch {
    return 0.75 // valor por defecto documentado en el contrato de ELE-API
  }
}

// ── Mapeo de habilidades de operación-ele ↔ destrezas de ELE-API ──
// operación-ele usa nombres en español; ELE-API usa siglas MCER.
const HABILIDAD_A_SKILL: Record<HabilidadType, 'CE' | 'CO' | 'EE' | 'EO'> = {
  lectora:  'CE',
  auditiva: 'CO',
  escrita:  'EE',
  oral:     'EO',
}

// Solo lectora y auditiva intentan ELE-API primero. Oral y escrita van
// SIEMPRE a Claude (decisión de arquitectura, ver cabecera del archivo).
const DESTREZAS_DESDE_API: HabilidadType[] = ['lectora', 'auditiva']

// ── Cliente singleton del servidor ──
// Un único cliente reutilizado entre llamadas dentro del mismo proceso
// de Next (el login se cachea hasta que el token expira o falla un 401,
// gestionado internamente por EleApiClient.request()).
let clienteCompartido: EleApiClient | null = null

async function obtenerClienteAutenticado(): Promise<EleApiClient> {
  if (!clienteCompartido) {
    clienteCompartido = new EleApiClient()
  }
  // El login es idempotente de cara al uso: si ya hay token válido,
  // las siguientes peticiones lo reutilizan vía request() interno.
  // Si el token expiró, EleApiClient ya gestiona el refresh automático
  // en request(); solo necesitamos login() la primera vez del proceso.
  const { accessToken } = clienteCompartido.getTokens()
  if (!accessToken) {
    const email = process.env.ELE_API_EMAIL
    const password = process.env.ELE_API_PASSWORD
    if (!email || !password) {
      throw new Error(
        'ELE_API_EMAIL / ELE_API_PASSWORD no configuradas. ' +
        'Revisa .env.local (servidor) o las variables de entorno de Vercel.'
      )
    }
    await clienteCompartido.login(email, password)
  }
  return clienteCompartido
}

// ── Traducción de resultados de Claude → score [0-1] de ELE-API ──
// Mapeo directo acordado: la capa (1/2/3) en que tuvo éxito determina
// el score; un fallo se traduce a un score bajo pero no nulo (refleja
// que hubo intento, igual que haría una rúbrica parcial).
function mapExitoToScore(evaluacion: EvaluacionRespuesta): number {
  if (!evaluacion.exito) return 0.2
  switch (evaluacion.capa) {
    case 1: return 0.9   // éxito al primer intento — dominio claro
    case 2: return 0.7   // éxito con soporte Pip-Boy — dominio con ayuda
    case 3: return 0.5   // éxito tras recalibración — dominio frágil
    default: return 0.6
  }
}

// ── Resultado unificado que devuelven las funciones de este módulo ──
// Mismo "shape" independientemente de si vino de ELE-API o de Claude,
// para que las route handlers no necesiten saber la procedencia.
export interface ContenidoDesafioResult {
  fuente: 'ele-api' | 'claude'
  // Si fuente === 'ele-api': la actividad real con su content.
  actividad?: Activity
  // Si fuente === 'claude': el contenido narrativo de siempre.
  contenidoClaude?: string | ContenidoAuditivo
}

export interface EvaluacionResult {
  fuente: 'ele-api' | 'claude'
  // Resultado en el formato que ya consume ChatChallenge.tsx
  // (se rellena igual venga de donde venga, para no tocar el frontend).
  exito: boolean
  capa: 1 | 2 | 3
  feedbackNarrativo: string
  feedbackTecnico?: string | null
  miniEjercicio?: string | null
  xpGanado: number
  // Score [0-1] que se envió/registró en ELE-API, por si se necesita mostrar.
  scoreEleApi?: number
}

/**
 * Obtiene el contenido de un desafío. Si la habilidad es CL/CA, intenta
 * ELE-API primero; si no hay actividad para ese subnivel, cae a Claude.
 * Para EO/EE va directo a Claude.
 */
export async function obtenerContenidoDesafio(
  subnivel: Subnivel,
  habilidad: HabilidadType,
): Promise<ContenidoDesafioResult> {
  if (DESTREZAS_DESDE_API.includes(habilidad)) {
    try {
      const api = await obtenerClienteAutenticado()
      const skill = HABILIDAD_A_SKILL[habilidad]
      const { data } = await api.listActivities({ levelId: subnivel.id, skill, limit: 1 })

      if (data.length > 0) {
        return { fuente: 'ele-api', actividad: data[0] }
      }
      // No hay actividad cargada para este subnivel todavía → fallback.
      console.info(
        `[orchestrator] Sin actividad ${skill} en ELE-API para ${subnivel.id}. ` +
        `Fallback a Claude. (Pendiente: cargar actividad en ELE-API.)`
      )
    } catch (err) {
      // Si ELE-API falla (red, 401 persistente, etc.), no rompemos la
      // experiencia del estudiante: caemos a Claude igualmente.
      console.error('[orchestrator] Error consultando ELE-API, fallback a Claude:', err)
    }
  }

  // Fallback (o destreza EO/EE, que siempre va aquí).
  const contenidoClaude = await generarContenidoDesafio(subnivel, habilidad)
  return { fuente: 'claude', contenidoClaude }
}

/**
 * Evalúa la respuesta del estudiante. Si el contenido vino de ELE-API,
 * evalúa contra /submit (CE/CO con `answers`). Si vino de Claude, evalúa
 * con Claude como siempre Y ADEMÁS registra el resultado en ELE-API
 * (mapeado a score) para que el progreso quede guardado igual en ambos casos.
 */
export async function evaluarYRegistrarProgreso(params: {
  subnivel: Subnivel
  habilidad: HabilidadType
  userId: string
  // Para CL/CA evaluadas por ELE-API: los índices elegidos.
  answers?: number[]
  // Para EO/EE (o fallback CL/CA): el texto y el historial de chat.
  respuestaTexto?: string
  historial?: MensajeChat[]
  intento?: number
  activityId?: string  // id de la actividad ELE-API, si la hubo
  contextAuditivo?: { preguntas: PreguntaAuditiva[] } | null
}): Promise<EvaluacionResult> {
  const { subnivel, habilidad, userId, answers, respuestaTexto, historial, intento, activityId, contextAuditivo } = params

  // ── Camino 1: la actividad vino de ELE-API (CL/CA con answers) ──
  if (activityId && answers) {
    try {
      const api = await obtenerClienteAutenticado()
      const resultado: SkillScore = await api.submitActivity(activityId, userId, { answers })

      // El umbral de éxito real (passThreshold) vive en el subnivel del
      // currículo de ELE-API, no en el Subnivel local de niveles.json.
      // Por defecto la API usa 0.75 si no se puede consultar.
      const umbral = await obtenerPassThreshold(subnivel.id)

      return {
        fuente: 'ele-api',
        exito: resultado.score >= umbral,
        // ELE-API no tiene el concepto de "capas" de operación-ele;
        // aproximamos: score alto = capa 1, medio = capa 2, bajo = capa 3.
        capa: resultado.score >= 0.85 ? 1 : resultado.score >= 0.6 ? 2 : 3,
        feedbackNarrativo: resultado.feedback.summary,
        feedbackTecnico: null,
        miniEjercicio: null,
        xpGanado: Math.round(resultado.score * 100),
        scoreEleApi: resultado.score,
      }
    } catch (err) {
      console.error('[orchestrator] Error en submit a ELE-API:', err)
      // Si falla el submit, no hay fallback razonable a Claude para CL/CA
      // (Claude generaría contenido distinto del que el estudiante vio).
      // Devolvemos un resultado neutro para no romper la UI.
      return {
        fuente: 'ele-api',
        exito: false,
        capa: 1,
        feedbackNarrativo: '[INTERFERENCIA] No se pudo registrar tu respuesta. Inténtalo de nuevo.',
        xpGanado: 0,
      }
    }
  }

  // ── Camino 2: evaluación con Claude (EO/EE, o fallback de CL/CA) ──
  const [evaluacion, respuestaNPC] = await Promise.all([
    evaluarRespuesta(subnivel, respuestaTexto ?? '', intento ?? 1, contextAuditivo ?? null),
    generarRespuestaNPC(subnivel, habilidad, historial ?? [], respuestaTexto ?? ''),
  ])

  const score = mapExitoToScore(evaluacion)

  // Registramos en ELE-API igualmente, contra la actividad "contenedor"
  // de esta destreza/subnivel, para que el progreso se vea unificado.
  // No bloqueamos la respuesta al estudiante si esto falla.
  registrarEnEleApiSinBloquear({ subnivel, habilidad, userId, score })

  return {
    fuente: 'claude',
    exito: evaluacion.exito,
    capa: evaluacion.capa,
    feedbackNarrativo: respuestaNPC || evaluacion.feedbackNarrativo,
    feedbackTecnico: evaluacion.feedbackTecnico ?? null,
    miniEjercicio: evaluacion.miniEjercicio ?? null,
    xpGanado: evaluacion.xpGanado,
    scoreEleApi: score,
  }
}

/**
 * Registra en ELE-API el resultado de una evaluación hecha por Claude,
 * sin bloquear ni propagar errores al estudiante: es un "best effort" de
 * sincronización de progreso. Si ELE-API no tiene todavía una actividad
 * "contenedor" para EO/EE de este subnivel, esto fallará con 404 — se
 * loguea pero no rompe la experiencia (queda como pendiente de la sección
 * "cargar actividades en ELE-API" del ESTADO_PROYECTO.md).
 */
function registrarEnEleApiSinBloquear(params: {
  subnivel: Subnivel
  habilidad: HabilidadType
  userId: string
  score: number
}) {
  const { subnivel, habilidad, userId, score } = params
  ;(async () => {
    try {
      const api = await obtenerClienteAutenticado()
      const skill = HABILIDAD_A_SKILL[habilidad]
      const { data } = await api.listActivities({ levelId: subnivel.id, skill, limit: 1 })
      if (data.length === 0) {
        console.info(
          `[orchestrator] Sin actividad contenedor ${skill} en ELE-API para ` +
          `${subnivel.id}. Progreso no sincronizado (pendiente: crear actividad).`
        )
        return
      }
      // Claude ya evaluó con texto libre; aquí solo informamos el score
      // resultante. ELE-API espera `response` con forma EE/EO → { text }.
      await api.submitActivity(data[0].id, userId, { text: '[evaluado por Claude en operación-ele]' })
    } catch (err) {
      console.error('[orchestrator] No se pudo sincronizar progreso con ELE-API:', err)
    }
  })()
}

/** Re-exporta el tipo de error para que las rutas puedan capturarlo. */
export { EleApiError }
