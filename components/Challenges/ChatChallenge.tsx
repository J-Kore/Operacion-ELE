'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Subnivel, HabilidadType, MensajeChat } from '@/lib/types'
import { usePipBoySound } from '@/hooks/usePipBoySound'
import styles from './ChatChallenge.module.css'

// ── Eliminamos la importación de HFStatus (era de huggingface.ts, ya no existe)

interface Props {
  subnivel: Subnivel
  habilidad: HabilidadType
  onExito: (xp: number) => void
  primeraMision?: boolean
}

const HABILIDAD_CONFIG = {
  oral:     { icon: '📡', color: 'amber',  label: 'EXPRESIÓN ORAL',       canal: 'Canal de Voz α-7',         instruccion: 'Pulsa el micrófono y habla en español. El sistema transcribirá tu voz automáticamente.' },
  escrita:  { icon: '⌨️', color: 'cyan',   label: 'EXPRESIÓN ESCRITA',    canal: 'Terminal de Mensajería',   instruccion: 'Escribe tu respuesta en español. Puedes tomarte más tiempo para revisar antes de enviar.' },
  lectora:  { icon: '📄', color: 'purple', label: 'COMPRENSIÓN LECTORA',  canal: 'Inventario de Pistas',     instruccion: 'Lee el texto con atención y responde las preguntas de comprensión en español.' },
  auditiva: { icon: '🎧', color: 'green',  label: 'COMPRENSIÓN AUDITIVA', canal: 'Audio Log Interceptado',   instruccion: 'Lee la transcripción de radio (con [ESTÁTICA]) e infiere lo que falta. Responde las preguntas.' },
}



// ── Overlay de éxito con partículas Pip-Boy ──
function SuccessOverlay({ xp }: { xp: number }) {
  return (
    <div className={styles.successOverlay}>
      <div className={styles.successContent}>
        <div className={styles.successIcon}>✓</div>
        <div className={styles.successTitle}>MISIÓN COMPLETADA</div>
        <div className={styles.successXp}>+{xp} XP</div>
        <div className={styles.successSub}>Siguiente desafío desbloqueado</div>
      </div>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className={styles.particle} style={{ '--i': i } as React.CSSProperties} />
      ))}
    </div>
  )
}

