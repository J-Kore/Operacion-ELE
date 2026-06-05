/**
 * lib/ai.ts — Selector de proveedor de IA
 *
 * Elige automáticamente el cliente correcto según AI_PROVIDER en .env.local.
 * Los archivos de API routes solo importan desde aquí — nunca directamente
 * de huggingface.ts, anthropic.ts u openai.ts.
 *
 * Para cambiar de proveedor: edita AI_PROVIDER en .env.local y reinicia.
 */

import type { Subnivel, HabilidadType, MensajeChat, EvaluacionRespuesta } from './types'
export type { HFStatus } from './huggingface'

type AIClient = {
  generarRespuestaNPC(
    subnivel: Subnivel,
    habilidad: HabilidadType,
    historialChat: MensajeChat[],
    mensajeUsuario: string,
    onStatus?: (s: any, msg?: string) => void
  ): Promise<string>

  evaluarRespuesta(
    subnivel: Subnivel,
    respuestaUsuario: string,
    intentoNumero: number,
    onStatus?: (s: any, msg?: string) => void
  ): Promise<EvaluacionRespuesta>

  generarContenidoDesafio(
    subnivel: Subnivel,
    habilidad: HabilidadType,
    onStatus?: (s: any, msg?: string) => void
  ): Promise<string>
}

function getProvider(): string {
  return (process.env.AI_PROVIDER ?? 'huggingface').toLowerCase().trim()
}

async function loadClient(): Promise<AIClient> {
  const provider = getProvider()
  switch (provider) {
    case 'anthropic':
      return await import('./anthropic')
    case 'openai':
      return await import('./openai')
    case 'huggingface':
    default:
      return await import('./huggingface')
  }
}

// Re-exportamos las funciones con la misma interfaz pública
export async function generarRespuestaNPC(
  subnivel: Subnivel,
  habilidad: HabilidadType,
  historialChat: MensajeChat[],
  mensajeUsuario: string,
  onStatus?: (s: any, msg?: string) => void
): Promise<string> {
  const client = await loadClient()
  return client.generarRespuestaNPC(subnivel, habilidad, historialChat, mensajeUsuario, onStatus)
}

export async function evaluarRespuesta(
  subnivel: Subnivel,
  respuestaUsuario: string,
  intentoNumero: number,
  onStatus?: (s: any, msg?: string) => void
): Promise<EvaluacionRespuesta> {
  const client = await loadClient()
  return client.evaluarRespuesta(subnivel, respuestaUsuario, intentoNumero, onStatus)
}

export async function generarContenidoDesafio(
  subnivel: Subnivel,
  habilidad: HabilidadType,
  onStatus?: (s: any, msg?: string) => void
): Promise<string> {
  const client = await loadClient()
  return client.generarContenidoDesafio(subnivel, habilidad, onStatus)
}
