import { useEffect, useState, useMemo } from 'react'
import { obtenerEventos, obtenerEventosAgendados } from '../services/eventosService'
import { Calendar, MapPin, Filter, Clock, ArrowRight, ChevronDown, CalendarDays, CheckCircle2 } from 'lucide-react'

type Evento = {
  id_evento: number
  nombre: string
  descripcion: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
  lugar: string | null
  horario: string | null
  costo: number | null
  imagenes_evento?: {
    url: string
    es_principal: boolean
  }[]
}

type EventosProps = {
  volver: () => void
  seleccionarEvento: (evento: Evento) => void
}

type FiltroTiempo = 'todos' | 'mes' | 'semana' | 'dia'

export default function Eventos({ volver, seleccionarEvento }: EventosProps) {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [idsAgendados, setIdsAgendados] = useState<number[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [filtroActivo, setFiltroActivo] = useState<FiltroTiempo>('todos')
  const [mesSeleccionado, setMesSeleccionado] = useState<number>(new Date().getMonth())

  const mesesAnio = [
    { id: 0, nombre: 'Enero' }, { id: 1, nombre: 'Febrero' }, { id: 2, nombre: 'Marzo' },
    { id: 3, nombre: 'Abril' }, { id: 4, nombre: 'Mayo' }, { id: 5, nombre: 'Junio' },
    { id: 6, nombre: 'Julio' }, { id: 7, nombre: 'Agosto' }, { id: 8, nombre: 'Septiembre' },
    { id: 9, nombre: 'Octubre' }, { id: 10, nombre: 'Noviembre' }, { id: 11, nombre: 'Diciembre' }
  ]

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true)
      try {
        const [resEventos, resAgendados] = await Promise.all([
          obtenerEventos(),
          obtenerEventosAgendados()
        ])

        if (resEventos.error) {
          setError('No se pudieron cargar los eventos de la base de datos.')
        } else {
          setEventos(resEventos.data || [])
        }

        if (resAgendados.data) {
          setIdsAgendados(resAgendados.data.map((e: any) => e.id_evento))
        }
      } catch (err) {
        console.error(err)
        setError('Error de conexión al cargar la agenda.')
      } finally {
        setCargando(false)
      }
    }
    cargarDatos()
  }, [])

  function obtenerImagen(evento: Evento): string {
    const principal = evento.imagenes_evento?.find(img => img.es_principal)
    return principal?.url || evento.imagenes_evento?.[0]?.url || 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=700&q=80'
  }

  function formatDate(fecha: string | null): string {
    if (!fecha) return 'Fecha por confirmar'
    const dateObj = new Date(fecha)
    if (isNaN(dateObj.getTime())) return fecha
    return dateObj.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const eventosFiltrados = useMemo(() => {
    if (filtroActivo === 'todos') return eventos

    const ahora = new Date()
    const anioActual = ahora.getFullYear()

    return eventos.filter(evento => {
      if (!evento.fecha_inicio) return false
      const fechaEv = new Date(evento.fecha_inicio)
      if (isNaN(fechaEv.getTime())) return false

      if (filtroActivo === 'mes') {
        return fechaEv.getUTCMonth() === mesSeleccionado && fechaEv.getUTCFullYear() === anioActual
      }

      if (filtroActivo === 'semana') {
        const primerDiaSemana = new Date(ahora)
        const diaSemana = ahora.getDay()
        const diff = ahora.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1)
        primerDiaSemana.setDate(diff)
        primerDiaSemana.setHours(0, 0, 0, 0)

        const ultimoDiaSemana = new Date(primerDiaSemana)
        ultimoDiaSemana.setDate(primerDiaSemana.getDate() + 6)
        ultimoDiaSemana.setHours(23, 59, 59, 999)

        return fechaEv >= primerDiaSemana && fechaEv <= ultimoDiaSemana
      }

      if (filtroActivo === 'dia') {
        return fechaEv.toDateString() === ahora.toDateString()
      }

      return true
    })
  }, [eventos, filtroActivo, mesSeleccionado])

  return (
    <main className="app-page" style={{ backgroundColor: '#faf5f4', minHeight: '100vh', paddingBottom: '60px' }}>
      
      <header className="app-header" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f0e2e2', padding: '18px 24px', boxShadow: '0 2px 10px rgba(179, 40, 45, 0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#2d1515', margin: 0, letterSpacing: '-0.3px' }}>San Andrés Cholula</h1>
          <p style={{ fontSize: '13px', color: '#6e6462', margin: '2px 0 0 0', fontWeight: 500 }}>Agenda y Festividades Culturales</p>
        </div>
        <button onClick={volver} style={{ fontWeight: 700, color: '#B3282D', background: '#fdf2f2', padding: '8px 18px', borderRadius: '14px', border: 'none', cursor: 'pointer' }}>
          Volver
        </button>
      </header>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '850px', margin: '24px auto 0 auto', width: '100%', padding: '0 16px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2.5px solid #f2e2e2', paddingBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#2d1515', margin: 0, letterSpacing: '-0.5px' }}>
              Próximos Eventos
            </h2>
            <p style={{ fontSize: '13.5px', color: '#6e6462', margin: '4px 0 0 0', fontWeight: 500 }}>
              Explora las mejores ferias, tradiciones y festivales de la región.
            </p>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#B3282D', backgroundColor: '#fdf2f2', padding: '6px 14px', borderRadius: '20px', border: '1px solid #f5d6d6' }}>
            {eventosFiltrados.length} eventos
          </span>
        </div>

        {/* BARRA DE FILTROS RESPONSIVA */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { id: 'todos', label: 'Todos', icon: Filter },
            { id: 'semana', label: 'Esta semana', icon: CalendarDays },
            { id: 'dia', label: 'Hoy', icon: Clock }
          ].map((f) => {
            const IconoComp = f.icon
            const activo = filtroActivo === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltroActivo(f.id as FiltroTiempo)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '20px',
                  border: activo ? '1.5px solid #B3282D' : '1.5px solid #e8deda',
                  backgroundColor: activo ? '#B3282D' : '#ffffff',
                  color: activo ? '#ffffff' : '#400d0f',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: activo ? '0 4px 14px rgba(179, 40, 45, 0.25)' : 'none'
                }}
              >
                <IconoComp size={14} /> {f.label}
              </button>
            )
          })}

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <select
              value={mesSeleccionado}
              onChange={(e) => {
                setMesSeleccionado(Number(e.target.value))
                setFiltroActivo('mes')
              }}
              style={{
                padding: '9px 34px 9px 14px',
                borderRadius: '20px',
                border: filtroActivo === 'mes' ? '1.5px solid #B3282D' : '1.5px solid #e8deda',
                backgroundColor: filtroActivo === 'mes' ? '#B3282D' : '#ffffff',
                color: filtroActivo === 'mes' ? '#ffffff' : '#400d0f',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                appearance: 'none',
                outline: 'none',
                boxShadow: filtroActivo === 'mes' ? '0 4px 14px rgba(179, 40, 45, 0.25)' : 'none'
              }}
            >
              {mesesAnio.map((m) => (
                <option key={m.id} value={m.id} style={{ backgroundColor: '#ffffff', color: '#2d1515' }}>
                  {m.nombre}
                </option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '12px', pointerEvents: 'none', color: filtroActivo === 'mes' ? '#ffffff' : '#400d0f' }} />
          </div>
        </div>

        {cargando && (
          <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#ffffff', borderRadius: '20px' }}>
            <p style={{ color: '#6e6462', fontWeight: 600, fontSize: '14px' }}>Cargando agenda cultural...</p>
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '30px', backgroundColor: '#ffffff', borderRadius: '20px' }}>
            <p style={{ color: '#B3282D', fontWeight: 700 }}>{error}</p>
          </div>
        )}

        {!cargando && eventosFiltrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#ffffff', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            <Calendar size={42} color="#B3282D" strokeWidth={1.5} />
            <h3 style={{ margin: 0, color: '#2d1515', fontSize: '17px', fontWeight: 800 }}>No hay eventos registrados</h3>
            <p style={{ color: '#6e6462', fontSize: '13.5px', margin: 0 }}>Prueba cambiando el filtro o revisa los eventos disponibles.</p>
          </div>
        )}

        {/* LISTA DE EVENTOS RESPONSIVA */}
        {!cargando && eventosFiltrados.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            {eventosFiltrados.map((evento) => {
              const estaAgendadoLocal = idsAgendados.includes(evento.id_evento)
              return (
                <div
                  key={evento.id_evento}
                  role="button"
                  tabIndex={0}
                  onClick={() => seleccionarEvento(evento)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') seleccionarEvento(evento) }}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    border: '1.5px solid #f2ece9',
                    boxShadow: '0 8px 24px rgba(179, 40, 45, 0.05)',
                    display: 'flex',
                    flexDirection: window.innerWidth < 640 ? 'column' : 'row',
                    alignItems: 'stretch',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    width: '100%',
                    position: 'relative'
                  }}
                >
                  {/* IMAGEN ADAPTABLE */}
                  <div style={{ 
                    width: window.innerWidth < 640 ? '100%' : '160px', 
                    minWidth: window.innerWidth < 640 ? '100%' : '160px', 
                    height: window.innerWidth < 640 ? '180px' : 'auto', 
                    backgroundColor: '#fdf5f5', 
                    position: 'relative' 
                  }}>
                    <img
                      src={obtenerImagen(evento)}
                      alt={evento.nombre}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>

                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', fontWeight: 800, color: '#B3282D', backgroundColor: '#fdf2f2', padding: '4px 10px', borderRadius: '8px', border: '1px solid #f5d6d6' }}>
                          <Calendar size={12} /> {formatDate(evento.fecha_inicio)}
                        </div>

                        {estaAgendadoLocal && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 800, color: '#0f5132', backgroundColor: '#d1e7dd', padding: '4px 10px', borderRadius: '8px', border: '1px solid #badbcc' }}>
                            <CheckCircle2 size={13} /> Agendado
                          </div>
                        )}
                      </div>
                      
                      <h3 style={{ margin: '2px 0 0 0', fontSize: '17px', fontWeight: 900, color: '#2d1515', lineHeight: '1.25' }}>
                        {evento.nombre}
                      </h3>

                      <p style={{ margin: 0, fontSize: '13px', color: '#6e6462', lineHeight: '1.45', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {evento.descripcion || 'Sin descripción detallada disponible.'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f6f0ef', paddingTop: '12px', marginTop: '4px', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontSize: '12.5px', color: '#400d0f', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}>
                        <MapPin size={13} color="#B3282D" style={{ flexShrink: 0 }} /> 
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>
                          {evento.lugar || 'San Andrés Cholula'}
                        </span>
                      </span>

                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#B3282D', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Ver detalles <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}