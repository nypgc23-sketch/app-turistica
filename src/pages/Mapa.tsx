import MapaTodosLugares from '../components/MapaTodosLugares'

type MapaProps = {
  seleccionarLugar: (lugar: {
    id_lugar: number
    nombre: string
  }) => void

  volver: () => void
}

export default function Mapa({
  seleccionarLugar,
  volver
}: MapaProps) {
  return (
    <main className="app-page">

      <header className="app-header">

        <div>
          <h1>
            San Andrés Cholula
          </h1>

          <p>
            Lugares que puedes conocer en tu viaje a Cholula.
          </p>
        </div>

        <button
          className="link-button"
          onClick={volver}
        >
          Volver
        </button>

      </header>

      <section className="content-area">

        <MapaTodosLugares
          seleccionarLugar={seleccionarLugar}
        />

      </section>

    </main>
  )
}