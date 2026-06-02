// Cliente para la API de Anthropic (Claude)
// Modelo: claude-haiku-4-5-20251001 (rápido y económico — ideal para este juego)
// Alternativa premium: claude-sonnet-4-6 (más preciso, más caro)
//
// INSTALACIÓN:
//   npm install @anthropic-ai/sdk
//
// .env.local:
//   ANTHROPIC_API_KEY=sk-ant-xxxxxxxx

import Anthropic from '@anthropic-ai/sdk'
import { Subnivel, HabilidadType, MensajeChat, EvaluacionRespuesta } from './types'

// HFStatus se mantiene por compatibilidad con ChatChallenge.tsx
export type HFStatus = 'idle' | 'cold_start' | 'retrying' | 'ok' | 'error'

const MODEL = 'claude-haiku-4-5-20251001'  // Cámbialo a claude-sonnet-4-6 para más calidad
const MAX_TOKENS = 800

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY no configurado en .env.local')
  return new Anthropic({ apiKey })
}

// ─── Prompts ─────────────────────────────────────────────────────────────────

function buildSystemPrompt(subnivel: Subnivel, habilidad: HabilidadType): string {
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
- CAPA 2 (error persistente): Detén la narrativa e indica: [PIP-BOY ALERTA] + diagnóstico técnico según: ${subnivel.feedbackPipboy}
- CAPA 3 (error crítico repetido): Pausa total. Da la regla gramatical clara y un mini-ejercicio de validación. Luego continúa la historia.

ERRORES CRÍTICOS A VIGILAR:
${subnivel.erroresCriticos.map((e, i) => `${i + 1}. ${e}`).join('\n')}

REGLA DE ORO: Nunca bloquees el progreso total. Si tras la Capa 3 el agente sigue fallando, activa un evento narrativo externo que permite avanzar pero penaliza la Reputación.

IDIOMA: Responde SIEMPRE en español. Mantén la atmósfera de espionaje retro-futurista.
LONGITUD: Concisa (máx 4 frases para NPC, máx 6 líneas para feedback técnico).`
}

function buildEvaluationPrompt(subnivel: Subnivel, respuestaUsuario: string, intentoNumero: number): string {
  return `Analiza esta respuesta del agente en español nivel ${subnivel.id}.

RESPUESTA DEL AGENTE: "${respuestaUsuario}"

ERRORES CRÍTICOS A EVALUAR:
${subnivel.erroresCriticos.map((e, i) => `${i + 1}. ${e}`).join('\n')}

INTENTO NÚMERO: ${intentoNumero}

Responde SOLO con un JSON válido con esta estructura (sin texto adicional, sin bloques de código):
{
  "exito": true,
  "capa": 1,
  "erroresEncontrados": [],
  "feedbackNarrativo": "respuesta del NPC en tono de espionaje",
  "feedbackTecnico": null,
  "miniEjercicio": null,
  "xpGanado": 75
}`
}

// ─── Llamada base a Claude ────────────────────────────────────────────────────

async function callClaude(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  onStatus?: (s: HFStatus, msg?: string) => void
): Promise<string> {
  onStatus?.('idle')
  const client = getClient()
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages,
    })
    onStatus?.('ok')
    const block = response.content[0]
    return block.type === 'text' ? block.text : ''
  } catch (error: any) {
    onStatus?.('error', 'Error conectando con Claude API')
    throw error
  }
}

// ─── Exports públicos (misma interfaz que huggingface.ts) ────────────────────

export async function generarRespuestaNPC(
  subnivel: Subnivel,
  habilidad: HabilidadType,
  historialChat: MensajeChat[],
  mensajeUsuario: string,
  onStatus?: (s: HFStatus, msg?: string) => void
): Promise<string> {
  const systemPrompt = buildSystemPrompt(subnivel, habilidad)
  const messages = [
    ...historialChat.map(m => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: mensajeUsuario },
  ]
  return callClaude(systemPrompt, messages, onStatus)
}

export async function evaluarRespuesta(
  subnivel: Subnivel,
  respuestaUsuario: string,
  intentoNumero: number,
  onStatus?: (s: HFStatus, msg?: string) => void
): Promise<EvaluacionRespuesta> {
  const systemPrompt = 'Eres un evaluador experto de español como lengua extranjera. Responde ÚNICAMENTE con JSON válido, sin texto adicional.'
  const evalPrompt   = buildEvaluationPrompt(subnivel, respuestaUsuario, intentoNumero)

  try {
    const raw = await callClaude(systemPrompt, [{ role: 'user', content: evalPrompt }], onStatus)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON no encontrado')
    return JSON.parse(jsonMatch[0]) as EvaluacionRespuesta
  } catch (error) {
    console.error('Error evaluando respuesta:', error)
    return {
      exito: false,
      capa: 1,
      feedbackNarrativo: 'La señal se ha cortado. Por favor, repite tu mensaje, agente.',
      xpGanado: 0,
    }
  }
}

export async function generarContenidoDesafio(
  subnivel: Subnivel,
  habilidad: HabilidadType,
  onStatus?: (s: HFStatus, msg?: string) => void
): Promise<string> {
  const desafio = subnivel.desafios[habilidad]
  const systemPrompt = 'Eres el generador de contenido del juego Operación ELE. Genera solo el contenido pedido, sin explicaciones ni introducciones.'
  const userPrompt   = `${desafio.prompt}
Vocabulario a usar: ${subnivel.vocabulario.join(', ')}
Verbos: ${subnivel.verbos.join(', ')}
Genera el contenido ahora.`

  return callClaude(systemPrompt, [{ role: 'user', content: userPrompt }], onStatus)
}
