import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { obtenerLugares } from '../services/lugaresService'
import {
  MapPin,
  Clock3,
  Phone,
  Utensils,
  Landmark,
  ChevronRight,
  Compass,
  Store,
  Church,
  History,
  Trees,
  Palette,
  Building2,
  Ticket,
  RefreshCw
} from 'lucide-react'

type CategoriaLugar = {
  id_categoria: number
  nombre: string
  descripcion?: string | null
}

type ImagenLugar = {
  id_imagen?: number
  id_lugar?: number
  url: string | null
  descripcion?: string | null
  es_principal?: boolean
  orden?: number
}

type Lugar = {
  id_lugar: number
  categoria_id: number | null
  nombre: string
  descripcion: string | null
  direccion: string | null
  latitud: number | null
  longitud: number | null
  horario: string | null
  costo_entrada: number | null
  telefono: string | null
  estado?: boolean
  categorias_lugar?: CategoriaLugar | CategoriaLugar[] | null
  imagenes_lugar?: ImagenLugar[] | null
}

type LugaresProps = {
  volver?: () => void
  seleccionarLugar?: (lugar: {
    id_lugar: number
    nombre: string
  }) => void
}

type FiltroSeccion = 'todos' | 'conocer' | 'comer'

export default function Lugares({
  volver,
  seleccionarLugar
}: LugaresProps) {
  const [lugares, setLugares] = useState<Lugar[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [filtroSeccion, setFiltroSeccion] = useState<FiltroSeccion>('todos')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number | null>(null)

  useEffect(() => {
    let activo = true

    async function cargarLugares() {
      setCargando(true)
      setError('')

      try {
        const resultado = await obtenerLugares()

        if (!activo) return

        if (resultado.error) {
          throw resultado.error
        }

        const datos = Array.isArray(resultado.data)
          ? resultado.data
          : []

        const lugaresNormalizados: Lugar[] =
          datos.map((lugar: any) => {
            const categoria =
              Array.isArray(lugar.categorias_lugar)
                ? lugar.categorias_lugar[0]
                : lugar.categorias_lugar

            const imagenes = Array.isArray(
              lugar.imagenes_lugar
            )
              ? lugar.imagenes_lugar
              : []

            const catId =
              lugar.categoria_id !== null &&
              lugar.categoria_id !== undefined
                ? Number(lugar.categoria_id)
                : lugar.id_categoria !== null &&
                  lugar.id_categoria !== undefined
                  ? Number(lugar.id_categoria)
                  : categoria?.id_categoria
                    ? Number(categoria.id_categoria)
                    : null

            return {
              ...lugar,
              categoria_id: catId,
              categorias_lugar: categoria || null,
              imagenes_lugar: imagenes
            }
          })

        setLugares(lugaresNormalizados)
      } catch (err: any) {
        if (!activo) return

        setError(
          err?.message ||
            'No fue posible cargar los lugares turísticos.'
        )
      } finally {
        if (activo) {
          setCargando(false)
        }
      }
    }
    cargarLugares()

    return () => {
      activo = false
    }
  }, [])

  function obtenerImagenGarantizada(lugar: any): string {
  if (typeof lugar.imagen === 'string' && lugar.imagen.trim() !== '') {
    return lugar.imagen.trim()
  }
  
  if (typeof lugar.imagen_url === 'string' && lugar.imagen_url.trim() !== '') {
    return lugar.imagen_url.trim()
  }

  const imagenes = Array.isArray(lugar.imagenes_lugar)
    ? lugar.imagenes_lugar
    : []

  const imagenPrincipal = imagenes.find(
    (imagen: any) =>
      imagen.es_principal &&
      typeof imagen.url === 'string' &&
      imagen.url.trim() !== ''
  )

  if (imagenPrincipal?.url) {
    return imagenPrincipal.url
  }

  const primeraImagen = imagenes.find(
    (imagen: any) =>
      typeof imagen.url === 'string' &&
      imagen.url.trim() !== ''
  )

  if (primeraImagen?.url) {
    return primeraImagen.url
  }

  return '/imagenes/lugares/restaurante.jpg'
}
  function esLugarParaComer(lugar: Lugar): boolean {
    const categoria = Array.isArray(lugar.categorias_lugar)
      ? lugar.categorias_lugar[0]
      : lugar.categorias_lugar

    const idCat = Number(lugar.categoria_id ?? categoria?.id_categoria ?? 0)
    return idCat === 7 || idCat === 8
  }

  function obtenerNombreCategoria(lugar: Lugar): string {
    const categoria = Array.isArray(lugar.categorias_lugar)
      ? lugar.categorias_lugar[0]
      : lugar.categorias_lugar

    if (categoria?.nombre) {
      return categoria.nombre
    }

    const idCat = Number(lugar.categoria_id ?? 0)
    switch (idCat) {
      case 1: return 'Histórico'
      case 2: return 'Religioso'
      case 3: return 'Cultural'
      case 4: return 'Arqueológico'
      case 5: return 'Natural'
      case 6: return 'Recreativo'
      case 7: return 'Restaurante'
      case 8: return 'Mercado'
      default: return 'Sitio de interés'
    }
  }

  function obtenerCosto(costo: number | null): string {
    if (costo === null || costo === undefined || Number(costo) === 0) {
      return 'Entrada gratuita'
    }
    return `$${Number(costo).toFixed(2)} MXN`
  }

  function obtenerHorario(horario: string | null): string {
    if (!horario || !horario.trim()) {
      return 'Horario no disponible'
    }
    return horario
  }

  function obtenerDescripcion(descripcion: string | null): string {
    if (!descripcion || !descripcion.trim()) {
      return 'Información próximamente disponible.'
    }
    return descripcion
  }

  function manejarSeleccionLugar(lugar: Lugar) {
    if (seleccionarLugar) {
      seleccionarLugar({
        id_lugar: lugar.id_lugar,
        nombre: lugar.nombre
      })
    }
  }

  function manejarTeclado(evento: KeyboardEvent, lugar: Lugar) {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault()
      manejarSeleccionLugar(lugar)
    }
  }

  function cambiarSeccion(seccion: FiltroSeccion) {
    setFiltroSeccion(seccion)
    setCategoriaSeleccionada(null)
  }

  function obtenerIconoCategoria(idCategoria: number | null) {
    switch (Number(idCategoria)) {
      case 1: return History
      case 2: return Church
      case 3: return Palette
      case 4: return Building2
      case 5: return Trees
      case 6: return Compass
      case 7: return Utensils
      case 8: return Store
      default: return Landmark
    }
  }

  function obtenerClaseCategoria(idCategoria: number | null): string {
    switch (Number(idCategoria)) {
      case 1: return 'categoria-historico'
      case 2: return 'categoria-religioso'
      case 3: return 'categoria-cultural'
      case 4: return 'categoria-arqueologico'
      case 5: return 'categoria-natural'
      case 6: return 'categoria-recreativo'
      case 7: return 'categoria-restaurante'
      case 8: return 'categoria-mercado'
      default: return 'categoria-default'
    }
  }

  const lugaresParaConocer = useMemo(
    () => lugares.filter(lugar => !esLugarParaComer(lugar)),
    [lugares]
  )

  const lugaresParaComer = useMemo(
    () => lugares.filter(lugar => esLugarParaComer(lugar)),
    [lugares]
  )

  const lugaresVisibles = useMemo(() => {
    let resultado = lugares

    if (filtroSeccion === 'conocer') {
      resultado = lugaresParaConocer
    } else if (filtroSeccion === 'comer') {
      resultado = lugaresParaComer
    }

    if (categoriaSeleccionada !== null) {
      resultado = resultado.filter(
        lugar => {
          const cat = Array.isArray(lugar.categorias_lugar) ? lugar.categorias_lugar[0] : lugar.categorias_lugar
          const idCat = Number(lugar.categoria_id ?? cat?.id_categoria ?? 0)
          return idCat === Number(categoriaSeleccionada)
        }
      )
    }

    return resultado
  }, [
    lugares,
    lugaresParaConocer,
    lugaresParaComer,
    filtroSeccion,
    categoriaSeleccionada
  ])

  function renderTarjetaLugar(lugar: Lugar) {
    const categoria = Array.isArray(lugar.categorias_lugar)
      ? lugar.categorias_lugar[0]
      : lugar.categorias_lugar

    const idCategoria = lugar.categoria_id ?? categoria?.id_categoria ?? null
    const IconoCategoria = obtenerIconoCategoria(idCategoria)
    const claseCategoria = obtenerClaseCategoria(idCategoria)

    return (
      <article
        key={lugar.id_lugar}
        className="lugar-card"
        role="button"
        tabIndex={0}
        onClick={() => manejarSeleccionLugar(lugar)}
        onKeyDown={evento => manejarTeclado(evento, lugar)}
      >
        <div className="lugar-imagen-contenedor">
          <img
            src={obtenerImagenGarantizada(lugar)}
            alt={lugar.nombre}
            className="lugar-imagen"
            loading="lazy"
            onError={evento => {
              const imagen = evento.currentTarget
              if (imagen.src.endsWith('restaurante.jpg')) return
              imagen.src = '/imagenes/lugares/restaurante.jpg'
            }}
          />
          <div className="lugar-imagen-overlay" />
          <div className={`lugar-categoria ${claseCategoria}`}>
            <IconoCategoria size={12} />
            <span>{obtenerNombreCategoria(lugar)}</span>
          </div>
        </div>

        <div className="lugar-contenido">
          <div className="lugar-titulo-fila">
            <h3>{lugar.nombre}</h3>
            <div className="lugar-flecha">
              <ChevronRight size={18} />
            </div>
          </div>

          <p className="lugar-descripcion">
            {obtenerDescripcion(lugar.descripcion)}
          </p>

          <div className="lugar-datos">
            <div className="lugar-dato">
              <MapPin size={14} />
              <span>{lugar.direccion || 'Dirección no disponible'}</span>
            </div>
            <div className="lugar-dato">
              <Clock3 size={14} />
              <span>{obtenerHorario(lugar.horario)}</span>
            </div>
            <div className="lugar-dato">
              <Ticket size={14} />
              <span>{obtenerCosto(lugar.costo_entrada)}</span>
            </div>
            {lugar.telefono && (
              <div className="lugar-dato">
                <Phone size={14} />
                <span>{lugar.telefono}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="lugar-boton"
            onClick={evento => {
              evento.stopPropagation()
              manejarSeleccionLugar(lugar)
            }}
          >
            <span>Ver detalle</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </article>
    )
  }

  function renderCategoriasDiscretas(tipo: 'conocer' | 'comer') {
    const fuente = tipo === 'conocer' ? lugaresParaConocer : lugaresParaComer
    const mapa = new Map<number, CategoriaLugar>()

    fuente.forEach(lugar => {
      const categoria = Array.isArray(lugar.categorias_lugar)
        ? lugar.categorias_lugar[0]
        : lugar.categorias_lugar

      const idCat = Number(lugar.categoria_id ?? categoria?.id_categoria ?? 0)

      if (idCat > 0) {
        let nombreCat = categoria?.nombre
        if (!nombreCat) {
          switch (idCat) {
            case 1: nombreCat = 'Histórico'; break
            case 2: nombreCat = 'Religioso'; break
            case 3: nombreCat = 'Cultural'; break
            case 4: nombreCat = 'Arqueológico'; break
            case 5: nombreCat = 'Natural'; break
            case 6: nombreCat = 'Recreativo'; break
            case 7: nombreCat = 'Restaurante'; break
            case 8: nombreCat = 'Mercado'; break
            default: nombreCat = 'Categoría'
          }
        }

        mapa.set(idCat, {
          id_categoria: idCat,
          nombre: nombreCat,
          descripcion: categoria?.descripcion || null
        })
      }
    })

    const categorias = Array.from(mapa.values()).sort((a, b) => a.id_categoria - b.id_categoria)

    if (categorias.length === 0) return null

    return (
      <div className="tags-categorias-contenedor">
        <div className="tags-scroll">
          {categorias.map(cat => {
            const seleccionada = categoriaSeleccionada === cat.id_categoria

            return (
              <button
                type="button"
                key={cat.id_categoria}
                className={`tag-categoria ${seleccionada ? 'tag-categoria-activo' : ''}`}
                onClick={() => {
                  setCategoriaSeleccionada(seleccionada ? null : cat.id_categoria)
                  setFiltroSeccion(tipo)
                }}
              >
                <span>{cat.nombre}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  function renderEncabezadoSeccion(tipo: 'conocer' | 'comer') {
    const esComer = tipo === 'comer'

    return (
      <div className="seccion-info">
        <div className={`seccion-icono ${esComer ? 'seccion-icono-comer' : 'seccion-icono-conocer'}`}>
          {esComer ? <Utensils size={17} /> : <Compass size={17} />}
        </div>
        <div className="seccion-texto">
          <h2>{esComer ? 'Lugares para comer' : 'Lugares para conocer'}</h2>
          <p>
            {esComer
              ? 'Mercados, restaurantes y espacios tradicionales.'
              : 'Sitios históricos, religiosos, culturales y naturales.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="lugares-pagina">
        {/* Encabezado minimalista estilo texto limpio con Volver a la derecha */}
        <header className="encabezado-limpio">
          <div className="encabezado-info">
            <h1 className="titulo-principal">Descubre Cholula</h1>
            <span className="subtitulo-seccion">Mis rutas</span>
          </div>
          <button
            type="button"
            className="boton-volver-texto"
            onClick={volver}
            aria-label="Volver"
          >
            Volver
          </button>
        </header>

        <main className="lugares-contenido-principal">
          <div className="selector-seccion">
            <button
              type="button"
              className={filtroSeccion === 'todos' ? 'selector-activo' : ''}
              onClick={() => cambiarSeccion('todos')}
            >
              <Landmark size={14} />
              <span>Todos</span>
            </button>

            <button
              type="button"
              className={filtroSeccion === 'conocer' ? 'selector-activo' : ''}
              onClick={() => cambiarSeccion('conocer')}
            >
              <Compass size={14} />
              <span>Conocer</span>
            </button>

            <button
              type="button"
              className={filtroSeccion === 'comer' ? 'selector-activo' : ''}
              onClick={() => cambiarSeccion('comer')}
            >
              <Utensils size={14} />
              <span>Comer</span>
            </button>
          </div>

          {cargando ? (
            <div className="estado-cargando">
              <h2>Cargando lugares...</h2>
            </div>
          ) : error ? (
            <div className="estado-mensaje estado-error">
              <h2>No pudimos cargar los lugares</h2>
              <p>{error}</p>
              <button type="button" className="boton-reintentar" onClick={() => window.location.reload()}>
                <RefreshCw size={14} /> Intentar nuevamente
              </button>
            </div>
          ) : lugares.length === 0 ? (
            <div className="estado-mensaje">
              <h2>Aún no hay lugares disponibles</h2>
            </div>
          ) : (
            <>
              {filtroSeccion === 'todos' ? (
                <>
                  {lugaresParaConocer.length > 0 && (
                    <section className="lugares-seccion">
                      {renderEncabezadoSeccion('conocer')}
                      {renderCategoriasDiscretas('conocer')}
                      <div className="lugares-grid">
                        {lugaresParaConocer.map(renderTarjetaLugar)}
                      </div>
                    </section>
                  )}

                  {lugaresParaComer.length > 0 && (
                    <section className="lugares-seccion">
                      {renderEncabezadoSeccion('comer')}
                      {renderCategoriasDiscretas('comer')}
                      <div className="lugares-grid">
                        {lugaresParaComer.map(renderTarjetaLugar)}
                      </div>
                    </section>
                  )}
                </>
              ) : (
                <section className="lugares-seccion">
                  {renderEncabezadoSeccion(filtroSeccion)}
                  {renderCategoriasDiscretas(filtroSeccion)}

                  {lugaresVisibles.length === 0 ? (
                    <div className="estado-mensaje estado-vacio-filtro">
                      <h2>No hay lugares en esta categoría</h2>
                      <button
                        type="button"
                        className="boton-reintentar"
                        onClick={() => setCategoriaSeleccionada(null)}
                      >
                        Ver todos
                      </button>
                    </div>
                  ) : (
                    <div className="lugares-grid">
                      {lugaresVisibles.map(renderTarjetaLugar)}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </main>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .lugares-pagina {
          min-height: 100vh;
          background: #fbf8f5;
          color: #2b1717;
        }

        /* Estilo del encabezado limpio minimalista */
        .encabezado-limpio {
          width: min(1200px, 100%);
          margin: 0 auto;
          padding: 28px 24px 16px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }

        .encabezado-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .titulo-principal {
          margin: 0;
          font-size: 26px;
          font-weight: 800;
          color: #6b1414;
          line-height: 1.2;
        }

        .subtitulo-seccion {
          font-size: 13px;
          color: #725d53;
          font-weight: 500;
        }

        .boton-volver-texto {
          background: transparent;
          border: none;
          color: #831818;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          padding: 4px 8px;
          transition: opacity 0.2s;
        }

        .boton-volver-texto:hover {
          opacity: 0.75;
          text-decoration: underline;
        }

        .lugares-contenido-principal {
          width: min(1200px, 100%);
          margin: 0 auto;
          padding: 10px 24px 50px;
        }

        .selector-seccion {
          display: flex;
          gap: 5px;
          padding: 4px;
          background: #fff;
          border: 1px solid #ebdcd0;
          border-radius: 12px;
          width: fit-content;
          box-shadow: 0 3px 12px rgba(131, 24, 24, 0.03);
          margin-bottom: 22px;
        }

        .selector-seccion button {
          min-height: 36px;
          padding: 0 14px;
          border: 0;
          border-radius: 9px;
          background: transparent;
          color: #725d53;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s;
        }

        .selector-seccion button:hover {
          background: #fdf5f5;
          color: #831818;
        }

        .selector-seccion button.selector-activo {
          background: #831818;
          color: #fff;
          box-shadow: 0 2px 8px rgba(131, 24, 24, 0.2);
        }

        .lugares-seccion {
          margin-bottom: 32px;
        }

        .seccion-info {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .seccion-icono {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .seccion-icono-conocer {
          background: #fdf5f5;
          color: #831818;
          border: 1px solid #f2e2e2;
        }

        .seccion-icono-comer {
          background: #fff5f5;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .seccion-texto h2 {
          margin: 0;
          font-size: 18px;
          color: #2b1717;
          font-weight: 800;
        }

        .seccion-texto p {
          margin: 2px 0 0;
          color: #725d53;
          font-size: 11.5px;
        }

        /* Tags de categoría discretos y elegantes */
        .tags-categorias-contenedor {
          margin-bottom: 16px;
          overflow: hidden;
        }

        .tags-scroll {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: none;
        }

        .tags-scroll::-webkit-scrollbar {
          display: none;
        }

        .tag-categoria {
          flex-shrink: 0;
          height: 30px;
          padding: 0 12px;
          border: 1px solid #e3d2c5;
          border-radius: 15px;
          background: #fff;
          color: #5a453d;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tag-categoria:hover {
          border-color: #831818;
          color: #831818;
          background: #fdf8f6;
        }

        .tag-categoria-activo {
          border-color: #831818;
          background: #831818;
          color: #fff;
        }

        .lugar-categoria {
          position: absolute;
          top: 10px;
          left: 10px;
          padding: 3px 9px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10.5px;
          font-weight: 700;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }

        .categoria-historico { background: #fae8d4; color: #9a531e; }
        .categoria-religioso { background: #f3e8f3; color: #6b3fa0; }
        .categoria-cultural { background: #e8eaf6; color: #3f51b5; }
        .categoria-arqueologico { background: #fef3c7; color: #b45309; }
        .categoria-natural { background: #e6f4ea; color: #137333; }
        .categoria-recreativo { background: #e0f2fe; color: #0369a1; }
        .categoria-restaurante { background: #fee2e2; color: #b91c1c; }
        .categoria-mercado { background: #fef3c7; color: #92400e; }
        .categoria-default { background: #f1f1f1; color: #555; }

        .lugares-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .lugar-card {
          background: #fff;
          border: 1px solid #ebdcd0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 3px 12px rgba(131, 24, 24, 0.03);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .lugar-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 22px rgba(131, 24, 24, 0.07);
          border-color: #dfc4b2;
        }

        .lugar-imagen-contenedor {
          height: 180px;
          position: relative;
          background: #eee;
        }

        .lugar-imagen {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }

        .lugar-card:hover .lugar-imagen {
          transform: scale(1.02);
        }

        .lugar-imagen-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.02) 50%, rgba(0,0,0,0.4) 100%);
        }

        .lugar-contenido {
          padding: 15px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .lugar-titulo-fila {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 5px;
        }

        .lugar-titulo-fila h3 {
          margin: 0;
          font-size: 15.5px;
          font-weight: 800;
          color: #2b1717;
          line-height: 1.3;
        }

        .lugar-flecha {
          color: #831818;
          background: #fdf5f5;
          border-radius: 7px;
          width: 25px;
          height: 25px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .lugar-descripcion {
          margin: 0 0 10px;
          color: #725d53;
          font-size: 12px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .lugar-datos {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-top: 10px;
          border-top: 1px solid #f2ece6;
          margin-bottom: auto;
        }

        .lugar-dato {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #5a453d;
          font-size: 11px;
        }

        .lugar-dato svg {
          color: #831818;
          flex-shrink: 0;
        }

        .lugar-boton {
          width: 100%;
          min-height: 36px;
          margin-top: 12px;
          border: none;
          border-radius: 10px;
          background: #831818;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px;
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }

        .lugar-boton:hover {
          background: #6b1414;
        }

        .estado-cargando, .estado-mensaje {
          text-align: center;
          padding: 35px 20px;
          background: #fff;
          border-radius: 16px;
          border: 1px solid #ebdcd0;
        }

        .estado-mensaje h2 {
          color: #2b1717;
          font-size: 16px;
          margin: 0 0 6px;
        }

        .boton-reintentar {
          background: #831818;
          color: #fff;
          border: none;
          padding: 8px 14px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 8px;
        }

        @media (max-width: 768px) {
          .lugares-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  )
}