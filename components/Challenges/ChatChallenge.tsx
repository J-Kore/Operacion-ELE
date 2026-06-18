'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Subnivel, HabilidadType, MensajeChat, ContenidoAuditivo, PreguntaAuditiva } from '@/lib/types'
import { usePipBoySound } from '@/hooks/usePipBoySound'
import AudioLogPlayer from './AudioLogPlayer'
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
  auditiva: { icon: '🎧', color: 'green',  label: 'COMPRENSIÓN AUDITIVA', canal: 'Audio Log Interceptado',   instruccion: 'Escucha la transmisión interceptada y responde las preguntas de comprensión. Puedes repetir el audio las veces que necesites.' },
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

// ── PreguntasAcordeon ────────────────────────────────────────────────────────
// Subcomponente local: panel de preguntas desplegable.
// Oculto por defecto para minimizar scroll — el estudiante lo abre si quiere
// leer las preguntas antes o durante la escucha.
function PreguntasAcordeon({ preguntas }: { preguntas: PreguntaAuditiva[] }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <div className={styles.preguntasAcordeon}>
      <button
        className={styles.preguntasAcordeonBtn}
        onClick={() => setAbierto(v => !v)}
        aria-expanded={abierto}
      >
        <span>⊞ PREGUNTAS DE COMPRENSIÓN — {preguntas.length} ÍTEMS</span>
        <span className={`${styles.acordeonArrow} ${abierto ? styles.acordeonArrowOpen : ''}`}>
          ▸
        </span>
      </button>
      {abierto && (
        <div className={styles.preguntasBody}>
          <ol className={styles.preguntasList}>
            {preguntas.map(p => (
              <li key={p.id} className={styles.preguntaItem}>
                <span className={styles.preguntaNum}>{p.id}.</span>
                <span className={styles.preguntaTexto}>{p.pregunta}</span>
              </li>
            ))}
          </ol>
          <div className={styles.preguntasHint}>
            Responde todas las preguntas juntas en el terminal de abajo.
          </div>
        </div>
      )}
    </div>
  )
}

// ── InventarioAcordeon ───────────────────────────────────────────────────────
function InventarioAcordeon({ subnivel }: { subnivel: Subnivel }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <div className={styles.preguntasAcordeon}>
      <button
        className={styles.preguntasAcordeonBtn}
        onClick={() => setAbierto(v => !v)}
        aria-expanded={abierto}
      >
        <span>⊞ INVENTARIO LINGÜÍSTICO</span>
        <span className={`${styles.acordeonArrow} ${abierto ? styles.acordeonArrowOpen : ''}`}>▸</span>
      </button>
      {abierto && (
        <div className={styles.preguntasBody}>
          <div className={styles.invGrid}>
            <div>
              <div className={styles.invLabel}>VERBOS CLAVE</div>
              <div className={styles.invList}>
                {subnivel.verbos.slice(0, 6).map(v => <span key={v} className={styles.invTag}>{v}</span>)}
              </div>
            </div>
            <div>
              <div className={styles.invLabel}>VOCABULARIO</div>
              <div className={styles.invList}>
                {subnivel.vocabulario.slice(0, 6).map(v => <span key={v} className={styles.invTag}>{v}</span>)}
              </div>
            </div>
          </div>
          <div className={styles.invProhibido}>⚠ {subnivel.gramaticaProhibida}</div>
        </div>
      )}
    </div>
  )
}

