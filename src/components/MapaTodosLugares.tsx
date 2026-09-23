import { useEffect, useState } from 'react'
import { obtenerLugares } from '../services/lugaresService'
import MapaUnificado from './MapaUnificado'

type LugarMapa = {
  id_lugar: number
  nombre: string
  latitud: number | null
  longitud: number | null
}

type MapaTodosLugaresProps = {
  seleccionarLugar: (lugar: { id_lugar: number; nombre: string }) => void
  lugarDestacado?: string
}

export default function MapaTodosLugares({ seleccionarLugar }: MapaTodosLugaresProps) {
  const [lugares, setLugares] = useState<LugarMapa[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function cargarLugares() {
      setCargando(true)
      setError(null)

      const resultado = await obtenerLugares()

      if (resultado.error) {
        setError('No se pudieron cargar los lugares.')
        setCargando(false)
        return
      }

      const lugaresConUbicacion = (resultado.data || [])
        .filter(lugar => lugar.latitud !== null && lugar.longitud !== null)
        .map(lugar => ({
          id_lugar: lugar.id_lugar,
          nombre: lugar.nombre,
          latitud: lugar.latitud,
          longitud: lugar.longitud
        }))

      setLugares(lugaresConUbicacion)
      setCargando(false)
    }

    cargarLugares()
  }, [])

  if (cargando) {
    return (
      <div className="dashboard-card">
        <p>Cargando mapa...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-card">
        <p>{error}</p>
      </div>
    )
  }

  // Se ven en el  mapa unificado
  const puntosGenerales = lugares.map(l => ({
    id: l.id_lugar,
    nombre: l.nombre,
    latitud: l.latitud,
    longitud: l.longitud
  }))

  return (
    <MapaUnificado
      puntos={puntosGenerales}
      centro={[19.059, -98.306]}
      zoom={14}
      altura="450px"
      titulo="Mapa de lugares turísticos"
      onSeleccionarLugar={seleccionarLugar}
    />
  )
}