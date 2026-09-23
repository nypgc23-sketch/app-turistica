import MapaUnificado from './MapaUnificado'

type MapaEventoProps = {
  nombreLugar: string
  latitud: number
  longitud: number
}

export default function MapaEvento({ nombreLugar, latitud, longitud }: MapaEventoProps) {
  // Se adapta la estructura del evento a los puntos que acepta el mapa unificado
  const puntoEvento = [
    {
      id: 0,
      nombre: nombreLugar,
      latitud: latitud,
      longitud: longitud
    }
  ]

  return (
    <div className="mapa-evento-container">
      <p className="mapa-evento-label">{nombreLugar}</p>
      <MapaUnificado
        puntos={puntoEvento}
        centro={[latitud, longitud]}
        zoom={16}
        altura="200px"
        mostrarBotonComoLlegar={true}
      />
    </div>
  )
}