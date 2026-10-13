import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { obtenerUsuarioCacheado } from '../lib/usuarioCache'
import {
  MapPin,
  CalendarDays,
  BookOpen,
  Route,
  Sun,
  Cloud,
  CloudRain,
  Search,
  ChevronRight,
  Heart,
  Compass,
  Menu,
  X,
  ArrowRight
} from 'lucide-react'

type DashboardProps = {
  mapa: () => void
  lugares: () => void
  gastronomia: () => void
  eventos: () => void
  misEventos: () => void
  historia: () => void
  favoritos: () => void
  misRutas: () => void
  perfil: () => void
  seleccionarLugar: (lugar: {
    id_lugar: number
    nombre: string
  }) => void
  seleccionarEvento: (evento: {
    id_evento: number
    nombre: string
  }) => void
}

type ClimaData = {
  temp: number
  descripcion: string
  codigo: number
}

type ResultadoBusqueda = {
  id: number
  nombre: string
  tipo: 'Lugar' | 'Evento' | 'Platillo' | 'Bebida'
  subtitulo: string
  categoriaObj: 'lugar' | 'evento' | 'gastronomia'
}

export default function Dashboard({
  mapa,
  lugares,
  gastronomia,
  eventos,
  misEventos,
  historia,
  favoritos,
  misRutas,
  perfil,
  seleccionarLugar,
  seleccionarEvento
}: DashboardProps) {
  const [nombre, setNombre] = useState('Explorador')
  const [menuAbierto, setMenuAbierto] = useState(false)

  const [textoBusqueda, setTextoBusqueda] = useState('')
  const [resultadosBusqueda, setResultadosBusqueda] = useState<ResultadoBusqueda[]>([])
  const [busquedaActiva, setBusquedaActiva] = useState(false)

  const [clima, setClima] = useState<ClimaData>({
    temp: 22,
    descripcion: 'Cargando clima...',
    codigo: 0
  })

  // Cargar datos del usuario de forma segura
  useEffect(() => {
    let activo = true

    async function cargarDatosSeguros() {
      try {
        const usuario = await obtenerUsuarioCacheado()

        if (!activo) return

        let nombreBase = 'Explorador'

        if (usuario?.nombre) {
          nombreBase = usuario.nombre
        } else {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()

          if (sessionError) {
            console.warn('No se pudo obtener la sesión:', sessionError.message)
          }

          if (session?.user) {
            nombreBase =
              session.user.user_metadata?.nombre ||
              session.user.email?.split('@')[0] ||
              'Explorador'
          }
        }

        if (activo) {
          const nombreFormateado =
            nombreBase.charAt(0).toUpperCase() + nombreBase.slice(1)
          setNombre(nombreFormateado)
        }
      } catch (error) {
        console.error('Error cargando datos del dashboard:', error)
      }
    }

    cargarDatosSeguros()

    return () => {
      activo = false
    }
  }, [])

  // Carga del Clima
  useEffect(() => {
    let activo = true

    async function obtenerClimaReal() {
      try {
        const respuesta = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=19.0586&longitude=-98.3038&current_weather=true'
        )

        if (!respuesta.ok) {
          throw new Error(`Error HTTP del clima: ${respuesta.status}`)
        }

        const data = await respuesta.json()

        if (activo && data?.current_weather) {
          const temp = Math.round(data.current_weather.temperature)
          const codigoWMO = data.current_weather.weathercode

          let desc = 'Despejado'

          if (codigoWMO >= 1 && codigoWMO <= 3) {
            desc = 'Parcialmente nublado'
          } else if (codigoWMO >= 51 && codigoWMO <= 67) {
            desc = 'Lluvia ligera'
          } else if (codigoWMO >= 95) {
            desc = 'Tormenta eléctrica'
          } else if (temp > 24) {
            desc = 'Cálido y soleado'
          } else if (temp < 15) {
            desc = 'Fresco'
          }

          setClima({
            temp,
            descripcion: desc,
            codigo: codigoWMO
          })
        }
      } catch (error) {
        console.error('Error cargando clima real:', error)

        if (activo) {
          setClima({
            temp: 21,
            descripcion: 'Clima templado',
            codigo: 0
          })
        }
      }
    }

    obtenerClimaReal()

    return () => {
      activo = false
    }
  }, [])

  // BÚSQUEDA GLOBAL OPTIMIZADA (Con debounce de 600ms para evitar saturar HTTP/2)
  useEffect(() => {
    let activo = true

    async function buscarEnBaseDeDatos() {
      const texto = textoBusqueda.trim()

      if (!texto) {
        if (activo) setResultadosBusqueda([])
        return
      }

      const q = texto.replace(/[%_]/g, '\\$&')

      try {
        const [lugaresRes, eventosRes, platillosRes, bebidasRes] = await Promise.all([
          supabase
            .from('lugares_turisticos')
            .select('id_lugar,nombre,descripcion,direccion')
            .or(`nombre.ilike.%${q}%,descripcion.ilike.%${q}%,direccion.ilike.%${q}%`)
            .limit(3),

          supabase
            .from('eventos')
            .select('id_evento,nombre,descripcion')
            .or(`nombre.ilike.%${q}%,descripcion.ilike.%${q}%`)
            .limit(3),

          supabase
            .from('platillos')
            .select('id_platillo,nombre,descripcion,tipo_comida')
            .eq('estado', true)
            .or(`nombre.ilike.%${q}%,descripcion.ilike.%${q}%,tipo_comida.ilike.%${q}%`)
            .limit(3),

          supabase
            .from('bebidas')
            .select('id_bebida,nombre,descripcion,tipo_bebida')
            .eq('estado', true)
            .or(`nombre.ilike.%${q}%,descripcion.ilike.%${q}%,tipo_bebida.ilike.%${q}%`)
            .limit(3)
        ])

        if (!activo) return

        const encontrados: ResultadoBusqueda[] = []

        if (lugaresRes.data) {
          lugaresRes.data.forEach((item: any) => {
            encontrados.push({
              id: item.id_lugar,
              nombre: item.nombre,
              tipo: 'Lugar',
              subtitulo: item.direccion || item.descripcion || 'San Andrés Cholula',
              categoriaObj: 'lugar'
            })
          })
        }

        if (eventosRes.data) {
          eventosRes.data.forEach((item: any) => {
            encontrados.push({
              id: item.id_evento,
              nombre: item.nombre,
              tipo: 'Evento',
              subtitulo: item.descripcion || 'Evento y actividad',
              categoriaObj: 'evento'
            })
          })
        }

        if (platillosRes.data) {
          platillosRes.data.forEach((item: any) => {
            encontrados.push({
              id: item.id_platillo,
              nombre: item.nombre,
              tipo: 'Platillo',
              subtitulo: item.tipo_comida || item.descripcion || 'Platillo tradicional',
              categoriaObj: 'gastronomia'
            })
          })
        }

        if (bebidasRes.data) {
          bebidasRes.data.forEach((item: any) => {
            encontrados.push({
              id: item.id_bebida,
              nombre: item.nombre,
              tipo: 'Bebida',
              subtitulo: item.tipo_bebida || item.descripcion || 'Bebida tradicional',
              categoriaObj: 'gastronomia'
            })
          })
        }

        if (activo) {
          setResultadosBusqueda(encontrados)
        }
      } catch (error) {
        console.error('Error en búsqueda global:', error)
        if (activo) setResultadosBusqueda([])
      }
    }

    const timer = window.setTimeout(() => {
      buscarEnBaseDeDatos()
    }, 600)

    return () => {
      activo = false
      window.clearTimeout(timer)
    }
  }, [textoBusqueda])

  function obtenerIconoResultado(tipo: ResultadoBusqueda['tipo']) {
    if (tipo === 'Lugar') return <MapPin size={16} color="#831818" />
    if (tipo === 'Evento') return <CalendarDays size={16} color="#831818" />
    return <BookOpen size={16} color="#831818" />
  }

  function seleccionarResultado(item: ResultadoBusqueda) {
    if (item.categoriaObj === 'lugar') {
      seleccionarLugar({ id_lugar: item.id, nombre: item.nombre })
    } else if (item.categoriaObj === 'evento') {
      seleccionarEvento({ id_evento: item.id, nombre: item.nombre })
      eventos()
    } else {
      gastronomia()
    }

    setTextoBusqueda('')
    setResultadosBusqueda([])
    setBusquedaActiva(false)
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#f3eee8'
      }}
    >
      {/* HEADER PRINCIPAL */}
      <header
        style={{
          background: 'linear-gradient(135deg, #6b1414 0%, #831818 100%)',
          padding: '24px 20px 36px 20px',
          color: '#fff',
          borderBottomLeftRadius: '36px',
          borderBottomRightRadius: '36px',
          boxShadow: '0 12px 30px rgba(131, 24, 24, 0.25)',
          position: 'relative'
        }}
      >
        {/* Fila superior */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}
        >
          <div>
            <p
              style={{
                fontSize: '13px',
                color: '#ffcccc',
                fontWeight: 600,
                margin: 0
              }}
            >
              ¡Hola, viajero!
            </p>

            <h1
              style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: 700,
                letterSpacing: '-0.3px'
              }}
            >
              {nombre}
            </h1>
          </div>

          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '14px',
              padding: '10px',
              cursor: 'pointer',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}
            aria-label="Abrir menú"
          >
            {menuAbierto ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* TARJETA DE CLIMA */}
        <div
          style={{
            backgroundColor: 'rgba(54, 10, 10, 0.45)',
            backdropFilter: 'blur(12px)',
            borderRadius: '18px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            marginBottom: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '11px',
                color: '#ffcccc',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.8px'
              }}
            >
              Clima actual • Cholula
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '8px',
                marginTop: '4px'
              }}
            >
              <strong
                style={{
                  fontSize: '24px',
                  fontWeight: 700
                }}
              >
                {clima.temp}°C
              </strong>

              <span
                style={{
                  fontSize: '13px',
                  opacity: 0.9,
                  fontWeight: 500
                }}
              >
                {clima.descripcion}
              </span>
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '12px',
              borderRadius: '14px'
            }}
          >
            {clima.codigo >= 51 ? (
              <CloudRain size={26} color="#fff" />
            ) : clima.temp > 20 ? (
              <Sun size={26} color="#ffd54f" />
            ) : (
              <Cloud size={26} color="#fff" />
            )}
          </div>
        </div>

        {/* BUSCADOR GLOBAL */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '14px 18px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
            }}
          >
            <Search
              size={18}
              color="#831818"
              style={{
                marginRight: '12px',
                flexShrink: 0
              }}
            />

            <input
              type="text"
              placeholder="Busca lugares, eventos, comida, bebidas..."
              value={textoBusqueda}
              onChange={(e) => {
                setTextoBusqueda(e.target.value)
                setBusquedaActiva(true)
              }}
              onFocus={() => setBusquedaActiva(true)}
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '14px',
                color: '#333',
                backgroundColor: 'transparent'
              }}
            />

            {textoBusqueda && (
              <button
                type="button"
                onClick={() => {
                  setTextoBusqueda('')
                  setResultadosBusqueda([])
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex'
                }}
                aria-label="Limpiar búsqueda"
              >
                <X size={16} color="#888" />
              </button>
            )}
          </div>

          {/* RESULTADOS */}
          {busquedaActiva && resultadosBusqueda.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '64px',
                left: 0,
                right: 0,
                backgroundColor: '#fff',
                borderRadius: '16px',
                boxShadow: '0 14px 35px rgba(0,0,0,0.18)',
                zIndex: 999,
                overflow: 'hidden',
                border: '1px solid #f0e6d8',
                maxHeight: '280px',
                overflowY: 'auto'
              }}
            >
              {resultadosBusqueda.map((item, index) => (
                <div
                  key={`${item.tipo}-${item.id}-${index}`}
                  onMouseDown={() => seleccionarResultado(item)}
                  style={{
                    padding: '12px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #f9f5f0',
                    cursor: 'pointer',
                    backgroundColor: '#fff'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      minWidth: 0
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: '#fdf5f5',
                        padding: '8px',
                        borderRadius: '10px',
                        flexShrink: 0
                      }}
                    >
                      {obtenerIconoResultado(item.tipo)}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#2d1515',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.nombre}
                      </div>

                      <div
                        style={{
                          fontSize: '12px',
                          color: '#7a6e6b',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <strong
                          style={{
                            color: '#831818',
                            textTransform: 'uppercase',
                            fontSize: '10px',
                            marginRight: '4px'
                          }}
                        >
                          {item.tipo}
                        </strong>

                        {item.subtitulo}
                      </div>
                    </div>
                  </div>

                  <ChevronRight size={16} color="#831818" />
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* MENÚ LATERAL */}
      {menuAbierto && (
        <div
          className="menu-overlay"
          onClick={() => setMenuAbierto(false)}
        >
          <div
            className="menu-lateral"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="menu-header">
              <h3>Menú</h3>

              <button
                type="button"
                onClick={() => setMenuAbierto(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="menu-lista">
              <button
                type="button"
                onClick={() => setMenuAbierto(false)}
              >
                <Compass size={20} />
                Inicio
              </button>

              <button
                type="button"
                onClick={() => {
                  perfil()
                  setMenuAbierto(false)
                }}
              >
                <Heart size={20} />
                Perfil
              </button>

              <button
                type="button"
                onClick={() => {
                  mapa()
                  setMenuAbierto(false)
                }}
              >
                <MapPin size={20} />
                Mapa
              </button>

              <button
                type="button"
                onClick={() => {
                  misRutas()
                  setMenuAbierto(false)
                }}
              >
                <Route size={20} />
                Mis rutas
              </button>

              <button
                type="button"
                onClick={() => {
                  misEventos()
                  setMenuAbierto(false)
                }}
              >
                <CalendarDays size={20} />
                Mis eventos
              </button>

              <button
                type="button"
                onClick={() => {
                  favoritos()
                  setMenuAbierto(false)
                }}
              >
                <Heart size={20} />
                Favoritos
              </button>

              <button
                type="button"
                onClick={() => {
                  historia()
                  setMenuAbierto(false)
                }}
              >
                <BookOpen size={20} />
                Historia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <div
        style={{
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '26px',
          maxWidth: '600px',
          margin: '0 auto'
        }}
      >
        {/* EXPLORA */}
        <section>
          <div
            style={{
              marginBottom: '14px'
            }}
          >
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#2d1515',
                margin: 0
              }}
            >
              Explora
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '14px'
            }}
          >
            {[
              {
                label: 'Lugares',
                subtitulo: 'Sitios de interés',
                onClick: lugares,
                img: '/imagenes/lugares.jpg',
                etiqueta: 'Explorar'
              },
              {
                label: 'Gastronomía',
                subtitulo: 'Platillos y bebidas',
                onClick: gastronomia,
                img: '/imagenes/gastronomia/gastronomia.jpg',
                etiqueta: 'Sabores'
              },
              {
                label: 'Eventos',
                subtitulo: 'Actividades de Cholula',
                onClick: eventos,
                img: '/imagenes/eventos.jpg',
                etiqueta: 'Agenda'
              },
              {
                label: 'Rutas',
                subtitulo: 'Planifica tu recorrido',
                onClick: misRutas,
                img: '/imagenes/cholula-bg.jpg',
                etiqueta: 'Recorridos'
              },
              {
                label: 'Mapa',
                subtitulo: 'Ubicaciones clave',
                onClick: mapa,
                img: '/imagenes/mapa.jpg',
                etiqueta: 'Ubicación'
              },
              {
                label: 'Historia',
                subtitulo: 'Patrimonio milenario',
                onClick: historia,
                img: '/imagenes/mercado.jpg',
                etiqueta: 'Cultura'
              }
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={item.onClick}
                style={{
                  height: '190px',
                  borderRadius: '22px',
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(131, 24, 24, 0.12)',
                  backgroundImage: `linear-gradient(to top, rgba(45, 10, 10, 0.92) 18%, rgba(45, 10, 10, 0.3) 60%, rgba(0, 0, 0, 0.05) 100%), url("${item.img}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: '16px 14px',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <span
                  style={{
                    fontSize: '9px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.9px',
                    color: '#ffcccc',
                    fontWeight: 700,
                    marginBottom: '3px'
                  }}
                >
                  {item.etiqueta}
                </span>

                <h3
                  style={{
                    margin: '0 0 4px 0',
                    fontSize: '15px',
                    fontWeight: 700,
                    lineHeight: 1.2
                  }}
                >
                  {item.label}
                </h3>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '4px'
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      opacity: 0.85,
                      lineHeight: 1.2
                    }}
                  >
                    {item.subtitulo}
                  </span>

                  <div
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      padding: '4px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <ArrowRight size={12} color="#fff" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ORGANIZA TUS RUTAS */}
        <section
          onClick={misRutas}
          style={{
            background: 'linear-gradient(135deg, rgba(64, 13, 15, 0.85) 0%, rgba(131, 24, 24, 0.95) 100%), url("/imagenes/cholula-bg.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '24px',
            padding: '24px',
            color: '#fff',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}
        >
          <div
            style={{
              maxWidth: '75%',
              zIndex: 2
            }}
          >
            <span
              style={{
                backgroundColor: '#831818',
                color: '#fff',
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 'bold',
                display: 'inline-block',
                marginBottom: '8px'
              }}
            >
              Itinerarios a tu medida
            </span>

            <h3
              style={{
                margin: '0 0 6px 0',
                fontSize: '18px',
                fontWeight: 700
              }}
            >
              Organiza tus Rutas
            </h3>

            <p
              style={{
                margin: 0,
                fontSize: '13px',
                opacity: 0.9,
                lineHeight: 1.4
              }}
            >
              Diseña tus recorridos diarios por Cholula optimizados por cercanía geográfica.
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#831818',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              zIndex: 2
            }}
          >
            <ArrowRight size={22} color="#fff" />
          </div>
        </section>

        {/* DESCUBRE CHOLULA */}
        <section>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px'
            }}
          >
            <h2
              style={{
                fontSize: '17px',
                fontWeight: 700,
                color: '#2d1515',
                margin: 0
              }}
            >
              Descubre Cholula
            </h2>

            <button
              type="button"
              onClick={lugares}
              style={{
                background: 'none',
                border: 'none',
                color: '#831818',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              Ver más
              <ChevronRight size={16} />
            </button>
          </div>

          <div
            onClick={lugares}
            style={{
              position: 'relative',
              borderRadius: '24px',
              overflow: 'hidden',
              padding: '28px 24px',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              backgroundImage: 'linear-gradient(rgba(45, 10, 10, 0.4), rgba(131, 24, 24, 0.88)), url("/imagenes/lugares/restaurante.jpg")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              minHeight: '160px',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <span
              style={{
                backgroundColor: '#831818',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '10px',
                fontWeight: 'bold',
                width: 'fit-content',
                marginBottom: '8px'
              }}
            >
              Corredor turístico Cholula
            </span>

            <h3
              style={{
                margin: '0 0 6px 0',
                fontSize: '20px',
                fontWeight: 700
              }}
            >
              Explora la magia de Cholula
            </h3>

            <p
              style={{
                margin: '0 0 16px 0',
                fontSize: '13px',
                opacity: 0.9,
                lineHeight: 1.4,
                maxWidth: '90%'
              }}
            >
              Conoce los rincones históricos, la gastronomía tradicional y sus templos milenarios.
            </p>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                lugares()
              }}
              style={{
                backgroundColor: '#fff',
                color: '#831818',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                width: 'fit-content',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              Explorar ahora
            </button>
          </div>
        </section>

        {/* PRÓXIMOS EVENTOS */}
        <section>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px'
            }}
          >
            <h2
              style={{
                fontSize: '17px',
                fontWeight: 700,
                color: '#2d1515',
                margin: 0
              }}
            >
              Próximos eventos
            </h2>

            <button
              type="button"
              onClick={eventos}
              style={{
                background: 'none',
                border: 'none',
                color: '#831818',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              Ver todos
              <ChevronRight size={16} />
            </button>
          </div>

          <div
            onClick={eventos}
            style={{
              background: 'linear-gradient(135deg, rgba(64, 13, 15, 0.85) 0%, rgba(131, 24, 24, 0.95) 100%), url("/imagenes/eventos.jpg")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              padding: '24px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
              color: '#fff'
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                padding: '16px',
                borderRadius: '16px',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '12px',
                backdropFilter: 'blur(8px)'
              }}
            >
              Prox
            </div>

            <div>
              <h3
                style={{
                  margin: '0 0 4px 0',
                  fontSize: '16px',
                  color: '#fff',
                  fontWeight: 700
                }}
              >
                Eventos y festividades
              </h3>

              <p
                style={{
                  margin: 0,
                  fontSize: '13px',
                  opacity: 0.9
                }}
              >
                Descubre las próximas actividades en San Andrés Cholula.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}