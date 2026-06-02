'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cargarProgreso } from '@/lib/gameState'

export default function MisionIndex() {
  const router = useRouter()
  useEffect(() => {
    const progreso = cargarProgreso()
    router.replace(`/mision/${progreso.nivelActual}/oral`)
  }, [router])
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--pip)', fontFamily:'monospace', fontSize:'0.7rem', letterSpacing:'0.2em' }}>
      CARGANDO MISIÓN...
    </div>
  )
}
