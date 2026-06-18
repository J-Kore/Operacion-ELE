// prisma.config.ts (raíz del proyecto)
//
// PRISMA 7: la configuración del CLI (URLs de conexión, ruta del schema,
// migraciones) vive aquí, ya no dentro de schema.prisma.
//
// IMPORTANTE: dotenv/config por defecto busca un archivo llamado `.env`,
// pero este proyecto usa `.env.local` (convención de Next.js). Por eso
// cargamos dotenv explícitamente apuntando a ese archivo, en vez de usar
// el import genérico 'dotenv/config'.
//
// POSTGRES_URL: conexión directa — la usa el CLI para migraciones
// (prisma db push, prisma migrate). Es la que necesitamos aquí.
// POSTGRES_PRISMA_DATABASE_URL (con pooling) la usa el CLIENTE en
// runtime — ver lib/prisma.ts, no este archivo.

import { config } from 'dotenv'
config({ path: '.env.local' })

import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('POSTGRES_URL'),
  },
})