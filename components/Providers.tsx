'use client'
// components/Providers.tsx
//
// Envuelve la app con SessionProvider de next-auth/react, necesario para
// que useSession() funcione en cualquier componente cliente (ej. ChatChallenge).
// Server Components (como app/layout.tsx) no pueden usar SessionProvider
// directamente porque requiere contexto de React del lado cliente.

import { SessionProvider } from 'next-auth/react'

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
