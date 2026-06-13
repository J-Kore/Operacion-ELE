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

type PaginaAgente = 'perfil' | 'atributos' | 'competencias'

const ATRIBUTOS = [
  { key: 'persuasion',        label: 'Persuasión',           icon: '🗣️' },
  { key: 'analisisTextual',   label: 'Análisis Textual',     icon: '✏️' },
  { key: 'sigiloLinguistico', label: 'Sigilo Lingüístico',   icon: '🔍' },
  { key: 'descifrado',        label: 'Descifrado',           icon: '🔓' },
  { key: 'recepcionSenales',  label: 'Recepción de Señales', icon: '🎙️' },
]

const HABILIDADES = [
  { key: 'oral',     label: '🗣️ Expresión Oral',      barClass: 'amber'  },
  { key: 'escrita',  label: '✏️ Expresión Escrita',    barClass: 'cyan'   },
  { key: 'lectora',  label: '📖 Comprensión Lectora',  barClass: 'purple' },
  { key: 'auditiva', label: '🎧 Comprensión Auditiva', barClass: ''       },
]

const RANGOS = [
  { rep: 'D', nombre: 'Recluta'  },
  { rep: 'C', nombre: 'Agente'   },
  { rep: 'B', nombre: 'Oper.'    },  // abreviado para móvil
  { rep: 'A', nombre: 'Senior'   },  // abreviado para móvil
  { rep: 'S', nombre: 'Director' },
]

const PAGINAS: { id: PaginaAgente; label: string; icon: string }[] = [
  { id: 'perfil',       label: 'Perfil',       icon: '◉' },
  { id: 'atributos',    label: 'Atributos',    icon: '⬡' },
  { id: 'competencias', label: 'Competencias', icon: '▦' },
]

