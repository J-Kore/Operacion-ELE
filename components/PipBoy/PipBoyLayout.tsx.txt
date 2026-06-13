'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ProgresoJugador } from '@/lib/types'
import { cargarProgreso, guardarProgreso, registrarSesion, xpEnRangoActual, xpRangoTotal } from '@/lib/gameState'
import { usePipBoySound } from '@/hooks/usePipBoySound'
import styles from './PipBoyLayout.module.css'

const TABS = [
  { id: 'mapa',       label: 'MAPA OPS',   icon: '◈', href: '/mapa'       },
  { id: 'agente',     label: 'AGENTE',     icon: '◉', href: '/agente'     },
  { id: 'mision',     label: 'MISIÓN',     icon: '▸', href: '/mision'     },
  { id: 'inventario', label: 'INVENTARIO', icon: '⊞', href: '/inventario' },
  { id: 'radio',      label: 'RADIO',      icon: '◎', href: '/radio'      },
]

export default function PipBoyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [progreso, setProgreso] = useState<ProgresoJugador | null>(null)
  const [hora, setHora] = useState('')
  const { play } = usePipBoySound()

  useEffect(() => {
    // Cargar progreso y registrar sesión del día
    const p = cargarProgreso()
    const pConSesion = registrarSesion(p)
    if (pConSesion.totalSesiones !== p.totalSesiones) {
      guardarProgreso(pConSesion)
    }
    setProgreso(pConSesion)

    // Reloj
    const tick = () => {
      const now = new Date()
      setHora(
        `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Recalcular XP dentro del rango actual
  const xpPct = progreso
    ? Math.min(100, Math.round((xpEnRangoActual(progreso.xp, progreso.reputacion) / xpRangoTotal(progreso.reputacion)) * 100))
    : 0

  return (
    <div className={styles.shell}>

      {/* ── TOP BAR ── */}
      <header className={styles.topBar}>
        <div className={styles.logo}>
          PIP·BOY // <span className={styles.logoAccent}>E·L·E</span>
        </div>

        <div className={styles.topStats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>AGENTE</span>
            <span className={styles.statVal}>{progreso?.nombreAgente ?? '—'}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>NIVEL</span>
            <span className={styles.statVal}>{progreso?.nivelActual ?? '—'}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>XP</span>
            <span className={styles.statVal}>{xpPct}%</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>REP.</span>
            <span className={`${styles.statVal} text-amber`}>
              {progreso?.reputacion ?? 'D'}
            </span>
          </div>
          {(progreso?.rachaActual ?? 0) > 1 && (
            <div className={styles.statItem}>
              <span className={styles.statLabel}>RACHA</span>
              <span className={`${styles.statVal} text-amber`}>
                {progreso!.rachaActual}🔥
              </span>
            </div>
          )}
        </div>

        <div className={`${styles.clock} vt323`}>{hora}</div>
      </header>

      {/* ── XP BAR ── */}
      <div className={styles.xpBarWrap}>
        <div className={styles.xpBarTrack}>
          <div className={styles.xpBarFill} style={{ width: `${xpPct}%` }} />
        </div>
      </div>

      {/* ── NAV TABS ── */}
      <nav className={styles.navTabs}>
        {TABS.map(tab => {
          const active = pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`${styles.tab} ${active ? styles.tabActive : ''}`}
              onClick={() => play('click')}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* ── CONTENIDO ── */}
      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}
