import { NextRequest, NextResponse } from 'next/server'
import { evaluarYRegistrarProgreso } from '@/lib/eleApiOrchestrator'
import { Subnivel, HabilidadType, MensajeChat, PreguntaAuditiva } from '@/lib/types'

export const maxDuration = 90

/**
 * Evalúa la respuesta del estudiante.
 *
 * Compatibilidad: si la petición no incluye `userId` (el frontend actual
 * todavía no lo envía), se comporta exactamente igual que antes de esta
 * sesión — evaluación pura con Claude, sin tocar ELE-API. En cuanto
 * ChatChallenge.tsx se actualice para enviar `userId` (pendiente de una
 * futura sesión: requiere sistema de autenticación de estudiante en el
 * propio operación-ele), el progreso empezará a sincronizarse solo.
 *
 * Si la actividad vino de ELE-API (CL/CA), la petición debe incluir
 * `activityId` y `answers` en vez de `mensaje`/`historial`.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      subnivel: Subnivel
      habilidad: HabilidadType
      historial?: MensajeChat[]
      mensaje?: string
      intento?: number
      contextAuditivo?: { preguntas: PreguntaAuditiva[] } | null
      // Nuevos campos, opcionales hasta que el frontend los envíe:
      userId?: string
      activityId?: string
      answers?: number[]
    }

    const { subnivel, habilidad, historial, mensaje, intento, contextAuditivo, userId, activityId, answers } = body

    // Sin userId todavía: comportamiento idéntico al de antes de esta
    // sesión. evaluarYRegistrarProgreso con userId vacío simplemente
    // no podrá registrar en ELE-API (lo intenta y falla en silencio,
    // ver registrarEnEleApiSinBloquear), pero la evaluación con Claude
    // funciona exactamente igual que siempre.
    const resultado = await evaluarYRegistrarProgreso({
      subnivel,
      habilidad,
      userId: userId ?? 'anonimo-sin-auth',
      answers,
      respuestaTexto: mensaje,
      historial,
      intento,
      activityId,
      contextAuditivo,
    })

    return NextResponse.json({
      feedbackNarrativo: resultado.feedbackNarrativo,
      exito:             resultado.exito,
      capa:              resultado.capa,
      feedbackTecnico:   resultado.feedbackTecnico ?? null,
      miniEjercicio:     resultado.miniEjercicio ?? null,
      xpGanado:          resultado.xpGanado,
      fuente:            resultado.fuente,
    })
  } catch (error) {
    console.error('[/api/chat] Error:', error)
    return NextResponse.json({
      feedbackNarrativo: '[INTERFERENCIA] Señal perdida. Repite el mensaje, agente.',
      exito: false,
      capa: 1,
      feedbackTecnico: null,
      miniEjercicio: null,
      xpGanado: 0,
    }, { status: 200 })
  }
}
