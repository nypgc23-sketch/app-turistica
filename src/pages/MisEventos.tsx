import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Trash2, Eye, Calendar, MapPin, Sparkles, Clock, BookmarkCheck, List, LayoutGrid, Compass } from 'lucide-react'

type EventoAgendado = {
  id_evento_usuario: number
  id_evento: number
  nombre: string
  descripcion: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
  lugar: string | null
  horario?: string | null
  costo?: string | null
  imagenes_evento?: { url: string; es_principal: boolean }[]
  fecha_agendado: string
}

type MisEventosProps = {
  volver: () => void
  seleccionarEvento: (evento: { id_evento: number; nombre: string }) => void
}

export default function MisEventos({ volver, seleccionarEvento }: MisEventosProps) {
  const [eventos, setEventos] = useState<EventoAgendado[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eliminando, setEliminando] = useState<number | null>(null)
  const [vista, setVista] = useState<'lista' | 'calendario'>('calendario') // <-- Por defecto en calendario

  useEffect(() => {
    cargarAgendaPersonal()
  }, [])

  async function cargarAgendaPersonal() {
    setCargando(true)
    setError(null)

    try {
      const idUsuarioActual = 34

      const { data: agendados, error: errAgendados } = await supabase
        .from('eventos_usuario')
        .select('id_evento_usuario, id_evento, fecha_agendado')
        .eq('id_usuario', idUsuarioActual)

      if (errAgendados) {
        setError('No se pudo cargar tu agenda personal.')
        setEventos([])
        setCargando(false)
        return
      }

      if (!agendados || agendados.length === 0) {
        setEventos([])
        setCargando(false)
        return
      }

      const idsEventos = agendados.map(item => item.id_evento)

      const { data: detalles, error: errDetalles } = await supabase
        .from('eventos')
        .select(`
          *,
          imagenes_evento (
            url,
            es_principal
          )
        `)
        .in('id_evento', idsEventos)

      if (errDetalles) {
        setError('Error al obtener la información de tus eventos.')
        setEventos([])
        setCargando(false)
        return
      }

      const listaFinal = (detalles || []).map(evento => {
        const relacion = agendados.find(a => a.id_evento === evento.id_evento)
        return {
          ...evento,
          id_evento_usuario: relacion?.id_evento_usuario || evento.id_evento,
          fecha_agendado: relacion?.fecha_agendado || new Date().toISOString()
        }
      })

      setEventos(listaFinal)
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
      setEventos([])
    } finally {
      setCargando(false)
    }
  }

  async function manejarEliminar(idEvento: number, idEventoUsuario: number) {
    setEliminando(idEvento)
    try {
      const { error } = await supabase
        .from('eventos_usuario')
        .delete()
        .eq('id_usuario', 34)
        .eq('id_evento', idEvento)

      if (error) {
        setError('No se pudo eliminar el evento.')
      } else {
        setEventos(prev => prev.filter(e => e.id_evento_usuario !== idEventoUsuario))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setEliminando(null)
    }
  }

  function obtenerImagen(evento: EventoAgendado): string {
    const principal = evento.imagenes_evento?.find(img => img.es_principal)
    return principal?.url || '/imagenes/eventos/default.jpg'
  }

  function formatDate(fecha: string | null): string {
    if (!fecha) return 'Por confirmar'
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const eventosOrdenados = [...eventos].sort((a, b) => {
    const fechaA = a.fecha_inicio ? new Date(a.fecha_inicio).getTime() : 0
    const fechaB = b.fecha_inicio ? new Date(b.fecha_inicio).getTime() : 0
    return fechaA - fechaB
  })

  return (
    <main style={{ backgroundColor: '#fcf8f7', minHeight: '100vh', paddingBottom: '110px', fontFamily: 'inherit' }}>
      
      {/* HEADER CON TÍTULOS Y TEXTOS EN BLANCO PURO */}
      <header style={{
        background: 'linear-gradient(135deg, #400d0f 0%, #5A1222 50%, #7B1E34 100%)',
        padding: '36px 20px 56px 20px',
        color: '#ffffff',
        borderBottomLeftRadius: '40px',
        borderBottomRightRadius: '40px',
        boxShadow: '0 16px 35px rgba(90, 18, 34, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.08, pointerEvents: 'none' }}>
          <Compass size={220} color="#ffffff" />
        </div>

        <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Sparkles size={15} color="#ffffff" />
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#ffffff', opacity: 0.95 }}>
                Itinerario Turístico
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
              Mis Eventos
            </h1>
          </div>
          <button 
            onClick={volver} 
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              padding: '10px 20px',
              borderRadius: '14px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '13px',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.2s'
            }}
          >
            Volver
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '700px', margin: '-28px auto 0 auto', padding: '0 20px', position: 'relative', zIndex: 10 }}>
        
        {/* SELECTOR DE VISTA */}
        {!cargando && eventos.length > 0 && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '10px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            border: '1px solid #f2ece9'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '12px' }}>
              <BookmarkCheck size={18} color="#5A1222" />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#5A1222', letterSpacing: '0.3px' }}>
                Vista de Agenda
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setVista('lista')}
                style={{
                  backgroundColor: vista === 'lista' ? '#5A1222' : 'transparent',
                  color: vista === 'lista' ? '#ffffff' : '#6e6462',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '14px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: vista === 'lista' ? '0 4px 12px rgba(90, 18, 34, 0.25)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <List size={16} /> Lista
              </button>
              <button
                onClick={() => setVista('calendario')}
                style={{
                  backgroundColor: vista === 'calendario' ? '#5A1222' : 'transparent',
                  color: vista === 'calendario' ? '#ffffff' : '#6e6462',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '14px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: vista === 'calendario' ? '0 4px 12px rgba(90, 18, 34, 0.25)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <LayoutGrid size={16} /> Calendario
              </button>
            </div>
          </div>
        )}

        {cargando && (
          <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '24px', textAlign: 'center', boxShadow: '0 8px 25px rgba(0,0,0,0.06)' }}>
            <p style={{ color: '#6e6462', margin: 0, fontWeight: 600 }}>Cargando tu itinerario...</p>
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: '#fdf5f5', padding: '20px', borderRadius: '20px', border: '1px solid #f2d6d0', marginBottom: '20px' }}>
            <p style={{ color: '#5A1222', margin: 0, fontWeight: 600, textAlign: 'center' }}>{error}</p>
          </div>
        )}

        {!cargando && eventos.length === 0 && (
          <div style={{ backgroundColor: '#ffffff', textAlign: 'center', padding: '60px 24px', borderRadius: '30px', boxShadow: '0 12px 35px rgba(0,0,0,0.06)', border: '1px solid #f2ece9' }}>
            <div style={{ backgroundColor: '#fdf5f5', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', boxShadow: '0 6px 16px rgba(90, 18, 34, 0.1)' }}>
              <Calendar size={36} color="#5A1222" />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#2d1515', fontWeight: 900 }}>Tu agenda está vacía</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#6e6462', lineHeight: 1.6, maxWidth: '340px', marginLeft: 'auto', marginRight: 'auto' }}>
              Explora la cartelera general de eventos y guarda tus favoritos para planificar tu visita a Cholula.
            </p>
          </div>
        )}

        {/* VISTA EN LISTA */}
        {!cargando && eventos.length > 0 && vista === 'lista' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {eventosOrdenados.map((evento) => (
              <div 
                key={evento.id_evento_usuario} 
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '26px',
                  overflow: 'hidden',
                  boxShadow: '0 12px 35px rgba(0,0,0,0.07)',
                  border: '1px solid #f2ece9',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ padding: '22px', display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                  
                  <div style={{ width: '110px', height: '110px', borderRadius: '20px', overflow: 'hidden', flexShrink: 0, backgroundColor: '#f5f0ef', boxShadow: '0 6px 16px rgba(0,0,0,0.1)' }}>
                    <img
                      src={obtenerImagen(evento)}
                      alt={evento.nombre}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ backgroundColor: '#fdf5f5', color: '#5A1222', padding: '4px 12px', borderRadius: '12px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Guardado en agenda
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 900, color: '#2d1515', lineHeight: 1.3 }}>
                      {evento.nombre}
                    </h4>
                    
                    <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#6e6462', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
                      {evento.descripcion || 'Sin descripción disponible.'}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '12px', color: '#400d0f', fontWeight: 700 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#fdf5f5', padding: '6px 12px', borderRadius: '10px', border: '1px solid #fbeaea' }}>
                        <Calendar size={14} color="#5A1222" />
                        <span>{formatDate(evento.fecha_inicio)}</span>
                      </div>

                      {evento.horario && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#fdf5f5', padding: '6px 12px', borderRadius: '10px', border: '1px solid #fbeaea' }}>
                          <Clock size={14} color="#5A1222" />
                          <span>{evento.horario}</span>
                        </div>
                      )}
                    </div>

                    {evento.lugar && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6e6462', marginTop: '10px', fontWeight: 600 }}>
                        <MapPin size={15} color="#5A1222" style={{ flexShrink: 0 }} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{evento.lugar}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ backgroundColor: '#fcf8f7', padding: '14px 22px', borderTop: '1px solid #f7f3f2', display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => seleccionarEvento({ id_evento: evento.id_evento, nombre: evento.nombre })}
                    style={{
                      flex: 1,
                      backgroundColor: '#5A1222',
                      color: '#ffffff',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      fontWeight: 800,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 6px 18px rgba(90, 18, 34, 0.25)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Eye size={17} /> Ver detalles y mapa
                  </button>
                  <button
                    type="button"
                    onClick={() => manejarEliminar(evento.id_evento, evento.id_evento_usuario)}
                    disabled={eliminando === evento.id_evento}
                    style={{
                      backgroundColor: '#ffffff',
                      color: '#5A1222',
                      border: '1px solid #f2d6d0',
                      padding: '12px 20px',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      fontWeight: 800,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Trash2 size={17} />
                    {eliminando === evento.id_evento ? '...' : 'Quitar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* VISTA EN CALENDARIO (POR DEFECTO) */}
        {!cargando && eventos.length > 0 && vista === 'calendario' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {eventosOrdenados.map((evento) => (
              <div 
                key={evento.id_evento_usuario}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '24px',
                  padding: '20px',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.05)',
                  border: '1px solid #f2ece9',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px'
                }}
              >
                <div style={{
                  backgroundColor: '#5A1222',
                  color: '#ffffff',
                  borderRadius: '18px',
                  padding: '14px 18px',
                  textAlign: 'center',
                  minWidth: '85px',
                  boxShadow: '0 6px 16px rgba(90, 18, 34, 0.2)'
                }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, display: 'block', opacity: 0.95, letterSpacing: '0.5px', color: '#ffffff' }}>
                    {evento.fecha_inicio ? new Date(evento.fecha_inicio).toLocaleDateString('es-MX', { month: 'short' }) : 'Mes'}
                  </span>
                  <strong style={{ fontSize: '24px', fontWeight: 900, display: 'block', lineHeight: 1.1, color: '#ffffff' }}>
                    {evento.fecha_inicio ? new Date(evento.fecha_inicio).getDate() : '--'}
                  </strong>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '17px', fontWeight: 900, color: '#2d1515' }}>
                    {evento.nombre}
                  </h4>
                  <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#6e6462', fontWeight: 500 }}>
                    {evento.lugar || 'Ubicación por confirmar'}
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => seleccionarEvento({ id_evento: evento.id_evento, nombre: evento.nombre })}
                      style={{ backgroundColor: '#5A1222', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(90, 18, 34, 0.2)' }}
                    >
                      Ver detalles
                    </button>
                    <button
                      onClick={() => manejarEliminar(evento.id_evento, evento.id_evento_usuario)}
                      style={{ backgroundColor: '#fdf5f5', color: '#5A1222', border: '1px solid #f2d6d0', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}