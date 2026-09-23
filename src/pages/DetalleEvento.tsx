import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import MapaLugar from '../components/MapaLugar'
import { 
  obtenerEventoPorId, 
  agendarEvento, 
  eliminarEventoAgendado, 
  estaAgendado 
} from '../services/eventosService'
import { Calendar, Clock, DollarSign, MapPin, ArrowLeft, BookmarkPlus, Check } from 'lucide-react'

type EventoSeleccionado = {
  id_evento: number
  nombre: string
}

type DetalleEventoProps = {
  evento: EventoSeleccionado
  volver: () => void
  seleccionarLugar?: (lugar: { id_lugar: number; nombre: string }) => void
}

type EventoDetalle = {
  id_evento: number
  nombre: string
  descripcion: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
  horario: string | null
  costo: number | null
  id_lugar: number | null
  lugares_turisticos: {
    id_lugar: number
    nombre: string
    direccion: string | null
    latitud: number | null
    longitud: number | null
  } | null
}

export default function DetalleEvento({
  evento,
  volver,
  seleccionarLugar
}: DetalleEventoProps) {
  const [detalle, setDetalle] = useState<EventoDetalle | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [agendado, setAgendado] = useState(false)

  useEffect(() => {
    async function cargarDetalle() {
      setCargando(true)
      setError(null)

      try {
        const { data: eventoData, error: eventoError } = await obtenerEventoPorId(evento.id_evento)

        if (eventoError || !eventoData) {
          setError('No se pudo cargar la información del evento.')
          setCargando(false)
          return
        }

        let lugarInfo = null
        if (eventoData.id_lugar) {
          const { data: lugarData } = await supabase
            .from('lugares_turisticos')
            .select('id_lugar, nombre, direccion, latitud, longitud')
            .eq('id_lugar', eventoData.id_lugar)
            .maybeSingle()

          lugarInfo = lugarData
        }

        setDetalle({
          ...eventoData,
          lugares_turisticos: lugarInfo
        })

        // Verificar si ya está agendado
        const { agendado: estadoAgendado } = await estaAgendado(evento.id_evento)
        setAgendado(estadoAgendado)

      } catch (err) {
        console.error('Error al cargar detalle del evento:', err)
        setError('Ocurrió un error inesperado.')
      } finally {
        setCargando(false)
      }
    }

    cargarDetalle()
  }, [evento.id_evento])

  const manejarAgendar = async () => {
    if (agendado) {
      const { error: errDel } = await eliminarEventoAgendado(evento.id_evento)
      if (!errDel) {
        setAgendado(false)
      }
    } else {
      const { error: errIns } = await agendarEvento(evento.id_evento)
      if (!errIns) {
        setAgendado(true)
      }
    }
  }

  if (cargando) {
    return (
      <main className="app-page">
        <header className="app-header">
          <div>
            <h1>San Andrés Cholula</h1>
            <p>Detalle del evento</p>
          </div>
          <button className="link-button" onClick={volver} style={{ color: '#7B1E34' }}>
            Volver
          </button>
        </header>
        <section className="content-area">
          <div className="dashboard-card">
            <p>Cargando evento...</p>
          </div>
        </section>
      </main>
    )
  }

  if (error || !detalle) {
    return (
      <main className="app-page">
        <header className="app-header">
          <div>
            <h1>San Andrés Cholula</h1>
            <p>Detalle del evento</p>
          </div>
          <button className="link-button" onClick={volver} style={{ color: '#7B1E34' }}>
            Volver
          </button>
        </header>
        <section className="content-area">
          <div className="dashboard-card">
            <p>{error || 'No se encontró el evento.'}</p>
          </div>
        </section>
      </main>
    )
  }

  const lugar = detalle.lugares_turisticos

  return (
    <main className="app-page">
      <header className="app-header">
        <div>
          <h1>San Andrés Cholula</h1>
          <p>Detalle del evento</p>
        </div>
        <button className="link-button" onClick={volver} style={{ color: '#7B1E34' }}>
          Volver
        </button>
      </header>

      <section className="content-area">
        <h2>{detalle.nombre}</h2>

        <div className="dashboard-card">
          <h3>Descripción</h3>
          <p>{detalle.descripcion || 'Sin descripción disponible para este evento.'}</p>
        </div>

        <div className="dashboard-card">
          <h3>Información general</h3>

          {detalle.fecha_inicio && (
            <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#7B1E34" />
              <strong>Fecha:</strong>{' '}
              {new Date(detalle.fecha_inicio).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
              {detalle.fecha_fin &&
                ` - ${new Date(detalle.fecha_fin).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}`}
            </p>
          )}

          {detalle.horario && (
            <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#7B1E34" />
              <strong>Horario:</strong> {detalle.horario}
            </p>
          )}

          {detalle.costo !== null && (
            <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} color="#7B1E34" />
              <strong>Costo:</strong>{' '}
              {detalle.costo === 0 ? 'Gratis' : `$${detalle.costo}`}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
          <button
            type="button"
            onClick={manejarAgendar}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '12px 24px',
              backgroundColor: agendado ? '#5A1222' : '#7B1E34',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {agendado ? <Check size={18} /> : <BookmarkPlus size={18} />}
            {agendado ? 'Agendado en mis eventos' : 'Agendar evento'}
          </button>
        </div>

        {lugar && (
          <div className="dashboard-card">
            <h3>Ubicación del evento</h3>

            <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} color="#7B1E34" />
              <strong>Lugar:</strong> {lugar.nombre}
            </p>

            {lugar.direccion && (
              <p style={{ marginLeft: '26px', color: '#666' }}>
                {lugar.direccion}
              </p>
            )}

            {seleccionarLugar && (
              <button
                type="button"
                className="secondary-button"
                style={{ marginTop: '12px', width: '100%' }}
                onClick={() =>
                  seleccionarLugar({
                    id_lugar: lugar.id_lugar,
                    nombre: lugar.nombre
                  })
                }
              >
                Ver ficha completa del lugar
              </button>
            )}
          </div>
        )}

        {lugar && lugar.latitud !== null && lugar.longitud !== null ? (
          <div className="mapa-ruta-wrapper" style={{ marginTop: '16px' }}>
            <MapaLugar
              latitud={lugar.latitud}
              longitud={lugar.longitud}
              nombre={lugar.nombre}
            />
          </div>
        ) : (
          <div className="dashboard-card" style={{ marginTop: '16px', textAlign: 'center' }}>
            <p>Ubicación del evento</p>
            <div className="mapa-ruta-wrapper" style={{ marginTop: '10px' }}>
              <MapaLugar
                latitud={19.0544}
                longitud={-98.2831}
                nombre={detalle.nombre}
              />
            </div>
          </div>
        )}

        <button
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '12px',
            marginTop: '20px',
            backgroundColor: '#7B1E34',
            color: '#fff',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer'
          }}
          onClick={volver}
        >
          <ArrowLeft size={18} color="#fff" /> Volver
        </button>
      </section>
    </main>
  )
}