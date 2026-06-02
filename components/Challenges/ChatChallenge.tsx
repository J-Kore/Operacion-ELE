'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Subnivel, HabilidadType, MensajeChat } from '@/lib/types'
import { HFStatus } from '@/lib/huggingface'
import { usePipBoySound } from '@/hooks/usePipBoySound'
import styles from './ChatChallenge.module.css'

interface Props {
  subnivel: Subnivel
  habilidad: HabilidadType
  onExito: (xp: number) => void
  primeraMision?: boolean
}

const HABILIDAD_CONFIG = {
  oral:     { icon: '📡', color: 'amber',  label: 'EXPRESIÓN ORAL',      canal: 'Canal de Voz α-7',         instruccion: 'Responde en español al mensaje del NPC. Habla como si fueras un agente secreto.' },
  escrita:  { icon: '⌨️', color: 'cyan',   label: 'EXPRESIÓN ESCRITA',   canal: 'Terminal de Mensajería',   instruccion: 'Escribe tu respuesta en español. Puedes tomarte más tiempo para revisar antes de enviar.' },
  lectora:  { icon: '📄', color: 'purple', label: 'COMPRENSIÓN LECTORA', canal: 'Inventario de Pistas',     instruccion: 'Lee el texto con atención y responde las preguntas de comprensión en español.' },
  auditiva: { icon: '🎧', color: 'green',  label: 'COMPRENSIÓN AUDITIVA', canal: 'Audio Log Interceptado', instruccion: 'Lee la transcripción de radio (con [ESTÁTICA]) e infiere lo que falta. Responde las preguntas.' },
}

const HF_STATUS_MSG: Record<string, string> = {
  cold_start: '⏳ El modelo IA se está iniciando (puede tardar ~30 s la primera vez)...',
  retrying:   '🔄 Reconectando con el servidor...',
  ok:         '',
  error:      '⚠ Error de conexión. Reintentando...',
}

// Confetti Pip-Boy: partículas verdes al completar
function SuccessOverlay({ xp }: { xp: number }) {
  return (
    <div className={styles.successOverlay}>
      <div className={styles.successContent}>
        <div className={styles.successIcon}>✓</div>
        <div className={styles.successTitle}>MISIÓN COMPLETADA</div>
        <div className={styles.successXp}>+{xp} XP</div>
        <div className={styles.successSub}>Siguiente desafío desbloqueado</div>
      </div>
      {/* partículas CSS */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className={styles.particle} style={{ '--i': i } as React.CSSProperties} />
      ))}
    </div>
  )
}

// Tooltip de onboarding para la primera misión
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

export default function ChatChallenge({ subnivel, habilidad, onExito, primeraMision }: Props) {
  const { play } = usePipBoySound()
  const [mensajes, setMensajes]           = useState<MensajeChat[]>([])
  const [input, setInput]                 = useState('')
  const [cargando, setCargando]           = useState(false)
  const [hfStatus, setHfStatus]           = useState<HFStatus>('idle')
  const [hfMsg, setHfMsg]                 = useState('')
  const [intento, setIntento]             = useState(1)
  const [completado, setCompletado]       = useState(false)
  const [xpGanado, setXpGanado]           = useState(0)
  const [mostrarExito, setMostrarExito]   = useState(false)
  const [feedbackTecnico, setFeedbackTecnico] = useState<string | null>(null)
  const [capa, setCapa]                   = useState<1|2|3>(1)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLTextAreaElement>(null)
  const cfg = HABILIDAD_CONFIG[habilidad]

  // Mostrar onboarding en primera misión (guardado en localStorage para no repetir)
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

  const onStatus = useCallback((s: HFStatus, msg?: string) => {
    setHfStatus(s)
    setHfMsg(msg ?? HF_STATUS_MSG[s] ?? '')
  }, [])

  // Cargar contenido inicial
  useEffect(() => {
    if (showOnboarding) return
    async function init() {
      setCargando(true)
      setHfStatus('idle')
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
          content: `[SEÑAL ESTABLECIDA — ${cfg.canal}] Agente, ¿listo para comenzar?`,
        }])
      } finally {
        setCargando(false)
        setHfMsg('')
      }
    }
    init()
  }, [subnivel.id, habilidad, showOnboarding])

  // Auto-scroll
  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight
  }, [mensajes, cargando])

  async function enviarMensaje() {
    if (!input.trim() || cargando || completado) return
    const userMsg = input.trim()
    play('transmit')
    setInput('')
    setCargando(true)
    setFeedbackTecnico(null)
    setHfMsg('')

    const newMensajes: MensajeChat[] = [...mensajes, { role: 'user', content: userMsg }]
    setMensajes(newMensajes)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subnivel, habilidad, historial: mensajes, mensaje: userMsg, intento }),
      })
      const data = await res.json()

      setMensajes([...newMensajes, { role: 'assistant', content: data.feedbackNarrativo }])
      setCapa(data.capa)
      if (data.feedbackTecnico) { play('error'); setFeedbackTecnico(data.feedbackTecnico) }
      if (data.miniEjercicio)   setFeedbackTecnico(p => `${p ?? ''}\n\n📋 MINI-EJERCICIO: ${data.miniEjercicio}`)

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
      setMensajes(prev => [...prev, { role: 'assistant', content: '[INTERFERENCIA] La señal se ha cortado. Reintentando...' }])
    } finally {
      setCargando(false)
      setHfMsg('')
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensaje() }
  }

  return (
    <div className={styles.wrapper}>

      {/* ONBOARDING — primera misión */}
      {showOnboarding && (
        <OnboardingTooltip habilidad={habilidad} onClose={cerrarOnboarding} />
      )}

      {/* SUCCESS OVERLAY */}
      {mostrarExito && <SuccessOverlay xp={xpGanado} />}

      {/* HEADER */}
      {!showOnboarding && (
        <>
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

          {/* ESTADO HF (cold start / retrying) */}
          {hfMsg && (
            <div className={styles.hfStatus}>
              <div className={styles.hfStatusDot} />
              {hfMsg}
            </div>
          )}

          {/* TERMINAL */}
          <div className={`terminal ${styles.terminal}`} ref={terminalRef}>
            {mensajes.map((m, i) => (
              <div key={i} className={`${styles.mensaje} ${m.role === 'user' ? styles.user : styles.npc}`}>
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

          {/* INDICADOR DE CAPA */}
          {intento > 1 && !completado && (
            <div className={styles.intentoIndicador}>
              <span className="text-muted text-xs">
                INTENTO {intento} — CAPA {capa}: {capa === 1 ? 'INMERSIÓN' : capa === 2 ? 'SOPORTE PIP-BOY' : 'RECALIBRACIÓN'}
              </span>
              <div className={styles.intentoDots}>
                {[1,2,3].map(n => (
                  <div key={n} className={`${styles.intentoDot} ${intento >= n ? styles.intentoDotActive : ''} ${capa === n ? styles.intentoDotCurrent : ''}`} />
                ))}
              </div>
            </div>
          )}

          {/* INPUT / COMPLETADO */}
          {!completado ? (
            <div className={styles.inputArea}>
              <textarea
                ref={inputRef}
                className={styles.input}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Escribe tu respuesta, agente... (Enter para enviar, Shift+Enter nueva línea)"
                rows={3}
                disabled={cargando}
              />
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
              <span className="text-amber orbitron" style={{ fontSize: '0.75rem', letterSpacing: '0.2em' }}>
                ✓ DESAFÍO SUPERADO — +{xpGanado} XP
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
