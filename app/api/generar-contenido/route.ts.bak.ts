import { NextRequest, NextResponse } from 'next/server'
import { generarContenidoDesafio } from '@/lib/ai'
import { Subnivel, HabilidadType } from '@/lib/types'

export const maxDuration = 90

export async function POST(req: NextRequest) {
  try {
    const { subnivel, habilidad } = await req.json() as {
      subnivel: Subnivel
      habilidad: HabilidadType
    }
    const contenido = await generarContenidoDesafio(subnivel, habilidad)
    return NextResponse.json({ contenido })
  } catch (error) {
    console.error('[/api/generar-contenido] Error:', error)
    return NextResponse.json({
      contenido: '[SEÑAL DÉBIL] Agente, la transmisión tiene interferencias. El objetivo te espera. Identifícate y reporta tu estado.',
    })
  }
}
