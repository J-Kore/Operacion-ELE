'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import styles from './AudioLogPlayer.module.css'

// ────────────────────────────────────────────────────────────────────────────
// AudioLogPlayer — Reproductor de comprensión auditiva (FASE A: Web Speech API)
//
// Responsabilidad única: convertir el guion de texto del audio log en VOZ usando
// la síntesis del navegador (speechSynthesis), con controles de reproducción y
// transcripción escalonada por macronivel.
//
// FASE A (esta): voz del navegador, gratis, 100% cliente. Calidad media.
// FASE B (futura): el `texto` se sustituirá por una URL de MP3 del servidor —
//   este componente solo cambiaría reproducir(texto) por un <audio src=url>.
//   La interfaz (botones, transcripción, ondas) NO cambiará. Por eso aislamos
//   aquí toda la lógica de TTS: migrar será un reemplazo localizado.
// ────────────────────────────────────────────────────────────────────────────

interface Props {
  /** Guion a leer en voz alta. Hoy viene de /api/generar-contenido. */
  texto: string
  /** Macronivel del subnivel: "A1" | "A2" | "B1" | "B2". Decide la transcripción. */
  macro: string
  /** Sonido Pip-Boy opcional al pulsar play (reutiliza usePipBoySound del padre). */
  onPlayClick?: () => void
}

export default function AudioLogPlayer({ texto, macro, onPlayClick }: Props) {
  const [estado, setEstado] = useState<'idle' | 'playing' | 'paused'>('idle')
  // Transcripción siempre oculta por defecto en todos los niveles.
  // El estudiante la abre solo si la necesita, minimizando scroll.
  const [verTranscripcion, setVerTranscripcion] = useState(false)
  const [soportado, setSoportado] = useState(true)
  const vozRef = useRef<SpeechSynthesisVoice | null>(null)

  // Texto limpio: quitamos cualquier [ESTÁTICA] residual que la IA pudiera meter,
  // ya que decidimos eliminar las estáticas (no aportan a la CO real).
  const textoLimpio = texto.replace(/\[EST[ÁA]TICA\]/gi, ' ').replace(/\s+/g, ' ').trim()

  // ── Carga de voces: bug clásico de Web Speech API ──
  // getVoices() suele devolver [] en la primera llamada porque las voces cargan
  // de forma asíncrona. Hay que escuchar 'voiceschanged' antes de poder elegir
  // una voz española de forma fiable.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setSoportado(false)
      return
    }

    function seleccionarVoz() {
      const voces = window.speechSynthesis.getVoices()
      // Preferimos cualquier voz en español (es-ES, es-MX, es-...). Sin distinguir
      // variedad por ahora, según lo acordado: con que suene en español, vale.
      vozRef.current =
        voces.find(v => v.lang.startsWith('es')) ?? voces[0] ?? null
    }

    seleccionarVoz()
    window.speechSynthesis.addEventListener('voiceschanged', seleccionarVoz)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', seleccionarVoz)
      // Importante: cancelar al desmontar para que la voz no siga sonando
      // si el estudiante navega a otro desafío a media reproducción.
      window.speechSynthesis.cancel()
    }
  }, [])

  // ── Reproducir ──
  // En iOS Safari la síntesis SOLO arranca tras una interacción del usuario (tap).
  // Como esto se dispara desde un onClick de botón, cumplimos esa condición.
  const reproducir = useCallback(() => {
    if (!soportado) return
    onPlayClick?.()

    // Si estaba pausado, reanudamos en lugar de empezar de cero.
    if (estado === 'paused') {
      window.speechSynthesis.resume()
      setEstado('playing')
      return
    }

    // Cancelamos cualquier locución previa para no solapar audios.
    window.speechSynthesis.cancel()

    const u = new SpeechSynthesisUtterance(textoLimpio)
    u.lang = 'es-ES'
    if (vozRef.current) u.voice = vozRef.current
    // Velocidad reducida en niveles iniciales: A1/A2 más lento y articulado.
    u.rate = macro === 'A1' ? 0.8 : macro === 'A2' ? 0.9 : 1.0
    u.pitch = 1.0

    u.onend = () => setEstado('idle')
    u.onerror = () => setEstado('idle')

    window.speechSynthesis.speak(u)
    setEstado('playing')
  }, [soportado, estado, textoLimpio, macro, onPlayClick])

  // ── Pausar ──
  const pausar = useCallback(() => {
    window.speechSynthesis.pause()
    setEstado('paused')
  }, [])

  // ── Reiniciar (volver a escuchar desde el principio) ──
  const reiniciar = useCallback(() => {
    window.speechSynthesis.cancel()
    setEstado('idle')
    // Pequeño respiro para que cancel() termine antes de relanzar.
    setTimeout(reproducir, 60)
  }, [reproducir])

  // Número de barras del visualizador de ondas (puramente decorativo).
  const BARRAS = 11

  return (
    <div className={styles.player}>
      {/* Cabecera con metadata de la transmisión (ambientación Pip-Boy) */}
      <div className={styles.header}>
        <span className={styles.canal}>◉ TRANSMISIÓN INTERCEPTADA — CANAL α-7 · 7.4 MHz</span>
      </div>

      {/* Visualizador de ondas: animado solo mientras suena */}
      <div className={styles.ondas} aria-hidden="true">
        {Array.from({ length: BARRAS }).map((_, i) => (
          <span
            key={i}
            className={`${styles.barra} ${estado === 'playing' ? styles.barraActiva : ''}`}
            style={{ animationDelay: `${(i % 6) * 0.08}s` }}
          />
        ))}
      </div>

      {/* Controles de reproducción */}
      {soportado ? (
        <div className={styles.controles}>
          {estado === 'playing' ? (
            <button className={styles.btn} onClick={pausar} aria-label="Pausar audio">
              ⏸ PAUSAR
            </button>
          ) : (
            <button className={styles.btn} onClick={reproducir} aria-label="Reproducir audio">
              {estado === 'paused' ? '▶ REANUDAR' : '▶ ESCUCHAR'}
            </button>
          )}
          <button className={styles.btnGhost} onClick={reiniciar} aria-label="Volver a escuchar desde el principio">
            ↺ REPETIR
          </button>
        </div>
      ) : (
        // Fallback si el navegador no tiene síntesis de voz: mostramos el texto.
        <div className={styles.noSoporte}>
          Tu navegador no puede reproducir el audio. Lee la transcripción:
        </div>
      )}

      {/* Toggle de transcripción — siempre desplegable, en todos los niveles.
          Si no hay soporte de voz se fuerza abierta para que el ejercicio
          siga siendo accesible. */}
      {soportado && (
        <button
          className={styles.toggleTranscripcion}
          onClick={() => setVerTranscripcion(v => !v)}
          aria-expanded={verTranscripcion}
        >
          {verTranscripcion ? '▾ OCULTAR TRANSCRIPCIÓN' : '▸ VER TRANSCRIPCIÓN'}
        </button>
      )}

      {(verTranscripcion || !soportado) && (
        <div className={styles.transcripcion}>
          <div className={styles.transcripcionLabel}>TRANSCRIPCIÓN</div>
          <p className={styles.transcripcionTexto}>{textoLimpio}</p>
        </div>
      )}
    </div>
  )
}
