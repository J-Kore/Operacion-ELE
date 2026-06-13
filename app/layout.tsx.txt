import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Operación E.L.E. — Pip-Boy Spy Academy',
  description: 'Aprende español como un agente secreto. Juego de espionaje con las 4 habilidades lingüísticas.',
  keywords: 'español, ELE, aprender español, juego, espionaje, Pip-Boy',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
