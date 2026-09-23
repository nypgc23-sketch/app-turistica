// Página principal de gastronomía

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  obtenerPlatillos,
  obtenerBebidas,
  obtenerLugaresPorPlatillo,
  obtenerLugaresPorBebida
} from '../services/gastronomiaService'

// Tipos
type Categoria = 'inicio' | 'platillos' | 'bebidas'

type Platillo = {
  id_platillo: number
  nombre: string
  descripcion: string | null
  preparacion: string | null
  ingredientes: string | string[] | null
  tipo_comida: string | null
  precio: number | null
  estado: boolean | null
  id_categoria: number | null
  temporada?: string | null // <-- Campo agregado
  categorias_platillo?: {
    id_categoria: number
    nombre: string
    descripcion: string | null
  } | null
  imagenes_platillo?: {
    url: string
    es_principal: boolean
    orden: number
  }[]
}

type Bebida = {
  id_bebida: number
  nombre: string
  descripcion: string | null
  preparacion: string | null
  ingredientes: string | string[] | null
  tipo_bebida: string | null
  precio: number | null
  estado: boolean | null
  temporada?: string | null // <-- Campo agregado
  imagenes_bebida?: {
    url: string
    es_principal: boolean
    orden: number
  }[]
}

type Lugar = {
  id_lugar: number
  nombre: string
  descripcion: string | null
  direccion: string | null
  categoria_id: number | null
  latitud: number | null
  longitud: number | null
  horario: string | null
  telefono: string | null
  costo_entrada: number | null
  imagenes_lugar?: {
    url: string
    es_principal: boolean
    orden: number
  }[]
}

type GastronomiaProps = {
  volver: () => void
  iniciarSesion?: () => void
  onVerLugar?: (idLugar: number) => void
  itemInicial?: { id: number; tipo: 'platillo' | 'bebida' } | null
}

type ContenidoSeleccionado =
  | { tipo: 'platillo'; id: number; nombre: string }
  | { tipo: 'bebida'; id: number; nombre: string }
  | null

