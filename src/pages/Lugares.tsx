import { useEffect, useState } from 'react'
import { obtenerLugares } from '../services/lugaresService'

type Lugar = {
  id_lugar: number
  nombre: string
  descripcion: string | null
  direccion: string | null
  latitud: number | null
  longitud: number | null
  horario: string | null
  costo_entrada: number | null
  telefono: string | null
  categorias_lugar:
    | {
        id_categoria: number
        nombre: string
        descripcion: string | null
      }
    | null
  imagenes_lugar: {
    id_imagen: number
    url: string
    descripcion: string | null
    es_principal: boolean
    orden: number | null
  }[]
}

type LugaresProps = {
  volver: () => void
  seleccionarLugar: (lugar: Lugar) => void
}

export default function Lugares({
  volver,
  seleccionarLugar
}: LugaresProps) {
  const [lugares, setLugares] = useState<Lugar[]>([])
  const [cargando, setCargando] = useState(true)
  const [resultado, setResultado] = useState('')

  useEffect(() => {
    async function cargarLugares() {
      try {
        const { data, error } =
          await obtenerLugares()

        if (error) {
          console.error(error)

          setResultado(
            'No se pudieron cargar los lugares turísticos.'
          )

          return
        }

        const lugaresNormalizados: Lugar[] =
          (data || []).map((lugar) => ({
            ...lugar,
            categorias_lugar:
              Array.isArray(lugar.categorias_lugar)
                ? lugar.categorias_lugar[0] || null
                : lugar.categorias_lugar
          }))

        setLugares(lugaresNormalizados)
      } catch (error) {
        console.error(error)

        setResultado(
          'Ocurrió un error al cargar los lugares.'
        )
      } finally {
        setCargando(false)
      }
    }

    cargarLugares()
  }, [])

  /* Categorías que consideraremos lugares paracomer */
  const categoriasComida = [
    'gastronómico',
    'gastronomico',
    'gastronómica',
    'gastronomica',
    'restaurante',
    'restaurantes',
    'mercado',
    'cafetería',
    'cafeteria',
    'bar',
    'comida',
    'alimentación',
    'alimentacion'
  ]

  function esLugarParaComer(lugar: Lugar) {
    const categoria =
      lugar.categorias_lugar?.nombre
        ?.trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') || ''

    return categoriasComida.some((c) => {
      const cLimpia = c.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      return categoria.includes(cLimpia)
    })
  }

  const lugaresDondeComer =
    lugares.filter(esLugarParaComer)

  const lugaresParaConocer =
    lugares.filter(
      (lugar) => !esLugarParaComer(lugar)
    )

  if (cargando) {
    return (
      <main className="app-page">
        <header className="app-header">
          <div>
            <h1>
              San Andrés Cholula
            </h1>

            <p>
              Lugares turísticos
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
          <h2>
            Cargando lugares...
          </h2>
        </section>
      </main>
    )
  }

  return (
    <main className="app-page">
      <header className="app-header">
        <div>
          <h1>
            San Andrés Cholula
          </h1>

          <p>
            Lugares turísticos
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

        <h2>
          Descubre San Andrés Cholula
        </h2>

        <p>
          Explora lugares para conocer y
          disfruta de la gastronomía de la región.
        </p>

        {resultado && (
          <p className="resultado">
            {resultado}
          </p>
        )}

        {lugares.length === 0 && !resultado && (
          <div className="dashboard-card">
            <p>
              Por el momento no hay lugares turísticos
              disponibles. Próximamente...
            </p>
          </div>
        )}
        {/* LUGARES PARA CONOCER */}
        {lugaresParaConocer.length > 0 && (
          <section className="home-section">

            <div className="section-heading">
              <div>
                <h2>
                  Lugares para conocer
                </h2>

                <p>
                  Descubre sitios históricos,
                  culturales y turísticos.
                </p>
              </div>
            </div>

            <div className="explore-grid">

              {lugaresParaConocer.map(
                (lugar) => (
                  <button
                    key={lugar.id_lugar}
                    type="button"
                    className="explore-card"
                    onClick={() =>
                      seleccionarLugar(lugar)
                    }
                  >

                    {lugar.imagenes_lugar.length > 0 && (
                      <img
                        src={
                          lugar.imagenes_lugar.find(
                            (imagen) =>
                              imagen.es_principal
                          )?.url ||
                          lugar.imagenes_lugar[0].url
                        }
                        alt={
                          lugar.imagenes_lugar.find(
                            (imagen) =>
                              imagen.es_principal
                          )?.descripcion ||
                          lugar.nombre
                        }
                        style={{
                          width: '100%',
                          height: '180px',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                    )}

                    <strong>
                      {lugar.nombre}
                    </strong>

                    <span>
                      {lugar.descripcion ||
                        'Sin descripción disponible.'}
                    </span>

                    {lugar.categorias_lugar && (
                      <span>
                        Categoría:{' '}
                        {lugar.categorias_lugar.nombre}
                      </span>
                    )}

                  </button>
                )
              )}

            </div>

          </section>
        )}
        {/* LUGARES DONDE COMER */}
        {lugaresDondeComer.length > 0 && (
          <section className="home-section">

            <div className="section-heading">
              <div>
                <h2>
                  Lugares donde comer
                </h2>

                <p>
                  Conoce restaurantes, mercados
                  y otros lugares para disfrutar.
                </p>
              </div>
            </div>

            <div className="explore-grid">

              {lugaresDondeComer.map(
                (lugar) => (
                  <button
                    key={lugar.id_lugar}
                    type="button"
                    className="explore-card"
                    onClick={() =>
                      seleccionarLugar(lugar)
                    }
                  >

                    {lugar.imagenes_lugar.length > 0 && (
                      <img
                        src={
                          lugar.imagenes_lugar.find(
                            (imagen) =>
                              imagen.es_principal
                          )?.url ||
                          lugar.imagenes_lugar[0].url
                        }
                        alt={
                          lugar.imagenes_lugar.find(
                            (imagen) =>
                              imagen.es_principal
                          )?.descripcion ||
                          lugar.nombre
                        }
                        style={{
                          width: '100%',
                          height: '180px',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                    )}

                    <strong>
                      {lugar.nombre}
                    </strong>

                    <span>
                      {lugar.descripcion ||
                        'Sin descripción disponible.'}
                    </span>

                    {lugar.categorias_lugar && (
                      <span>
                        Categoría:{' '}
                        {lugar.categorias_lugar.nombre}
                      </span>
                    )}

                  </button>
                )
              )}

            </div>

          </section>
        )}

      </section>
    </main>
  )
}