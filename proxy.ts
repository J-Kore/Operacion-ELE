// proxy.ts (raíz del proyecto)
//
// Protección de rutas vía middleware de Next.js + Auth.js.
//
// ⚠️ AVISO DE SEGURIDAD (documentado en auth.config.ts también):
// CVE-2025-29927 demostró que la protección solo-middleware en Next.js
// puede saltarse falsificando la cabecera x-middleware-subrequest. Esta
// capa es una primera barrera (mejora UX: redirige antes de renderizar),
// pero NO es la única comprobación. Las rutas de API sensibles
// (app/api/chat, app/api/generar-contenido) verifican la sesión otra vez
// con auth() dentro del propio handler — ver esos archivos.

import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

export default NextAuth(authConfig).auth

export const config = {
  // Excluye API routes, assets estáticos y archivos de imagen.
  // Las rutas de página (mapa, mision, agente...) sí pasan por aquí.
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$|.*\\.svg$).*)'],
}
