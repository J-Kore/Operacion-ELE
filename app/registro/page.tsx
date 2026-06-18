'use client'
// app/registro/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import styles from './registro.module.css'

export default function RegistroPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [genero, setGenero]     = useState<'M' | 'F' | ''>('')
  const [error, setError]       = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!genero) {
      setError('Indica si eres el agente o la agente.')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setCargando(true)
    try {
      const res = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, genero }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'No se pudo completar el registro.')
        setCargando(false)
        return
      }

      // Registro correcto → login automático con las mismas credenciales.
      const resultado = await signIn('credentials', {
        email, password, redirect: false,
      })
      if (resultado?.error) {
        setError('Cuenta creada, pero el inicio de sesión automático falló. Intenta iniciar sesión.')
        setCargando(false)
        return
      }
      router.push('/diagnostico')
    } catch {
      setError('[INTERFERENCIA] No se pudo conectar con la Agencia. Inténtalo de nuevo.')
      setCargando(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className="pip-panel" style={{ maxWidth: 420, width: '100%' }}>
        <div className={styles.title}>◈ REGISTRO DE NUEVO AGENTE</div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            CORREO DE CONTACTO
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={styles.input}
              placeholder="agente@ejemplo.com"
            />
          </label>

          <label className={styles.label}>
            CONTRASEÑA (mín. 8 caracteres)
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={styles.input}
            />
          </label>

          <div className={styles.label}>
            ¿CÓMO TE LLAMAMOS?
            <div className={styles.generoOpciones}>
              <button
                type="button"
                className={`${styles.generoBtn} ${genero === 'M' ? styles.generoBtnActivo : ''}`}
                onClick={() => setGenero('M')}
              >
                EL AGENTE
              </button>
              <button
                type="button"
                className={`${styles.generoBtn} ${genero === 'F' ? styles.generoBtnActivo : ''}`}
                onClick={() => setGenero('F')}
              >
                LA AGENTE
              </button>
            </div>
          </div>

          {error && <div className="alert-box" style={{ borderColor: 'var(--red-alert)', color: 'var(--red-alert)' }}>{error}</div>}

          <button type="submit" className="pip-btn amber" disabled={cargando} style={{ width: '100%', justifyContent: 'center' }}>
            {cargando ? 'REGISTRANDO...' : '▸ UNIRSE A LA AGENCIA'}
          </button>
        </form>

        <div className={styles.footer}>
          ¿Ya tienes una identidad asignada?{' '}
          <Link href="/login" className={styles.link}>Inicia sesión</Link>
        </div>
      </div>
    </div>
  )
}
