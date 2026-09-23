import MapaUnificado from './MapaUnificado'

type PuntoRuta = {
  id_lugar: number
  nombre: string
  latitud: number | null
  longitud: number | null
  orden_visita: number
}

type MapaRutaProps = {
  lugares: PuntoRuta[]
}

export default function MapaRuta({ lugares }: MapaRutaProps) {
  // Mapeo de los puntos de la ruta para que coincidan con la estructura del mapa unificado
  const puntosRuta = lugares.map(l => ({
    id: l.id_lugar,
    nombre: l.nombre,
    latitud: l.latitud,
    longitud: l.longitud,
    orden_visita: l.orden_visita
  }))

  return (
    <MapaUnificado
      puntos={puntosRuta}
      mostrarRuta={true}
      altura="400px"
      titulo="Mapa de la ruta"
      mensajeVacio="No hay coordenadas disponibles para mostrar la ruta."
      mostrarBotonComoLlegar={true}
    />
  )
}