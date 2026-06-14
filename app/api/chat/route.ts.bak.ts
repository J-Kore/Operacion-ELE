import { NextRequest, NextResponse } from 'next/server'
import { generarRespuestaNPC, evaluarRespuesta } from '@/lib/ai'
import { Subnivel, HabilidadType, MensajeChat } from '@/lib/types'

export const maxDuration = 90

export async function POST(req: NextRequest) {
  try {
    const { subnivel, habilidad, historial, mensaje, intento } = await req.json() as {
      subnivel: Subnivel
      habilidad: HabilidadType
      historial: MensajeChat[]
      mensaje: string
      intento: number
    }

    const [evaluacion, respuestaNPC] = await Promise.all([
      evaluarRespuesta(subnivel, mensaje, intento),
      generarRespuestaNPC(subnivel, habilidad, historial, mensaje),
    ])

    return NextResponse.json({
      feedbackNarrativo: respuestaNPC || evaluacion.feedbackNarrativo,
      exito:             evaluacion.exito,
      capa:              evaluacion.capa,
      feedbackTecnico:   evaluacion.feedbackTecnico  ?? null,
      miniEjercicio:     evaluacion.miniEjercicio    ?? null,
      xpGanado:          evaluacion.xpGanado,
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
