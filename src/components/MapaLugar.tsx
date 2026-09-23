import MapaUnificado from './MapaUnificado'

type MapaLugarProps = {
  latitud: number
  longitud: number
  nombre: string
}

export default function MapaLugar({ latitud, longitud, nombre }: MapaLugarProps) {
  // Se estructuran las coordenadas del lugar individual para el mapa unificado
  const puntoLugar = [
    {
      id: 0,
      nombre: nombre,
      latitud: latitud,
      longitud: longitud
    }
  ]

  return (
    <MapaUnificado
      puntos={puntoLugar}
      centro={[latitud, longitud]}
      zoom={16}
      altura="250px"
      titulo="Ubicación"
      mostrarBotonComoLlegar={true}
    />
  )
}