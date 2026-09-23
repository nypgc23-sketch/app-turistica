// Lista de eventos

import { useEffect, useState } from 'react'
import { obtenerEventos } from '../services/eventosService'

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

export default function Eventos({ volver, seleccionarEvento }: EventosProps) {
  // Estados del componente
  const [eventos, setEventos] = useState<Evento[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar eventos al montar el componente
  useEffect(() => {
    async function cargarEventos() {
      setCargando(true)
      const { data, error } = await obtenerEventos()
      if (error) {
        setError('No se pudieron cargar los eventos.')
      } else {
        setEventos(data || [])
      }
      setCargando(false)
    }
    cargarEventos()
  }, [])

  // Obtener imagen principal del evento
  function obtenerImagen(evento: Evento): string {
    const principal = evento.imagenes_evento?.find(img => img.es_principal)
    return principal?.url || '/imagenes/eventos/default.jpg'
  }

  // Formatear fecha para mostrar
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
      {/* Encabezado */}
      <header className="app-header">
        <div>
          <h1>San Andrés Cholula</h1>
          <p>Eventos y festividades</p>
        </div>
        {/* Botón para volver */}
        <button className="link-button" onClick={volver}>
          Volver
        </button>
      </header>

      {/* Contenido principal */}
      <section className="content-area">
        <h2>Próximos eventos</h2>
        <p>Descubre las festividades y actividades de la región.</p>

        {/* Estado de carga */}
        {cargando && (
          <div className="dashboard-card">
            <p>Cargando eventos...</p>
          </div>
        )}

        {/* Mensaje de error */}
        {error && (
          <div className="dashboard-card">
            <p className="resultado error">{error}</p>
          </div>
        )}

        {/* Sin eventos disponibles */}
        {!cargando && eventos.length === 0 && (
          <div className="dashboard-card">
            <h3>No hay eventos disponibles</h3>
            <p>Pronto publicaremos las festividades de San Andrés Cholula.</p>
          </div>
        )}

        {/* Lista de eventos */}
        {!cargando && eventos.length > 0 && (
          <div className="eventos-lista">
            {eventos.map((evento) => (
              // Contenedor interactivo corregido (div con rol de botón para evitar bloqueos)
              <div
                key={evento.id_evento}
                className="evento-card"
                role="button"
                tabIndex={0}
                onClick={() => seleccionarEvento(evento)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') seleccionarEvento(evento)
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="evento-imagen-container">
                  <img
                    src={obtenerImagen(evento)}
                    alt={evento.nombre}
                    className="evento-imagen"
                  />
                  <span className="evento-fecha">
                    {formatDate(evento.fecha_inicio)}
                  </span>
                </div>
                <div className="evento-info">
                  <h3>{evento.nombre}</h3>
                  <p>{evento.descripcion || 'Sin descripción'}</p>
                  {evento.lugar && (
                    <span className="evento-lugar"> {evento.lugar}</span>
                  )}
                  <span className="ver-detalle">Ver detalles →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}