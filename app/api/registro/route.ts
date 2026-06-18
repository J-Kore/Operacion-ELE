import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/registro
 * Crea un nuevo estudiante. La contraseña nunca se guarda en texto plano:
 * se hashea con bcrypt (factor de coste 12) antes de tocar la base de datos.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password, genero } = await req.json() as {
      email?: string; password?: string; genero?: 'M' | 'F'
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son obligatorios.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, { status: 400 })
    }
    if (genero !== 'M' && genero !== 'F') {
      return NextResponse.json({ error: 'Indica si eres el agente o la agente.' }, { status: 400 })
    }

    const existente = await prisma.user.findUnique({ where: { email } })
    if (existente) {
      // Mensaje genérico: no confirmamos ni negamos detalles más allá
      // de que ese email ya está en uso (esto sí es información necesaria
      // para que el estudiante sepa que debe iniciar sesión en vez de
      // registrarse de nuevo).
      return NextResponse.json({ error: 'Ya existe una cuenta con ese correo.' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const usuario = await prisma.user.create({
      data: { email, passwordHash, genero },
    })

    return NextResponse.json({ id: usuario.id, email: usuario.email })
  } catch (error) {
    console.error('[/api/registro] Error:', error)
    return NextResponse.json({ error: 'No se pudo completar el registro. Inténtalo de nuevo.' }, { status: 500 })
  }
}
