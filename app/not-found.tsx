'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './not-found.module.css'

export default function NotFound() {
  const [dots, setDots] = useState('')
  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.scanlines} />
      <div className={styles.content}>
        <div className={styles.code}>404</div>
        <div className={styles.title}>SEÑAL PERDIDA</div>
        <div className={styles.terminal}>
          <div className={styles.line}>
            <span className={styles.prompt}>SYS &gt;</span> Buscando coordenadas{dots}
          </div>
          <div className={styles.line}>
            <span className={styles.prompt}>SYS &gt;</span> <span className={styles.warn}>ERROR: Ruta no encontrada en la base de datos</span>
          </div>
          <div className={styles.line}>
            <span className={styles.prompt}>SYS &gt;</span> Recomendación: volver al cuartel general
          </div>
        </div>
        <div className={styles.actions}>
          <Link href="/mapa" className={styles.btn}>◈ VOLVER AL MAPA</Link>
          <Link href="/"    className={styles.btnSecondary}>▸ PANTALLA DE INICIO</Link>
        </div>
      </div>
    </div>
  )
}
