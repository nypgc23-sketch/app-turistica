import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type FavoritoItem = {
  id_favorito: number
  id_usuario: number
  tipo_contenido: 'platillo' | 'bebida' | 'lugar'
  id_contenido: number
  fecha_registro: string | null
  platillo?: {
    id_platillo: number
    nombre: string
    descripcion: string | null
    imagenes_platillo?: { url: string; es_principal: boolean }[]
  }
  bebida?: {
    id_bebida: number
    nombre: string
    descripcion: string | null
    imagenes_bebida?: { url: string; es_principal: boolean }[]
  }
  lugar?: {
    id_lugar: number
    nombre: string
    descripcion: string | null
    direccion: string | null
    categorias_lugar?: {
      id_categoria: number
      nombre: string
      descripcion: string | null
    } | null
    imagenes_lugar?: { url: string; es_principal: boolean }[]
  }
}

type FavoritosProps = {
  volver: () => void
  seleccionarLugar: (lugar: { id_lugar: number; nombre: string }) => void
  onVerGastronomia?: (item: { id: number; tipo: 'platillo' | 'bebida' }) => void
}

export default function Favoritos({ volver, seleccionarLugar, onVerGastronomia }: FavoritosProps) {
  const [favoritos, setFavoritos] = useState<FavoritoItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eliminando, setEliminando] = useState<number | null>(null)
  const [filtro, setFiltro] = useState<'todos' | 'lugar' | 'platillo' | 'bebida'>('todos')

  useEffect(() => {
    async function cargarFavoritos() {
      setCargando(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setError('Necesitas iniciar sesión para consultar tus favoritos.')
        setCargando(false)
        return
      }

      try {
        let { data: usuarioData } = await supabase
          .from('usuarios')
          .select('id_usuario')
          .eq('auth_user_id', session.user.id)
          .maybeSingle()

        let usuarioId = usuarioData?.id_usuario

        if (!usuarioId && session.user.email) {
          const { data: usuarioPorCorreo } = await supabase
            .from('usuarios')
            .select('id_usuario')
            .eq('correo', session.user.email)
            .maybeSingle()
          
          usuarioId = usuarioPorCorreo?.id_usuario
        }

        if (!usuarioId) {
          setError('No se encontró tu usuario.')
          setCargando(false)
          return
        }

        const { data: favoritosData, error: favoritosError } = await supabase
          .from('favoritos')
          .select('*')
          .eq('id_usuario', usuarioId)
          .order('fecha_registro', { ascending: false })

        if (favoritosError) throw favoritosError

        const items = await Promise.all(
          (favoritosData || []).map(async (fav) => {
            if (fav.tipo_contenido === 'platillo') {
              const { data } = await supabase
                .from('platillos')
                .select('id_platillo, nombre, descripcion')
                .eq('id_platillo', fav.id_contenido)
                .maybeSingle()

              const { data: imgs } = await supabase
                .from('imagenes_platillo')
                .select('url, es_principal')
                .eq('id_platillo', fav.id_contenido)

              return {
                ...fav,
                platillo: data ? { ...data, imagenes_platillo: imgs || [] } : null
              }
            }

            if (fav.tipo_contenido === 'bebida') {
              const { data } = await supabase
                .from('bebidas')
                .select('id_bebida, nombre, descripcion')
                .eq('id_bebida', fav.id_contenido)
                .maybeSingle()

              const { data: imgs } = await supabase
                .from('imagenes_bebida')
                .select('url, es_principal')
                .eq('id_bebida', fav.id_contenido)

              return {
                ...fav,
                bebida: data ? { ...data, imagenes_bebida: imgs || [] } : null
              }
            }

            if (fav.tipo_contenido === 'lugar') {
              const { data: lugarData } = await supabase
                .from('lugares_turisticos')
                .select('id_lugar, nombre, descripcion, direccion, categoria_id')
                .eq('id_lugar', fav.id_contenido)
                .maybeSingle()

              if (!lugarData) return fav

              const [categoriaRes, imagenesRes] = await Promise.all([
                lugarData.categoria_id
                  ? supabase
                      .from('categorias_lugar')
                      .select('id_categoria, nombre, descripcion')
                      .eq('id_categoria', lugarData.categoria_id)
                      .maybeSingle()
                  : Promise.resolve({ data: null }),
                supabase
                  .from('imagenes_lugar')
                  .select('url, es_principal')
                  .eq('id_lugar', fav.id_contenido)
              ])

              return {
                ...fav,
                lugar: {
                  ...lugarData,
                  categorias_lugar: categoriaRes.data || null,
                  imagenes_lugar: imagenesRes.data || []
                }
              }
            }

            return fav
          })
        )

        setFavoritos(items.filter((item) => item !== null))
      } catch (error) {
        console.error('Error cargando favoritos:', error)
        setError('No se pudieron cargar tus favoritos.')
      } finally {
        setCargando(false)
      }
    }

    cargarFavoritos()
  }, [])

  async function manejarEliminar(idFavorito: number) {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) return

    let { data: usuarioData } = await supabase
      .from('usuarios')
      .select('id_usuario')
      .eq('auth_user_id', session.user.id)
      .maybeSingle()

    let usuarioId = usuarioData?.id_usuario

    if (!usuarioId && session.user.email) {
      const { data: usuarioPorCorreo } = await supabase
        .from('usuarios')
        .select('id_usuario')
        .eq('correo', session.user.email)
        .maybeSingle()
      
      usuarioId = usuarioPorCorreo?.id_usuario
    }

    if (!usuarioId) return

    setEliminando(idFavorito)

    const { error } = await supabase
      .from('favoritos')
      .delete()
      .eq('id_favorito', idFavorito)
      .eq('id_usuario', usuarioId)

    if (error) {
      console.error('Error eliminando favorito:', error)
      setEliminando(null)
      return
    }

    setFavoritos((prev) => prev.filter((fav) => fav.id_favorito !== idFavorito))
    setEliminando(null)
  }

  function obtenerImagen(item: FavoritoItem): string {
    if (item.tipo_contenido === 'platillo' && item.platillo) {
      const img = item.platillo.imagenes_platillo?.find((i) => i.es_principal)
      return img?.url || '/imagenes/cholula-bg.jpg'
    }
    if (item.tipo_contenido === 'bebida' && item.bebida) {
      const img = item.bebida.imagenes_bebida?.find((i) => i.es_principal)
      return img?.url || '/imagenes/cholula-bg.jpg'
    }
    if (item.tipo_contenido === 'lugar' && item.lugar) {
      const img = item.lugar.imagenes_lugar?.find((i) => i.es_principal)
      return img?.url || '/imagenes/cholula-bg.jpg'
    }
    return '/imagenes/cholula-bg.jpg'
  }

  function obtenerNombre(item: FavoritoItem): string {
    if (item.tipo_contenido === 'platillo') return item.platillo?.nombre || 'Platillo'
    if (item.tipo_contenido === 'bebida') return item.bebida?.nombre || 'Bebida'
    if (item.tipo_contenido === 'lugar') return item.lugar?.nombre || 'Lugar'
    return 'Sin nombre'
  }

  function obtenerDescripcion(item: FavoritoItem): string {
    if (item.tipo_contenido === 'platillo') return item.platillo?.descripcion || 'Platillo tradicional'
    if (item.tipo_contenido === 'bebida') return item.bebida?.descripcion || 'Bebida tradicional'
    if (item.tipo_contenido === 'lugar') return item.lugar?.descripcion || item.lugar?.direccion || 'Lugar turístico'
    return ''
  }

  function obtenerEtiqueta(item: FavoritoItem): string {
    if (item.tipo_contenido === 'platillo') return 'Platillo'
    if (item.tipo_contenido === 'bebida') return 'Bebida'
    return 'Lugar'
  }

  const favoritosFiltrados = filtro === 'todos'
    ? favoritos
    : favoritos.filter(f => f.tipo_contenido === filtro)

  return (
    <main className="app-page">
      <header className="app-header">
        <div>
          <h1>San Andrés Cholula</h1>
          <p>Mis favoritos</p>
        </div>
        <button className="link-button" onClick={volver}>
          Volver
        </button>
      </header>

      <section className="content-area">
        <h2>Mis favoritos</h2>

        <div className="favoritos-filtros">
          <button className={`filtro-pill ${filtro === 'todos' ? 'activo' : ''}`} onClick={() => setFiltro('todos')}>Todos</button>
          <button className={`filtro-pill ${filtro === 'lugar' ? 'activo' : ''}`} onClick={() => setFiltro('lugar')}>Lugares</button>
          <button className={`filtro-pill ${filtro === 'platillo' ? 'activo' : ''}`} onClick={() => setFiltro('platillo')}>Platillos</button>
          <button className={`filtro-pill ${filtro === 'bebida' ? 'activo' : ''}`} onClick={() => setFiltro('bebida')}>Bebidas</button>
        </div>

        {cargando && (
          <div className="dashboard-card">
            <p>Cargando favoritos...</p>
          </div>
        )}

        {error && (
          <div className="dashboard-card">
            <p>{error}</p>
          </div>
        )}

        {!cargando && !error && favoritos.length === 0 && (
          <div className="dashboard-card">
            <h3>Aún no tienes favoritos</h3>
            <p>Cuando guardes un lugar, platillo o bebida, aparecerá aquí.</p>
          </div>
        )}

        {!cargando && !error && favoritos.length > 0 && (
          <div className="favoritos-grid">
            {favoritosFiltrados.map((favorito) => (
              <article key={favorito.id_favorito} className="favorito-card">
                <div className="favorito-imagen-container">
                  <img
                    src={obtenerImagen(favorito)}
                    alt={obtenerNombre(favorito)}
                    className="favorito-imagen"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = '/imagenes/cholula-bg.jpg'
                    }}
                  />
                  <span className="favorito-tipo">{obtenerEtiqueta(favorito)}</span>
                </div>

                <div className="favorito-info">
                  <h3>{obtenerNombre(favorito)}</h3>
                  <p>{obtenerDescripcion(favorito)}</p>

                  {favorito.tipo_contenido === 'lugar' && favorito.lugar?.categorias_lugar && (
                    <p className="favorito-categoria">
                      Categoría: {favorito.lugar.categorias_lugar.nombre}
                    </p>
                  )}

                  <div className="favorito-acciones">
                    <button
                      className="primary-button"
                      onClick={() => {
                        if (favorito.tipo_contenido === 'lugar' && favorito.lugar) {
                          seleccionarLugar({
                            id_lugar: favorito.lugar.id_lugar,
                            nombre: favorito.lugar.nombre
                          })
                        } else if (onVerGastronomia) {
                          onVerGastronomia({
                            id: favorito.id_contenido,
                            tipo: favorito.tipo_contenido as 'platillo' | 'bebida'
                          })
                        }
                      }}
                    >
                      {favorito.tipo_contenido === 'lugar' ? 'Ver lugar' : 'Ver detalles'}
                    </button>

                    <button
                      className="secondary-button"
                      onClick={() => manejarEliminar(favorito.id_favorito)}
                      disabled={eliminando === favorito.id_favorito}
                    >
                      {eliminando === favorito.id_favorito ? 'Eliminando...' : 'Quitar de favoritos'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}