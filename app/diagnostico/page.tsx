'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PipBoyLayout from '@/components/PipBoy/PipBoyLayout'
import { cargarProgreso, guardarProgreso, ORDEN_NIVELES } from '@/lib/gameState'
import { usePipBoySound } from '@/hooks/usePipBoySound'
import styles from './page.module.css'

const NIVELES_OPCIONES = [
  { id: 'A1.1', label: 'A1 — Principiante absoluto',   desc: 'No conozco nada de español o muy poco.' },
  { id: 'A1.3', label: 'A1 — Básico inicial',          desc: 'Sé saludar, presentarme y describir objetos.' },
  { id: 'A2.1', label: 'A2 — Básico consolidado',      desc: 'Puedo hablar de rutinas, planes y dar órdenes sencillas.' },
  { id: 'A2.3', label: 'A2 — Pre-intermedio',          desc: 'Cuento cosas del pasado y describo situaciones.' },
  { id: 'B1.1', label: 'B1 — Intermedio',              desc: 'Expreso deseos, emociones e hipótesis básicas.' },
  { id: 'B1.5', label: 'B1 — Intermedio alto',         desc: 'Debato, doy consejos y narro con todos los pasados.' },
  { id: 'B2.1', label: 'B2 — Avanzado',                desc: 'Manejo el subjuntivo y estructuras complejas.' },
]

const PREGUNTAS = [
  {
    pregunta: '¿Cuánto tiempo llevas estudiando español?',
    opciones: [
      { texto: 'Nunca he estudiado',  pts: 0 },
      { texto: 'Menos de 6 meses',    pts: 1 },
      { texto: '6 meses – 1 año',     pts: 2 },
      { texto: '1 – 3 años',          pts: 3 },
      { texto: 'Más de 3 años',       pts: 4 },
    ],
  },
  {
    pregunta: 'Completa: "Ayer yo ______ al mercado y ______ mucha fruta."',
    opciones: [
      { texto: 'voy / compraba',   pts: 0 },
      { texto: 'fui / compré',     pts: 3 },
      { texto: 'iba / compré',     pts: 2 },
      { texto: 'fui / compraba',   pts: 2 },
    ],
  },
  {
    pregunta: '¿Cuál es la oración correcta?',
    opciones: [
      { texto: 'Espero que vengas mañana.',       pts: 4 },
      { texto: 'Espero que vienes mañana.',       pts: 1 },
      { texto: 'Espero que vendrás mañana.',      pts: 2 },
      { texto: 'Espero que tú vengas ayer.',      pts: 1 },
    ],
  },
  {
    pregunta: '"Si tuviera más dinero, ______ un coche nuevo." ¿Qué va en el hueco?',
    opciones: [
      { texto: 'compro',      pts: 1 },
      { texto: 'compraría',   pts: 4 },
      { texto: 'compré',      pts: 0 },
      { texto: 'compraba',    pts: 2 },
    ],
  },
]

function nivelDesdePuntos(pts: number): string {
  if (pts >= 14) return 'B2.1'
  if (pts >= 11) return 'B1.5'
  if (pts >= 8)  return 'B1.1'
  if (pts >= 6)  return 'A2.3'
  if (pts >= 4)  return 'A2.1'
  if (pts >= 2)  return 'A1.3'
  return 'A1.1'
}

export default function DiagnosticoPage() {
  const router      = useRouter()
  const { play }    = usePipBoySound()
  const [fase,        setFase]        = useState<'intro' | 'test' | 'manual'>('intro')
  const [preguntaIdx, setPreguntaIdx] = useState(0)
  const [puntos,      setPuntos]      = useState(0)
  const [nivelManual, setNivelManual] = useState('A1.1')

  function aplicarNivel(nivelId: string) {
    play('success')
    const progreso   = cargarProgreso()
    const idx        = ORDEN_NIVELES.indexOf(nivelId)
    const completados = ORDEN_NIVELES.slice(0, idx)
    guardarProgreso({ ...progreso, nivelActual: nivelId, nivelesCompletados: completados })
    router.push(`/mision/${nivelId}/oral`)
  }

  function responder(pts: number) {
    play('click')
    const total = puntos + pts
    if (preguntaIdx < PREGUNTAS.length - 1) {
      setPuntos(total)
      setPreguntaIdx(i => i + 1)
    } else {
      aplicarNivel(nivelDesdePuntos(total))
    }
  }

  const preguntaActual = PREGUNTAS[preguntaIdx]

  return (
    <PipBoyLayout>
      <div className={styles.page}>

        {/* INTRO */}
        {fase === 'intro' && (
          <div className={styles.card}>
            <div className={styles.bigIcon}>🕵️</div>
            <div className={styles.titulo}>Test de Clasificación</div>
            <div className={styles.subtitulo}>
              Antes de comenzar la operación, necesitamos evaluar tus capacidades
              lingüísticas para asignarte el nivel correcto.
            </div>
            <div className={styles.opciones}>
              <button className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => { play('click'); setFase('test') }}>
                ▸ Hacer el test rápido (4 preguntas)
              </button>
              <button className={styles.btn}
                onClick={() => { play('click'); setFase('manual') }}>
                ◈ Seleccionar nivel manualmente
              </button>
              <button className={styles.btn}
                onClick={() => aplicarNivel('A1.1')}>
                + Empezar desde cero (A1.1)
              </button>
            </div>
          </div>
        )}

        {/* TEST */}
        {fase === 'test' && (
          <div className={styles.card}>
            <div className={styles.progBar}>
              <div className={styles.progFill}
                style={{ width: `${(preguntaIdx / PREGUNTAS.length) * 100}%` }} />
            </div>
            <div className={styles.progLabel}>
              PREGUNTA {preguntaIdx + 1} / {PREGUNTAS.length}
            </div>
            <div className={styles.pregunta}>{preguntaActual.pregunta}</div>
            <div className={styles.respuestas}>
              {preguntaActual.opciones.map((op, i) => (
                <button key={i} className={styles.respuestaBtn} onClick={() => responder(op.pts)}>
                  {op.texto}
                </button>
              ))}
            </div>
            <button className={styles.btnSmall}
              onClick={() => { play('click'); setFase('intro') }}>
              ← Volver
            </button>
          </div>
        )}

        {/* MANUAL */}
        {fase === 'manual' && (
          <div className={styles.card}>
            <div className={styles.titulo}>Selecciona tu nivel</div>
            <div className={styles.nivelesLista}>
              {NIVELES_OPCIONES.map(n => (
                <div
                  key={n.id}
                  className={`${styles.nivelOpcion} ${nivelManual === n.id ? styles.nivelOpcionActivo : ''}`}
                  onClick={() => { play('click'); setNivelManual(n.id) }}
                >
                  <div className={styles.nivelId}>{n.id}</div>
                  <div>
                    <div className={styles.nivelLabel}>{n.label}</div>
                    <div className={styles.nivelDesc}>{n.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.botones}>
              <button className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => aplicarNivel(nivelManual)}>
                ▸ Comenzar en {nivelManual}
              </button>
              <button className={styles.btn}
                onClick={() => { play('click'); setFase('intro') }}>
                ← Volver
              </button>
            </div>
          </div>
        )}

      </div>
    </PipBoyLayout>
  )
}