export default function ChatChallenge({ subnivel, habilidad, onExito, primeraMision }: Props) {
  const { play } = usePipBoySound()
  const { data: session } = useSession()
  const userId = session?.user?.id

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

  // ── Estado específico de comprensión auditiva ──
  // El guion va al reproductor; las preguntas se muestran en el Pip-Boy.
  // Las preguntas también viajan al evaluador como contexto de corrección.
  const [guionAudio,   setGuionAudio]   = useState<string>('')
  const [preguntas,    setPreguntas]    = useState<PreguntaAuditiva[]>([])
  // Header del desafío: desplegable, cerrado por defecto para minimizar scroll
  const [headerAbierto, setHeaderAbierto] = useState(false)

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
  const esAuditiva = habilidad === 'auditiva'

  // ── Detectar soporte de Web Speech API al montar ──
  useEffect(() => {
    if (esOral) {
      const SpeechRecognitionAPI =
        typeof window !== 'undefined'
          ? (window.SpeechRecognition || window.webkitSpeechRecognition)
          : null
      if (!SpeechRecognitionAPI) {
        setMicStatus('unsupported')
        // En iOS Safari existe pero falla — forzamos test real
      } else {
        try {
          const test = new SpeechRecognitionAPI()
          test.abort()
        } catch {
          setMicStatus('unsupported')
        }
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
          body: JSON.stringify({ subnivel, habilidad, userId }),
        })
        const data = await res.json()

        if (habilidad === 'auditiva') {
          // La respuesta es un ContenidoAuditivo estructurado.
          // El guionAudio va al reproductor; las preguntas al panel Pip-Boy.
          // El terminal empieza vacío — el estudiante escucha primero.
          const contenido = data as ContenidoAuditivo
          setGuionAudio(contenido.guionAudio ?? '')
          setPreguntas(contenido.preguntas ?? [])
          setMensajes([]) // terminal limpio hasta que el agente responda
        } else {
          // Resto de habilidades: texto plano al terminal como antes
          setMensajes([{ role: 'assistant', content: data.contenido }])
        }
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
    const esIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    recognition.lang = 'es-ES'
    recognition.continuous = esIOS ? false : true
    recognition.interimResults = esIOS ? false : true
    recognition.maxAlternatives = 1
    
    recognition.onstart = () => {
      setMicStatus('recording')
      play('click')
    }

    // onresult se dispara con cada fragmento de texto reconocido
    // Los resultados 'interim' son provisionales, el 'final' es el definitivo
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''
      let interimTranscript = ''
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interimTranscript += result[0].transcript
        }
      }
      setInput(finalTranscript || interimTranscript)
    }

    recognition.onend = () => {
      const esIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
      if (esIOS && micStatus === 'recording') {
        try { recognition.start() } catch { setMicStatus('idle') }
      } else {
        setMicStatus('idle')
        recognitionRef.current = null
        inputRef.current?.focus()
      }
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
          userId,
          // Para auditiva: el evaluador necesita las preguntas y sus respuestas
          // esperadas para verificar que la información es correcta, no solo
          // que la gramática está bien.
          contextAuditivo: habilidad === 'auditiva' && preguntas.length > 0
            ? { preguntas }
            : null,
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
          {/* HEADER DEL DESAFÍO — acordeón desplegable */}
          <div className={styles.headerAcordeon}>
            {/* Barra de título: siempre visible, actúa como toggle */}
            <button
              className={styles.headerToggle}
              onClick={() => setHeaderAbierto(v => !v)}
              aria-expanded={headerAbierto}
            >
              <span className={styles.headerToggleLeft}>
                <span className={styles.headerIcon}>{cfg.icon}</span>
                <span className={styles.headerCanal}>{cfg.canal}</span>
                {completado && <span className={styles.completadoBadge}>✓</span>}
              </span>
              <span className={styles.headerToggleRight}>
                {!completado && (
                  <button
                    className={styles.helpBtn}
                    title="¿Cómo funciona?"
                    onClick={e => { e.stopPropagation(); setShowOnboarding(true) }}
                  >?</button>
                )}
                <span className={`${styles.headerArrow} ${headerAbierto ? styles.headerArrowOpen : ''}`}>▸</span>
              </span>
            </button>
            {/* Cuerpo: tipo y descripción, visibles solo al desplegar */}
            {headerAbierto && (
              <div className={styles.headerBody}>
                <div className={`${styles.headerType} text-xs text-muted`}>{cfg.label}</div>
                <div className={styles.headerDesc}>{subnivel.desafios[habilidad].descripcion}</div>
              </div>
            )}
          </div>

          {/* MENSAJES DE ESTADO (conexión, errores de mic...) */}
          {apiMsg && (
            <div className={styles.hfStatus}>
              <div className={styles.hfStatusDot} />
              {apiMsg}
            </div>
          )}

          {/* REPRODUCTOR DE AUDIO LOG — solo en comprensión auditiva.
              El guion se escucha aquí; el terminal de abajo omite ese primer
              mensaje para no convertir la audición en lectura. */}
          {esAuditiva && guionAudio && (
            <AudioLogPlayer
              texto={guionAudio}
              macro={subnivel.macro}
              onPlayClick={() => play('transmit')}
            />
          )}

          {/* PREGUNTAS DE COMPRENSIÓN — acordeón desplegable, oculto por defecto.
              El estudiante lo abre cuando quiere saber qué se le va a preguntar,
              sin que ocupe espacio si prefiere escuchar primero sin guía. */}
          {esAuditiva && preguntas.length > 0 && (
            <PreguntasAcordeon preguntas={preguntas} />
          )}

          {/* INVENTARIO LINGÜÍSTICO — entre preguntas e input */}
          <InventarioAcordeon subnivel={subnivel} />

          {/* ── ÁREA DE INPUT ──
              Justo debajo del terminal, antes que el feedback Pip-Boy.
              Para habilidad ORAL: micrófono + textarea + botón transmitir.
              Para el resto: solo textarea + botón transmitir.
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

          {/* TERMINAL DE MENSAJES — al fondo */}
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

          {/* FEEDBACK TÉCNICO PIP-BOY — al fondo, después del input.
              Es información de diagnóstico, no de acción: el estudiante
              la consulta tras escribir, no antes. */}
          {feedbackTecnico && (
            <div className={`${styles.pipFeedback} ${capa === 3 ? styles.capa3 : styles.capa2}`}>
              <div className={styles.pipFeedbackTitle}>
                {capa === 3 ? '⚠ PIP-BOY — RECALIBRACIÓN' : '⚠ PIP-BOY — SOPORTE TÉCNICO'}
              </div>
              <pre className={styles.pipFeedbackText}>{feedbackTecnico}</pre>
            </div>
          )}

          {/* INDICADOR DE INTENTO / CAPA — también al fondo, contexto de estado */}
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