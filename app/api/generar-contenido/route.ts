import { NextRequest, NextResponse } from 'next/server'
import { obtenerContenidoDesafio } from '@/lib/eleApiOrchestrator'
import { Subnivel, HabilidadType, ContenidoAuditivo } from '@/lib/types'

export const maxDuration = 90

/**
 * Genera el contenido inicial de un desafío.
 *
 * Desde esta sesión, lectora (CL) y auditiva (CA) intentan primero
 * ELE-API (actividades reales con opción múltiple); si el subnivel
 * aún no tiene actividad cargada, cae automáticamente a Claude.
 * Oral y escrita siguen siempre generadas por Claude.
 *
 * El contrato de respuesta hacia ChatChallenge.tsx NO cambia:
 * - auditiva → objeto ContenidoAuditivo completo
 * - resto    → { contenido: string }
 * Si el contenido vino de ELE-API, se adapta a esa misma forma para
 * que el frontend no necesite saber la procedencia (todavía).
 */
export async function POST(req: NextRequest) {
  try {
    const { subnivel, habilidad } = await req.json() as {
      subnivel: Subnivel
      habilidad: HabilidadType
    }

    const resultado = await obtenerContenidoDesafio(subnivel, habilidad)

    if (resultado.fuente === 'ele-api' && resultado.actividad) {
      // Adaptamos la actividad de ELE-API a la forma que ya entiende el
      // frontend. Por ahora exponemos el `content` tal cual (el cliente
      // de CL/CA sabrá renderizarlo cuando se actualice ChatChallenge);
      // mientras tanto, devolvemos también un resumen en `contenido`
      // para no romper la UI actual basada en texto.
      return NextResponse.json({
        contenido: JSON.stringify(resultado.actividad.content),
        eleApiActivityId: resultado.actividad.id,
        fuente: 'ele-api',
      })
    }

    // Fuente Claude: mismo comportamiento que antes de esta sesión.
    if (habilidad === 'auditiva') {
      return NextResponse.json({
        ...(resultado.contenidoClaude as ContenidoAuditivo),
        fuente: 'claude',
      })
    }
    return NextResponse.json({
      contenido: resultado.contenidoClaude as string,
      fuente: 'claude',
    })

  } catch (error) {
    console.error('[/api/generar-contenido] Error:', error)
    return NextResponse.json({
      contenido: '[SEÑAL DÉBIL] Agente, la transmisión tiene interferencias. El objetivo te espera. Identifícate y reporta tu estado.',
      fuente: 'claude',
    })
  }
}
