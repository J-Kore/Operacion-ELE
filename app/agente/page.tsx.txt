'use client'
import { useEffect, useState } from 'react'
import PipBoyLayout from '@/components/PipBoy/PipBoyLayout'
import { ProgresoJugador, Subnivel } from '@/lib/types'
import {
  cargarProgreso, guardarProgreso, resetearProgreso, PROGRESO_INICIAL,
  xpEnRangoActual, xpRangoTotal
} from '@/lib/gameState'
import { usePipBoySound } from '@/hooks/usePipBoySound'
import nivelesData from '@/data/niveles.json'
import styles from './page.module.css'

const ATRIBUTOS = [
  { key: 'persuasion',        label: 'Persuasión',           icon: '🗣️', habilidad: 'oral',     max: 10 },
  { key: 'analisisTextual',   label: 'Análisis Textual',     icon: '✏️', habilidad: 'escrita',  max: 10 },
  { key: 'sigiloLinguistico', label: 'Sigilo Lingüístico',   icon: '🔍', habilidad: 'lectora',  max: 10 },
  { key: 'descifrado',        label: 'Descifrado',           icon: '🔓', habilidad: 'auditiva', max: 10 },
  { key: 'recepcionSenales',  label: 'Recepción de Señales', icon: '🎙️', habilidad: 'todos',    max: 10 },
]

const HABILIDADES = [
  { key: 'oral',     label: '🗣️ Expresión Oral',      barClass: 'amber'  },
  { key: 'escrita',  label: '✏️ Expresión Escrita',    barClass: 'cyan'   },
  { key: 'lectora',  label: '📖 Comprensión Lectora',  barClass: 'purple' },
  { key: 'auditiva', label: '🎧 Comprensión Auditiva', barClass: ''       },
]

const RANGOS = [
  { rep: 'D', nombre: 'Recluta',       color: '' },
  { rep: 'C', nombre: 'Agente',        color: '' },
  { rep: 'B', nombre: 'Operativo',     color: '' },
  { rep: 'A', nombre: 'Agente Senior', color: '' },
  { rep: 'S', nombre: 'Director',      color: 'amber' },
]

