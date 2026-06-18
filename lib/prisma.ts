// lib/prisma.ts
//
// Cliente Prisma como singleton. En desarrollo, Next.js recarga módulos
// en cada cambio de archivo (hot-reload), lo que crearía una conexión
// nueva a la base de datos cada vez sin este patrón — agotando el pool
// de conexiones de Postgres en minutos. En producción (Vercel) cada
// invocación serverless es un proceso nuevo, así que esto no afecta.
//
// PRISMA 7: ya no se puede hacer `new PrismaClient()` sin más — hace
// falta pasarle explícitamente un "driver adapter". Para Postgres es
// @prisma/adapter-pg, que usa POSTGRES_PRISMA_DATABASE_URL (la URL CON
// pooling, distinta de la URL directa que usa prisma.config.ts para
// migraciones).

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

const adapter = new PrismaPg({
  connectionString: process.env.POSTGRES_PRISMA_DATABASE_URL,
})

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