// ── Onboarding para primera misión ──
function OnboardingTooltip({ habilidad, onClose }: { habilidad: HabilidadType; onClose: () => void }) {
  const cfg = HABILIDAD_CONFIG[habilidad]
  return (
    <div className={styles.onboarding}>
      <div className={styles.onboardingHeader}>
        <span className={styles.onboardingIcon}>{cfg.icon}</span>
        <div>
          <div className={styles.onboardingTitle}>¿Cómo funciona este desafío?</div>
          <div className={styles.onboardingHabilidad}>{cfg.label}</div>
        </div>
      </div>
      <div className={styles.onboardingSteps}>
        <div className={styles.onboardingStep}>
          <span className={styles.stepNum}>1</span>
          <span>{cfg.instruccion}</span>
        </div>
        <div className={styles.onboardingStep}>
          <span className={styles.stepNum}>2</span>
          <span>Si cometes un error, el NPC reaccionará con dudas — intenta corregirte solo (Capa 1).</span>
        </div>
        <div className={styles.onboardingStep}>
          <span className={styles.stepNum}>3</span>
          <span>Si el error persiste, el Pip-Boy activará un diagnóstico técnico (Capas 2 y 3).</span>
        </div>
        <div className={styles.onboardingStep}>
          <span className={styles.stepNum}>4</span>
          <span>Completa los 4 desafíos del nivel (oral, escrita, lectora, auditiva) para avanzar.</span>
        </div>
      </div>
      <button className={styles.onboardingClose} onClick={onClose}>
        ▸ ENTENDIDO — INICIAR MISIÓN
      </button>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ────────────────────────────────────────────────────────────────────────────

export default function ChatChallenge({ subnivel, habilidad, onExito, primeraMision }: Props) {
  const { play } = usePipBoySound()

  // ── Estado del chat ──
  const [mensajes, setMensajes]               = useState<MensajeChat[]>([])
  const [input, setInput]                     = useState('')
  const [cargando, setCargando]               = useState(false)
  const [intento, setIntento]                 = useState(1)
  const [completado, setCompletado]           = useState(false)
  const [xpGanado, setXpGanado]               = useState(0)
  const [mostrarExito, setMostrarExito]       = useState(false)
  const [feedbackTecnico, setFeedbackTecnico] = useState<string | null>(null)
  const [capa, setCapa]                       = useState<1|2|3>(1)
  const [showOnboarding, setShowOnboarding]   = useState(false)
  const [apiMsg, setApiMsg]                   = useState('')

  // ── Estado del micrófono (solo para habilidad oral) ──
  // 'idle'        → sin grabar, botón disponible
  // 'recording'   → grabando, animación activa
  // 'processing'  → transcribiendo (Web Speech es casi instantáneo)
  // 'unsupported' → navegador no compatible (Safari)
  const [micStatus, setMicStatus] = useState<'idle' | 'recording' | 'processing' | 'unsupported'>('idle')

  // Ref al objeto SpeechRecognition para poder llamar .stop() desde el botón
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const terminalRef    = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLTextAreaElement>(null)

  const cfg = HABILIDAD_CONFIG[habilidad]
  const esOral = habilidad === 'oral'

  // ── Detectar soporte de Web Speech API al montar ──
  useEffect(() => {
    if (esOral) {
      const SpeechRecognitionAPI =
        typeof window !== 'undefined'
          ? (window.SpeechRecognition || window.webkitSpeechRecognition)
          : null
      if (!SpeechRecognitionAPI) {
        setMicStatus('unsupported')
      }
    }
  }, [esOral])

  // ── Onboarding primera misión ──
  useEffect(() => {
    if (primeraMision) {
      const visto = localStorage.getItem('ele-onboarding-visto')
      if (!visto) setShowOnboarding(true)
    }
  }, [primeraMision])

  function cerrarOnboarding() {
    play('click')
    localStorage.setItem('ele-onboarding-visto', '1')
    setShowOnboarding(false)
  }

  // ── Cargar contenido inicial del NPC ──
  useEffect(() => {
    if (showOnboarding) return
    async function init() {
      setCargando(true)
      setApiMsg('Conectando con el servidor...')
      try {
        const res = await fetch('/api/generar-contenido', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subnivel, habilidad }),
        })
        const data = await res.json()
        setMensajes([{ role: 'assistant', content: data.contenido }])
      } catch {
        setMensajes([{
          role: 'assistant',
          content: `[SEÑAL ESTABLECIDA — ${cfg.canal}] Agente, listo para comenzar.`,
        }])
      } finally {
        setCargando(false)
        setApiMsg('')
      }
    }
    init()
  }, [subnivel.id, habilidad, showOnboarding])

  // ── Auto-scroll al final del terminal ──
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [mensajes, cargando])

  // ────────────────────────────────────────────────────────────────────────
  // WEB SPEECH API — Lógica del micrófono
  // Solo se activa para habilidad === 'oral'
  // ────────────────────────────────────────────────────────────────────────

  function iniciarGrabacion() {
    if (cargando || completado || micStatus === 'unsupported') return

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) return

    const recognition = new SpeechRecognitionAPI()
    recognitionRef.current = recognition

    // Configuración para español
    recognition.lang = 'es-ES'
    recognition.continuous = true      // para cuando detecta silencio
    recognition.interimResults = true   // muestra texto provisional mientras habla

    recognition.onstart = () => {
      setMicStatus('recording')
      play('click')
    }

    // onresult se dispara con cada fragmento de texto reconocido
    // Los resultados 'interim' son provisionales, el 'final' es el definitivo
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let textoAcumulado = ''
      for (let i = 0; i < event.results.length; i++) {
        textoAcumulado += event.results[i][0].transcript
      }
      setInput(textoAcumulado)
    }

    recognition.onend = () => {
      setMicStatus('idle')
      recognitionRef.current = null
      // Si hay texto transcrito, enfocamos el input para que pueda editar antes de enviar
      inputRef.current?.focus()
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[SpeechRecognition] Error:', event.error)
      setMicStatus('idle')
      recognitionRef.current = null

      // Errores comunes y mensajes amigables
      if (event.error === 'not-allowed') {
        setApiMsg('⚠ Permiso de micrófono denegado. Actívalo en la configuración del navegador.')
      } else if (event.error === 'no-speech') {
        setApiMsg('No se detectó voz. Pulsa el micrófono e intenta de nuevo.')
        setTimeout(() => setApiMsg(''), 3000)
      }
    }

    recognition.start()
  }

  function detenerGrabacion() {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setMicStatus('idle')
    }
  }

  function toggleMic() {
    if (micStatus === 'recording') {
      detenerGrabacion()
    } else {
      iniciarGrabacion()
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // ENVIAR MENSAJE AL NPC
  // ────────────────────────────────────────────────────────────────────────

  async function enviarMensaje() {
    if (!input.trim() || cargando || completado) return

    // Si el mic sigue activo al pulsar transmitir, lo paramos primero
    if (micStatus === 'recording') detenerGrabacion()

    const userMsg = input.trim()
    play('transmit')
    setInput('')
    setCargando(true)
    setFeedbackTecnico(null)
    setApiMsg('')

    const newMensajes: MensajeChat[] = [...mensajes, { role: 'user', content: userMsg }]
    setMensajes(newMensajes)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subnivel,
          habilidad,
          historial: mensajes,
          mensaje: userMsg,
          intento,
        }),
      })
      const data = await res.json()

      setMensajes([...newMensajes, { role: 'assistant', content: data.feedbackNarrativo }])
      setCapa(data.capa)

      if (data.feedbackTecnico) {
        play('error')
        setFeedbackTecnico(data.feedbackTecnico)
      }
      if (data.miniEjercicio) {
        setFeedbackTecnico(p => `${p ?? ''}\n\nMINI-EJERCICIO: ${data.miniEjercicio}`)
      }

      if (data.exito) {
        const xp = data.xpGanado ?? 50
        setXpGanado(xp)
        setCompletado(true)
        setMostrarExito(true)
        onExito(xp)
        setTimeout(() => setMostrarExito(false), 3500)
      } else {
        setIntento(i => i + 1)
      }
    } catch {
      setMensajes(prev => [
        ...prev,
        { role: 'assistant', content: '[INTERFERENCIA] La señal se ha cortado. Reintentando...' },
      ])
    } finally {
      setCargando(false)
      setApiMsg('')
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviarMensaje()
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────

  return (
    <div className={styles.wrapper}>

      {/* ONBOARDING */}
      {showOnboarding && (
        <OnboardingTooltip habilidad={habilidad} onClose={cerrarOnboarding} />
      )}

      {/* SUCCESS OVERLAY */}
      {mostrarExito && <SuccessOverlay xp={xpGanado} />}

      {!showOnboarding && (
        <>
          {/* HEADER */}
          <div className={`${styles.header} pip-panel`}>
            <span className={styles.headerIcon}>{cfg.icon}</span>
            <div className={styles.headerBody}>
              <div className={`${styles.headerType} text-xs text-muted`}>{cfg.label}</div>
              <div className={`${styles.headerCanal} orbitron`}>{cfg.canal}</div>
              <div className={styles.headerDesc}>{subnivel.desafios[habilidad].descripcion}</div>
            </div>
            {completado
              ? <div className={styles.completadoBadge}>✓ COMPLETADO</div>
              : <button className={styles.helpBtn} title="¿Cómo funciona?" onClick={() => setShowOnboarding(true)}>?</button>
            }
          </div>

          {/* MENSAJES DE ESTADO (conexión, errores de mic...) */}
          {apiMsg && (
            <div className={styles.hfStatus}>
              <div className={styles.hfStatusDot} />
              {apiMsg}
            </div>
          )}

          {/* TERMINAL DE MENSAJES */}
          <div className={`terminal ${styles.terminal}`} ref={terminalRef}>
            {mensajes.map((m, i) => (
              <div
                key={i}
                className={`${styles.mensaje} ${m.role === 'user' ? styles.user : styles.npc}`}
              >
                <span className={styles.roleLabel}>{m.role === 'user' ? 'AGT >' : 'NPC >'}</span>
                <span className={styles.content}>{m.content}</span>
              </div>
            ))}
            {cargando && (
              <div className={`${styles.mensaje} ${styles.npc}`}>
                <span className={styles.roleLabel}>NPC &gt;</span>
                <span className={styles.content}><span className="terminal-cursor" /></span>
              </div>
            )}
          </div>

          {/* FEEDBACK TÉCNICO PIP-BOY */}
          {feedbackTecnico && (
            <div className={`${styles.pipFeedback} ${capa === 3 ? styles.capa3 : styles.capa2}`}>
              <div className={styles.pipFeedbackTitle}>
                {capa === 3 ? '⚠ PIP-BOY — RECALIBRACIÓN' : '⚠ PIP-BOY — SOPORTE TÉCNICO'}
              </div>
              <pre className={styles.pipFeedbackText}>{feedbackTecnico}</pre>
            </div>
          )}

          {/* INDICADOR DE INTENTO / CAPA */}
          {intento > 1 && !completado && (
            <div className={styles.intentoIndicador}>
              <span className="text-muted text-xs">
                INTENTO {intento} — CAPA {capa}: {capa === 1 ? 'INMERSIÓN' : capa === 2 ? 'SOPORTE PIP-BOY' : 'RECALIBRACIÓN'}
              </span>
              <div className={styles.intentoDots}>
                {[1, 2, 3].map(n => (
                  <div
                    key={n}
                    className={`${styles.intentoDot} ${intento >= n ? styles.intentoDotActive : ''} ${capa === n ? styles.intentoDotCurrent : ''}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── ÁREA DE INPUT ──
              Para habilidad ORAL: micrófono + textarea + botón transmitir
              Para el resto: solo textarea + botón transmitir
          ── */}
          {!completado ? (
            <div className={styles.inputArea}>

              {/* BOTÓN DE MICRÓFONO — solo en expresión oral */}
              {esOral && (
                <button
                  className={`${styles.micBtn} ${micStatus === 'recording' ? styles.micBtnActive : ''} ${micStatus === 'unsupported' ? styles.micBtnDisabled : ''}`}
                  onClick={toggleMic}
                  disabled={cargando || completado || micStatus === 'unsupported'}
                  title={
                    micStatus === 'unsupported'
                      ? 'Micrófono no disponible en este navegador (usa Chrome)'
                      : micStatus === 'recording'
                      ? 'Pulsa para detener la grabación'
                      : 'Pulsa para hablar'
                  }
                  aria-label={micStatus === 'recording' ? 'Detener grabación' : 'Iniciar grabación de voz'}
                >
                  {/* Icono cambia según estado */}
                  {micStatus === 'recording' ? '⏹' : micStatus === 'unsupported' ? '🚫' : '🎙️'}
                  {/* Anillo de pulso visible solo al grabar */}
                  {micStatus === 'recording' && <span className={styles.micPulse} />}
                </button>
              )}

              {/* TEXTAREA — siempre visible, en oral muestra la transcripción en tiempo real */}
              <textarea
                ref={inputRef}
                className={styles.input}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={
                  esOral
                    ? micStatus === 'recording'
                      ? '🔴 Grabando... habla en español'
                      : micStatus === 'unsupported'
                      ? 'Escribe tu respuesta (micrófono no disponible en Safari)'
                      : 'Pulsa 🎙️ para hablar, o escribe directamente...'
                    : 'Escribe tu respuesta, agente... (Enter para enviar)'
                }
                rows={3}
                disabled={cargando}
              />

              {/* BOTÓN TRANSMITIR */}
              <button
                className={`pip-btn amber ${styles.sendBtn}`}
                onClick={enviarMensaje}
                disabled={cargando || !input.trim()}
              >
                {cargando ? '◌ PROCESANDO...' : '▸ TRANSMITIR'}
              </button>
            </div>
          ) : (
            <div className={styles.exitoMsg}>
              <span className="text-amber orbitron" style={{ fontSize: 'var(--text-sm)', letterSpacing: '0.2em' }}>
                ✓ DESAFÍO SUPERADO — +{xpGanado} XP
              </span>
            </div>
          )}

          {/* Aviso navegador incompatible */}
          {esOral && micStatus === 'unsupported' && (
            <div className="text-xs text-muted" style={{ textAlign: 'center', marginTop: 4 }}>
              La expresión oral por voz requiere Chrome o Edge. En Safari puedes escribir tu respuesta.
            </div>
          )}

        </>
      )}
    </div>
  )
}