export default function AgentePage() {
  const [progreso,         setProgreso]         = useState<ProgresoJugador | null>(null)
  const [confirmarReset,   setConfirmarReset]   = useState(false)
  const [editandoNombre,   setEditandoNombre]   = useState(false)
  const [tmpNombre,        setTmpNombre]         = useState('')
  const [tmpAlias,         setTmpAlias]          = useState('')
  const { play } = usePipBoySound()

  useEffect(() => { setProgreso(cargarProgreso()) }, [])

  function handleReset() {
    play('error')
    resetearProgreso()
    setProgreso({ ...PROGRESO_INICIAL })
    setConfirmarReset(false)
  }

  function abrirEdicion() {
    if (!progreso) return
    setTmpNombre(progreso.nombreAgente)
    setTmpAlias(progreso.aliasAgente)
    setEditandoNombre(true)
    play('click')
  }

  function guardarNombre() {
    if (!progreso) return
    const nuevo = {
      ...progreso,
      nombreAgente: tmpNombre.trim() || 'X-001',
      aliasAgente:  tmpAlias.trim().toUpperCase() || 'SOMBRA',
    }
    guardarProgreso(nuevo)
    setProgreso(nuevo)
    setEditandoNombre(false)
    play('transmit')
  }

  if (!progreso) return (
    <PipBoyLayout>
      <div style={{ padding: 24, color: 'var(--pip-dim)', fontFamily: 'monospace', fontSize: '0.7rem' }}>
        CARGANDO EXPEDIENTE...
      </div>
    </PipBoyLayout>
  )

  const totalDesafios     = Object.values(progreso.desafiosCompletados).reduce((a, b) => a + b.length, 0)
  const nivelesCompletados = progreso.nivelesCompletados.length
  const xpEnRango         = xpEnRangoActual(progreso.xp, progreso.reputacion)
  const xpTotal           = xpRangoTotal(progreso.reputacion)
  const xpPct             = Math.min(100, Math.round((xpEnRango / xpTotal) * 100))
  const rangoActual       = RANGOS.find(r => r.rep === progreso.reputacion) ?? RANGOS[0]
  const rangoSiguiente    = RANGOS[RANGOS.indexOf(rangoActual) + 1]
  const totalNiveles      = nivelesData.subniveles.length

  const pctHabilidad = (tipo: string) => {
    const completados = Object.values(progreso.desafiosCompletados)
      .filter(arr => arr.includes(tipo)).length
    return Math.round((completados / totalNiveles) * 100)
  }

  return (
    <PipBoyLayout>
      <div className={styles.page}>

        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Expediente del Agente</div>
          <div className={styles.badge}>CLASIFICADO</div>
        </div>

        {/* MODAL EDICIÓN NOMBRE */}
        {editandoNombre && (
          <div className={styles.modal}>
            <div className={styles.modalTitle}>ACTUALIZAR IDENTIDAD</div>
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>CÓDIGO DE AGENTE</label>
              <input
                className={styles.modalInput}
                value={tmpNombre}
                onChange={e => setTmpNombre(e.target.value)}
                maxLength={20}
                placeholder="X-001"
              />
            </div>
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>ALIAS DE OPERACIÓN</label>
              <input
                className={styles.modalInput}
                value={tmpAlias}
                onChange={e => setTmpAlias(e.target.value.toUpperCase())}
                maxLength={20}
                placeholder="SOMBRA"
              />
            </div>
            <div className={styles.modalActions}>
              <button className={`${styles.modalBtn} ${styles.modalBtnPrimary}`} onClick={guardarNombre}>
                ▸ CONFIRMAR
              </button>
              <button className={styles.modalBtn} onClick={() => setEditandoNombre(false)}>
                CANCELAR
              </button>
            </div>
          </div>
        )}

        <div className="grid-2">

          {/* TARJETA DE AGENTE */}
          <div className={`pip-panel ${styles.agentCard}`}>
            <div className={styles.panelTitleRow}>
              <div className="panel-title" style={{marginBottom:0}}>PERFIL DEL OPERATIVO</div>
              <button className={styles.editBtn} onClick={abrirEdicion}>✎ EDITAR</button>
            </div>

            <div className={styles.agentInner}>
              <div className={styles.avatar}>🕵️</div>
              <div className={styles.agentInfo}>
                <div className={styles.agentName}>{progreso.nombreAgente}</div>
                <div className={styles.agentAlias}>// {progreso.aliasAgente}</div>
                <div className={styles.agentRank}>
                  {rangoActual.nombre.toUpperCase()} — {progreso.nivelActual}
                </div>

                {/* XP BAR dentro del rango */}
                <div className={styles.xpBlock}>
                  <div className={styles.xpLabel}>
                    <span className="text-muted text-xs">XP EN RANGO</span>
                    <span className="text-xs">{xpEnRango} / {xpTotal}</span>
                  </div>
                  <div className="stat-bar-track">
                    <div className="stat-bar-fill" style={{ width: `${xpPct}%` }} />
                  </div>
                  {rangoSiguiente && (
                    <div className="text-xs text-muted" style={{ marginTop: 3 }}>
                      Siguiente: {rangoSiguiente.nombre}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* MINI STATS */}
            <div className={styles.statsRow}>
              <div className={styles.miniStat}>
                <div className="text-xs text-muted">XP TOTAL</div>
                <div className={styles.miniStatVal}>{progreso.xp.toLocaleString()}</div>
              </div>
              <div className={styles.miniStat}>
                <div className="text-xs text-muted">NIVELES</div>
                <div className={styles.miniStatVal}>{nivelesCompletados}/25</div>
              </div>
              <div className={styles.miniStat}>
                <div className="text-xs text-muted">DESAFÍOS</div>
                <div className={styles.miniStatVal}>{totalDesafios}/100</div>
              </div>
              <div className={styles.miniStat}>
                <div className="text-xs text-muted">RACHA</div>
                <div className={`${styles.miniStatVal} text-amber`}>{progreso.rachaActual}🔥</div>
              </div>
            </div>

            {/* RANGOS */}
            <div className={styles.rangos}>
              {RANGOS.map(r => (
                <div key={r.rep}
                  className={`${styles.rangoItem} ${r.rep === progreso.reputacion ? styles.rangoActive : ''}`}
                >
                  <div className={styles.rangoRep}>{r.rep}</div>
                  <div className={styles.rangoNombre}>{r.nombre}</div>
                </div>
              ))}
            </div>

            {/* SESIONES */}
            <div className={styles.sesiones}>
              <span className="text-xs text-muted">SESIONES TOTALES:</span>
              <span className="text-xs" style={{ marginLeft: 6 }}>{progreso.totalSesiones}</span>
              {progreso.ultimaSesion && (
                <>
                  <span className="text-xs text-muted" style={{ marginLeft: 12 }}>ÚLTIMA:</span>
                  <span className="text-xs" style={{ marginLeft: 6 }}>{progreso.ultimaSesion}</span>
                </>
              )}
            </div>
          </div>

          {/* ATRIBUTOS */}
          <div className="pip-panel">
            <div className="panel-title">ATRIBUTOS ESPECIALES</div>
            <div className="text-xs text-muted" style={{ marginBottom: 10, lineHeight: 1.5 }}>
              Suben automáticamente al completar desafíos de cada habilidad.
            </div>
            {ATRIBUTOS.map(attr => {
              const val = progreso.atributos[attr.key as keyof typeof progreso.atributos] ?? 1
              return (
                <div key={attr.key} className={styles.atributo}>
                  <span className={styles.atributoIcon}>{attr.icon}</span>
                  <span className={styles.atributoLabel}>{attr.label}</span>
                  <div className={styles.dots}>
                    {Array.from({ length: 10 }, (_, i) => (
                      <div key={i} className={`${styles.dot} ${i < val ? styles.dotFilled : ''}`} />
                    ))}
                  </div>
                  <span className={styles.atributoVal}>{val}/10</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* COMPETENCIAS */}
        <div className="pip-panel">
          <div className="panel-title">COMPETENCIAS LINGÜÍSTICAS — MARCO CERVANTES</div>
          <div className={styles.habilidadesGrid}>
            {HABILIDADES.map(h => {
              const pct = pctHabilidad(h.key)
              return (
                <div key={h.key} className={styles.habilidad}>
                  <div className={styles.habilidadHeader}>
                    <span>{h.label}</span>
                    <span className="text-xs">{pct}%</span>
                  </div>
                  <div className="stat-bar-track">
                    <div className={`stat-bar-fill ${h.barClass}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* HISTORIAL */}
        <div className="pip-panel">
          <div className="panel-title">HISTORIAL DE OPERACIONES</div>
          {progreso.nivelesCompletados.length === 0 ? (
            <div className="text-muted text-xs" style={{ padding: '8px 0' }}>
              Sin operaciones completadas aún. Inicia tu primera misión.
            </div>
          ) : (
            <div className={styles.historialGrid}>
              {progreso.nivelesCompletados.map(id => {
                const sn = (nivelesData.subniveles as Subnivel[]).find(s => s.id === id)
                return (
                  <div key={id} className={styles.historialItem}>
                    <span className={styles.historialId}>{id}</span>
                    <span className={styles.historialNombre}>{sn?.nombre ?? id}</span>
                    <span className={styles.historialCheck}>✓✓✓✓</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* RESET */}
        <div className={styles.resetZone}>
          {!confirmarReset ? (
            <button className="pip-btn danger" style={{ fontSize: '0.55rem' }}
              onClick={() => { setConfirmarReset(true); play('error') }}>
              ⚠ RESETEAR PROGRESO
            </button>
          ) : (
            <div className={styles.resetConfirm}>
              <span className="text-red text-xs">¿Borrar todo el progreso? Esta acción es irreversible.</span>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="pip-btn danger" style={{ fontSize: '0.55rem' }} onClick={handleReset}>SÍ, BORRAR</button>
                <button className="pip-btn" style={{ fontSize: '0.55rem' }} onClick={() => setConfirmarReset(false)}>CANCELAR</button>
              </div>
            </div>
          )}
        </div>

      </div>
    </PipBoyLayout>
  )
}
