'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePipBoySound } from '@/hooks/usePipBoySound'
import styles from './page.module.css'

const BOOT_LOGS = [
  'VERIFICANDO INTEGRIDAD DEL SISTEMA...',
  'CARGANDO INVENTARIO LÉXICO A1–B2...',
  'INICIALIZANDO MOTOR NARRATIVO IA...',
  'ESTABLECIENDO CONEXIÓN — INSTITUTO CERVANTES...',
  'CALIBRANDO EVALUADOR GRAMATICAL...',
  'CARGANDO 25 NIVELES · 100 DESAFÍOS...',
  'PROTOCOLO PIP-BOY ACTIVO...',
  'BIENVENIDO, AGENTE.',
]

export default function BootPage() {
  const router = useRouter()
  const [progress, setProgress] = useState(0)
  const [logText,  setLogText]  = useState('INICIANDO PROTOCOLOS...')
  const [done,     setDone]     = useState(false)
  const { play } = usePipBoySound()

  useEffect(() => {
    // Sonido de boot al montar
    const t = setTimeout(() => play('boot'), 300)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    let current = 0
    const interval = setInterval(() => {
      current += Math.random() * 10 + 4
      if (current >= 100) {
        current = 100
        setDone(true)
        clearInterval(interval)
      }
      setProgress(Math.min(100, current))
      const idx = Math.floor((current / 100) * BOOT_LOGS.length)
      setLogText(BOOT_LOGS[Math.min(idx, BOOT_LOGS.length - 1)])
    }, 150)
    return () => clearInterval(interval)
  }, [])

  function entrar() {
    play('click')
    const guardado = typeof window !== 'undefined' && localStorage.getItem('operacion-ele-progreso')
    router.push(guardado ? '/mapa' : '/diagnostico')
  }

  return (
    <div className={styles.boot}>
      <div className={styles.scanlines} />

      <div className={styles.content}>
        <div className={styles.pipboyIcon}>
          <div className={styles.pipboyCircle}>
            <div className={styles.pipboyScreen}>
              <span className={styles.pipboyFace}>🤖</span>
            </div>
          </div>
        </div>

        <div className={styles.title}>PIP·BOY</div>
        <div className={styles.subtitle}>O P E R A C I Ó N &nbsp; E · L · E</div>
        <div className={styles.tagline}>ESPIONAJE · ESPAÑOL · SUPERVIVENCIA</div>

        <div className={styles.bars}>
          {[
            { label: 'INICIALIZANDO SISTEMA',   pct: progress },
            { label: 'MÓDULOS LINGÜÍSTICOS',     pct: Math.min(100, progress * 0.85) },
            { label: 'PROTOCOLO PIP-BOY',        pct: Math.min(100, progress * 0.70) },
          ].map(b => (
            <div key={b.label} className={styles.barBlock}>
              <div className={styles.barLabel}>{b.label}</div>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: `${b.pct}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className={styles.logLine}>{logText}</div>

        {done ? (
          <button className={styles.enterBtn} onClick={entrar}>
            ▸ &nbsp; INICIAR MISIÓN
          </button>
        ) : (
          <div className={styles.waiting}>
            {[0, 0.3, 0.6].map((d, i) => (
              <span key={i} className={styles.waitDot} style={{ animationDelay: `${d}s` }} />
            ))}
          </div>
        )}

        <div className={styles.versionInfo}>
          OPERACIÓN E.L.E. v1.0 &nbsp;·&nbsp; NIVELES A1–B2 &nbsp;·&nbsp; 25 MISIONES · 100 DESAFÍOS
        </div>
      </div>
    </div>
  )
}
