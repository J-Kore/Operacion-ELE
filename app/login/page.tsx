'use client'
// app/login/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import styles from '../registro/registro.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setCargando(true)

    const resultado = await signIn('credentials', { email, password, redirect: false })

    if (resultado?.error) {
      setError('Email o contraseña incorrectos.')
      setCargando(false)
      return
    }
    router.push('/mapa')
  }

  return (
    <div className={styles.page}>
      <div className="pip-panel" style={{ maxWidth: 420, width: '100%' }}>
        <div className={styles.title}>◈ IDENTIFICACIÓN DE AGENTE</div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            CORREO DE CONTACTO
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              className={styles.input}
            />
          </label>

          <label className={styles.label}>
            CONTRASEÑA
            <input
              type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              className={styles.input}
            />
          </label>

          {error && <div className="alert-box" style={{ borderColor: 'var(--red-alert)', color: 'var(--red-alert)' }}>{error}</div>}

          <button type="submit" className="pip-btn amber" disabled={cargando} style={{ width: '100%', justifyContent: 'center' }}>
            {cargando ? 'VERIFICANDO...' : '▸ ACCEDER'}
          </button>
        </form>

        <div className={styles.footer}>
          ¿Primera vez en la Agencia?{' '}
          <Link href="/registro" className={styles.link}>Regístrate</Link>
        </div>
      </div>
    </div>
  )
}
