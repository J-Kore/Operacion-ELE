'use client'
import { useEffect, useState } from 'react'
import PipBoyLayout from '@/components/PipBoy/PipBoyLayout'
import { ProgresoJugador } from '@/lib/types'
import { cargarProgreso } from '@/lib/gameState'
import nivelesData from '@/data/niveles.json'
import Link from 'next/link'
import styles from './page.module.css'

type FiltroTipo = 'todos' | 'documentos' | 'audiologs' | 'fichas'

const FILTROS: { id: FiltroTipo; icon: string; label: string }[] = [
  { id: 'todos',      icon: '◈', label: 'Todos'  },
  { id: 'documentos', icon: '📋', label: 'Docs'   },
  { id: 'audiologs',  icon: '🎧', label: 'Audio'  },
  { id: 'fichas',     icon: '🗂️', label: 'Fichas' },
]

export default function InventarioPage() {
  const [progreso,     setProgreso]     = useState<ProgresoJugador | null>(null)
  const [filtro,       setFiltro]       = useState<FiltroTipo>('todos')
  const [seleccionado, setSeleccionado] = useState<string | null>(null)

  useEffect(() => { setProgreso(cargarProgreso()) }, [])

  const nivelesDesbloqueados = nivelesData.subniveles.filter(sn => {
    if (!progreso) return sn.id === 'A1.1'
    return progreso.nivelesCompletados.includes(sn.id) || progreso.nivelActual === sn.id
  })

  const items = nivelesDesbloqueados.flatMap(sn => [
    {
      id: `${sn.id}-lectora`,
      tipo: 'documentos' as FiltroTipo,
      icon: '📋',
      nombre: `Diario — ${sn.nombre}`,
      desc: sn.desafios.lectora.descripcion,
      subnivel: sn.id,
      habilidad: 'lectora',
      completado: progreso?.desafiosCompletados[sn.id]?.includes('lectora') ?? false,
      contenido: `FOCO: ${sn.morfosintaxis}\n\nVERBOS: ${sn.verbos.join(', ')}\n\nVOCABULARIO: ${sn.vocabulario.join(', ')}\n\nERRORES CRÍTICOS:\n${sn.erroresCriticos.map((e, idx) => `${idx + 1}. ${e}`).join('\n')}`,
    },
    {
      id: `${sn.id}-auditiva`,
      tipo: 'audiologs' as FiltroTipo,
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
      tipo: 'fichas' as FiltroTipo,
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
    todos:      items.length,
    documentos: items.filter(i => i.tipo === 'documentos').length,
    audiologs:  items.filter(i => i.tipo === 'audiologs').length,
    fichas:     items.filter(i => i.tipo === 'fichas').length,
  }

  const completados = {
    documentos: items.filter(i => i.tipo === 'documentos' && i.completado).length,
    audiologs:  items.filter(i => i.tipo === 'audiologs'  && i.completado).length,
    fichas:     items.filter(i => i.tipo === 'fichas'     && i.completado).length,
    total:      items.filter(i => i.completado).length,
  }

  return (
    <PipBoyLayout>
      <div className={styles.page}>

        {/* HEADER */}
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Inventario de Pistas</div>
          <div className={styles.badge}>{items.length} OBJETOS</div>
        </div>

        {/* TABS DE FILTRO — ahora son la paginación principal */}
        <div className={styles.subNav}>
          {FILTROS.map(f => (
            <button
              key={f.id}
              className={`${styles.subNavBtn} ${filtro === f.id ? styles.subNavBtnActive : ''}`}
              onClick={() => { setFiltro(f.id); setSeleccionado(null) }}
            >
              <span className={styles.subNavIcon}>{f.icon}</span>
              <span className={styles.subNavLabel}>{f.label}</span>
              <span className={styles.subNavCount}>{contadores[f.id]}</span>
            </button>
          ))}
        </div>

        {/* LISTA DE ITEMS */}
        <div className={`${styles.lista} pip-panel`} key={filtro}>
          {itemsFiltrados.length === 0 ? (
            <div className="text-muted text-xs" style={{ padding: '16px 0', textAlign: 'center' }}>
              Sin objetos en esta categoría.
            </div>
          ) : (
            itemsFiltrados.map(item => (
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
            ))
          )}
        </div>

        {/* PANEL DETALLE — aparece debajo al seleccionar un item */}
        {selItem && (
          <div className={`pip-panel ${styles.detalle} fade-in`}>
            <div className={styles.detalleHeader}>
              <span style={{ fontSize: '1.5rem' }}>{selItem.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
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
                    <Link href={`/mision/${selItem.subnivel}/${selItem.habilidad}`} className="pip-btn amber">
                      ▸ REINTENTAR MISIÓN
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.bloqueadoMsg}>
                <span style={{ fontSize: '1.5rem' }}>🔒</span>
                <div>
                  <div className={styles.detalleNombre} style={{ marginBottom: 6 }}>OBJETO CLASIFICADO</div>
                  <div className="text-muted text-xs" style={{ marginBottom: 10 }}>
                    Completa el nivel {selItem.subnivel} para desbloquear.
                  </div>
                  <Link href={`/mision/${selItem.subnivel}/oral`} className="pip-btn">
                    ▸ IR A LA MISIÓN
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ESTADÍSTICAS — siempre visibles al fondo */}
        <div className={styles.statsGrid}>
          {[
            { label: 'DOCUMENTOS', val: `${completados.documentos}/${contadores.documentos}` },
            { label: 'AUDIO LOGS', val: `${completados.audiologs}/${contadores.audiologs}`   },
            { label: 'FICHAS',     val: `${completados.fichas}/${contadores.fichas}`         },
            { label: 'TOTAL',      val: `${completados.total}/${items.length}`,  amber: true },
          ].map(s => (
            <div key={s.label} className={`${styles.statBox} ${(s as any).amber ? styles.statBoxAmber : ''}`}>
              <div className="text-xs text-muted">{s.label}</div>
              <div className={`${styles.statNum} ${(s as any).amber ? 'text-amber' : ''}`}>{s.val}</div>
            </div>
          ))}
        </div>

      </div>
    </PipBoyLayout>
  )
}
