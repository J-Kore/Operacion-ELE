'use client'
import { useState, useEffect } from 'react'
import PipBoyLayout from '@/components/PipBoy/PipBoyLayout'
import { Subnivel, MacroNivel, EstadoNivel, ProgresoJugador } from '@/lib/types'
import { cargarProgreso, calcularEstadoNivel } from '@/lib/gameState'
import nivelesData from '@/data/niveles.json'
import { usePipBoySound } from '@/hooks/usePipBoySound'
import styles from './page.module.css'
import Link from 'next/link'

export default function MapaPage() {
  const [progreso, setProgreso] = useState<ProgresoJugador | null>(null)
  const { play } = usePipBoySound()
  const [seleccionado, setSeleccionado] = useState<Subnivel | null>(null)

  useEffect(() => {
    setProgreso(cargarProgreso())
  }, [])

  const macros = nivelesData.macroNiveles as MacroNivel[]
  const subniveles = nivelesData.subniveles as Subnivel[]

  function getSubnivel(id: string): Subnivel | undefined {
    return subniveles.find(s => s.id === id)
  }

  function getEstado(id: string): EstadoNivel {
    if (!progreso) return 'locked'
    return calcularEstadoNivel(id, progreso)
  }

  function getDesafiosCompletados(id: string): string[] {
    return progreso?.desafiosCompletados[id] ?? []
  }

  return (
    <PipBoyLayout>
      <div className={styles.page}>
        {/* HEADER */}
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Mapa de Operaciones</div>
          <div className={styles.badge}>25 NIVELES</div>
        </div>

        {/* ALERTA NIVEL ACTUAL */}
        {progreso && (
          <div className="alert-box" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="radar-dot" />
            <div>
              <strong>NIVEL ACTIVO: {progreso.nivelActual}</strong>
              {' — '}
              {getSubnivel(progreso.nivelActual)?.nombre}
              <div style={{ fontSize: '0.55rem', marginTop: 2, color: 'rgba(255,184,48,0.7)' }}>
                Completa los 4 desafíos para avanzar al siguiente nivel
              </div>
            </div>
          </div>
        )}

        {/* MACRO-NIVELES */}
        {macros.map(macro => (
          <div key={macro.id} className={styles.macroBlock}>
            <div className={styles.macroHeader}>
              <span className={styles.macroId}>{macro.id}</span>
              <span className={styles.macroNombre}>{macro.nombre}</span>
              <span className={styles.macroCount}>{macro.subniveles.length} NIVELES</span>
            </div>
            <div className={styles.macroDesc}>{macro.objetivo}</div>

            <div className={styles.nodoGrid}>
              {macro.subniveles.map(snId => {
                const sn = getSubnivel(snId)
                if (!sn) return null
                const estado = getEstado(snId)
                const completados = getDesafiosCompletados(snId)
                const isSelected = seleccionado?.id === snId

                return (
                  <div
                    key={snId}
                    className={`${styles.nodo} ${styles[estado]} ${isSelected ? styles.nodoSelected : ''}`}
                    onClick={() => {
                      if (estado !== 'locked') {
                        play('click')
                        setSeleccionado(isSelected ? null : sn)
                      }
                    }}
                  >
                    <div className={styles.nodoId}>{sn.id}</div>
                    <div className={styles.nodoNombre}>{sn.nombre}</div>
                    {/* Indicadores de desafíos completados */}
                    <div className={styles.nodoDesafios}>
                      {['oral','escrita','lectora','auditiva'].map((h) => (
                        <div
                          key={h}
                          className={`${styles.desafioDot} ${completados.includes(h) ? styles.desafioDotOk : ''}`}
                          title={h}
                        />
                      ))}
                    </div>
                    {estado === 'completed' && <div className={styles.checkmark}>✓</div>}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* PANEL DETALLE */}
        {seleccionado && (
          <div className={`${styles.detalle} pip-panel fade-in`}>
            <div className={styles.detalleTop}>
              <div className={styles.detalleHex}>
                <div className={styles.detalleHexInner}>
                  <div className={styles.detalleId}>{seleccionado.id}</div>
                  <div className={styles.detalleIdSub}>NIVEL</div>
                </div>
              </div>
              <div className={styles.detalleInfo}>
                <div className={styles.detalleNombre}>{seleccionado.nombre}</div>
                <div className={styles.detalleDesc}>{seleccionado.descripcionNarrativa}</div>
                <div className={styles.detalleMeta}>
                  META: {seleccionado.metaComunicativa}
                </div>
              </div>
              <button className={styles.closeBtn} onClick={() => setSeleccionado(null)}>✕</button>
            </div>

            {/* 4 Desafíos */}
            <div className="panel-title" style={{ marginTop: 14, marginBottom: 10 }}>
              DESAFÍOS DEL NIVEL — 4 HABILIDADES
            </div>
            <div className={styles.desafiosGrid}>
              {(Object.entries(seleccionado.desafios) as [string, any][]).map(([key, desafio]) => {
                const completados = getDesafiosCompletados(seleccionado.id)
                const hecho = completados.includes(key)
                return (
                  <Link
                    key={key}
                    href={`/mision/${seleccionado.id}/${key}`}
                    className={`${styles.desafioCard} ${styles[`desafio_${key}`]} ${hecho ? styles.desafioHecho : ''}`}
                  >
                    <div className={styles.desafioIcon}>
                      {key === 'oral' ? '📡' : key === 'escrita' ? '⌨️' : key === 'lectora' ? '📄' : '🎧'}
                    </div>
                    <div className={styles.desafioTipo}>{desafio.tipo}</div>
                    <div className={styles.desafioNombre}>{desafio.nombre}</div>
                    <div className={styles.desafioDesc}>{desafio.descripcion}</div>
                    {hecho && <div className={styles.desafioCheck}>✓ COMPLETADO</div>}
                  </Link>
                )
              })}
            </div>

            <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link
                href={`/mision/${seleccionado.id}/oral`}
                className="pip-btn amber"
                style={{ fontSize: '0.6rem' }}
              >
                ▸ INICIAR PRIMERA MISIÓN
              </Link>
            </div>
          </div>
        )}
      </div>
    </PipBoyLayout>
  )
}
