'use client'
import { useEffect, useState } from 'react'
import PipBoyLayout from '@/components/PipBoy/PipBoyLayout'
import { ProgresoJugador } from '@/lib/types'
import { cargarProgreso } from '@/lib/gameState'
import nivelesData from '@/data/niveles.json'
import Link from 'next/link'
import styles from './page.module.css'

type FiltroTipo = 'todos' | 'documentos' | 'audiologs' | 'fichas'

export default function InventarioPage() {
  const [progreso, setProgreso] = useState<ProgresoJugador | null>(null)
  const [filtro, setFiltro] = useState<FiltroTipo>('todos')
  const [seleccionado, setSeleccionado] = useState<string | null>(null)

  useEffect(() => {
    setProgreso(cargarProgreso())
  }, [])

  const nivelesDesbloqueados = nivelesData.subniveles.filter(sn => {
    if (!progreso) return sn.id === 'A1.1'
    return (
      progreso.nivelesCompletados.includes(sn.id) ||
      progreso.nivelActual === sn.id
    )
  })

  const items = nivelesDesbloqueados.flatMap(sn => [
    {
      id: `${sn.id}-lectora`,
      tipo: 'documentos',
      icon: '📋',
      nombre: `Diario — ${sn.nombre}`,
      desc: sn.desafios.lectora.descripcion,
      subnivel: sn.id,
      habilidad: 'lectora',
      completado: progreso?.desafiosCompletados[sn.id]?.includes('lectora') ?? false,
      contenido: `FOCO: ${sn.morfosintaxis}\n\nVERBOS: ${sn.verbos.join(', ')}\n\nVOCABULARIO: ${sn.vocabulario.join(', ')}\n\nERRORES CRÍTICOS:\n${sn.erroresCriticos.map((e,idx)=>`${idx+1}. ${e}`).join('\n')}`,
    },
    {
      id: `${sn.id}-auditiva`,
      tipo: 'audiologs',
      icon: '🎧',
      nombre: `Audio Log — ${sn.id}`,
      desc: sn.desafios.auditiva.descripcion,
      subnivel: sn.id,
      habilidad: 'auditiva',
      completado: progreso?.desafiosCompletados[sn.id]?.includes('auditiva') ?? false,
      contenido: sn.desafios.auditiva.descripcion,
    },
    {
      id: `${sn.id}-ficha`,
      tipo: 'fichas',
      icon: '🗂️',
      nombre: `Ficha Gramatical — ${sn.id}`,
      desc: sn.metaComunicativa,
      subnivel: sn.id,
      habilidad: null,
      completado: progreso?.nivelesCompletados.includes(sn.id) ?? false,
      contenido: `META: ${sn.metaComunicativa}\n\nMORFOSINTAXIS:\n${sn.morfosintaxis}\n\nFEEDBACK PIP-BOY:\n${sn.feedbackPipboy}\n\nGRAMÁTICA PROHIBIDA: ${sn.gramaticaProhibida}`,
    },
  ])

  const itemsFiltrados = filtro === 'todos' ? items : items.filter(i => i.tipo === filtro)
  const selItem = items.find(i => i.id === seleccionado)

  const contadores = {
    todos: items.length,
    documentos: items.filter(i => i.tipo === 'documentos').length,
    audiologs: items.filter(i => i.tipo === 'audiologs').length,
    fichas: items.filter(i => i.tipo === 'fichas').length,
  }

  return (
    <PipBoyLayout>
      <div className={styles.page}>

        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Inventario de Pistas</div>
          <div className={styles.badge}>{items.length} OBJETOS</div>
        </div>

        {/* FILTROS */}
        <div className={styles.filtros}>
          {(['todos','documentos','audiologs','fichas'] as FiltroTipo[]).map(f => (
            <button
              key={f}
              className={`${styles.filtroBtn} ${filtro === f ? styles.filtroBtnActive : ''}`}
              onClick={() => setFiltro(f)}
            >
              {f === 'todos' ? '◈ TODOS' : f === 'documentos' ? '📋 DOCS' : f === 'audiologs' ? '🎧 AUDIO' : '🗂️ FICHAS'}
              <span className={styles.filtroCount}>{contadores[f]}</span>
            </button>
          ))}
        </div>

        <div className={styles.layout}>
          {/* LISTA */}
          <div className={styles.lista}>
            {itemsFiltrados.map(item => (
              <div
                key={item.id}
                className={`${styles.item} ${!item.completado ? styles.itemBloqueado : ''} ${seleccionado === item.id ? styles.itemSelected : ''}`}
                onClick={() => setSeleccionado(seleccionado === item.id ? null : item.id)}
              >
                <div className={styles.itemIcon}>{item.icon}</div>
                <div className={styles.itemInfo}>
                  <div className={styles.itemNombre}>{item.nombre}</div>
                  <div className={styles.itemDesc}>{item.desc}</div>
                </div>
                <div className={styles.itemBadge}>
                  {item.completado
                    ? <span className={styles.badgeOk}>✓</span>
                    : <span className={styles.badgeLocked}>🔒</span>
                  }
                </div>
              </div>
            ))}
            {itemsFiltrados.length === 0 && (
              <div className="text-muted text-xs" style={{ padding: '12px 0' }}>
                Sin objetos en esta categoría.
              </div>
            )}
          </div>

          {/* DETALLE */}
          {selItem && (
            <div className={`pip-panel ${styles.detalle} fade-in`}>
              <div className={styles.detalleHeader}>
                <span style={{ fontSize: '1.5rem' }}>{selItem.icon}</span>
                <div>
                  <div className={styles.detalleNombre}>{selItem.nombre}</div>
                  <div className="text-xs text-muted">{selItem.subnivel} — {selItem.tipo.toUpperCase()}</div>
                </div>
                <button className={styles.closeBtn} onClick={() => setSeleccionado(null)}>✕</button>
              </div>

              {selItem.completado ? (
                <>
                  <div className={styles.detalleContenido}>
                    <pre className={styles.preContent}>{selItem.contenido}</pre>
                  </div>
                  {selItem.habilidad && (
                    <div style={{ marginTop: 12 }}>
                      <Link
                        href={`/mision/${selItem.subnivel}/${selItem.habilidad}`}
                        className="pip-btn amber"
                        style={{ fontSize: '0.6rem' }}
                      >
                        ▸ REINTENTAR MISIÓN
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.bloqueadoMsg}>
                  <span>🔒</span>
                  <div>
                    <div style={{ fontSize: '0.65rem', marginBottom: 4 }}>OBJETO CLASIFICADO</div>
                    <div className="text-muted text-xs">
                      Completa el nivel {selItem.subnivel} para desbloquear este objeto.
                    </div>
                    <Link
                      href={`/mision/${selItem.subnivel}/oral`}
                      className="pip-btn"
                      style={{ fontSize: '0.55rem', marginTop: 10, display: 'inline-flex' }}
                    >
                      ▸ IR A LA MISIÓN
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ESTADÍSTICAS RÁPIDAS */}
        <div className="grid-4">
          <div className={styles.statBox}>
            <div className="text-xs text-muted">DOCUMENTOS</div>
            <div className={styles.statNum}>{items.filter(i=>i.tipo==='documentos'&&i.completado).length}/{contadores.documentos}</div>
          </div>
          <div className={styles.statBox}>
            <div className="text-xs text-muted">AUDIO LOGS</div>
            <div className={styles.statNum}>{items.filter(i=>i.tipo==='audiologs'&&i.completado).length}/{contadores.audiologs}</div>
          </div>
          <div className={styles.statBox}>
            <div className="text-xs text-muted">FICHAS</div>
            <div className={styles.statNum}>{items.filter(i=>i.tipo==='fichas'&&i.completado).length}/{contadores.fichas}</div>
          </div>
          <div className={styles.statBox} style={{ borderColor: 'var(--amber)' }}>
            <div className="text-xs text-muted">TOTAL</div>
            <div className={`${styles.statNum} text-amber`}>{items.filter(i=>i.completado).length}/{items.length}</div>
          </div>
        </div>

      </div>
    </PipBoyLayout>
  )
}
