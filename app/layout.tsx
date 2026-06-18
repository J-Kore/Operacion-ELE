import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'

export const metadata: Metadata = {
  title: 'Operación E.L.E. — Pip-Boy Spy Academy',
  description: 'Aprende español como un agente secreto. Juego de espionaje con las 4 habilidades lingüísticas.',
  keywords: 'español, ELE, aprender español, juego, espionaje, Pip-Boy, SILABOS',
  authors: [{ name: 'SILABOS', url: 'https://silabos.es' }],
  // Open Graph para compartir en redes
  openGraph: {
    title: 'Operación E.L.E. — Pip-Boy Spy Academy',
    description: 'Aprende español como un agente secreto.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        {/* Favicon SVG — funciona en todos los navegadores modernos */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        {/* Fallback PNG para Safari y navegadores más antiguos */}
        <link rel="alternate icon" href="/favicon.ico" />
        {/* Color del tema en móvil — coincide con el fondo Pip-Boy */}
        <meta name="theme-color" content="#0a0f0b" />
        {/* Pantalla completa en iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {/* Estándar actual (sustituye/complementa el meta de Apple, que
            por sí solo genera el aviso de deprecación en consola) */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Op. E.L.E." />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
