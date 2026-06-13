'use client'
import { useEffect, useState, useRef } from 'react'
import PipBoyLayout from '@/components/PipBoy/PipBoyLayout'
import { ProgresoJugador, HabilidadType, Subnivel } from '@/lib/types'
import { cargarProgreso } from '@/lib/gameState'
import { usePipBoySound } from '@/hooks/usePipBoySound'
import nivelesData from '@/data/niveles.json'
import Link from 'next/link'
import styles from './page.module.css'

type PaginaRadio = 'auditiva' | 'oral' | 'accesos'

const ACCESOS: { habilidad: HabilidadType; icon: string; label: string; color: string }[] = [
  { habilidad: 'oral',     icon: '🗣️', label: 'Expresión Oral',      color: 'amber'  },
  { habilidad: 'escrita',  icon: '✏️', label: 'Expresión Escrita',   color: 'cyan'   },
  { habilidad: 'lectora',  icon: '📖', label: 'Comp. Lectora',       color: 'purple' },
  { habilidad: 'auditiva', icon: '🎧', label: 'Comp. Auditiva',      color: 'green'  },
]

const PAGINAS: { id: PaginaRadio; icon: string; label: string }[] = [
  { id: 'auditiva', icon: '🎧', label: 'Auditiva' },
  { id: 'oral',     icon: '🎙️', label: 'Oral'     },
  { id: 'accesos',  icon: '◈',  label: 'Accesos'  },
]

