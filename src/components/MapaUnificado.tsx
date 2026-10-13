import { useState, useEffect } from 'react'
import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMap
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

// Componente interno para ajustar los límites del mapa evitando que se aleje demasiado
function AjustadorDeZoom({ puntos, zoomForzado }: { puntos: { latitudAjustada: number; longitudAjustada: number }[], zoomForzado: number }) {
  const map = useMap()

  useEffect(() => {
    if (puntos.length > 0) {
      if (puntos.length === 1) {
        map.setView([puntos[0].latitudAjustada, puntos[0].longitudAjustada], zoomForzado)
      } else {
        const bounds = L.latLngBounds(puntos.map(p => [p.latitudAjustada, p.longitudAjustada]))
        map.fitBounds(bounds, { maxZoom: zoomForzado, padding: [40, 40] })
      }
    }
  }, [puntos, map, zoomForzado])

  return null
}

// Función para generar pines personalizados numerados y estilizados
function crearIconoNumerado(numero: number) {
  return L.divIcon({
    className: 'custom-pin-numerado',
    html: `
      <div style="
        background-color: #831818;
        color: white;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 14px;
        font-family: inherit;
        box-shadow: 0 4px 14px rgba(131,24,24,0.4);
        border: 2.5px solid #ffffff;
      ">
        ${numero}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20]
  })
}

export default function MapaUnificado({
  puntos,
  centro,
  zoom = 16,
  mostrarRuta = false,
  altura = '420px',
  titulo,
  mensajeVacio = 'No hay coordenadas disponibles para mostrar.',
  onSeleccionarLugar,
  mostrarBotonComoLlegar = false
}: MapaUnificadoProps) {
  const [tipoMapa, setTipoMapa] = useState<'calles' | 'satelite'>('calles')

  const puntosValidos = puntos.filter(
    p => p.latitud !== null && p.longitud !== null && !isNaN(p.latitud) && !isNaN(p.longitud)
  )

  if (puntosValidos.length === 0) {
    return (
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        {titulo && <h3 style={{ color: '#400d0f', marginBottom: '8px', fontSize: '16px', fontWeight: 700 }}>{titulo}</h3>}
        <p style={{ color: '#6e6462', fontSize: '14px', margin: 0 }}>{mensajeVacio}</p>
      </div>
    )
  }

  const puntosAjustados = puntosValidos.map((p, idx, arr) => {
    let lat = Number(p.latitud!)
    let lon = Number(p.longitud!)

    const duplicadosPrevios = arr.slice(0, idx).filter(
      prev => Number(prev.latitud) === lat && Number(prev.longitud) === lon
    ).length

    if (duplicadosPrevios > 0) {
      const angulo = duplicadosPrevios * (Math.PI / 2)
      lat += Math.sin(angulo) * 0.00035 * duplicadosPrevios
      lon += Math.cos(angulo) * 0.00035 * duplicadosPrevios
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
    <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', border: '1px solid #f2ece9' }}>
      {titulo && <h3 style={{ color: '#400d0f', fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>{titulo}</h3>}

      <div
        style={{
          width: '100%',
          height: altura,
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid #f0e6d8'
        }}
      >
        {/* Selector de Estilo de Mapa Flotante (Calles / Satelital) */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 1000,
          display: 'flex',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          borderRadius: '12px',
          padding: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: '1px solid rgba(0,0,0,0.08)'
        }}>
          <button
            onClick={() => setTipoMapa('calles')}
            style={{
              padding: '6px 12px',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: tipoMapa === 'calles' ? '#831818' : 'transparent',
              color: tipoMapa === 'calles' ? '#fff' : '#400d0f',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Calles
          </button>
          <button
            onClick={() => setTipoMapa('satelite')}
            style={{
              padding: '6px 12px',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: tipoMapa === 'satelite' ? '#831818' : 'transparent',
              color: tipoMapa === 'satelite' ? '#fff' : '#400d0f',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Satelital
          </button>
        </div>

        <MapContainer
          center={centroMapa}
          zoom={zoom}
          scrollWheelZoom={false}
          touchZoom={'center'}
          dragging={true}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Componente que ajusta inteligentemente el acercamiento máximo a los pines */}
          <AjustadorDeZoom puntos={puntosAjustados} zoomForzado={16} />

          {tipoMapa === 'calles' ? (
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          ) : (
            <TileLayer
              attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          )}

          {mostrarRuta && posicionesLinea.length > 1 && (
            <Polyline positions={posicionesLinea} pathOptions={{ color: '#831818', weight: 4, dashArray: '6, 6' }} />
          )}

          {puntosAjustados.map((punto, index) => {
            const numeroOrden = punto.orden_visita || index + 1
            return (
              <Marker
                key={`marker-${punto.id}-${index}`}
                position={[punto.latitudAjustada, punto.longitudAjustada]}
                icon={crearIconoNumerado(numeroOrden)}
              >
                <Popup>
                  <div style={{ textAlign: 'center', padding: '4px' }}>
                    <strong style={{ color: '#400d0f', fontSize: '14px', display: 'block', marginBottom: '2px' }}>
                      {numeroOrden}. {punto.nombre}
                    </strong>
                    {punto.descripcion && <p style={{ fontSize: '12px', color: '#6e6462', margin: '4px 0' }}>{punto.descripcion}</p>}
                    {onSeleccionarLugar && (
                      <button
                        style={{ color: '#831818', fontWeight: 700, fontSize: '12px', marginTop: '6px', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
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
          onClick={comoLlegar}
          style={{
            marginTop: '14px',
            width: '100%',
            backgroundColor: '#831818',
            color: '#fff',
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(131,24,24,0.25)',
            transition: 'background 0.2s'
          }}
        >
          Cómo llegar en Google Maps
        </button>
      )}
    </div>
  )
}