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

  // ── NUEVO: tab activo del macronivel (A1, A2, B1, B2)
  // Al cargar, arrancamos en el macronivel del nivel actual del jugador
  const [macroActivo, setMacroActivo] = useState<string>('A1')

  useEffect(() => {
    const p = cargarProgreso()
    setProgreso(p)
    // Detectar en qué macronivel está el jugador y abrir ese tab automáticamente
    // Ej: "B1.3" → macronivel "B1"
    if (p?.nivelActual) {
      const macro = p.nivelActual.replace(/\.\d+$/, '') // "A1.2" → "A1"
      setMacroActivo(macro)
    }
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

  // ── Calcular progreso de un macronivel para mostrar en el tab ──
  // Devuelve { completados, total } para el indicador "2/4"
  function getProgresoMacro(macro: MacroNivel): { completados: number; total: number } {
    const total = macro.subniveles.length
    const completados = macro.subniveles.filter(snId => getEstado(snId) === 'completed').length
    return { completados, total }
  }

  // ── Macronivel activo (datos completos) ──
  const macroSeleccionado = macros.find(m => m.id === macroActivo)

  // Cuando cambia el macronivel, cerramos el panel de detalle
  function cambiarMacro(id: string) {
    play('click')
    setMacroActivo(id)
    setSeleccionado(null)
  }

  return (
    <PipBoyLayout>
      <div className={styles.page}>

        {/* ── HEADER ── */}
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Mapa de Operaciones</div>
          <div className={styles.badge}>25 NIVELES</div>
        </div>

        {/* ── ALERTA NIVEL ACTUAL ── */}
        {progreso && (
          <div className="alert-box" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="radar-dot" />
            <div>
              <strong>NIVEL ACTIVO: {progreso.nivelActual}</strong>
              {' — '}
              {getSubnivel(progreso.nivelActual)?.nombre}
              <div style={{ fontSize: 'var(--text-xs)', marginTop: 3, color: 'rgba(255,184,48,0.75)' }}>
                Completa los 4 desafíos para avanzar al siguiente nivel
              </div>
            </div>
          </div>
        )}

        {/* ── TABS DE MACRONIVEL ──
            Esta es la pieza clave de la paginación.
            En vez de mostrar los 25 nodos de golpe, el usuario
            navega entre los 4 macroniveles. Cada tab muestra:
            - ID del macronivel (A1, A2, B1, B2)
            - Nombre corto
            - Progreso: cuántos subniveles completados
        ── */}
        <div className={styles.macroTabs} role="tablist">
          {macros.map(macro => {
            const prog = getProgresoMacro(macro)
            const esActivo = macro.id === macroActivo
            // El nombre corto: tomamos la primera palabra del nombre del macro
            // Ej: "El Recluta" → "Recluta"
            const nombreCorto = macro.nombre.split(' ').slice(-1)[0] ?? macro.nombre

            return (
              <button
                key={macro.id}
                role="tab"
                aria-selected={esActivo}
                className={`${styles.macroTab} ${esActivo ? styles.macroTabActive : ''}`}
                onClick={() => cambiarMacro(macro.id)}
              >
                <span className={styles.macroTabId}>{macro.id}</span>
                <span className={styles.macroTabName}>{nombreCorto}</span>
                {/* Indicador de progreso */}
                <span className={styles.macroTabProgress}>
                  {prog.completados}/{prog.total}
                </span>
              </button>
            )
          })}
        </div>

        {/* ── CONTENIDO DEL MACRONIVEL ACTIVO ──
            Solo se renderizan los subniveles del macronivel seleccionado,
            no los 25 de golpe. Esto reduce drásticamente la densidad.
        ── */}
        {macroSeleccionado && (
          <div
            className={styles.macroBlock}
            role="tabpanel"
            /* key fuerza la animación fadeInUp al cambiar de macro */
            key={macroSeleccionado.id}
          >
            <div className={styles.macroHeader}>
              <span className={styles.macroId}>{macroSeleccionado.id}</span>
              <span className={styles.macroNombre}>{macroSeleccionado.nombre}</span>
              <span className={styles.macroCount}>{macroSeleccionado.subniveles.length} NIVELES</span>
            </div>
            <div className={styles.macroDesc}>{macroSeleccionado.objetivo}</div>

            {/* NODOS del macronivel activo */}
            <div className={styles.nodoGrid}>
              {macroSeleccionado.subniveles.map(snId => {
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
                    role={estado !== 'locked' ? 'button' : undefined}
                    aria-disabled={estado === 'locked'}
                    aria-pressed={isSelected}
                  >
                    <div className={styles.nodoId}>{sn.id}</div>
                    <div className={styles.nodoNombre}>{sn.nombre}</div>
                    {/* Dots: uno por cada destreza. Visual, no texto */}
                    <div className={styles.nodoDesafios} aria-label={`${completados.length} de 4 desafíos completados`}>
                      {['oral', 'escrita', 'lectora', 'auditiva'].map(h => (
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
        )}

        {/* ── PANEL DETALLE ──
            Se muestra debajo del bloque del macronivel
            cuando el usuario toca un nodo desbloqueado
        ── */}
        {seleccionado && (
          <div className={`${styles.detalle} pip-panel fade-in`}>
            <div className={styles.detalleTop}>
              {/* Hex decorativo con el ID del nivel */}
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

              <button
                className={styles.closeBtn}
                onClick={() => setSeleccionado(null)}
                aria-label="Cerrar panel de detalle"
              >
                ✕ CERRAR
              </button>
            </div>

            {/* 4 Desafíos */}
            <div className="panel-title" style={{ marginTop: 16, marginBottom: 12 }}>
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

            {/* CTA: iniciar primera misión del nivel */}
            <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link
                href={`/mision/${seleccionado.id}/oral`}
                className="pip-btn amber"
              >
                ▸ INICIAR PRIMERA MISIÓN
              </Link>
              <button
                className="pip-btn"
                onClick={() => setSeleccionado(null)}
              >
                ✕ CERRAR
              </button>
            </div>
          </div>
        )}

      </div>
    </PipBoyLayout>
  )
}
