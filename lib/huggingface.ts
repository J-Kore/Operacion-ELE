// Cliente para Hugging Face Inference API
// Modelo: mistralai/Mixtral-8x7B-Instruct-v0.1 (gratuito con token HF)
// Alternativa: meta-llama/Meta-Llama-3-8B-Instruct

import { Subnivel, HabilidadType, MensajeChat, EvaluacionRespuesta } from './types'

const HF_API_URL = 'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1'
const MAX_RETRIES = 3
const COLD_START_WAIT_MS = 25000   // 25 s de espera en cold start
const RETRY_DELAY_MS     = 5000    // 5 s entre reintentos normales

// ─── Prompts ────────────────────────────────────────────────────────────────

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

REGLA DE ORO: Nunca bloquees el progreso total. Si tras la Capa 3 el agente sigue fallando, activa un evento narrativo externo (explosión, distracción) que permite avanzar pero penaliza la Reputación.

IDIOMA: Responde SIEMPRE en español. Mantén la atmósfera de espionaje retro-futurista.
LONGITUD DE RESPUESTA: Concisa (máx 4 frases para NPC, máx 6 líneas para feedback técnico).`
}

function buildEvaluationPrompt(subnivel: Subnivel, respuestaUsuario: string, intentoNumero: number): string {
  return `Analiza esta respuesta del agente en español nivel ${subnivel.id}.

RESPUESTA DEL AGENTE: "${respuestaUsuario}"

ERRORES CRÍTICOS A EVALUAR:
${subnivel.erroresCriticos.map((e, i) => `${i + 1}. ${e}`).join('\n')}

INTENTO NÚMERO: ${intentoNumero}

Responde SOLO con un JSON con esta estructura exacta (sin texto adicional):
{
  "exito": true/false,
  "capa": 1/2/3,
  "erroresEncontrados": ["error1", "error2"],
  "feedbackNarrativo": "respuesta del NPC en tono de espionaje",
  "feedbackTecnico": "diagnóstico Pip-Boy (solo si capa >= 2, sino null)",
  "miniEjercicio": "mini-ejercicio corto (solo si capa 3, sino null)",
  "xpGanado": número entre 0 y 100
}`
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** Detecta si el modelo está en cold start por el mensaje de error de HF */
function isColdStart(body: string): boolean {
  return body.includes('loading') || body.includes('currently loading') || body.includes('503')
}

// ─── Llamada a la API con reintentos y manejo de cold start ──────────────────

export type HFStatus = 'idle' | 'cold_start' | 'retrying' | 'ok' | 'error'

/**
 * Llama a la API de HF con:
 *  - Detección de cold start → espera COLD_START_WAIT_MS y reintenta
 *  - Hasta MAX_RETRIES reintentos con backoff
 *  - Callback opcional onStatus para que el componente pueda mostrar mensajes al usuario
 */
async function callHuggingFace(
  prompt: string,
  onStatus?: (s: HFStatus, msg?: string) => void
): Promise<string> {
  const token = process.env.HUGGINGFACE_API_TOKEN
  if (!token) throw new Error('HUGGINGFACE_API_TOKEN no configurado en .env.local')

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          top_p: 0.9,
          do_sample: true,
          return_full_text: false,
        },
        // Pedimos a HF que espere si el modelo está cargando (hasta 60 s)
        options: { wait_for_model: true },
      }),
    })

    // ── Cold start (503 o body con "loading") ──
    if (response.status === 503) {
      const body = await response.text()
      if (isColdStart(body) && attempt < MAX_RETRIES) {
        onStatus?.('cold_start', `El modelo se está iniciando... (intento ${attempt}/${MAX_RETRIES})`)
        await sleep(COLD_START_WAIT_MS)
        continue
      }
    }

    // ── Error HTTP no recuperable ──
    if (!response.ok) {
      const errText = await response.text()
      if (attempt < MAX_RETRIES) {
        onStatus?.('retrying', `Error ${response.status}, reintentando...`)
        await sleep(RETRY_DELAY_MS * attempt)
        continue
      }
      throw new Error(`HF API error ${response.status}: ${errText}`)
    }

    // ── Respuesta OK ──
    onStatus?.('ok')
    const data = await response.json()
    return data[0]?.generated_text ?? ''
  }

  throw new Error('No se pudo conectar con el modelo tras varios intentos.')
}

// ─── Formato de historial Mistral Instruct ────────────────────────────────────

function formatChatHistory(systemPrompt: string, history: MensajeChat[]): string {
  let prompt = `<s>[INST] ${systemPrompt}\n\n`
  for (let i = 0; i < history.length; i++) {
    const msg = history[i]
    if (msg.role === 'user') {
      prompt += i === 0 ? `${msg.content} [/INST]` : ` [INST] ${msg.content} [/INST]`
    } else {
      prompt += ` ${msg.content} </s>`
    }
  }
  return prompt
}

// ─── Exports públicos ────────────────────────────────────────────────────────

export async function generarRespuestaNPC(
  subnivel: Subnivel,
  habilidad: HabilidadType,
  historialChat: MensajeChat[],
  mensajeUsuario: string,
  onStatus?: (s: HFStatus, msg?: string) => void
): Promise<string> {
  const systemPrompt = buildSystemPrompt(subnivel, habilidad)
  const historial = [...historialChat, { role: 'user' as const, content: mensajeUsuario }]
  const prompt = formatChatHistory(systemPrompt, historial)
  return callHuggingFace(prompt, onStatus)
}

export async function evaluarRespuesta(
  subnivel: Subnivel,
  respuestaUsuario: string,
  intentoNumero: number,
  onStatus?: (s: HFStatus, msg?: string) => void
): Promise<EvaluacionRespuesta> {
  const evalPrompt = buildEvaluationPrompt(subnivel, respuestaUsuario, intentoNumero)
  try {
    const raw = await callHuggingFace(
      `<s>[INST] Eres un evaluador de español. ${evalPrompt} [/INST]`,
      onStatus
    )
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON no encontrado en respuesta')
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
  const prompt = `<s>[INST] Eres el generador de contenido del juego Operación ELE.
${desafio.prompt}
Vocabulario a usar: ${subnivel.vocabulario.join(', ')}
Verbos: ${subnivel.verbos.join(', ')}
Genera el contenido ahora. Solo el contenido, sin explicaciones. [/INST]`
  return callHuggingFace(prompt, onStatus)
}
