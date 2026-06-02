// Gestión del progreso del jugador (localStorage)
import { ProgresoJugador, EstadoNivel } from './types'

const STORAGE_KEY = 'operacion-ele-progreso'

export const ORDEN_NIVELES = [
  'A1.1','A1.2','A1.3','A1.4',
  'A2.1','A2.2','A2.3','A2.4','A2.5',
  'B1.1','B1.2','B1.3','B1.4','B1.5','B1.6','B1.7','B1.8',
  'B2.1','B2.2','B2.3','B2.4','B2.5','B2.6','B2.7','B2.8',
]

export const PROGRESO_INICIAL: ProgresoJugador = {
  nombreAgente:  'X-001',
  aliasAgente:   'SOMBRA',
  nivelActual:   'A1.1',
  nivelesCompletados: [],
  desafiosCompletados: {},
  xp:            0,
  reputacion:    'D',
  rachaActual:   0,
  ultimaSesion:  '',
  totalSesiones: 0,
  atributos: {
    persuasion:        1,
    sigiloLinguistico: 1,
    descifrado:        1,
    analisisTextual:   1,
    recepcionSenales:  1,
  },
}

// ─── Persistencia ────────────────────────────────────────────────────────────

export function cargarProgreso(): ProgresoJugador {
  if (typeof window === 'undefined') return PROGRESO_INICIAL
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return PROGRESO_INICIAL
    // Merge con PROGRESO_INICIAL para garantizar que campos nuevos existan
    const parsed = JSON.parse(stored) as Partial<ProgresoJugador>
    return { ...PROGRESO_INICIAL, ...parsed, atributos: { ...PROGRESO_INICIAL.atributos, ...(parsed.atributos ?? {}) } }
  } catch {
    return PROGRESO_INICIAL
  }
}

export function guardarProgreso(progreso: ProgresoJugador): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progreso))
}

export function resetearProgreso(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

// ─── Sesión y racha ──────────────────────────────────────────────────────────

export function registrarSesion(progreso: ProgresoJugador): ProgresoJugador {
  const hoy = new Date().toISOString().slice(0, 10)
  if (progreso.ultimaSesion === hoy) return progreso  // ya registrada hoy

  const ayer = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const racha = progreso.ultimaSesion === ayer ? progreso.rachaActual + 1 : 1

  return {
    ...progreso,
    ultimaSesion:   hoy,
    totalSesiones:  progreso.totalSesiones + 1,
    rachaActual:    racha,
  }
}

// ─── Estado de niveles ────────────────────────────────────────────────────────

export function calcularEstadoNivel(nivelId: string, progreso: ProgresoJugador): EstadoNivel {
  if (progreso.nivelesCompletados.includes(nivelId)) return 'completed'
  if (progreso.nivelActual === nivelId) return 'active'
  const idxActual = ORDEN_NIVELES.indexOf(progreso.nivelActual)
  const idxNivel  = ORDEN_NIVELES.indexOf(nivelId)
  return idxNivel <= idxActual ? 'active' : 'locked'
}

// ─── Completar desafío ────────────────────────────────────────────────────────

/** Mapa: qué atributo sube con cada habilidad */
const ATRIBUTO_POR_HABILIDAD: Record<string, keyof ProgresoJugador['atributos']> = {
  oral:     'persuasion',
  escrita:  'analisisTextual',
  lectora:  'sigiloLinguistico',
  auditiva: 'descifrado',
}

export function completarDesafio(
  progreso: ProgresoJugador,
  subnivel: string,
  habilidad: string,
  xpGanado: number
): ProgresoJugador {
  const desafios = progreso.desafiosCompletados[subnivel] ?? []
  if (desafios.includes(habilidad)) return progreso  // ya completado

  const nuevosDesafios = [...desafios, habilidad]

  // Subir el atributo correspondiente a la habilidad (máx 10)
  const attrKey = ATRIBUTO_POR_HABILIDAD[habilidad]
  const attrActual = progreso.atributos[attrKey]
  // Sube cada 2 desafíos de ese tipo completados (en todos los niveles)
  const totalEseHabilidad = Object.values({
    ...progreso.desafiosCompletados,
    [subnivel]: nuevosDesafios,
  }).filter(arr => arr.includes(habilidad)).length
  const nuevoAttr = Math.min(10, Math.floor(totalEseHabilidad / 2) + 1)

  const nuevoProgreso: ProgresoJugador = {
    ...progreso,
    xp: progreso.xp + xpGanado,
    desafiosCompletados: { ...progreso.desafiosCompletados, [subnivel]: nuevosDesafios },
    atributos: { ...progreso.atributos, [attrKey]: nuevoAttr },
  }

  // Si completa los 4 desafíos del subnivel → avanzar y subir recepcionSenales
  if (nuevosDesafios.length >= 4) {
    nuevoProgreso.nivelesCompletados = [...progreso.nivelesCompletados, subnivel]
    const idx = ORDEN_NIVELES.indexOf(subnivel)
    if (idx < ORDEN_NIVELES.length - 1) nuevoProgreso.nivelActual = ORDEN_NIVELES[idx + 1]
    nuevoProgreso.reputacion = calcularReputacion(nuevoProgreso.xp)
    // recepcionSenales sube al completar un nivel completo
    nuevoProgreso.atributos.recepcionSenales = Math.min(
      10,
      Math.floor(nuevoProgreso.nivelesCompletados.length / 3) + 1
    )
  }

  return nuevoProgreso
}

// ─── Utilidades ──────────────────────────────────────────────────────────────

function calcularReputacion(xp: number): string {
  if (xp >= 10000) return 'S'
  if (xp >= 6000)  return 'A'
  if (xp >= 3000)  return 'B'
  if (xp >= 1000)  return 'C'
  return 'D'
}

export function xpParaSiguienteRango(reputacion: string): number {
  const rangos: Record<string, number> = { D: 1000, C: 3000, B: 6000, A: 10000, S: 10000 }
  return rangos[reputacion] ?? 10000
}

export function xpEnRangoActual(xp: number, reputacion: string): number {
  const bases: Record<string, number> = { D: 0, C: 1000, B: 3000, A: 6000, S: 10000 }
  return xp - (bases[reputacion] ?? 0)
}

export function xpRangoTotal(reputacion: string): number {
  const totales: Record<string, number> = { D: 1000, C: 2000, B: 3000, A: 4000, S: 1 }
  return totales[reputacion] ?? 1000
}
