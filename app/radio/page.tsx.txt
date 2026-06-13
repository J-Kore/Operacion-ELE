'use client'
import { useEffect, useState, useRef } from 'react'
import PipBoyLayout from '@/components/PipBoy/PipBoyLayout'
import { ProgresoJugador, HabilidadType, Subnivel } from '@/lib/types'
import { cargarProgreso } from '@/lib/gameState'
import { usePipBoySound } from '@/hooks/usePipBoySound'
import nivelesData from '@/data/niveles.json'
import Link from 'next/link'
import styles from './page.module.css'

const ACCESOS: { habilidad: HabilidadType; icon: string; label: string; color: string }[] = [
  { habilidad: 'oral',     icon: '🗣️', label: 'Expresión Oral',       color: 'amber'  },
  { habilidad: 'escrita',  icon: '✏️', label: 'Expresión Escrita',    color: 'cyan'   },
  { habilidad: 'lectora',  icon: '📖', label: 'Comprensión Lectora',  color: 'purple' },
  { habilidad: 'auditiva', icon: '🎧', label: 'Comprensión Auditiva', color: 'green'  },
]

export default function RadioPage() {
  const [progreso,   setProgreso]   = useState<ProgresoJugador | null>(null)
  const [micActivo,  setMicActivo]  = useState(false)
  const [canal,      setCanal]      = useState('α-7')
  const [waveH,      setWaveH]      = useState(Array(11).fill(4))
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

  const nivelActual   = progreso?.nivelActual ?? 'A1.1'
  const nivelesComp   = progreso?.nivelesCompletados.length ?? 0

  const canales = [
    { id: 'α-7', nombre: 'Oficial de Registro',  libre: true },
    { id: 'β-2', nombre: 'Cuartel General',       libre: nivelesComp >= 4  },
    { id: 'γ-1', nombre: 'Agente Encubierto',     libre: nivelesComp >= 9  },
    { id: 'δ-9', nombre: 'Directora La Sombra',   libre: nivelesComp >= 17 },
  ]

  // Últimos 5 niveles completados
  const ultimos = (progreso?.nivelesCompletados ?? []).slice(-5).reverse()

  return (
    <PipBoyLayout>
      <div className={styles.page}>

        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Centro de Comunicaciones</div>
          <div className={styles.badge}>◉ EN VIVO</div>
        </div>

        <div className="grid-2">

          {/* VISUALIZADOR */}
          <div className="pip-panel">
            <div className="panel-title">VISUALIZADOR DE ONDAS — Comprensión Auditiva</div>
            <div className={styles.waveContainer}>
              {waveH.map((h, i) => (
                <div key={i} className={styles.waveBar}
                  style={{ height: `${h}px`, transition: micActivo ? 'height 0.11s ease' : 'height 0.5s ease' }} />
              ))}
            </div>
            <div className="text-xs text-muted" style={{ textAlign:'center', marginBottom:10 }}>
              INTERCEPTANDO — CANAL {canal} &nbsp;·&nbsp; {micActivo ? '● ACTIVO' : '○ STANDBY'}
            </div>
            <div className="terminal" style={{ height: 72, fontSize:'0.58rem' }}>
              <div style={{ color:'var(--pip-dim)' }}>NPC: "Agente, su mi... [ESTÁTICA] ...ón es clara."</div>
              <div style={{ color:'var(--pip-dim)' }}>NPC: "...número de operativo... [ESTÁTICA] ...confirme."</div>
            </div>
            <div style={{ marginTop:10 }}>
              <Link href={`/mision/${nivelActual}/auditiva`}
                className="pip-btn" style={{ fontSize:'0.58rem' }}
                onClick={() => play('click')}>
                🎧 IR A COMPRENSIÓN AUDITIVA ↗
              </Link>
            </div>
          </div>

          {/* TRANSMISOR */}
          <div className="pip-panel">
            <div className="panel-title">TRANSMISOR — Expresión Oral</div>
            <div className={styles.micArea}>
              <button
                className={`${styles.micBtn} ${micActivo ? styles.micBtnActive : ''}`}
                onClick={() => { setMicActivo(m => !m); play(micActivo ? 'click' : 'transmit') }}
              >
                🎙️
              </button>
              <div className={`${styles.micStatus} ${micActivo ? styles.micStatusActive : ''}`}>
                {micActivo ? '● GRABANDO...' : 'PULSE PARA HABLAR'}
              </div>
              <div className="text-xs text-muted" style={{ fontSize:'0.48rem', textAlign:'center' }}>
                {micActivo
                  ? 'Habla en español — el NPC te escucha'
                  : 'Activa el micrófono del navegador'}
              </div>
            </div>
            <div style={{ height:1, background:'rgba(0,255,157,0.15)', margin:'12px 0' }} />
            <div className="panel-title">CANALES DISPONIBLES</div>
            {canales.map(c => (
              <div key={c.id}
                className={`${styles.canalItem} ${!c.libre ? styles.canalBloqueado : ''} ${canal === c.id ? styles.canalActivo : ''}`}
                onClick={() => { if (c.libre) { setCanal(c.id); play('click') } }}
              >
                <span className={styles.canalInd}>{c.libre ? (canal === c.id ? '◉' : '○') : '✕'}</span>
                <div style={{ flex:1, fontSize:'0.6rem' }}>Canal {c.id} — {c.nombre}</div>
                <span className={`${styles.canalBadge} ${c.libre ? (canal===c.id ? styles.canalBadgeOk : '') : styles.canalBadgeLocked}`}>
                  {c.libre ? (canal===c.id ? 'ACTIVO' : 'LIBRE') : 'BLOQUEADO'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ACCESO RÁPIDO */}
        <div className="pip-panel">
          <div className="panel-title">ACCESO RÁPIDO — 4 HABILIDADES — NIVEL ACTIVO: {nivelActual}</div>
          <div className="grid-4" style={{ marginTop:10 }}>
            {ACCESOS.map(a => (
              <Link key={a.habilidad}
                href={`/mision/${nivelActual}/${a.habilidad}`}
                className={`${styles.accesoBtn} ${styles[`acceso_${a.color}`]}`}
                onClick={() => play('click')}
              >
                <span style={{ fontSize:'1.4rem' }}>{a.icon}</span>
                <span style={{ fontSize:'0.5rem', letterSpacing:'0.1em', textAlign:'center', lineHeight:1.3 }}>
                  {a.label.toUpperCase()}
                </span>
                <span style={{ fontSize:'0.42rem', color:'var(--pip-dim)' }}>{nivelActual} ↗</span>
              </Link>
            ))}
          </div>
        </div>

        {/* HISTORIAL */}
        <div className="pip-panel">
          <div className="panel-title">SEÑALES RECIBIDAS — ÚLTIMAS OPERACIONES</div>
          {ultimos.length === 0 ? (
            <div className="text-muted text-xs" style={{ padding:'8px 0' }}>
              Sin señales recibidas aún. Completa tu primera misión.
            </div>
          ) : (
            <div className={styles.senalesGrid}>
              {ultimos.map(id => {
                const sn = (nivelesData.subniveles as Subnivel[]).find(s => s.id === id)
                return (
                  <div key={id} className={styles.senalItem}>
                    <span className={styles.senalId}>{id}</span>
                    <span className={styles.senalNombre}>{sn?.nombre ?? id}</span>
                    <div className={styles.senalDesafios}>
                      {['oral','escrita','lectora','auditiva'].map(h => (
                        <span key={h} style={{ color:'var(--pip)', fontSize:'0.5rem' }}>✓</span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </PipBoyLayout>
  )
}
