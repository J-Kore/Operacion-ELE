// auth.ts
//
// Configuración completa de Auth.js v5 (solo Node.js runtime, nunca Edge).
// Aquí sí se puede usar Prisma y bcrypt. Exporta los helpers que usa el
// resto de la app: auth(), signIn(), signOut(), y los route handlers.

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { authConfig } from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email:    { label: 'Email',      type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const email    = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined
        if (!email || !password) return null

        const usuario = await prisma.user.findUnique({ where: { email } })
        // No revelamos si el email existe o no: mismo mensaje de error
        // genérico tanto si el usuario no existe como si la contraseña
        // es incorrecta (evita enumeración de cuentas).
        if (!usuario || !usuario.passwordHash) return null

        const passwordValida = await bcrypt.compare(password, usuario.passwordHash)
        if (!passwordValida) return null

        return {
          id:    usuario.id,
          email: usuario.email,
          name:  usuario.name,
        }
      },
    }),
  ],
})