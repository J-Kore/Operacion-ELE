// ─────────────────────────────────────────────────────────────────────────────
// lib/ai.ts
// Motor de IA de Operación ELE — Anthropic Claude (claude-sonnet-4-20250514)
//
// Reemplaza lib/huggingface.ts. Exporta las mismas tres funciones públicas:
//   - generarContenidoDesafio()
//   - generarRespuestaNPC()
//   - evaluarRespuesta()
//
// Las rutas API (app/api/chat/route.ts y app/api/generar-contenido/route.ts)
// no necesitan ningún cambio — siguen importando desde @/lib/ai.
// ─────────────────────────────────────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk'
import { Subnivel, HabilidadType, MensajeChat, EvaluacionRespuesta } from './types'

// Cliente Anthropic — lee la clave desde .env.local automáticamente
// (el SDK busca process.env.ANTHROPIC_API_KEY por defecto)
const anthropic = new Anthropic()

// Modelo a usar — claude-sonnet-4-20250514 ofrece el mejor balance
// entre calidad pedagógica y velocidad de respuesta
const MODEL = 'claude-sonnet-4-6'

// Tokens máximos por tipo de llamada
const MAX_TOKENS_NPC      = 400   // respuesta narrativa del NPC: concisa
const MAX_TOKENS_EVAL     = 600   // evaluación: necesita JSON estructurado
const MAX_TOKENS_CONTENIDO = 800  // generación de contenido inicial: más largo


// ─────────────────────────────────────────────────────────────────────────────
// PROMPTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * System prompt para el NPC — define el comportamiento narrativo y pedagógico.
 * Se construye con los datos del subnivel para que la IA evalúe exactamente
 * los inventarios lingüísticos del nivel Cervantes activo.
 */
function buildSystemPromptNPC(subnivel: Subnivel, habilidad: HabilidadType): string {
  const desafio = subnivel.desafios[habilidad]
  return `Eres el motor narrativo de "Operación E.L.E.", un juego de espionaje para aprender español.

ROL ACTUAL: ${desafio.prompt}

NIVEL CERVANTES: ${subnivel.macro} — Subnivel ${subnivel.id}: ${subnivel.nombre}
META COMUNICATIVA: ${subnivel.metaComunicativa}
MORFOSINTAXIS FOCO: ${subnivel.morfosintaxis}
VERBOS CLAVE: ${subnivel.verbos.join(', ')}
VOCABULARIO: ${subnivel.vocabulario.join(', ')}
GRAMÁTICA PROHIBIDA (el agente no debe usar): ${subnivel.gramaticaProhibida}

SISTEMA DE FEEDBACK — TRES CAPAS:
- CAPA 1 (primer error): Responde como NPC con dudas o sospecha. No des feedback directo. El agente debe intentar corregirse solo.
- CAPA 2 (error persistente): Detén la narrativa e indica [PIP-BOY ALERTA] + diagnóstico técnico según: ${subnivel.feedbackPipboy}
- CAPA 3 (error crítico repetido): Pausa total. Da la regla gramatical clara y un mini-ejercicio de validación. Luego continúa la historia.

ERRORES CRÍTICOS A VIGILAR:
${subnivel.erroresCriticos.map((e, i) => `${i + 1}. ${e}`).join('\n')}

REGLA DE ORO: Nunca bloquees el progreso total. Si tras la Capa 3 el agente sigue fallando, activa un evento narrativo externo (explosión, distracción) que permite avanzar pero penaliza la Reputación.

IDIOMA: Responde SIEMPRE en español. Mantén la atmósfera de espionaje retro-futurista.
LONGITUD: Concisa — máx 4 frases para NPC, máx 6 líneas para feedback técnico.
FORMATO: Texto plano únicamente. Sin markdown, sin asteriscos, sin negritas, sin guiones decorativos, sin emojis. Solo texto y saltos de línea.
IMPORTANTE: El NPC habla siempre en español correcto y natural. Nunca usa estructuras incorrectas ni calcos de otros idiomas. Si necesita dar una orden usa imperativo afirmativo en forma tú o la perífrasis tener que + infinitivo: "Alto", "Presentate", "Identifícate", "Procede", "Espera", "Tienes que esperar", "Tienes que presentarte".`
}

/**
 * Prompt de evaluación — pide a la IA un JSON estructurado con el análisis
 * lingüístico de la respuesta del estudiante.
 */
function buildEvaluationPrompt(
  subnivel: Subnivel,
  respuestaUsuario: string,
  intentoNumero: number
): string {
  return `Analiza esta respuesta del agente en español nivel ${subnivel.id}.

RESPUESTA DEL AGENTE: "${respuestaUsuario}"

ERRORES CRÍTICOS A EVALUAR:
${subnivel.erroresCriticos.map((e, i) => `${i + 1}. ${e}`).join('\n')}

INTENTO NÚMERO: ${intentoNumero}

Responde SOLO con un JSON válido con esta estructura exacta (sin texto adicional, sin markdown):
{
  "exito": true o false,
  "capa": 1, 2 o 3,
  "erroresEncontrados": ["error1", "error2"],
  "feedbackNarrativo": "respuesta del NPC en tono de espionaje (máx 3 frases)",
  "feedbackTecnico": "diagnóstico Pip-Boy (solo si capa >= 2, sino null)",
  "miniEjercicio": "mini-ejercicio corto (solo si capa 3, sino null)",
  "xpGanado": número entre 0 y 100
}`
}


// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN INTERNA: llamada base a la API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Llamada directa a la API de Anthropic.
 * A diferencia de Hugging Face, Claude no tiene cold start —
 * la respuesta llega en pocos segundos sin reintentos por carga del modelo.
 */
async function callClaude(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  maxTokens: number
): Promise<string> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    // La API de Anthropic espera el historial en formato { role, content }
    // que ya coincide con nuestro tipo MensajeChat — sin conversión necesaria
    messages,
  })

  // Extraemos el texto del primer bloque de contenido
  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Respuesta inesperada de la API')
  return block.text
}


// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS PÚBLICOS
// Estas tres funciones son las que llaman las rutas API.
// Sus firmas son idénticas a las de huggingface.ts para que no haya
// que tocar ningún otro archivo del proyecto.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Genera el mensaje inicial del NPC que arranca el desafío.
 * Se llama desde /api/generar-contenido al entrar en una misión.
 */
export async function generarContenidoDesafio(
  subnivel: Subnivel,
  habilidad: HabilidadType
): Promise<string> {
  const desafio = subnivel.desafios[habilidad]

  const systemPrompt = `Eres el generador de contenido del juego Operación ELE.
Genera el mensaje inicial del NPC para arrancar el desafío.
Vocabulario a usar: ${subnivel.vocabulario.join(', ')}
Verbos: ${subnivel.verbos.join(', ')}
Solo el contenido narrativo, sin explicaciones ni metadatos.
Responde en español con tono de espionaje retro-futurista.
Formato: texto plano únicamente, sin markdown, sin asteriscos, sin emojis.`

  const userMessage = desafio.prompt

  try {
    return await callClaude(
      systemPrompt,
      [{ role: 'user', content: userMessage }],
      MAX_TOKENS_CONTENIDO
    )
  } catch (error) {
    console.error('[ai] generarContenidoDesafio error:', error)
    // Fallback narrativo — la misión puede continuar aunque falle la generación
    return '[SEÑAL DÉBIL] Agente, la transmisión tiene interferencias. El objetivo te espera. Identifícate y reporta tu estado.'
  }
}

/**
 * Genera la respuesta narrativa del NPC al mensaje del estudiante.
 * Se llama en paralelo con evaluarRespuesta desde /api/chat.
 */
export async function generarRespuestaNPC(
  subnivel: Subnivel,
  habilidad: HabilidadType,
  historialChat: MensajeChat[],
  mensajeUsuario: string
): Promise<string> {
  const systemPrompt = buildSystemPromptNPC(subnivel, habilidad)

  // Construimos el historial completo incluyendo el mensaje actual del usuario
  const messages: { role: 'user' | 'assistant'; content: string }[] = [
    ...historialChat.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: mensajeUsuario },
  ]

  try {
    return await callClaude(systemPrompt, messages, MAX_TOKENS_NPC)
  } catch (error) {
    console.error('[ai] generarRespuestaNPC error:', error)
    return '[INTERFERENCIA] Señal perdida. Repite el mensaje, agente.'
  }
}

/**
 * Evalúa lingüísticamente la respuesta del estudiante y devuelve
 * un objeto estructurado con el resultado, capa de feedback y XP ganado.
 * Se llama en paralelo con generarRespuestaNPC desde /api/chat.
 */
export async function evaluarRespuesta(
  subnivel: Subnivel,
  respuestaUsuario: string,
  intentoNumero: number
): Promise<EvaluacionRespuesta> {
  const systemPrompt = `Eres un evaluador experto de español como lengua extranjera.
Sigues el Plan Curricular del Instituto Cervantes (PCIC).
Respondes ÚNICAMENTE con JSON válido, sin texto adicional, sin bloques markdown.`

  const userMessage = buildEvaluationPrompt(subnivel, respuestaUsuario, intentoNumero)

  try {
    const raw = await callClaude(
      systemPrompt,
      [{ role: 'user', content: userMessage }],
      MAX_TOKENS_EVAL
    )

    // Limpiamos por si el modelo añade bloques ```json ``` a pesar de las instrucciones
    const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    // Buscamos el JSON en la respuesta
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON no encontrado en respuesta de evaluación')

    return JSON.parse(jsonMatch[0]) as EvaluacionRespuesta

  } catch (error) {
    console.error('[ai] evaluarRespuesta error:', error)
    // Fallback conservador: no penalizamos al estudiante por errores de red
    return {
      exito: false,
      capa: 1,
      feedbackNarrativo: 'La señal se ha cortado. Por favor, repite tu mensaje, agente.',
      xpGanado: 0,
    }
  }
}