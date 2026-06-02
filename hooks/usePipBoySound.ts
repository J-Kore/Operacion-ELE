'use client'
import { useCallback, useRef } from 'react'

type SoundKey = 'click' | 'success' | 'error' | 'boot' | 'transmit' | 'levelup'

/**
 * Genera sonidos retro Pip-Boy usando Web Audio API (sin archivos externos).
 * Si el navegador no soporta Web Audio, los sonidos se silencian gracefully.
 * El usuario puede usar archivos MP3 en /public/sounds/ para sobreescribir.
 */
export function usePipBoySound() {
  const ctxRef = useRef<AudioContext | null>(null)

  function getCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!ctxRef.current) {
      try {
        ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch {
        return null
      }
    }
    return ctxRef.current
  }

  // Genera un beep sintético con parámetros personalizables
  function beep(
    frequency = 440,
    duration  = 0.1,
    type: OscillatorType = 'square',
    gain = 0.15,
    delay = 0
  ) {
    const ctx = getCtx()
    if (!ctx) return
    try {
      const osc  = ctx.createOscillator()
      const gainNode = ctx.createGain()
      osc.connect(gainNode)
      gainNode.connect(ctx.destination)

      osc.type = type
      osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay)
      gainNode.gain.setValueAtTime(0, ctx.currentTime + delay)
      gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + delay + 0.01)
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + duration)

      osc.start(ctx.currentTime + delay)
      osc.stop(ctx.currentTime + delay + duration + 0.05)
    } catch { /* silencioso si falla */ }
  }

  // Intenta reproducir un MP3 de /public/sounds/ primero; si no existe, usa beep
  async function playFile(name: SoundKey, fallback: () => void) {
    try {
      const audio = new Audio(`/sounds/${name}.mp3`)
      audio.volume = 0.4
      await audio.play()
    } catch {
      fallback()
    }
  }

  const play = useCallback((sound: SoundKey) => {
    switch (sound) {
      case 'click':
        playFile('click', () => beep(800, 0.05, 'square', 0.1))
        break
      case 'success':
        playFile('success', () => {
          beep(523, 0.12, 'sine', 0.2, 0)
          beep(659, 0.12, 'sine', 0.2, 0.12)
          beep(784, 0.2,  'sine', 0.2, 0.24)
        })
        break
      case 'error':
        playFile('error', () => {
          beep(220, 0.08, 'sawtooth', 0.15, 0)
          beep(180, 0.12, 'sawtooth', 0.15, 0.1)
        })
        break
      case 'boot':
        playFile('boot', () => {
          beep(220, 0.1, 'square', 0.1, 0)
          beep(330, 0.1, 'square', 0.1, 0.15)
          beep(440, 0.1, 'square', 0.1, 0.3)
          beep(880, 0.2, 'sine',   0.2, 0.45)
        })
        break
      case 'transmit':
        playFile('transmit', () => {
          beep(1200, 0.04, 'square', 0.08, 0)
          beep(900,  0.04, 'square', 0.08, 0.06)
          beep(1200, 0.04, 'square', 0.08, 0.12)
        })
        break
      case 'levelup':
        playFile('levelup', () => {
          beep(392, 0.1, 'sine', 0.2, 0)
          beep(523, 0.1, 'sine', 0.2, 0.1)
          beep(659, 0.1, 'sine', 0.2, 0.2)
          beep(784, 0.3, 'sine', 0.25, 0.3)
        })
        break
    }
  }, [])

  return { play }
}
