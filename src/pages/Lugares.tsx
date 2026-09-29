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

// Mapeo
function obtenerImagenGarantizada(nombre: string, imagenesApi?: { url: string; es_principal: boolean }[]): string {
  // Si la API trae una imagen válida que no sea un enlace roto, la usamos
  if (imagenesApi && imagenesApi.length > 0) {
    const principal = imagenesApi.find(img => img.es_principal)?.url || imagenesApi[0].url
    if (principal && principal.startsWith('http')) return principal
  }

  const n = nombre.toLowerCase()
  if (n.includes('pirámide') || n.includes('zona arqueológica')) return '/imagenes/lugares/cholula-bg.jpg'
  if (n.includes('museo')) return '/imagenes/lugares/restaurante_mural.jpg'
  if (n.includes('parroquia') || n.includes('acatepec')) return '/imagenes/lugares/mercado.jpg'
  if (n.includes('casita') || n.includes('oxxo')) return '/imagenes/lugares/restaurante.jpg'
  if (n.includes('mercado')) return '/imagenes/lugares/mercado.jpg'
  if (n.includes('mural') || n.includes('poblanos')) return '/imagenes/lugares/restaurante_mural.jpg'
  
  return '/imagenes/lugares/restaurante.jpg'
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
        const { data, error } = await obtenerLugares()

        if (error) {
          console.error(error)
          setResultado('No se pudieron cargar los lugares turísticos.')
          return
        }

        const lugaresNormalizados: Lugar[] = (data || []).map((lugar) => ({
          ...lugar,
          categorias_lugar: Array.isArray(lugar.categorias_lugar)
            ? lugar.categorias_lugar[0] || null
            : lugar.categorias_lugar
        }))

        setLugares(lugaresNormalizados)
      } catch (error) {
        console.error(error)
        setResultado('Ocurrió un error al cargar los lugares.')
      } finally {
        setCargando(false)
      }
    }

    cargarLugares()
  }, [])

  /* Categorías para comer */
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

  const lugaresDondeComer = lugares.filter(esLugarParaComer)
  const lugaresParaConocer = lugares.filter((lugar) => !esLugarParaComer(lugar))

  if (cargando) {
    return (
      <main className="app-page">
        <header className="app-header">
          <div>
            <h1>San Andrés Cholula</h1>
            <p>Lugares turísticos</p>
          </div>
          <button className="link-button" onClick={volver}>
            Volver
          </button>
        </header>

        <section className="content-area">
          <div style={{ textAlign: 'center', padding: '60px', color: '#6e6462', fontWeight: 600, fontSize: '16px' }}>
            Cargando experiencias...
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="app-page" style={{ backgroundColor: '#faf6f5', minHeight: '100vh', paddingBottom: '40px' }}>
      <header className="app-header">
        <div>
          <h1>San Andrés Cholula</h1>
          <p>Exploración y Turismo</p>
        </div>
        <button className="link-button" onClick={volver}>
          Volver
        </button>
      </header>

      <section className="content-area" style={{ display: 'flex', flexDirection: 'column', gap: '36px', maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '0 20px' }}>

        {/* Banner principal moderno tipo tarjeta flotante con gradiente */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #fff5f5 100%)',
          borderRadius: '28px',
          padding: '32px 36px',
          border: '1px solid #f2e2e2',
          boxShadow: '0 12px 40px rgba(179, 40, 45, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginTop: '10px'
        }}>
      
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: '#2d1515', letterSpacing: '-0.5px' }}>
            Descubre San Andrés Cholula
          </h2>
          <p style={{ margin: 0, fontSize: '15px', color: '#6e6462', lineHeight: '1.6', maxWidth: '800px' }}>
            Sumérgete en la riqueza histórica, sitios arqueológicos inigualables y la exquisita tradición culinaria que hacen de este Pueblo Mágico un lugar inolvidable.
          </p>
        </div>

        {resultado && (
          <p className="resultado" style={{ color: '#B3282D', fontWeight: 600 }}>
            {resultado}
          </p>
        )}

        {lugares.length === 0 && !resultado && (
          <div className="dashboard-card" style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#6e6462' }}>
              Por el momento no hay lugares turísticos disponibles.
            </p>
          </div>
        )}

        {/* SECCIÓN 1: LUGARES PARA CONOCER */}
        {lugaresParaConocer.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '2.5px solid #f2e2e2', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#2d1515', margin: 0, letterSpacing: '-0.3px' }}>
                 Lugares para conocer
              </h2>
              <p style={{ fontSize: '14px', color: '#6e6462', margin: 0 }}>
                Sitios históricos, culturales y arquitectónicos imprescindibles.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '28px' }}>
              {lugaresParaConocer.map((lugar) => {
                const urlImagen = obtenerImagenGarantizada(lugar.nombre, lugar.imagenes_lugar)

                return (
                  <button
                    key={lugar.id_lugar}
                    type="button"
                    onClick={() => seleccionarLugar(lugar)}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '24px',
                      overflow: 'hidden',
                      border: '1.5px solid #f2ece9',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      textAlign: 'left',
                      padding: 0,
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      height: '100%',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-6px)'
                      e.currentTarget.style.boxShadow = '0 18px 40px rgba(179, 40, 45, 0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    {/* Contenedor de Imagen con altura fija y perfecta */}
                    <div style={{ width: '100%', height: '200px', overflow: 'hidden', backgroundColor: '#f5eded', position: 'relative' }}>
                      <img
                        src={urlImagen}
                        alt={lugar.nombre}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/imagenes/lugares/restaurante.jpg'
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: 'rgba(45, 21, 21, 0.75)',
                        backdropFilter: 'blur(4px)',
                        color: '#fff',
                        padding: '5px 12px',
                        borderRadius: '14px',
                        fontSize: '11px',
                        fontWeight: '700',
                        letterSpacing: '0.3px'
                      }}>
                        {lugar.categorias_lugar?.nombre || 'Turismo'}
                      </div>
                    </div>

                    {/* Contenido con alturas estrictas para evitar saltos o parpadeos */}
                    <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, width: '100%', gap: '14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#2d1515', lineHeight: '1.25' }}>
                          {lugar.nombre}
                        </h3>

                        <p style={{ 
                          margin: 0, 
                          fontSize: '13.5px', 
                          color: '#6e6462', 
                          lineHeight: '1.5', 
                          display: '-webkit-box', 
                          WebkitLineClamp: 2, 
                          WebkitBoxOrient: 'vertical', 
                          overflow: 'hidden',
                          height: '42px' 
                        }}>
                          {lugar.descripcion || 'Espacio emblemático lleno de historia y tradición para conocer en la región.'}
                        </p>
                      </div>

                      <div style={{ 
                        borderTop: '1px solid #f4eae8', 
                        paddingTop: '12px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        width: '100%'
                      }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#B3282D', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Ver detalles y ruta
                        </span>
                        <span style={{ backgroundColor: '#fdf2f2', color: '#B3282D', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                          →
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* SECCIÓN 2: LUGARES DONDE COMER */}
        {lugaresDondeComer.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '2.5px solid #f2e2e2', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#2d1515', margin: 0, letterSpacing: '-0.3px' }}>
                 Lugares donde comer
              </h2>
              <p style={{ fontSize: '14px', color: '#6e6462', margin: 0 }}>
                Restaurantes, mercados tradicionales y experiencias gastronómicas locales.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '28px' }}>
              {lugaresDondeComer.map((lugar) => {
                const urlImagen = obtenerImagenGarantizada(lugar.nombre, lugar.imagenes_lugar)

                return (
                  <button
                    key={lugar.id_lugar}
                    type="button"
                    onClick={() => seleccionarLugar(lugar)}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '24px',
                      overflow: 'hidden',
                      border: '1.5px solid #f2ece9',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      textAlign: 'left',
                      padding: 0,
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      height: '100%',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-6px)'
                      e.currentTarget.style.boxShadow = '0 18px 40px rgba(179, 40, 45, 0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    {/* Contenedor de Imagen con altura fija y perfecta */}
                    <div style={{ width: '100%', height: '200px', overflow: 'hidden', backgroundColor: '#f5eded', position: 'relative' }}>
                      <img
                        src={urlImagen}
                        alt={lugar.nombre}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/imagenes/lugares/restaurante.jpg'
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: 'rgba(45, 21, 21, 0.75)',
                        backdropFilter: 'blur(4px)',
                        color: '#fff',
                        padding: '5px 12px',
                        borderRadius: '14px',
                        fontSize: '11px',
                        fontWeight: '700',
                        letterSpacing: '0.3px'
                      }}>
                        {lugar.categorias_lugar?.nombre || 'Gastronomía'}
                      </div>
                    </div>

                    {/* Contenido con alturas estrictas para evitar saltos o parpadeos */}
                    <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, width: '100%', gap: '14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#2d1515', lineHeight: '1.25' }}>
                          {lugar.nombre}
                        </h3>

                        <p style={{ 
                          margin: 0, 
                          fontSize: '13.5px', 
                          color: '#6e6462', 
                          lineHeight: '1.5', 
                          display: '-webkit-box', 
                          WebkitLineClamp: 2, 
                          WebkitBoxOrient: 'vertical', 
                          overflow: 'hidden',
                          height: '42px' 
                        }}>
                          {lugar.descripcion || 'Disfruta de los mejores sabores, platillos tradicionales y antojitos típicos de la región.'}
                        </p>
                      </div>

                      <div style={{ 
                        borderTop: '1px solid #f4eae8', 
                        paddingTop: '12px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        width: '100%'
                      }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#B3282D', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Ver menú y detalles
                        </span>
                        <span style={{ backgroundColor: '#fdf2f2', color: '#B3282D', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                          →
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

      </section>
    </main>
  )
}