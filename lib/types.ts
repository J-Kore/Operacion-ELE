// Tipos globales del proyecto Operación ELE

export interface Desafio {
  tipo: string
  nombre: string
  descripcion: string
  prompt: string
}

export interface Subnivel {
  id: string
  macro: string
  nombre: string
  descripcionNarrativa: string
  metaComunicativa: string
  morfosintaxis: string
  verbos: string[]
  vocabulario: string[]
  erroresCriticos: string[]
  gramaticaProhibida: string
  feedbackPipboy: string
  desafios: {
    oral: Desafio
    escrita: Desafio
    lectora: Desafio
    auditiva: Desafio
  }
}

export interface MacroNivel {
  id: string
  nombre: string
  requisitos: string
  objetivo: string
  subniveles: string[]
}

export type EstadoNivel = 'locked' | 'active' | 'completed'

export interface ProgresoJugador {
  // Identidad del agente
  nombreAgente: string      // personalizable, default "X-001"
  aliasAgente: string       // alias de espionaje, default "SOMBRA"
  // Progreso
  nivelActual: string
  nivelesCompletados: string[]
  desafiosCompletados: Record<string, string[]>
  xp: number
  reputacion: string
  rachaActual: number        // días consecutivos activo
  ultimaSesion: string       // ISO date string
  totalSesiones: number
  atributos: {
    persuasion: number        // sube con desafíos orales
    sigiloLinguistico: number // sube con lectora
    descifrado: number        // sube con auditiva
    analisisTextual: number   // sube con escrita
    recepcionSenales: number  // sube al completar niveles completos
  }
}

export type HabilidadType = 'oral' | 'escrita' | 'lectora' | 'auditiva'

export interface MensajeChat {
  role: 'user' | 'assistant'
  content: string
}

export interface EvaluacionRespuesta {
  exito: boolean
  capa: 1 | 2 | 3
  feedbackNarrativo: string
  feedbackTecnico?: string
  miniEjercicio?: string
  xpGanado: number
}
