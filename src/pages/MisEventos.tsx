import { useEffect, useState } from 'react'
import {
  obtenerEventosAgendados,
  eliminarEventoAgendado
} from '../services/eventosService'
import { Trash2, Eye, Calendar } from 'lucide-react'

type EventoAgendado = {
  id_evento_usuario: number
  id_evento: number
  nombre: string
  descripcion: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
  lugar: string | null
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

  useEffect(() => {
    cargarEventos()
  }, [])

  async function cargarEventos() {
    setCargando(true)
    setError(null)
    const { data, error } = await obtenerEventosAgendados()
    if (error) {
      setError('No se pudieron cargar tus eventos agendados.')
    } else {
      setEventos((data || []) as unknown as EventoAgendado[])
    }
    setCargando(false)
  }

  async function manejarEliminar(idEvento: number, idEventoUsuario: number) {
    setEliminando(idEvento)
    const { error } = await eliminarEventoAgendado(idEvento)
    if (error) {
      setError('No se pudo eliminar el evento de tu agenda.')
    } else {
      setEventos(prev => prev.filter(e => e.id_evento_usuario !== idEventoUsuario))
    }
    setEliminando(null)
  }

  function obtenerImagen(evento: EventoAgendado): string {
    const principal = evento.imagenes_evento?.find(img => img.es_principal)
    return principal?.url || '/imagenes/eventos/default.jpg'
  }

  function formatDate(fecha: string | null): string {
    if (!fecha) return 'Fecha por confirmar'
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <main className="app-page">
      <header className="app-header">
        <div>
          <h1>San Andrés Cholula</h1>
          <p>Mis eventos</p>
        </div>
        <button className="link-button" onClick={volver} style={{ color: '#7B1E34' }}>
          Volver
        </button>
      </header>

      <section className="content-area">
        <h2>Eventos agendados</h2>
        <p>Estos son los eventos que has guardado en tu agenda.</p>

        {cargando && (
          <div className="dashboard-card">
            <p>Cargando tus eventos...</p>
          </div>
        )}

        {error && (
          <div className="dashboard-card">
            <p className="resultado error">{error}</p>
          </div>
        )}

        {!cargando && eventos.length === 0 && (
          <div className="dashboard-card">
            <h3>No tienes eventos agendados</h3>
            <p>Explora la sección de eventos y agenda los que más te interesen.</p>
          </div>
        )}

        {!cargando && eventos.length > 0 && (
          <div className="mis-eventos-lista">
            {eventos.map((evento) => (
              <div key={evento.id_evento_usuario} className="evento-agendado-card">
                <div className="evento-agendado-imagen">
                  <img
                    src={obtenerImagen(evento)}
                    alt={evento.nombre}
                  />
                </div>

                <div className="evento-agendado-info">
                  <h4>{evento.nombre}</h4>
                  <p>{evento.descripcion || 'Sin descripción'}</p>
                  <span className="evento-agendado-fecha" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={16} color="#7B1E34" />
                    {formatDate(evento.fecha_inicio)}
                  </span>
                  {evento.lugar && (
                    <span className="evento-agendado-lugar">{evento.lugar}</span>
                  )}
                </div>

                <div className="evento-agendado-acciones">
                  <button
                    type="button"
                    className="btn-ver"
                    onClick={() => seleccionarEvento({ id_evento: evento.id_evento, nombre: evento.nombre })}
                    style={{ backgroundColor: '#7B1E34', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Eye size={16} /> Ver
                  </button>
                  <button
                    type="button"
                    className="btn-eliminar"
                    onClick={() => manejarEliminar(evento.id_evento, evento.id_evento_usuario)}
                    disabled={eliminando === evento.id_evento}
                    style={{ backgroundColor: '#5A1222', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Trash2 size={16} />
                    {eliminando === evento.id_evento ? '...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}