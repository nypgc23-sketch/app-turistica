import { useEffect, useState, useMemo } from 'react'
import { obtenerEventos } from '../services/eventosService'
import { Calendar, MapPin, Filter, Clock, ArrowRight, ChevronDown, CalendarDays } from 'lucide-react'

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
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [filtroActivo, setFiltroActivo] = useState<FiltroTiempo>('todos')
  const [mesSeleccionado, setMesSeleccionado] = useState<number>(new Date().getMonth())

  const mesesAnio = [
    { id: 0, nombre: 'Enero' },
    { id: 1, nombre: 'Febrero' },
    { id: 2, nombre: 'Marzo' },
    { id: 3, nombre: 'Abril' },
    { id: 4, nombre: 'Mayo' },
    { id: 5, nombre: 'Junio' },
    { id: 6, nombre: 'Julio' },
    { id: 7, nombre: 'Agosto' },
    { id: 8, nombre: 'Septiembre' },
    { id: 9, nombre: 'Octubre' },
    { id: 10, nombre: 'Noviembre' },
    { id: 11, nombre: 'Diciembre' }
  ]

  useEffect(() => {
    async function cargarEventos() {
      setCargando(true)
      const { data, error } = await obtenerEventos()
      if (error) {
        setError('No se pudieron cargar los eventos de la base de datos.')
        console.error(error)
      } else {
        setEventos(data || [])
      }
      setCargando(false)
    }
    cargarEventos()
  }, [])

  function obtenerImagen(evento: Evento): string {
    const principal = evento.imagenes_evento?.find(img => img.es_principal)
    return principal?.url || 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=700&q=80'
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

    const ahora = new Date() // Fecha actual del sistema (23 de Septiembre de 2026)
    const anioActual = ahora.getFullYear()

    return eventos.filter(evento => {
      if (!evento.fecha_inicio) return false
      
      const fechaEv = new Date(evento.fecha_inicio)
      if (isNaN(fechaEv.getTime())) return false

      if (filtroActivo === 'mes') {
        return fechaEv.getUTCMonth() === mesSeleccionado && fechaEv.getUTCFullYear() === anioActual
      }

      if (filtroActivo === 'semana') {
        // Cálculo exacto de lunes a domingo de la semana actual
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
        //prueba de hoy 23 de septiembre de 2026
        return fechaEv.toDateString() === ahora.toDateString()
      }

      return true
    })
  }, [eventos, filtroActivo, mesSeleccionado])

  return (
    <main className="app-page" style={{ backgroundColor: '#faf5f4', minHeight: '100vh', paddingBottom: '60px' }}>
      
      <header className="app-header" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f0e2e2', padding: '18px 28px', boxShadow: '0 2px 10px rgba(179, 40, 45, 0.03)' }}>
        <div>
          <h1 style={{ fontSize: '21px', fontWeight: 900, color: '#2d1515', margin: 0, letterSpacing: '-0.3px' }}>San Andrés Cholula</h1>
          <p style={{ fontSize: '13px', color: '#6e6462', margin: '2px 0 0 0', fontWeight: 500 }}>Agenda y Festividades Culturales</p>
        </div>
        <button className="link-button" onClick={volver} style={{ fontWeight: 700, color: '#B3282D', background: '#fdf2f2', padding: '8px 18px', borderRadius: '14px', border: 'none', cursor: 'pointer', transition: 'all 0.2s ease' }}>
          Volver
        </button>
      </header>

      <section className="content-area" style={{ display: 'flex', flexDirection: 'column', gap: '26px', maxWidth: '850px', margin: '28px auto 0 auto', width: '100%', padding: '0 20px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2.5px solid #f2e2e2', paddingBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#2d1515', margin: 0, letterSpacing: '-0.5px' }}>
              Próximos Eventos
            </h2>
            <p style={{ fontSize: '14px', color: '#6e6462', margin: '4px 0 0 0', fontWeight: 500 }}>
              Explora las mejores ferias, tradiciones y festivales de la región.
            </p>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#B3282D', backgroundColor: '#fdf2f2', padding: '6px 14px', borderRadius: '20px', border: '1px solid #f5d6d6', boxShadow: '0 2px 8px rgba(179, 40, 45, 0.08)' }}>
            {eventosFiltrados.length} eventos
          </span>
        </div>

        {/* BARRA DE FILTROS */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setFiltroActivo('todos')}
            style={{
              padding: '10px 20px',
              borderRadius: '24px',
              border: filtroActivo === 'todos' ? '1.5px solid #B3282D' : '1.5px solid #e8deda',
              backgroundColor: filtroActivo === 'todos' ? '#B3282D' : '#ffffff',
              color: filtroActivo === 'todos' ? '#ffffff' : '#400d0f',
              fontWeight: 800,
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: filtroActivo === 'todos' ? '0 6px 18px rgba(179, 40, 45, 0.3)' : '0 3px 8px rgba(0,0,0,0.03)',
              transition: 'all 0.25s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Filter size={15} /> Todos
          </button>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <select
              value={mesSeleccionado}
              onChange={(e) => {
                setMesSeleccionado(Number(e.target.value))
                setFiltroActivo('mes')
              }}
              style={{
                padding: '10px 38px 10px 18px',
                borderRadius: '24px',
                border: filtroActivo === 'mes' ? '1.5px solid #B3282D' : '1.5px solid #e8deda',
                backgroundColor: filtroActivo === 'mes' ? '#B3282D' : '#ffffff',
                color: filtroActivo === 'mes' ? '#ffffff' : '#400d0f',
                fontWeight: 800,
                fontSize: '13.5px',
                cursor: 'pointer',
                appearance: 'none',
                outline: 'none',
                boxShadow: filtroActivo === 'mes' ? '0 6px 18px rgba(179, 40, 45, 0.3)' : '0 3px 8px rgba(0,0,0,0.03)',
                transition: 'all 0.25s ease'
              }}
            >
              {mesesAnio.map((m) => (
                <option key={m.id} value={m.id} style={{ backgroundColor: '#ffffff', color: '#2d1515', fontWeight: 600 }}>
                  {m.nombre}
                </option>
              ))}
            </select>
            <ChevronDown size={15} style={{ position: 'absolute', right: '14px', pointerEvents: 'none', color: filtroActivo === 'mes' ? '#ffffff' : '#400d0f' }} />
          </div>

          <button
            type="button"
            onClick={() => setFiltroActivo('semana')}
            style={{
              padding: '10px 20px',
              borderRadius: '24px',
              border: filtroActivo === 'semana' ? '1.5px solid #B3282D' : '1.5px solid #e8deda',
              backgroundColor: filtroActivo === 'semana' ? '#B3282D' : '#ffffff',
              color: filtroActivo === 'semana' ? '#ffffff' : '#400d0f',
              fontWeight: 800,
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: filtroActivo === 'semana' ? '0 6px 18px rgba(179, 40, 45, 0.3)' : '0 3px 8px rgba(0,0,0,0.03)',
              transition: 'all 0.25s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <CalendarDays size={15} /> Esta semana
          </button>

          <button
            type="button"
            onClick={() => setFiltroActivo('dia')}
            style={{
              padding: '10px 20px',
              borderRadius: '24px',
              border: filtroActivo === 'dia' ? '1.5px solid #B3282D' : '1.5px solid #e8deda',
              backgroundColor: filtroActivo === 'dia' ? '#B3282D' : '#ffffff',
              color: filtroActivo === 'dia' ? '#ffffff' : '#400d0f',
              fontWeight: 800,
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: filtroActivo === 'dia' ? '0 6px 18px rgba(179, 40, 45, 0.3)' : '0 3px 8px rgba(0,0,0,0.03)',
              transition: 'all 0.25s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Clock size={15} /> Hoy
          </button>
        </div>

        {cargando && (
          <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#ffffff', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
            <p style={{ color: '#6e6462', fontWeight: 600, fontSize: '15px' }}>Cargando agenda cultural...</p>
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#ffffff', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
            <p style={{ color: '#B3282D', fontWeight: 700 }}>{error}</p>
          </div>
        )}

        {!cargando && eventosFiltrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#ffffff', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            <Calendar size={48} color="#B3282D" strokeWidth={1.5} />
            <h3 style={{ margin: 0, color: '#2d1515', fontSize: '18px', fontWeight: 800 }}>No hay eventos registrados</h3>
            <p style={{ color: '#6e6462', fontSize: '14px', margin: 0 }}>Haz clic en el filtro "Todos" o selecciona "Septiembre" para ver los eventos disponibles.</p>
          </div>
        )}

        {/* LISTA DE EVENTOS */}
        {!cargando && eventosFiltrados.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {eventosFiltrados.map((evento) => (
              <div
                key={evento.id_evento}
                role="button"
                tabIndex={0}
                onClick={() => seleccionarEvento(evento)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') seleccionarEvento(evento)
                }}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  border: '1.5px solid #f2ece9',
                  boxShadow: '0 10px 30px rgba(179, 40, 45, 0.06)',
                  display: 'flex',
                  alignItems: 'stretch',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  width: '100%',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)'
                  e.currentTarget.style.boxShadow = '0 20px 45px rgba(179, 40, 45, 0.15)'
                  e.currentTarget.style.borderColor = '#d6b3b0'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(179, 40, 45, 0.06)'
                  e.currentTarget.style.borderColor = '#f2ece9'
                }}
              >
                <div style={{ width: '170px', minWidth: '170px', backgroundColor: '#fdf5f5', position: 'relative', overflow: 'hidden' }}>
                  <img
                    src={obtenerImagen(evento)}
                    alt={evento.nombre}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>

                <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#B3282D', backgroundColor: '#fdf2f2', padding: '5px 12px', borderRadius: '10px', width: 'fit-content', border: '1.5px solid #f5d6d6' }}>
                      <Calendar size={13} /> {formatDate(evento.fecha_inicio)}
                    </div>
                    
                    <h3 style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 900, color: '#2d1515', lineHeight: '1.3', letterSpacing: '-0.3px' }}>
                      {evento.nombre}
                    </h3>

                    <p style={{ margin: 0, fontSize: '13.5px', color: '#6e6462', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {evento.descripcion || 'Sin descripción detallada disponible.'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f6f0ef', paddingTop: '14px', marginTop: '4px' }}>
                    {evento.lugar ? (
                      <span style={{ fontSize: '13px', color: '#400d0f', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                        <MapPin size={14} color="#B3282D" style={{ flexShrink: 0 }} /> 
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>{evento.lugar}</span>
                      </span>
                    ) : (
                      <span style={{ fontSize: '13px', color: '#6e6462', fontWeight: 600 }}>San Andrés Cholula</span>
                    )}

                    <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#B3282D', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Ver detalles <ArrowRight size={15} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}