export default function RadioPage() {
  const [progreso,  setProgreso]  = useState<ProgresoJugador | null>(null)
  const [pagina,    setPagina]    = useState<PaginaRadio>('auditiva')
  const [micActivo, setMicActivo] = useState(false)
  const [canal,     setCanal]     = useState('α-7')
  const [waveH,     setWaveH]     = useState(Array(11).fill(4))
  const waveRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { play } = usePipBoySound()

  useEffect(() => { setProgreso(cargarProgreso()) }, [])

  useEffect(() => {
    if (micActivo) {
      waveRef.current = setInterval(() => {
        setWaveH(prev => prev.map(() => Math.random() * 38 + 4))
      }, 110)
    } else {
      if (waveRef.current) clearInterval(waveRef.current)
      setWaveH(Array(11).fill(4))
    }
    return () => { if (waveRef.current) clearInterval(waveRef.current) }
  }, [micActivo])

  const nivelActual = progreso?.nivelActual ?? 'A1.1'
  const nivelesComp = progreso?.nivelesCompletados.length ?? 0
  const ultimos     = (progreso?.nivelesCompletados ?? []).slice(-5).reverse()

  const canales = [
    { id: 'α-7', nombre: 'Oficial de Registro', libre: true                 },
    { id: 'β-2', nombre: 'Cuartel General',      libre: nivelesComp >= 4    },
    { id: 'γ-1', nombre: 'Agente Encubierto',    libre: nivelesComp >= 9    },
    { id: 'δ-9', nombre: 'Directora La Sombra',  libre: nivelesComp >= 17   },
  ]

  function cambiarPagina(p: PaginaRadio) {
    play('click')
    setPagina(p)
  }

  return (
    <PipBoyLayout>
      <div className={styles.page}>

        {/* HEADER */}
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Centro de Comunicaciones</div>
          <div className={styles.badge}>◉ EN VIVO</div>
        </div>

        {/* SUB-NAV */}
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

        {/* ── PÁGINA: AUDITIVA ── */}
        {pagina === 'auditiva' && (
          <div className={`pip-panel ${styles.pageContent}`} key="auditiva">
            <div className="panel-title">VISUALIZADOR DE ONDAS — Comprensión Auditiva</div>

            <div className={styles.waveContainer}>
              {waveH.map((h, i) => (
                <div
                  key={i}
                  className={styles.waveBar}
                  style={{ height: `${h}px`, transition: micActivo ? 'height 0.11s ease' : 'height 0.5s ease' }}
                />
              ))}
            </div>

            <div className="text-xs text-muted" style={{ textAlign: 'center', marginBottom: 12 }}>
              INTERCEPTANDO — CANAL {canal} &nbsp;·&nbsp; {micActivo ? '● ACTIVO' : '○ STANDBY'}
            </div>

            <div className="terminal" style={{ marginBottom: 14 }}>
              <div style={{ color: 'var(--pip-dim)' }}>NPC: "Agente, su mi... [ESTÁTICA] ...ón es clara."</div>
              <div style={{ color: 'var(--pip-dim)' }}>NPC: "...número de operativo... [ESTÁTICA] ...confirme."</div>
            </div>

            <Link
              href={`/mision/${nivelActual}/auditiva`}
              className="pip-btn"
              onClick={() => play('click')}
            >
              🎧 IR A COMPRENSIÓN AUDITIVA ↗
            </Link>

            {/* Señales recibidas */}
            {ultimos.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div className="panel-title">SEÑALES RECIBIDAS — ÚLTIMAS OPERACIONES</div>
                <div className={styles.senalesGrid}>
                  {ultimos.map(id => {
                    const sn = (nivelesData.subniveles as Subnivel[]).find(s => s.id === id)
                    return (
                      <div key={id} className={styles.senalItem}>
                        <span className={styles.senalId}>{id}</span>
                        <span className={styles.senalNombre}>{sn?.nombre ?? id}</span>
                        <span style={{ color: 'var(--pip)', fontSize: 'var(--text-xs)' }}>✓✓✓✓</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PÁGINA: ORAL ── */}
        {pagina === 'oral' && (
          <div className={`pip-panel ${styles.pageContent}`} key="oral">
            <div className="panel-title">TRANSMISOR — Expresión Oral</div>

            <div className={styles.micArea}>
              <button
                className={`${styles.micBtn} ${micActivo ? styles.micBtnActive : ''}`}
                onClick={() => { setMicActivo(m => !m); play(micActivo ? 'click' : 'transmit') }}
                aria-label={micActivo ? 'Detener grabación' : 'Iniciar grabación'}
              >
                🎙️
              </button>
              <div className={`${styles.micStatus} ${micActivo ? styles.micStatusActive : ''}`}>
                {micActivo ? '● GRABANDO...' : 'PULSE PARA HABLAR'}
              </div>
              <div className="text-xs text-muted" style={{ textAlign: 'center' }}>
                {micActivo ? 'Habla en español — el NPC te escucha' : 'Activa el micrófono del navegador'}
              </div>
            </div>

            <div className={styles.divider} />

            <div className="panel-title">CANALES DISPONIBLES</div>
            {canales.map(c => (
              <div
                key={c.id}
                className={`${styles.canalItem} ${!c.libre ? styles.canalBloqueado : ''} ${canal === c.id ? styles.canalActivo : ''}`}
                onClick={() => { if (c.libre) { setCanal(c.id); play('click') } }}
              >
                <span className={styles.canalIndicador}>
                  {c.libre ? (canal === c.id ? '◉' : '○') : '✕'}
                </span>
                <div className={styles.canalNombre}>Canal {c.id} — {c.nombre}</div>
                <span className={`${styles.canalBadge} ${c.libre ? (canal === c.id ? styles.canalBadgeActivo : '') : styles.canalBadgeLocked}`}>
                  {c.libre ? (canal === c.id ? 'ACTIVO' : 'LIBRE') : 'BLOQUEADO'}
                </span>
              </div>
            ))}

            <div style={{ marginTop: 16 }}>
              <Link
                href={`/mision/${nivelActual}/oral`}
                className="pip-btn amber"
                onClick={() => play('click')}
              >
                📡 IR A EXPRESIÓN ORAL ↗
              </Link>
            </div>
          </div>
        )}

        {/* ── PÁGINA: ACCESOS RÁPIDOS ── */}
        {pagina === 'accesos' && (
          <div className={`pip-panel ${styles.pageContent}`} key="accesos">
            <div className="panel-title">
              ACCESO RÁPIDO — 4 HABILIDADES — NIVEL: {nivelActual}
            </div>
            <div className={styles.accesosGrid}>
              {ACCESOS.map(a => (
                <Link
                  key={a.habilidad}
                  href={`/mision/${nivelActual}/${a.habilidad}`}
                  className={`${styles.accesoBtn} ${styles[`acceso_${a.color}`]}`}
                  onClick={() => play('click')}
                >
                  <span className={styles.accesoIcon}>{a.icon}</span>
                  <span className={styles.accesoLabel}>{a.label.toUpperCase()}</span>
                  <span className={styles.accesoNivel}>{nivelActual} ↗</span>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </PipBoyLayout>
  )
}
