'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PipBoyLayout from '@/components/PipBoy/PipBoyLayout'
import ChatChallenge from '@/components/Challenges/ChatChallenge'
import { Subnivel, HabilidadType, ProgresoJugador } from '@/lib/types'
import { cargarProgreso, guardarProgreso, completarDesafio } from '@/lib/gameState'
import { usePipBoySound } from '@/hooks/usePipBoySound'
import nivelesData from '@/data/niveles.json'
import Link from 'next/link'
import styles from './page.module.css'

const HABILIDADES: HabilidadType[] = ['oral', 'escrita', 'lectora', 'auditiva']

const HABILIDAD_LABELS: Record<HabilidadType, { icon: string; label: string; color: string }> = {
  oral:     { icon: '📡', label: 'Expresión Oral',       color: 'amber'  },
  escrita:  { icon: '⌨️', label: 'Expresión Escrita',    color: 'cyan'   },
  lectora:  { icon: '📄', label: 'Comprensión Lectora',  color: 'purple' },
  auditiva: { icon: '🎧', label: 'Comprensión Auditiva', color: 'green'  },
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

  function handleExito(xp: number) {
    if (!progreso || !subnivel) return
    const nuevo = completarDesafio(progreso, subnivel.id, habilidad, xp)
    guardarProgreso(nuevo)
    setProgreso(nuevo)
    setXpFlash(xp)

    const nivelAhoraCompleto = (nuevo.desafiosCompletados[subnivel.id]?.length ?? 0) >= 4

    if (nivelAhoraCompleto) {
      // Nivel completo → sonido level-up y auto-navegar al mapa en 3 s
      play('levelup')
      setAutoNav(true)
      setTimeout(() => router.push('/mapa'), 4000)
    } else {
      // Solo desafío completo
      play('success')
      // Auto-avanzar al siguiente desafío en 3 s
      const siguienteH = HABILIDADES[HABILIDADES.indexOf(habilidad) + 1]
      if (siguienteH) {
        setTimeout(() => {
          setXpFlash(null)
          router.push(`/mision/${nivelId}/${siguienteH}`)
        }, 3000)
      }
    }

    setTimeout(() => setXpFlash(null), 2800)
  }

  const desafiosCompletados = progreso?.desafiosCompletados[nivelId] ?? []
  const siguienteHabilidad  = HABILIDADES[HABILIDADES.indexOf(habilidad) + 1]
  const nivelCompleto       = desafiosCompletados.length >= 4

  if (!subnivel) return (
    <PipBoyLayout>
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--pip-dim)', fontFamily: 'monospace', fontSize: '0.7rem' }}>
        CARGANDO MISIÓN...
      </div>
    </PipBoyLayout>
  )

  return (
    <PipBoyLayout>
      <div className={styles.page}>

        {/* BREADCRUMB */}
        <div className={styles.breadcrumb}>
          <Link href="/mapa" className={styles.breadLink} onClick={() => play('click')}>◈ MAPA</Link>
          <span className={styles.breadSep}>›</span>
          <span>{subnivel.id}</span>
          <span className={styles.breadSep}>›</span>
          <span className={`text-${HABILIDAD_LABELS[habilidad].color}`}>
            {HABILIDAD_LABELS[habilidad].label.toUpperCase()}
          </span>
        </div>

        {/* HEADER */}
        <div className={`${styles.misionHeader} pip-panel`}>
          <div className={styles.misionMeta}>
            <div className={styles.nivelBadge}>
              <div className={styles.nivelHex}>
                <span className={styles.nivelId}>{subnivel.id}</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div className={styles.misionNombre}>{subnivel.nombre}</div>
              <div className={styles.misionDesc}>{subnivel.descripcionNarrativa}</div>
              <div className={styles.misionMeta2}>
                <span className="text-muted text-xs">META:</span>{' '}
                <span style={{ fontSize: '0.58rem' }}>{subnivel.metaComunicativa}</span>
              </div>
            </div>
          </div>

          {/* Pestañas de habilidades */}
          <div className={styles.habilidadTabs}>
            {HABILIDADES.map(h => {
              const cfg   = HABILIDAD_LABELS[h]
              const hecho = desafiosCompletados.includes(h)
              const activo = h === habilidad
              return (
                <Link
                  key={h}
                  href={`/mision/${nivelId}/${h}`}
                  title={cfg.label}
                  onClick={() => play('click')}
                  className={`${styles.habilidadTab} ${activo ? styles.habilidadTabActive : ''} ${hecho ? styles.habilidadTabHecho : ''}`}
                >
                  <span className={styles.habilidadTabIcon}>{cfg.icon}</span>
                  <span className={styles.habilidadTabLabel}>{cfg.label}</span>
                  {hecho && <span className={styles.habilidadCheck}>✓</span>}
                </Link>
              )
            })}
          </div>
        </div>

        {/* XP FLASH */}
        {xpFlash !== null && (
          <div className={styles.xpFlash}>
            +{xpFlash} XP — DESAFÍO COMPLETADO
          </div>
        )}

        {/* NIVEL COMPLETO */}
        {nivelCompleto && (
          <div className={`${styles.nivelCompleto} alert-box`}>
            <strong>🎉 NIVEL {subnivel.id} COMPLETADO — LOS 4 DESAFÍOS SUPERADOS</strong>
            {autoNav
              ? <span style={{ marginLeft: 8, fontSize: '0.55rem' }}>Redirigiendo al mapa en 4 s...</span>
              : <Link href="/mapa" className={styles.nivelCompletoLink} onClick={() => play('click')}> → VER MAPA</Link>
            }
          </div>
        )}

        {/* CHAT CHALLENGE */}
        <ChatChallenge
          subnivel={subnivel}
          habilidad={habilidad}
          onExito={handleExito}
          primeraMision={nivelId === 'A1.1' && habilidad === 'oral'}
        />

        {/* INVENTARIO LINGÜÍSTICO + NAVEGACIÓN */}
        <div className={styles.navDesafios}>
          <div className={`${styles.inventarioPanel} pip-panel`}>
            <div className="panel-title">INVENTARIO LINGÜÍSTICO</div>
            <div className={styles.inventarioGrid}>
              <div>
                <div className={styles.invLabel}>VERBOS CLAVE</div>
                <div className={styles.invList}>
                  {subnivel.verbos.slice(0, 6).map(v => (
                    <span key={v} className={styles.invTag}>{v}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className={styles.invLabel}>VOCABULARIO</div>
                <div className={styles.invList}>
                  {subnivel.vocabulario.slice(0, 6).map(v => (
                    <span key={v} className={styles.invTag}>{v}</span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <div className={styles.invLabel}>GRAMÁTICA PROHIBIDA</div>
              <div className={styles.invProhibido}>{subnivel.gramaticaProhibida}</div>
            </div>
          </div>

          <div className={styles.siguientePanel}>
            {siguienteHabilidad && desafiosCompletados.includes(habilidad) && !nivelCompleto && (
              <Link
                href={`/mision/${nivelId}/${siguienteHabilidad}`}
                className="pip-btn amber"
                style={{ fontSize: '0.6rem' }}
                onClick={() => play('click')}
              >
                ▸ SIGUIENTE: {HABILIDAD_LABELS[siguienteHabilidad].icon} {HABILIDAD_LABELS[siguienteHabilidad].label.toUpperCase()}
              </Link>
            )}
            {!desafiosCompletados.includes(habilidad) && siguienteHabilidad && (
              <div className="text-muted text-xs" style={{ marginBottom: 6, lineHeight: 1.5 }}>
                Completa este desafío para desbloquear el siguiente
              </div>
            )}
            <Link href="/mapa" className="pip-btn" style={{ fontSize: '0.6rem' }} onClick={() => play('click')}>
              ◈ VOLVER AL MAPA
            </Link>
          </div>
        </div>

      </div>
    </PipBoyLayout>
  )
}
