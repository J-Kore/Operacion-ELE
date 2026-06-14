'use client'
import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

// app/mision/[nivel]/page.tsx
// Redirect simple: cuando se accede a /mision/A1.1 sin especificar habilidad,
// redirige a /mision/A1.1/oral (primera habilidad por defecto)
export default function MisionNivelIndex() {
  const router = useRouter()
  const params = useParams()
  const nivelId = params.nivel as string

  useEffect(() => {
    router.replace(`/mision/${nivelId}/oral`)
  }, [router, nivelId])

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--pip)', fontFamily:'monospace', fontSize:'0.7rem', letterSpacing:'0.2em' }}>
      CARGANDO MISIÓN...
    </div>
  )
}