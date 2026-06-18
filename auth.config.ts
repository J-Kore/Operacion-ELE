// auth.config.ts
//
// Configuración "edge-safe" de Auth.js v5 — todo lo que puede ejecutarse
// en el Edge Runtime (incluido el middleware). NO importar aquí nada que
// toque la base de datos directamente (eso vive en auth.ts).
//
// Referencia: https://authjs.dev/getting-started/migrating-to-v5

import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [
    // El provider de Credentials se reconfigura con el `authorize()`
    // completo en auth.ts (necesita acceso a Prisma + bcrypt, que no
    // son edge-safe). Aquí solo se declara la forma del formulario.
    Credentials({
      credentials: {
        email:    { label: 'Email',      type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      // authorize real se inyecta en auth.ts
      async authorize() { return null },
    }),
  ],
  callbacks: {
    // Decide si una ruta requiere sesión. Lo usa el middleware (proxy.ts).
    // IMPORTANTE: por el CVE-2025-29927 (bypass de middleware falsificando
    // x-middleware-subrequest), esta comprobación NO es la única barrera.
    // Las rutas sensibles (app/api/chat, app/api/generar-contenido) vuelven
    // a verificar la sesión ellas mismas con `auth()` — ver esos archivos.
    authorized({ auth, request: { nextUrl } }) {
      const estaLogueado = !!auth?.user
      const rutaProtegida =
        nextUrl.pathname.startsWith('/mision') ||
        nextUrl.pathname.startsWith('/mapa') ||
        nextUrl.pathname.startsWith('/agente') ||
        nextUrl.pathname.startsWith('/inventario') ||
        nextUrl.pathname.startsWith('/radio') ||
        nextUrl.pathname.startsWith('/diagnostico')

      if (rutaProtegida && !estaLogueado) return false
      return true
    },
    // Añade el userId (id de Prisma) al token JWT de la sesión.
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    // Expone el userId en `session.user.id` para el cliente y el servidor.
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
} satisfies NextAuthConfig