// Componente principal
export default function Gastronomia({
  volver,
  iniciarSesion,
  onVerLugar,
  itemInicial
}: GastronomiaProps) {
  // Estados de navegación
  const [categoria, setCategoria] = useState<Categoria>('inicio')
  const [temporadaFiltro, setTemporadaFiltro] = useState<string>('Todo el año') // <-- Filtro de temporada

  // Estados de datos
  const [platillos, setPlatillos] = useState<Platillo[]>([])
  const [bebidas, setBebidas] = useState<Bebida[]>([])
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState('')

  // Estado del contenido seleccionado
  const [contenidoSeleccionado, setContenidoSeleccionado] =
    useState<ContenidoSeleccionado>(null)

  // Estados de sesión y favoritos
  const [sesionActiva, setSesionActiva] = useState(false)
  const [favorito, setFavorito] = useState(false)
  const [procesandoFavorito, setProcesandoFavorito] = useState(false)

  // Estados de lugares asociados
  const [lugaresAsociados, setLugaresAsociados] = useState<Lugar[]>([])
  const [cargandoLugares, setCargandoLugares] = useState(false)

  // Estado para mostrar/ocultar detalles
  const [mostrarDetalles, setMostrarDetalles] = useState(false)

  // Al cargar el componente, comprobar sesión y cargar datos
  useEffect(() => {
    comprobarSesion()
    cargarPlatillos()
    cargarBebidas()
  }, [])

  // Auto-seleccionar elemento si proviene de Favoritos (itemInicial)
  useEffect(() => {
    if (!itemInicial) return

    if (itemInicial.tipo === 'platillo' && platillos.length > 0) {
      const p = platillos.find((item) => item.id_platillo === itemInicial.id)
      if (p) seleccionarPlatillo(p)
    } else if (itemInicial.tipo === 'bebida' && bebidas.length > 0) {
      const b = bebidas.find((item) => item.id_bebida === itemInicial.id)
      if (b) seleccionarBebida(b)
    }
  }, [itemInicial, platillos, bebidas])

  async function comprobarSesion() {
    try {
      const { data } = await supabase.auth.getSession()
      setSesionActiva(!!data.session)
    } catch (error) {
      console.error('Error comprobando sesión:', error)
      setSesionActiva(false)
    }
  }

  async function cargarPlatillos() {
    setCargando(true)
    try {
      const { data, error } = await obtenerPlatillos()
      if (error) {
        console.error('Error cargando platillos:', error)
        setResultado('No se pudieron cargar los platillos.')
        return
      }
      const datos = (data || []).map((platillo: any) => ({
        ...platillo,
        categorias_platillo: Array.isArray(platillo.categorias_platillo)
          ? platillo.categorias_platillo[0] || null
          : platillo.categorias_platillo || null
      }))
      setPlatillos(datos as Platillo[])
    } catch (error) {
      console.error(error)
      setResultado('Ocurrió un error al cargar los platillos.')
    } finally {
      setCargando(false)
    }
  }

  async function cargarBebidas() {
    try {
      const { data, error } = await obtenerBebidas()
      if (error) {
        console.error('Error cargando bebidas:', error)
        setResultado('No se pudieron cargar las bebidas.')
        return
      }
      setBebidas(data || [])
    } catch (error) {
      console.error(error)
      setResultado('Ocurrió un error al cargar las bebidas.')
    }
  }

  async function cargarLugaresPlatillo(idPlatillo: number) {
    setCargandoLugares(true)
    try {
      const { data, error } = await obtenerLugaresPorPlatillo(idPlatillo)
      if (error) {
        setLugaresAsociados([])
        return
      }
      setLugaresAsociados(data || [])
    } catch (error) {
      setLugaresAsociados([])
    } finally {
      setCargandoLugares(false)
    }
  }

  async function cargarLugaresBebida(idBebida: number) {
    setCargandoLugares(true)
    try {
      const { data, error } = await obtenerLugaresPorBebida(idBebida)
      if (error) {
        setLugaresAsociados([])
        return
      }
      setLugaresAsociados(data || [])
    } catch (error) {
      setLugaresAsociados([])
    } finally {
      setCargandoLugares(false)
    }
  }

  async function seleccionarPlatillo(platillo: Platillo) {
    setContenidoSeleccionado({
      tipo: 'platillo',
      id: platillo.id_platillo,
      nombre: platillo.nombre
    })
    setResultado('')
    setLugaresAsociados([])
    setMostrarDetalles(false)
    await comprobarFavorito('platillo', platillo.id_platillo)
    await cargarLugaresPlatillo(platillo.id_platillo)
  }

  async function seleccionarBebida(bebida: Bebida) {
    setContenidoSeleccionado({
      tipo: 'bebida',
      id: bebida.id_bebida,
      nombre: bebida.nombre
    })
    setResultado('')
    setLugaresAsociados([])
    setMostrarDetalles(false)
    await comprobarFavorito('bebida', bebida.id_bebida)
    await cargarLugaresBebida(bebida.id_bebida)
  }

  async function obtenerUsuarioBD() {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) return null
    const { data, error } = await supabase
      .from('usuarios')
      .select('id_usuario')
      .eq('auth_user_id', authData.user.id)
      .single()
    if (error || !data) return null
    return data.id_usuario
  }

  async function comprobarFavorito(tipo: 'platillo' | 'bebida', idContenido: number) {
    try {
      const usuarioId = await obtenerUsuarioBD()
      if (!usuarioId) {
        setFavorito(false)
        return
      }
      const { data } = await supabase
        .from('favoritos')
        .select('id_favorito')
        .eq('id_usuario', usuarioId)
        .eq('tipo_contenido', tipo)
        .eq('id_contenido', idContenido)
        .maybeSingle()
      setFavorito(!!data)
    } catch (error) {
      setFavorito(false)
    }
  }

  async function cambiarFavorito() {
    if (!contenidoSeleccionado) return
    if (!sesionActiva) {
      setResultado('Necesitas iniciar sesión para guardar este contenido en favoritos.')
      if (iniciarSesion) iniciarSesion()
      return
    }
    setProcesandoFavorito(true)
    setResultado('')
    try {
      const usuarioId = await obtenerUsuarioBD()
      if (!usuarioId) {
        setResultado('No se encontró tu usuario. Inicia sesión nuevamente.')
        return
      }
      const tipo = contenidoSeleccionado.tipo
      const idContenido = contenidoSeleccionado.id
      if (favorito) {
        await supabase
          .from('favoritos')
          .delete()
          .eq('id_usuario', usuarioId)
          .eq('tipo_contenido', tipo)
          .eq('id_contenido', idContenido)
        setFavorito(false)
        setResultado('Se quitó de favoritos.')
      } else {
        const { error } = await supabase
          .from('favoritos')
          .insert({
            id_usuario: usuarioId,
            tipo_contenido: tipo,
            id_contenido: idContenido
          })
        if (error && error.code === '23505') {
          setFavorito(true)
          setResultado('Este contenido ya está en tus favoritos.')
        } else {
          setFavorito(true)
          setResultado('Se agregó a tus favoritos.')
        }
      }
    } catch (error) {
      setResultado('Ocurrió un error al actualizar favoritos.')
    } finally {
      setProcesandoFavorito(false)
    }
  }

  function volverDeFicha() {
    setContenidoSeleccionado(null)
    setResultado('')
    setFavorito(false)
    setLugaresAsociados([])
    setMostrarDetalles(false)
  }

  function obtenerImagenPrincipal(item: Platillo | Bebida): string {
    if ('imagenes_platillo' in item && item.imagenes_platillo && item.imagenes_platillo.length > 0) {
      const principal = item.imagenes_platillo.find((img) => img.es_principal)
      return principal ? principal.url : item.imagenes_platillo[0].url
    }
    if ('imagenes_bebida' in item && item.imagenes_bebida && item.imagenes_bebida.length > 0) {
      const principal = item.imagenes_bebida.find((img) => img.es_principal)
      return principal ? principal.url : item.imagenes_bebida[0].url
    }
    return 'imagenes_platillo' in item
      ? '/imagenes/gastronomia/platillo.jpg'
      : '/imagenes/gastronomia/bebida.jpg'
  }

  function obtenerImagenLugar(lugar: Lugar): string {
    if (lugar.imagenes_lugar && lugar.imagenes_lugar.length > 0) {
      const principal = lugar.imagenes_lugar.find((img) => img.es_principal)
      return principal ? principal.url : lugar.imagenes_lugar[0].url
    }
    const nombreLower = lugar.nombre.toLowerCase()
    if (nombreLower.includes('mercado') || lugar.categoria_id === 8) {
      return '/imagenes/mercado.jpg'
    }
    return '/imagenes/lugares/restaurante.jpg'
  }

  function verLugar(idLugar: number) {
    if (onVerLugar) onVerLugar(idLugar)
  }

  function formatearIngredientes(ing: string | string[] | null): string {
    if (!ing) return 'No especificados'
    if (Array.isArray(ing)) return ing.join(', ')
    return ing
  }

  function renderInicio() {
    return (
      <>
        <div className="gastronomia-intro">
          <h2>Gastronomía de Cholula</h2>
          <p>Descubre los sabores tradicionales de San Andrés Cholula.</p>
        </div>
        <div className="gastronomia-categorias">
          <button
            type="button"
            className="gastronomia-categoria-card"
            onClick={() => { setCategoria('platillos'); setTemporadaFiltro('Todo el año'); }}
          >
            <div className="gastronomia-categoria-imagen platillos-imagen">
              <img src="/imagenes/gastronomia/gastronomia.jpg" alt="Gastronomía de Cholula" />
              <span>Platillos</span>
            </div>
            <div className="gastronomia-categoria-contenido">
              <h3>Platillos típicos</h3>
              <p>Conoce los sabores y preparaciones tradicionales de Cholula.</p>
              <strong>Ver platillos</strong>
            </div>
          </button>
          <button
            type="button"
            className="gastronomia-categoria-card"
            onClick={() => { setCategoria('bebidas'); setTemporadaFiltro('Todo el año'); }}
          >
            <div className="gastronomia-categoria-imagen bebidas-imagen">
              <img src="/imagenes/gastronomia/bebidas.jpg" alt="Bebidas tradicionales de Cholula" />
              <span>Bebidas</span>
            </div>
            <div className="gastronomia-categoria-contenido">
              <h3>Bebidas tradicionales</h3>
              <p>Descubre bebidas tradicionales de la región.</p>
              <strong>Ver bebidas</strong>
            </div>
          </button>
        </div>
      </>
    )
  }

  // Componente de botones de filtro de temporada
  function renderFiltrosTemporada() {
    return (
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => setTemporadaFiltro('Todo el año')}
          style={{
            padding: '6px 14px',
            borderRadius: '16px',
            border: '1px solid #dcd6d3',
            backgroundColor: temporadaFiltro === 'Todo el año' ? '#B3282D' : '#fff',
            color: temporadaFiltro === 'Todo el año' ? '#fff' : '#6e6462',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Todo el año
        </button>
        <button
          type="button"
          onClick={() => setTemporadaFiltro('Temporada Especial')}
          style={{
            padding: '6px 14px',
            borderRadius: '16px',
            border: '1px solid #dcd6d3',
            backgroundColor: temporadaFiltro === 'Temporada Especial' ? '#B3282D' : '#fff',
            color: temporadaFiltro === 'Temporada Especial' ? '#fff' : '#6e6462',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Temporada Especial
        </button>
      </div>
    )
  }

  // Listado de platillos con filtro de temporada
  function renderPlatillos() {
    const platillosFiltrados = platillos.filter((item) => {
      const temp = item.temporada || 'Todo el año'
      if (temporadaFiltro === 'Todo el año') {
        return temp.toLowerCase().includes('todo el año')
      } else {
        return !temp.toLowerCase().includes('todo el año')
      }
    })

    return (
      <>
        <div className="gastronomia-seccion-header">
          <button type="button" className="link-button" onClick={() => setCategoria('inicio')}>
            Volver a gastronomía
          </button>
          <h2>Platillos típicos</h2>
          <p>Selecciona un platillo para consultar su información.</p>
        </div>

        {renderFiltrosTemporada()}

        {cargando ? (
          <div className="dashboard-card"><h3>Cargando platillos...</h3></div>
        ) : platillosFiltrados.length === 0 ? (
          <div className="dashboard-card">
            <h3>No hay platillos disponibles</h3>
            <p>No se encontraron registros para esta selección.</p>
          </div>
        ) : (
          <div className="gastronomia-lista">
            {platillosFiltrados.map((platillo) => (
              <button
                type="button"
                className="gastronomia-item"
                key={platillo.id_platillo}
                onClick={() => seleccionarPlatillo(platillo)}
              >
                <img
                  src={obtenerImagenPrincipal(platillo)}
                  alt={platillo.nombre}
                  className="gastronomia-item-imagen"
                />
                <div className="gastronomia-item-contenido">
                  <h3>{platillo.nombre}</h3>
                  <p>{platillo.descripcion || 'Platillo tradicional de la región de Cholula.'}</p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    {platillo.tipo_comida && (
                      <span className="gastronomia-tipo">{platillo.tipo_comida}</span>
                    )}
                    <span className="gastronomia-tipo" style={{ backgroundColor: '#f2ece9', color: '#400d0f' }}>
                      {platillo.temporada || 'Todo el año'}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </>
    )
  }

  // Listado de bebidas con filtro de temporada
  function renderBebidas() {
    const bebidasFiltradas = bebidas.filter((item) => {
      const temp = item.temporada || 'Todo el año'
      if (temporadaFiltro === 'Todo el año') {
        return temp.toLowerCase().includes('todo el año')
      } else {
        return !temp.toLowerCase().includes('todo el año')
      }
    })

    return (
      <>
        <div className="gastronomia-seccion-header">
          <button type="button" className="link-button" onClick={() => setCategoria('inicio')}>
            Volver a gastronomía
          </button>
          <h2>Bebidas tradicionales</h2>
          <p>Selecciona una bebida para consultar su información.</p>
        </div>

        {renderFiltrosTemporada()}

        {bebidasFiltradas.length === 0 ? (
          <div className="dashboard-card">
            <h3>No hay bebidas disponibles</h3>
            <p>No se encontraron registros para esta selección.</p>
          </div>
        ) : (
          <div className="gastronomia-lista">
            {bebidasFiltradas.map((bebida) => (
              <button
                type="button"
                className="gastronomia-item"
                key={bebida.id_bebida}
                onClick={() => seleccionarBebida(bebida)}
              >
                <img
                  src={obtenerImagenPrincipal(bebida)}
                  alt={bebida.nombre}
                  className="gastronomia-item-imagen"
                />
                <div className="gastronomia-item-contenido">
                  <h3>{bebida.nombre}</h3>
                  <p>{bebida.descripcion || 'Bebida tradicional de la región.'}</p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    {bebida.tipo_bebida && (
                      <span className="gastronomia-tipo">{bebida.tipo_bebida}</span>
                    )}
                    <span className="gastronomia-tipo" style={{ backgroundColor: '#f2ece9', color: '#400d0f' }}>
                      {bebida.temporada || 'Todo el año'}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </>
    )
  }

  function renderLugaresAsociados(esPlatillo: boolean) {
    const ID_RESTAURANTE = 7
    const ID_MERCADO = 8

    let restaurantes = lugaresAsociados.filter(
      (lugar) => Number(lugar.categoria_id) === ID_RESTAURANTE
    )
    let mercados = lugaresAsociados.filter(
      (lugar) => Number(lugar.categoria_id) === ID_MERCADO
    )

    restaurantes = restaurantes.filter(
      (lugar, index, self) => index === self.findIndex((l) => l.id_lugar === lugar.id_lugar)
    )
    mercados = mercados.filter(
      (lugar, index, self) => index === self.findIndex((l) => l.id_lugar === lugar.id_lugar)
    )

    if (restaurantes.length === 0 && mercados.length === 0) {
      return (
        <div className="gastronomia-lugares-asociados">
          <h3>Dónde encontrarlo</h3>
          <p>
            No hay restaurantes o mercados registrados para este{' '}
            {esPlatillo ? 'platillo' : 'bebida'}.
          </p>
        </div>
      )
    }

    const renderLista = (lugares: Lugar[], titulo: string) => {
      if (lugares.length === 0) return null
      return (
        <div className="lugares-seccion">
          <h4>{titulo}</h4>
          <div className="lugares-lista">
            {lugares.map((lugar) => (
              <div key={lugar.id_lugar} className="lugar-card">
                <img
                  src={obtenerImagenLugar(lugar)}
                  alt={lugar.nombre}
                  className="lugar-card-imagen"
                />
                <div className="lugar-card-info">
                  <h4>{lugar.nombre}</h4>
                  <p>{lugar.direccion || 'Dirección no disponible'}</p>
                </div>
                <button
                  type="button"
                  className="btn-ver-lugar"
                  onClick={() => verLugar(lugar.id_lugar)}
                >
                  Ver lugar
                </button>
              </div>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="gastronomia-lugares-asociados">
        <h3>Dónde encontrarlo</h3>
        {cargandoLugares ? (
          <p>Cargando lugares...</p>
        ) : (
          <>
            {renderLista(restaurantes, 'Restaurantes')}
            {renderLista(mercados, 'Mercados')}
          </>
        )}
      </div>
    )
  }

  function renderFicha() {
    if (!contenidoSeleccionado) return null

    const esPlatillo = contenidoSeleccionado.tipo === 'platillo'
    const platillo = esPlatillo
      ? platillos.find((item) => item.id_platillo === contenidoSeleccionado.id)
      : null
    const bebida = !esPlatillo
      ? bebidas.find((item) => item.id_bebida === contenidoSeleccionado.id)
      : null

    if (!platillo && !bebida) {
      return (
        <div className="dashboard-card">
          <p>No se encontró la información del contenido seleccionado.</p>
          <button type="button" className="link-button" onClick={volverDeFicha}>
            Volver
          </button>
        </div>
      )
    }

    const nombre = platillo?.nombre || bebida?.nombre || ''
    const descripcion = platillo?.descripcion || bebida?.descripcion || 'No hay una descripción disponible.'
    const preparacion = platillo?.preparacion || bebida?.preparacion || null
    const ingredientes = platillo?.ingredientes || bebida?.ingredientes || null
    const temporadaItem = platillo?.temporada || bebida?.temporada || 'Todo el año'
    const imagen = platillo
      ? obtenerImagenPrincipal(platillo)
      : obtenerImagenPrincipal(bebida as Bebida)

    const toggleDetalles = () => setMostrarDetalles(!mostrarDetalles)

    return (
      <div className="gastronomia-ficha">
        <button type="button" className="link-button" onClick={volverDeFicha}>
          Volver
        </button>

        <div className="gastronomia-ficha-card">
          <img src={imagen} alt={nombre} className="gastronomia-ficha-imagen" />

          <div className="gastronomia-ficha-contenido">
            <span className="gastronomia-ficha-tipo">
              {esPlatillo ? 'Platillo típico' : 'Bebida tradicional'}
            </span>

            <h2>{nombre}</h2>
            <p className="descripcion">{descripcion}</p>

            <p><strong>Disponibilidad:</strong> {temporadaItem}</p>

            {platillo?.tipo_comida && (
              <p><strong>Tipo de comida:</strong> {platillo.tipo_comida}</p>
            )}
            {bebida?.tipo_bebida && (
              <p><strong>Tipo de bebida:</strong> {bebida.tipo_bebida}</p>
            )}
            {platillo?.categorias_platillo && (
              <p><strong>Categoría:</strong> {platillo.categorias_platillo.nombre}</p>
            )}

            {(ingredientes || preparacion) && (
              <button
                type="button"
                className={`btn-toggle-detalles ${mostrarDetalles ? 'active' : ''}`}
                onClick={toggleDetalles}
              >
                {mostrarDetalles ? 'Ocultar' : 'Mostrar'} ingredientes y preparación
              </button>
            )}

            {mostrarDetalles && (
              <div className="detalles-container">
                {ingredientes && (
                  <div className="gastronomia-ingredientes">
                    <h4>Ingredientes</h4>
                    <p>{formatearIngredientes(ingredientes)}</p>
                  </div>
                )}
                {preparacion && (
                  <div className="gastronomia-preparacion">
                    <h4>Preparación</h4>
                    <p>{preparacion}</p>
                  </div>
                )}
              </div>
            )}

            <div className="gastronomia-favorito-area">
              {sesionActiva ? (
                <button
                  type="button"
                  className={`btn-favorito ${favorito ? 'activo' : ''}`}
                  onClick={cambiarFavorito}
                  disabled={procesandoFavorito}
                >
                  {procesandoFavorito
                    ? 'Guardando...'
                    : favorito
                    ? 'Quitar de favoritos'
                    : 'Agregar a favoritos'}
                </button>
              ) : (
                <div className="dashboard-card sin-sesion">
                  <p>Inicia sesión para guardar este contenido en tus favoritos.</p>
                  <button
                    type="button"
                    className="btn-favorito"
                    onClick={() => {
                      if (iniciarSesion) iniciarSesion()
                    }}
                  >
                    Iniciar sesión
                  </button>
                </div>
              )}
              {resultado && <p className="resultado">{resultado}</p>}
            </div>

            {renderLugaresAsociados(esPlatillo)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="app-page gastronomia-page">
      <header className="app-header">
        <div>
          <h1>San Andrés Cholula</h1>
          <p>Gastronomía</p>
        </div>
        <button 
          type="button" 
          className="link-button" 
          onClick={() => {
            if (contenidoSeleccionado) {
              if (itemInicial) {
                volver();
              } else {
                volverDeFicha();
              }
            } else if (categoria !== 'inicio') {
              setCategoria('inicio');
            } else {
              volver();
            }
          }}
        >
          Volver
        </button>
      </header>

      <section className="content-area">
        {contenidoSeleccionado
          ? renderFicha()
          : categoria === 'inicio'
          ? renderInicio()
          : categoria === 'platillos'
          ? renderPlatillos()
          : renderBebidas()} 
      </section>
    </main>
  )
}