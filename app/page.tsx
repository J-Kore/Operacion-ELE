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
        {/* Insignia Sílabos — sustituye el icono robot */}
        <div className={styles.pipboyIcon}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="none" className={styles.silabosBadge}>
            <defs>
              <radialGradient id="esfera" cx="50%" cy="40%" r="75%">
                <stop offset="0%"   stopColor="#06140d"/>
                <stop offset="70%"  stopColor="#030a06"/>
                <stop offset="100%" stopColor="#010402"/>
              </radialGradient>
              <filter id="neon" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="2.5" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="neonStrong" x="-120%" y="-120%" width="340%" height="340%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <clipPath id="clip"><circle cx="64" cy="64" r="60"/></clipPath>
            </defs>
            <circle cx="64" cy="64" r="62" fill="url(#esfera)"/>
            <g clipPath="url(#clip)" opacity="0.35">
              <line x1="4" y1="124" x2="124" y2="124" stroke="#00cc7a" strokeWidth="0.8"/>
              <line x1="4" y1="112" x2="124" y2="112" stroke="#00cc7a" strokeWidth="0.7"/>
              <line x1="4" y1="101" x2="124" y2="101" stroke="#00cc7a" strokeWidth="0.6"/>
              <line x1="4" y1="92"  x2="124" y2="92"  stroke="#00cc7a" strokeWidth="0.5"/>
              <line x1="4" y1="85"  x2="124" y2="85"  stroke="#00cc7a" strokeWidth="0.4"/>
              <line x1="4" y1="79"  x2="124" y2="79"  stroke="#00cc7a" strokeWidth="0.35"/>
              <line x1="4" y1="75"  x2="124" y2="75"  stroke="#00cc7a" strokeWidth="0.3"/>
              <line x1="64" y1="72" x2="64"  y2="126" stroke="#00cc7a" strokeWidth="0.5"/>
              <line x1="64" y1="72" x2="34"  y2="126" stroke="#00cc7a" strokeWidth="0.45"/>
              <line x1="64" y1="72" x2="4"   y2="126" stroke="#00cc7a" strokeWidth="0.4"/>
              <line x1="64" y1="72" x2="94"  y2="126" stroke="#00cc7a" strokeWidth="0.45"/>
              <line x1="64" y1="72" x2="124" y2="126" stroke="#00cc7a" strokeWidth="0.4"/>
              <line x1="64" y1="72" x2="16"  y2="100" stroke="#00cc7a" strokeWidth="0.35"/>
              <line x1="64" y1="72" x2="112" y2="100" stroke="#00cc7a" strokeWidth="0.35"/>
            </g>
            <line x1="6" y1="72" x2="122" y2="72" stroke="#00ff9d" strokeWidth="1" opacity="0.5" filter="url(#neon)" clipPath="url(#clip)"/>
            <circle cx="64" cy="64" r="61" stroke="#00ff9d" strokeWidth="1.8" opacity="0.9" filter="url(#neon)"/>
            <circle cx="64" cy="64" r="57" stroke="#00cc7a" strokeWidth="0.6" opacity="0.4"/>
            <g filter="url(#neon)">
              <line x1="38" y1="26" x2="86" y2="36" stroke="#00cc7a" strokeWidth="2.2" strokeLinecap="round" opacity="0.85"/>
              <line x1="38" y1="26" x2="46" y2="60" stroke="#00cc7a" strokeWidth="2.2" strokeLinecap="round" opacity="0.85"/>
              <line x1="86" y1="36" x2="79" y2="57" stroke="#00cc7a" strokeWidth="2.2" strokeLinecap="round" opacity="0.85"/>
              <line x1="46" y1="60" x2="34" y2="94" stroke="#00cc7a" strokeWidth="2.2" strokeLinecap="round" opacity="0.85"/>
              <line x1="79" y1="57" x2="92" y2="88" stroke="#00cc7a" strokeWidth="2.2" strokeLinecap="round" opacity="0.85"/>
            </g>
            <g filter="url(#neonStrong)">
              <line x1="46" y1="60" x2="62" y2="58.5" stroke="#00ff9d" strokeWidth="3.2" strokeLinecap="round"/>
              <line x1="62" y1="58.5" x2="79" y2="57" stroke="#00ff9d" strokeWidth="3.2" strokeLinecap="round"/>
            </g>
            <line x1="34" y1="94" x2="92" y2="88" stroke="#00ff9d" strokeWidth="1.4" strokeDasharray="4,5" strokeLinecap="round" opacity="0.5" filter="url(#neon)"/>
            <g filter="url(#neonStrong)">
              <circle cx="38" cy="26" r="7" fill="#010402"/>
              <circle cx="38" cy="26" r="7" stroke="#00ff9d" strokeWidth="1.6"/>
              <circle cx="38" cy="26" r="2.8" fill="#00ff9d"/>
            </g>
            <g filter="url(#neon)">
              <circle cx="86" cy="36" r="4.5" fill="#010402"/>
              <circle cx="86" cy="36" r="4.5" stroke="#00cc7a" strokeWidth="1.2"/>
              <circle cx="86" cy="36" r="1.8" fill="#00cc7a"/>
            </g>
            <g filter="url(#neon)"><circle cx="46" cy="60" r="3.8" fill="#00ff9d"/></g>
            <g filter="url(#neonStrong)"><circle cx="62" cy="58.5" r="4.6" fill="#00ff9d"/></g>
            <g filter="url(#neon)"><circle cx="79" cy="57" r="3.8" fill="#00ff9d"/></g>
            <g filter="url(#neon)">
              <circle cx="34" cy="94" r="4.5" fill="#010402"/>
              <circle cx="34" cy="94" r="4.5" stroke="#00cc7a" strokeWidth="1.2"/>
              <circle cx="34" cy="94" r="1.8" fill="#00cc7a"/>
            </g>
            <g filter="url(#neonStrong)">
              <circle cx="92" cy="88" r="13" fill="#010402"/>
              <circle cx="92" cy="88" r="13" stroke="#00ff9d" strokeWidth="2"/>
              <circle cx="92" cy="88" r="9.5" stroke="#00cc7a" strokeWidth="0.6" opacity="0.5"/>
              <text x="92" y="93.5" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="15" fontWeight="700" fill="#00ff9d">S</text>
            </g>
          </svg>
        </div>

        <div className={styles.title}>OP·ELE</div>
        <div className={styles.subtitle}>O P E R A C I Ó N &nbsp; E · L · E</div>
        <div className={styles.tagline}>AVENTURA · ESPAÑOL · SUPERVIVENCIA</div>

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
          v1.0 &nbsp;·&nbsp; NIVELES A1–B2 &nbsp;·&nbsp; 100 DESAFÍOS &nbsp;·&nbsp; SILABOS
        </div>
      </div>
    </div>
  )
}