export default function AgentePage() {
  const [progreso,       setProgreso]       = useState<ProgresoJugador | null>(null)
  const [pagina,         setPagina]         = useState<PaginaAgente>('perfil')
  const [confirmarReset, setConfirmarReset] = useState(false)
  const [editandoNombre, setEditandoNombre] = useState(false)
  const [tmpNombre,      setTmpNombre]      = useState('')
  const [tmpAlias,       setTmpAlias]       = useState('')
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

  function cambiarPagina(p: PaginaAgente) {
    play('click')
    setPagina(p)
  }

  if (!progreso) return (
    <PipBoyLayout>
      <div style={{ padding: 24, color: 'var(--pip-dim)', fontFamily: 'monospace' }}>
        CARGANDO EXPEDIENTE...
      </div>
    </PipBoyLayout>
  )

  const totalDesafios      = Object.values(progreso.desafiosCompletados).reduce((a, b) => a + b.length, 0)
  const nivelesCompletados = progreso.nivelesCompletados.length
  const xpEnRango          = xpEnRangoActual(progreso.xp, progreso.reputacion)
  const xpTotal            = xpRangoTotal(progreso.reputacion)
  const xpPct              = Math.min(100, Math.round((xpEnRango / xpTotal) * 100))
  const rangoActual        = RANGOS.find(r => r.rep === progreso.reputacion) ?? RANGOS[0]
  const rangoSiguiente     = RANGOS[RANGOS.indexOf(rangoActual) + 1]
  const totalNiveles       = nivelesData.subniveles.length

  const pctHabilidad = (tipo: string) => {
    const completados = Object.values(progreso.desafiosCompletados)
      .filter(arr => arr.includes(tipo)).length
    return Math.round((completados / totalNiveles) * 100)
  }

  return (
    <PipBoyLayout>
      <div className={styles.page}>

        {/* HEADER */}
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

        {/* SUB-PÁGINAS NAV */}
        <div className={styles.subNav}>
          {PAGINAS.map(p => (
            <button
              key={p.id}
              className={`${styles.subNavBtn} ${pagina === p.id ? styles.subNavBtnActive : ''}`}
              onClick={() => cambiarPagina(p.id)}
            >
              <span className={styles.subNavIcon}>{p.icon}</span>
              <span className={styles.subNavLabel}>{p.label}</span>
            </button>
          ))}
        </div>

        {/* ── PÁGINA: PERFIL ── */}
        {pagina === 'perfil' && (
          <div className={`${styles.pageContent} pip-panel`} key="perfil">
            <div className={styles.panelTitleRow}>
              <div className="panel-title" style={{ marginBottom: 0 }}>PERFIL DEL OPERATIVO</div>
              <button className={styles.editBtn} onClick={abrirEdicion}>✎ EDITAR</button>
            </div>

            {/* Avatar + info básica */}
            <div className={styles.agentInner}>
              <div className={styles.avatar}>🕵️</div>
              <div className={styles.agentInfo}>
                <div className={styles.agentName}>{progreso.nombreAgente}</div>
                <div className={styles.agentAlias}>// {progreso.aliasAgente}</div>
                <div className={styles.agentRank}>
                  {rangoActual.nombre.toUpperCase()} — {progreso.nivelActual}
                </div>
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

            {/* Mini stats */}
            <div className={styles.statsRow}>
              {[
                { label: 'XP TOTAL',  val: progreso.xp.toLocaleString(), amber: false },
                { label: 'NIVELES',   val: `${nivelesCompletados}/25`,    amber: false },
                { label: 'DESAFÍOS',  val: `${totalDesafios}/100`,        amber: false },
                { label: 'RACHA',     val: `${progreso.rachaActual}🔥`,   amber: true  },
              ].map(s => (
                <div key={s.label} className={styles.miniStat}>
                  <div className="text-xs text-muted">{s.label}</div>
                  <div className={`${styles.miniStatVal} ${s.amber ? 'text-amber' : ''}`}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Rangos */}
            <div className={styles.rangos}>
              {RANGOS.map(r => (
                <div
                  key={r.rep}
                  className={`${styles.rangoItem} ${r.rep === progreso.reputacion ? styles.rangoActive : ''}`}
                >
                  <div className={styles.rangoRep}>{r.rep}</div>
                  <div className={styles.rangoNombre}>{r.nombre}</div>
                </div>
              ))}
            </div>

            {/* Sesiones */}
            <div className={styles.sesiones}>
              <span className="text-xs text-muted">SESIONES:</span>
              <span className="text-xs" style={{ marginLeft: 6 }}>{progreso.totalSesiones}</span>
              {progreso.ultimaSesion && (
                <>
                  <span className="text-xs text-muted" style={{ marginLeft: 12 }}>ÚLTIMA:</span>
                  <span className="text-xs" style={{ marginLeft: 6 }}>{progreso.ultimaSesion}</span>
                </>
              )}
            </div>

            {/* Reset */}
            <div className={styles.resetZone}>
              {!confirmarReset ? (
                <button className="pip-btn danger" onClick={() => { setConfirmarReset(true); play('error') }}>
                  ⚠ RESETEAR PROGRESO
                </button>
              ) : (
                <div className={styles.resetConfirm}>
                  <span className="text-red text-xs">¿Borrar todo el progreso? Esta acción es irreversible.</span>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <button className="pip-btn danger" onClick={handleReset}>SÍ, BORRAR</button>
                    <button className="pip-btn" onClick={() => setConfirmarReset(false)}>CANCELAR</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PÁGINA: ATRIBUTOS ── */}
        {pagina === 'atributos' && (
          <div className={`${styles.pageContent} pip-panel`} key="atributos">
            <div className="panel-title">ATRIBUTOS ESPECIALES</div>
            <div className="text-xs text-muted" style={{ marginBottom: 14, lineHeight: 1.6 }}>
              Suben automáticamente al completar desafíos de cada habilidad.
            </div>
            {ATRIBUTOS.map(attr => {
              const val = progreso.atributos[attr.key as keyof typeof progreso.atributos] ?? 1
              return (
                <div key={attr.key} className={styles.atributo}>
                  <span className={styles.atributoIcon}>{attr.icon}</span>
                  <span className={styles.atributoLabel}>{attr.label}</span>
                  <div className={styles.dotsWrap}>
                    <div className={styles.dots}>
                      {Array.from({ length: 10 }, (_, i) => (
                        <div key={i} className={`${styles.dot} ${i < val ? styles.dotFilled : ''}`} />
                      ))}
                    </div>
                    <span className={styles.atributoVal}>{val}/10</span>
                  </div>
                </div>
              )
            })}

            {/* Historial de operaciones */}
            <div style={{ marginTop: 20 }}>
              <div className="panel-title">HISTORIAL DE OPERACIONES</div>
              {progreso.nivelesCompletados.length === 0 ? (
                <div className="text-muted text-xs" style={{ padding: '8px 0' }}>
                  Sin operaciones completadas aún.
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
          </div>
        )}

        {/* ── PÁGINA: COMPETENCIAS ── */}
        {pagina === 'competencias' && (
          <div className={`${styles.pageContent} pip-panel`} key="competencias">
            <div className="panel-title">COMPETENCIAS LINGÜÍSTICAS — MARCO CERVANTES</div>
            <div className="text-xs text-muted" style={{ marginBottom: 14, lineHeight: 1.6 }}>
              Progreso por destreza en los 25 niveles A1–B2.
            </div>
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
        )}

      </div>
    </PipBoyLayout>
  )
}
