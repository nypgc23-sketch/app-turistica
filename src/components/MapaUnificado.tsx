// Componente de mapa unificado optimizado con pines numerados y diseño moderno
import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

type PuntoMapa = {
  id: number
  nombre: string
  latitud: number | null
  longitud: number | null
  descripcion?: string | null
  orden_visita?: number
}

type MapaUnificadoProps = {
  puntos: PuntoMapa[]
  centro?: [number, number]
  zoom?: number
  mostrarRuta?: boolean
  altura?: string
  titulo?: string
  mensajeVacio?: string
  onSeleccionarLugar?: (lugar: { id_lugar: number; nombre: string }) => void
  mostrarBotonComoLlegar?: boolean
}

// Función para generar pines personalizados numerados y estilizados
function crearIconoNumerado(numero: number) {
  return L.divIcon({
    className: 'custom-pin-numerado',
    html: `
      <div style="
        background-color: #B3282D;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        font-family: inherit;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        border: 2px solid #ffffff;
      ">
        ${numero}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  })
}

export default function MapaUnificado({
  puntos,
  centro = [19.059, -98.306],
  zoom = 14,
  mostrarRuta = false,
  altura = '400px',
  titulo,
  mensajeVacio = 'No hay coordenadas disponibles para mostrar.',
  onSeleccionarLugar,
  mostrarBotonComoLlegar = false
}: MapaUnificadoProps) {

  // Filtrar puntos que contienen coordenadas válidas
  const puntosValidos = puntos.filter(
    p => p.latitud !== null && p.longitud !== null
  )

  if (puntosValidos.length === 0) {
    return (
      <div className="dashboard-card" style={{ padding: '20px', textAlign: 'center' }}>
        {titulo && <h3 style={{ color: '#400d0f', marginBottom: '8px' }}>{titulo}</h3>}
        <p style={{ color: '#6e6462', fontSize: '14px' }}>{mensajeVacio}</p>
      </div>
    )
  }

  // Desplazamiento inteligente por si hay coordenadas encimadas (como el Mercado de Cholula)
  const puntosAjustados = puntosValidos.map((p, idx, arr) => {
    let lat = p.latitud!
    let lon = p.longitud!

    // Si hay puntos con exactamente la misma lat/lon, aplicar un leve desfase visual automático
    const duplicadosPrevios = arr.slice(0, idx).filter(prev => prev.latitud === lat && prev.longitud === lon).length
    if (duplicadosPrevios > 0) {
      lat += duplicadosPrevios * 0.0015
      lon += duplicadosPrevios * 0.0015
    }

    return {
      ...p,
      latitudAjustada: lat,
      longitudAjustada: lon
    }
  })

  const centroMapa: [number, number] = centro || [
    puntosAjustados[0].latitudAjustada,
    puntosAjustados[0].longitudAjustada
  ]

  // Generar posiciones para la línea de ruta conectando los puntos en orden
  const posicionesLinea: [number, number][] = puntosAjustados.map(
    p => [p.latitudAjustada, p.longitudAjustada]
  )

  function comoLlegar() {
    if (puntosAjustados.length === 0) return

    if (mostrarRuta && puntosAjustados.length > 1) {
      const origen = puntosAjustados[0]
      const destino = puntosAjustados[puntosAjustados.length - 1]
      const intermedios = puntosAjustados
        .slice(1, puntosAjustados.length - 1)
        .map(p => `${p.latitudAjustada},${p.longitudAjustada}`)
        .join('|')

      let url = `https://www.google.com/maps/dir/?api=1&origin=${origen.latitudAjustada},${origen.longitudAjustada}&destination=${destino.latitudAjustada},${destino.longitudAjustada}`
      if (intermedios) {
        url += `&waypoints=${encodeURIComponent(intermedios)}`
      }
      url += '&travelmode=walking'
      window.open(url, '_blank')
    } else {
      const destino = puntosAjustados[0]
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destino.latitudAjustada},${destino.longitudAjustada}`
      window.open(url, '_blank')
    }
  }

  return (
    <div className="dashboard-card" style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
      {titulo && <h3 style={{ color: '#400d0f', fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>{titulo}</h3>}

      <div
        style={{
          width: '100%',
          height: altura,
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid #f2ece9'
        }}
      >
        <MapContainer
          center={centroMapa}
          zoom={zoom}
          scrollWheelZoom={false}
          touchZoom={'center'}
          dragging={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {mostrarRuta && posicionesLinea.length > 1 && (
            <Polyline positions={posicionesLinea} pathOptions={{ color: '#B3282D', weight: 4, dashArray: '6, 6' }} />
          )}

          {puntosAjustados.map((punto, index) => {
            const numeroOrden = punto.orden_visita || index + 1
            return (
              <Marker
                key={punto.id || index}
                position={[punto.latitudAjustada, punto.longitudAjustada]}
                icon={crearIconoNumerado(numeroOrden)}
              >
                <Popup>
                  <div style={{ textAlign: 'center', padding: '4px' }}>
                    <strong style={{ color: '#400d0f', fontSize: '14px', display: 'block' }}>
                      {numeroOrden}. {punto.nombre}
                    </strong>
                    {punto.descripcion && <p style={{ fontSize: '12px', color: '#6e6462', margin: '4px 0' }}>{punto.descripcion}</p>}
                    {onSeleccionarLugar && (
                      <button
                        className="link-button"
                        style={{ color: '#B3282D', fontWeight: 700, fontSize: '12px', marginTop: '6px', background: 'none', border: 'none', cursor: 'pointer' }}
                        onClick={() =>
                          onSeleccionarLugar({
                            id_lugar: punto.id,
                            nombre: punto.nombre
                          })
                        }
                      >
                        Ver lugar
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>

      {mostrarBotonComoLlegar && (
        <button
          className="primary-button"
          onClick={comoLlegar}
          style={{
            marginTop: '14px',
            width: '100%',
            backgroundColor: '#B3282D',
            color: '#fff',
            padding: '12px',
            borderRadius: '10px',
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Cómo llegar
        </button>
      )}
    </div>
  )
}