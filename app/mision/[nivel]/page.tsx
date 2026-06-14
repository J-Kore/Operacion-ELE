'use client'
// ─────────────────────────────────────────────────────────────────────────────
// app/mision/[nivel]/[habilidad]/page.tsx
//
// Nuevo layout tipo "wizard con tabs fijas" — basado en el patrón /agente.
// La página NO hace scroll: header compacto + subNav 4 tabs + chat ocupa todo.
// El input siempre es visible porque el scroll ocurre dentro del terminal.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PipBoyLayout from '@/components/PipBoy/PipBoyLayout'
import ChatChallenge from '@/components/Challenges/ChatChallenge'
import { Subnivel, HabilidadType, ProgresoJugador } from '@/lib/types'
import { cargarProgreso, guardarProgreso, completarDesafio } from '@/lib/gameState'
import { usePipBoySound } from '@/hooks/usePipBoySound'
import nivelesData from '@/data/niveles.json'
import styles from './page.module.css'

// ── Configuración de las 4 habilidades (orden de navegación) ──
const HABILIDADES: HabilidadType[] = ['oral', 'escrita', 'lectora', 'auditiva']

const HABILIDAD_CFG: Record<HabilidadType, { icon: string; label: string; labelCorto: string }> = {
  oral:     { icon: '📡', label: 'Expresión Oral',       labelCorto: 'E.Oral'    },
  escrita:  { icon: '⌨️', label: 'Expresión Escrita',    labelCorto: 'E.Escrita' },
  lectora:  { icon: '📄', label: 'Comprensión Lectora',  labelCorto: 'C.Lectora' },
  auditiva: { icon: '🎧', label: 'Comprensión Auditiva', labelCorto: 'C.Audio'   },
}

export default function MisionPage() {
  const params    = useParams()
  const router    = useRouter()
  const { play }  = usePipBoySound()

  const nivelId   = params.nivel    as string
  const habilidad = params.habilidad as HabilidadType

  const [subnivel,  setSubnivel]  = useState<Subnivel | null>(null)
  const [progreso,  setProgreso]  = useState<ProgresoJugador | null>(null)
  const [xpFlash,   setXpFlash]   = useState<number | null>(null)
  const [autoNav,   setAutoNav]   = useState(false)

  useEffect(() => {
    const sn = (nivelesData.subniveles as Subnivel[]).find(s => s.id === nivelId)
    setSubnivel(sn ?? null)
    setProgreso(cargarProgreso())
    setXpFlash(null)
    setAutoNav(false)
  }, [nivelId, habilidad])

  // ── Callback cuando el estudiante supera un desafío ──
  function handleExito(xp: number) {
    if (!progreso || !subnivel) return
    const nuevo = completarDesafio(progreso, subnivel.id, habilidad, xp)
    guardarProgreso(nuevo)
    setProgreso(nuevo)
    setXpFlash(xp)

    const nivelAhoraCompleto = (nuevo.desafiosCompletados[subnivel.id]?.length ?? 0) >= 4

    if (nivelAhoraCompleto) {
      play('levelup')
      setAutoNav(true)
      setTimeout(() => router.push('/mapa'), 4000)
    } else {
      play('success')
      // Auto-avanzar al siguiente tab de habilidad en 2.5 s
      const idx = HABILIDADES.indexOf(habilidad)
      const siguienteH = HABILIDADES[idx + 1]
      if (siguienteH) {
        setTimeout(() => {
          setXpFlash(null)
          router.push(`/mision/${nivelId}/${siguienteH}`)
        }, 2500)
      }
    }
    setTimeout(() => setXpFlash(null), 2400)
  }

  // ── Derivados de progreso ──
  const desafiosCompletados = progreso?.desafiosCompletados[nivelId] ?? []
  const nivelCompleto       = desafiosCompletados.length >= 4

  // ── Loading state ──
  if (!subnivel) return (
    <PipBoyLayout>
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--pip-dim)', fontFamily: 'monospace', fontSize: '0.7rem' }}>
        CARGANDO MISIÓN...
      </div>
    </PipBoyLayout>
  )

  const esAuditiva = habilidad === 'auditiva'

  return (
    <PipBoyLayout>
      <div className={styles.page}>

        {/* ── HEADER COMPACTO ─────────────────────────────────────────────── */}
        {/* Una sola línea: breadcrumb + nombre truncado + 4 puntos de progreso */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            {/* Breadcrumb */}
            <div className={styles.breadcrumb}>
              <Link href="/mapa" className={styles.breadLink} onClick={() => play('click')}>
                ◈ MAPA
              </Link>
              <span className={styles.breadSep}>›</span>
              <span>{subnivel.id}</span>
            </div>

            {/* Nombre de la misión — truncado en móvil */}
            <div className={styles.misionNombre}>{subnivel.nombre.toUpperCase()}</div>

            {/* 4 puntos: uno por habilidad, verde si está completa */}
            <div className={styles.progresoPuntos} title={`${desafiosCompletados.length}/4 desafíos`}>
              {HABILIDADES.map(h => (
                <div
                  key={h}
                  className={`${styles.progresoPunto} ${desafiosCompletados.includes(h) ? styles.progresoPuntoHecho : ''}`}
                  title={HABILIDAD_CFG[h].label}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── SUB-NAV: 4 TABS DE HABILIDAD ────────────────────────────────── */}
        {/* Patrón idéntico a /agente — 4 tabs en lugar de 3 */}
        <div className={styles.subNav}>
          {HABILIDADES.map(h => {
            const cfg   = HABILIDAD_CFG[h]
            const hecho = desafiosCompletados.includes(h)
            const activo = h === habilidad
            return (
              <Link
                key={h}
                href={`/mision/${nivelId}/${h}`}
                title={cfg.label}
                onClick={() => play('click')}
                className={`${styles.subNavBtn} ${activo ? styles.subNavBtnActive : ''}`}
              >
                <span className={styles.subNavIcon}>{cfg.icon}</span>
                <span className={styles.subNavLabel}>{cfg.labelCorto}</span>
                {hecho && <span className={styles.subNavCheck}>✓</span>}
              </Link>
            )
          })}
        </div>

        {/* ── CONTENIDO DEL TAB ACTIVO ────────────────────────────────────── */}
        <div className={styles.tabContent} key={habilidad}>

          {/* XP Flash y nivel completo: overlays absolutos que no empujan el layout */}
          {xpFlash !== null && (
            <div className={styles.xpFlash}>
              +{xpFlash} XP — {HABILIDAD_CFG[habilidad].label.toUpperCase()} COMPLETADA
            </div>
          )}
          {nivelCompleto && (
            <div className={`${styles.nivelCompleto} alert-box`}>
              <strong>🎉 NIVEL {subnivel.id} COMPLETADO</strong>
              {autoNav
                ? <span style={{ marginLeft: 8, fontSize: '0.7rem' }}>Redirigiendo al mapa...</span>
                : <Link href="/mapa" className={styles.nivelCompletoLink} onClick={() => play('click')}> → VER MAPA</Link>
              }
            </div>
          )}

          {/* CHAT CHALLENGE: primero el desafío activo */}
          <ChatChallenge
            subnivel={subnivel}
            habilidad={habilidad}
            onExito={handleExito}
            primeraMision={nivelId === 'A1.1' && habilidad === 'oral'}
          />



        </div>
      </div>
    </PipBoyLayout>
  )
}
