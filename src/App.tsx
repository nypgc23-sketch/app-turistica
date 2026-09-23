import { useEffect, useState } from 'react'
import {
  obtenerPreferencias,
  tienePreferencias,
  guardarPreferencias
} from './services/authService'

import { supabase } from './lib/supabaseClient'

import Lugares from './pages/Lugares'
import DetalleLugar from './pages/DetalleLugar'
import MapaTodosLugares from './components/MapaTodosLugares'
import Favoritos from './pages/Favoritos'
import MisRutas from './pages/MisRutas'
import Gastronomia from './pages/Gastronomia'
import Eventos from './pages/Eventos'
import DetalleEvento from './pages/DetalleEvento'
import MisEventos from './pages/MisEventos'
import Login from './pages/Login'
import RestablecerPassword from './pages/RestablecerPassword'
import Dashboard from './pages/Dashboard'
import Perfil from './pages/Perfil'
import AdminPanel from './pages/AdminPanel' // <--- 1. Importado aquí
import { MapPin, Landmark, UtensilsCrossed, CalendarDays, BookOpen, Route, Mail, Phone, Eye, EyeOff } from 'lucide-react'

type Pantalla =
  | 'inicio'
  | 'acceso'
  | 'mapa'
  | 'lugares'
  | 'misRutas'
  | 'detalleLugar'
  | 'gastronomia'
  | 'eventos'
  | 'detalleEvento'
  | 'misEventos'
  | 'historia'
  | 'registro'
  | 'verificacion'
  | 'intereses'
  | 'login'
  | 'dashboard'
  | 'favoritos'
  | 'restablecer'
  | 'perfil'
  | 'admin' // <--- 2. Añadido al tipo Pantalla

export default function App() {
  const [pantalla, setPantalla] = useState<Pantalla>('inicio')
  const [cargando, setCargando] = useState(true)
  const [sesionActiva, setSesionActiva] = useState(false)
    
  const [lugarSeleccionado, setLugarSeleccionado] = useState<{
    id_lugar: number
    nombre: string
  } | null>(null)

  const [eventoSeleccionado, setEventoSeleccionado] = useState<{ 
    id_evento: number; 
    nombre: string 
  } | null>(null)

  const [itemGastroSeleccionado, setItemGastroSeleccionado] = useState<{
    id: number
    tipo: 'platillo' | 'bebida'
  } | null>(null)

  const [origenDetalle, setOrigenDetalle] = useState<Pantalla>('lugares')
  const [origenMisEventos, setOrigenMisEventos] = useState<Pantalla>('dashboard')

  async function dirigirUsuario(usuarioId: string) {
    try {
      const promesaPreferencias = tienePreferencias(usuarioId)
      const timeout = new Promise((_, reject) => setTimeout(() => reject(timeout), 2000))

      const resultado: any = await Promise.race([promesaPreferencias, timeout])

      if (resultado?.tiene) {
        setPantalla('dashboard')
      } else {
        setPantalla('dashboard')
      }
    } catch (error) {
      console.warn('Aviso de preferencias omitido por seguridad:', error)
      setPantalla('dashboard')
    }
  }

  async function explorarSinCuenta() {
    try {
      await supabase.auth.signOut()
      setSesionActiva(false)
      localStorage.removeItem('supabase.auth.token')
      setPantalla('acceso')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      setPantalla('acceso')
    }
  }

  useEffect(() => {
    let activo = true

    async function comprobarSesion() {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error || (data.session && !data.session.user)) {
          console.warn('Sesión caducada o token inválido, limpiando credenciales...')
          await supabase.auth.signOut()
          localStorage.clear()
          if (activo) {
            setSesionActiva(false)
            setPantalla('acceso')
          }
          return
        }

        if (activo) {
          setSesionActiva(!!data.session)
        }

        if (activo && data.session) {
          await dirigirUsuario(data.session.user.id)
        }
      } catch (error) {
        console.error('Error comprobando sesión:', error)
        localStorage.clear()
      } finally {
        if (activo) {
          setCargando(false)
        }
      }
    }

    comprobarSesion()

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!activo) return
      
      setSesionActiva(!!session)

      if (event === 'PASSWORD_RECOVERY') {
        setPantalla('restablecer')
        return
      }

      if (event === 'SIGNED_IN' && session) {
        setPantalla('dashboard')
      }

      if (event === 'SIGNED_OUT') {
        setSesionActiva(false)
        setPantalla('acceso')
      }
    })

    return () => {
      activo = false
      data.subscription.unsubscribe()
    }
  }, [])

  function irInicio() {
    if (sesionActiva) {
      setPantalla('dashboard')
    } else {
      setPantalla('acceso')
    }
  }

  function irMapa() {
    setPantalla('mapa')
  }

  function irLugares() {
    setPantalla('lugares')
  }

  function irFavoritos() {
    if (sesionActiva) {
      setPantalla('favoritos')
    } else {
      setPantalla('login')
    }
  }

  function irPerfil() {
    if (sesionActiva) {
      setPantalla('perfil')
    } else {
      setPantalla('acceso')
    }
  }

  if (cargando) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="form-area">
            <h2>Cargando...</h2>
          </div>
        </section>
      </main>
    )
  }

  switch (pantalla) {
    case 'inicio':
      return (
        <main className="auth-page">
          <section className="auth-card">
            <Logo />
            <div className="form-area">
              <h2>Bienvenido a Cholula</h2>
              <p className="welcome-text">
                Explora San Andrés Cholula y descubre sus atractivos.
              </p>
              <button className="primary-button" onClick={() => setPantalla('login')}>
                Iniciar sesión
              </button>
              <button className="secondary-button" onClick={() => setPantalla('registro')}>
                Crear cuenta
              </button>
              <button className="link-button" onClick={explorarSinCuenta}>
                Explorar sin cuenta
              </button>
            </div>
          </section>
        </main>
      )

    case 'lugares':
      return (
        <>
          <Lugares
            volver={() => (sesionActiva ? setPantalla('dashboard') : setPantalla('acceso'))}
            seleccionarLugar={(lugar) => {
              setOrigenDetalle('lugares')
              setLugarSeleccionado({
                id_lugar: lugar.id_lugar,
                nombre: lugar.nombre
              })
              setPantalla('detalleLugar')
            }}
          />
          {sesionActiva && (
            <NavegacionInferior
              pantalla={pantalla}
              inicio={irInicio}
              mapa={irMapa}
              lugares={irLugares}
              favoritos={irFavoritos}
              perfil={irPerfil}
            />
          )}
        </>
      )

    case 'acceso':
      return (
        <Acceso
          volver={() => setPantalla('inicio')}
          registrarse={() => setPantalla('registro')}
          iniciarSesion={() => setPantalla('login')}
          mapa={() => setPantalla('mapa')}
          lugares={() => setPantalla('lugares')}
          gastronomia={() => setPantalla('gastronomia')}
          eventos={() => setPantalla('eventos')}
          historia={() => setPantalla('historia')}
          misRutas={() => setPantalla('misRutas')}
          sesionActiva={sesionActiva}
        />
      )

    case 'registro':
      return (
        <Registro
          volver={() => setPantalla('inicio')}
          login={() => setPantalla('login')}
          verificacion={() => setPantalla('verificacion')}
          entrar={(usuarioId: string) => dirigirUsuario(usuarioId)}
        />
      )

    case 'verificacion':
      return <Verificacion login={() => setPantalla('login')} />

    case 'intereses':
      return <Intereses terminar={() => setPantalla('dashboard')} />

    case 'login':
      return (
        <>
          <Login
            volver={() => setPantalla('inicio')}
            registro={() => setPantalla('registro')}
            entrar={(usuarioId: string) => dirigirUsuario(usuarioId)}
          />
          <button className="fab-button" onClick={() => alert('Asistente virtual en construcción')}></button>
        </>
      )

    case 'restablecer':
      return <RestablecerPassword login={() => setPantalla('login')} />

    case 'dashboard':
      return (
        <Dashboard
          mapa={irMapa}
          lugares={irLugares}
          gastronomia={() => setPantalla('gastronomia')}
          eventos={() => setPantalla('eventos')}
          historia={() => setPantalla('historia')}
          favoritos={irFavoritos}
          misRutas={() => setPantalla('misRutas')}
          perfil={irPerfil}
          seleccionarLugar={(lugar) => {
            setOrigenDetalle('dashboard' as Pantalla)
            setLugarSeleccionado(lugar)
            setPantalla('detalleLugar')
          }}
          seleccionarEvento={(evento) => {
            setOrigenMisEventos('dashboard')
            setEventoSeleccionado(evento)
            setPantalla('detalleEvento')
          }}
        />
      )

    case 'perfil':
      return (
        <>
          <Perfil
            volver={() => setPantalla('dashboard')}
            irAdmin={() => setPantalla('admin')}
            onCerrarSesion={() => {
              setSesionActiva(false)
              setPantalla('inicio')
            }}
            onVerEventos={() => {
              setOrigenMisEventos('perfil')
              setPantalla('misEventos')
            }}
          />
          {sesionActiva && (
            <NavegacionInferior
              pantalla={pantalla}
              inicio={irInicio}
              mapa={irMapa}
              lugares={irLugares}
              favoritos={irFavoritos}
              perfil={irPerfil}
            />
          )}
        </>
      )

    case 'admin':
      return (
        <AdminPanel 
          volver={() => setPantalla('perfil')} 
        />
      )

    case 'mapa':
      return (
        <>
          <main className="app-page mapa-page">
            <header className="mapa-header">
              <div className="mapa-header-titulo">
                <h1>San Andrés Cholula</h1>
                <p>Mapa interactivo de la región</p>
              </div>
              <button
                className="btn-volver-mapa"
                onClick={() => (sesionActiva ? setPantalla('dashboard') : setPantalla('acceso'))}
              >
                Volver
              </button>
            </header>

            <section className="mapa-container-principal">
              <div className="mapa-card-grande">
                <MapaTodosLugares
                  seleccionarLugar={(lugar) => {
                    setOrigenDetalle('mapa')
                    setLugarSeleccionado({
                      id_lugar: lugar.id_lugar,
                      nombre: lugar.nombre
                    })
                    setPantalla('detalleLugar')
                  }}
                />
              </div>

              <div className="mapa-tarjeta-flotante">
                <div className="mapa-info-icono">
                  <MapPin size={22} color="#B3282D" />
                </div>
                <div>
                  <strong>Explora Cholula</strong>
                  <p>Selecciona un lugar en el mapa para ver sus detalles.</p>
                </div>
              </div>
            </section>
          </main>

          {sesionActiva && (
            <NavegacionInferior
              pantalla={pantalla}
              inicio={irInicio}
              mapa={irMapa}
              lugares={irLugares}
              favoritos={irFavoritos}
              perfil={irPerfil}
            />
          )}
        </>
      )

    case 'detalleLugar':
      if (!lugarSeleccionado) {
        return (
          <Lugares
            volver={() => setPantalla('lugares')}
            seleccionarLugar={(lugar) => {
              setLugarSeleccionado({ id_lugar: lugar.id_lugar, nombre: lugar.nombre })
              setPantalla('detalleLugar')
            }}
          />
        )
      }

      return (
        <>
          <DetalleLugar
            lugar={lugarSeleccionado}
            volver={() => setPantalla(origenDetalle)}
            iniciarSesion={() => setPantalla('login')}
            registrarse={() => setPantalla('registro')}
          />

          {sesionActiva && (
            <NavegacionInferior
              pantalla={pantalla}
              inicio={irInicio}
              mapa={irMapa}
              lugares={irLugares}
              favoritos={irFavoritos}
              perfil={irPerfil}
            />
          )}
        </>
      )

    case 'misRutas':
      if (!sesionActiva) {
        return (
          <main className="app-page">
            <header className="app-header">
              <div>
                <h1>San Andrés Cholula</h1>
                <p>Acceso requerido</p>
              </div>

              <button className="link-button" onClick={() => setPantalla('acceso')}>
                Volver
              </button>
            </header>

            <section className="content-area">
              <div className="dashboard-card">
                <h2>Mis rutas</h2>
                <p>Necesitas iniciar sesión para consultar tus rutas.</p>
                <button className="primary-button" onClick={() => setPantalla('login')}>
                  Iniciar sesión
                </button>
              </div>
            </section>
          </main>
        )
      }

      return (
        <>
          <MisRutas
            volver={() => setPantalla('dashboard')}
            seleccionarLugar={(lugar) => {
              setOrigenDetalle('misRutas')
              setLugarSeleccionado({
                id_lugar: lugar.id_lugar,
                nombre: lugar.nombre
              })
              setPantalla('detalleLugar')
            }}
          />

          <NavegacionInferior
            pantalla={pantalla}
            inicio={irInicio}
            mapa={irMapa}
            lugares={irLugares}
            favoritos={irFavoritos}
            perfil={irPerfil}
          />
        </>
      )

    case 'gastronomia':
      return (
        <>
          <Gastronomia
            volver={() => {
              if (origenDetalle === 'favoritos') {
                setPantalla('favoritos')
              } else {
                sesionActiva ? setPantalla('dashboard') : setPantalla('acceso')
              }
            }}
            iniciarSesion={() => setPantalla('login')}
            onVerLugar={(idLugar: number) => {
              setOrigenDetalle('gastronomia')
              setLugarSeleccionado({ id_lugar: idLugar, nombre: '' })
              setPantalla('detalleLugar')
            }}
            itemInicial={itemGastroSeleccionado}
          />
          {sesionActiva && (
            <NavegacionInferior
              pantalla={pantalla}
              inicio={irInicio}
              mapa={irMapa}
              lugares={irLugares}
              favoritos={irFavoritos}
              perfil={irPerfil}
            />
          )}
        </>
      )

    case 'eventos':
      return (
        <>
          <Eventos
            volver={() => (sesionActiva ? setPantalla('dashboard') : setPantalla('acceso'))}
            seleccionarEvento={(evento) => {
              setOrigenMisEventos('eventos' as Pantalla)
              setEventoSeleccionado(evento)
              setPantalla('detalleEvento')
            }}
          />
          {sesionActiva && (
            <NavegacionInferior
              pantalla={pantalla}
              inicio={irInicio}
              mapa={irMapa}
              lugares={irLugares}
              favoritos={irFavoritos}
              perfil={irPerfil}
            />
          )}
        </>
      )

    case 'misEventos':
      return (
        <>
          <MisEventos
            volver={() => setPantalla(origenMisEventos)}
            seleccionarEvento={(evento) => {
              setOrigenMisEventos('misEventos')
              setEventoSeleccionado({
                id_evento: evento.id_evento,
                nombre: evento.nombre
              })
              setPantalla('detalleEvento')
            }}
          />
          {sesionActiva && (
            <NavegacionInferior
              pantalla={pantalla}
              inicio={irInicio}
              mapa={irMapa}
              lugares={irLugares}
              favoritos={irFavoritos}
              perfil={irPerfil}
            />
          )}
        </>
      )

    case 'detalleEvento':
      if (!eventoSeleccionado) {
        setPantalla('misEventos')
        return null
      }
      return (
        <>
          <DetalleEvento
            evento={eventoSeleccionado}
            volver={() => setPantalla(origenMisEventos)}
            seleccionarLugar={(lugar) => {
              setOrigenDetalle('detalleEvento' as Pantalla)
              setLugarSeleccionado(lugar)
              setPantalla('detalleLugar')
            }}
          />
          {sesionActiva && (
            <NavegacionInferior
              pantalla={pantalla}
              inicio={irInicio}
              mapa={irMapa}
              lugares={irLugares}
              favoritos={irFavoritos}
              perfil={irPerfil}
            />
          )}
        </>
      )

    case 'historia':
      return (
        <>
          <main className="app-page">
            <header className="app-header">
              <div>
                <h1>San Andrés Cholula</h1>
                <p>Historia</p>
              </div>

              <button
                className="link-button"
                onClick={() => (sesionActiva ? setPantalla('dashboard') : setPantalla('acceso'))}
              >
                Volver
              </button>
            </header>

            <section className="content-area">
              <h2>Historia de Cholula</h2>
              <p>Aquí se mostrará la historia de San Andrés Cholula.</p>
            </section>
          </main>

          {sesionActiva && (
            <NavegacionInferior
              pantalla={pantalla}
              inicio={irInicio}
              mapa={irMapa}
              lugares={irLugares}
              favoritos={irFavoritos}
              perfil={irPerfil}
            />
          )}
        </>
      )

    case 'favoritos':
      return (
        <>
          <Favoritos
            volver={() => setPantalla('dashboard')}
            seleccionarLugar={(lugar) => {
              setOrigenDetalle('favoritos')
              setLugarSeleccionado({
                id_lugar: lugar.id_lugar,
                nombre: lugar.nombre
              })
              setPantalla('detalleLugar')
            }}
            onVerGastronomia={(item) => {
              setOrigenDetalle('favoritos')
              setItemGastroSeleccionado(item)
              setPantalla('gastronomia')
            }}
          />

          <NavegacionInferior
            pantalla={pantalla}
            inicio={irInicio}
            mapa={irMapa}
            lugares={irLugares}
            favoritos={irFavoritos}
            perfil={irPerfil}
          />
        </>
      )

    default:
      return null
  }
}

function NavegacionInferior({
  pantalla,
  inicio,
  mapa,
  lugares,
  favoritos,
  perfil
}: {
  pantalla: Pantalla
  inicio: () => void
  mapa: () => void
  lugares: () => void
  favoritos: () => void
  perfil: () => void
}) {
  return (
    <nav className="bottom-navigation">
      <button
        type="button"
        className={pantalla === 'dashboard' ? 'bottom-nav-item active' : 'bottom-nav-item'}
        onClick={inicio}
      >
        <span>Inicio</span>
        <small>Inicio</small>
      </button>

      <button
        type="button"
        className={pantalla === 'mapa' ? 'bottom-nav-item active' : 'bottom-nav-item'}
        onClick={mapa}
      >
        <span>Mapa</span>
        <small>Mapa</small>
      </button>

      <button
        type="button"
        className={
          pantalla === 'lugares' || pantalla === 'detalleLugar'
            ? 'bottom-nav-item active'
            : 'bottom-nav-item'
        }
        onClick={lugares}
      >
        <span>Lugares</span>
        <small>Explorar</small>
      </button>

      <button
        type="button"
        className={pantalla === 'favoritos' ? 'bottom-nav-item active' : 'bottom-nav-item'}
        onClick={favoritos}
      >
        <span>Favoritos</span>
        <small>Favoritos</small>
      </button>

      <button type="button" className="bottom-nav-item" onClick={perfil}>
        <span>Perfil</span>
        <small>Perfil</small>
      </button>
    </nav>
  )
}

function Logo() {
  return (
    <div className="logo-area">
      <div className="logo-circle">San Andrés Cholula</div>
    </div>
  )
}

function Acceso({
  volver,
  registrarse,
  iniciarSesion,
  mapa,
  lugares,
  gastronomia,
  eventos,
  historia,
  misRutas,
  sesionActiva
}: {
  volver: () => void
  registrarse: () => void
  iniciarSesion: () => void
  mapa: () => void
  lugares: () => void
  gastronomia: () => void
  eventos: () => void
  historia: () => void
  misRutas: () => void
  sesionActiva: boolean
}) {
  const opciones = [
    { titulo: 'Mapa', descripcion: 'Consulta lugares de interés.', accion: mapa, IconoComponent: MapPin },
    { titulo: 'Lugares', descripcion: 'Conoce sitios turísticos.', accion: lugares, IconoComponent: Landmark },
    { titulo: 'Gastronomía', descripcion: 'Descubre platillos y bebidas.', accion: gastronomia, IconoComponent: UtensilsCrossed },
    { titulo: 'Eventos', descripcion: 'Consulta eventos y festividades.', accion: eventos, IconoComponent: CalendarDays },
    { titulo: 'Historia', descripcion: 'Conoce la historia de Cholula.', accion: historia, IconoComponent: BookOpen }
  ]

  return (
    <main className="app-page">
      <header className="app-header">
        <div>
          <h1>San Andrés Cholula</h1>
          <p>Exploración básica</p>
        </div>
        <button className="link-button" onClick={volver}>Inicio</button>
      </header>

      <section className="content-area">
        {sesionActiva ? (
          <>
            <h2>Descubre Cholula</h2>
            <p>Explora lugares, gastronomía, eventos e historia de San Andrés Cholula.</p>
          </>
        ) : (
          <>
            <h2>Explorar sin cuenta</h2>
            <p>Puedes consultar información pública sin registrarte.</p>
          </>
        )}

        <div className="explore-grid">
          {opciones.map((opcion) => {
            const Icono = opcion.IconoComponent
            return (
              <button className="explore-card" key={opcion.titulo} onClick={opcion.accion}>
                <Icono size={30} color="#B3282D" style={{ marginBottom: '8px' }} />
                <strong>{opcion.titulo}</strong>
                <span>{opcion.descripcion}</span>
              </button>
            )
          })}

          {sesionActiva && (
            <button type="button" className="explore-card" onClick={misRutas}>
              <Route size={30} color="#B3282D" style={{ marginBottom: '8px' }} />
              <strong>Mis rutas</strong>
              <span>Consulta y administra tus rutas guardadas.</span>
            </button>
          )}
        </div>

        {!sesionActiva && (
          <div className="guest-warning">
            <p>Para utilizar favoritos, historial, preferencias, perfil y recomendaciones personalizadas necesitas una cuenta.</p>
            <button className="primary-button" onClick={registrarse}>Registrarme</button>
            <button type="button" className="secondary-button" onClick={iniciarSesion}>Ya tengo una cuenta</button>
          </div>
        )}
      </section>
    </main>
  )
}

function Registro({
  volver,
  login,
  verificacion,
  entrar
}: {
  volver: () => void
  login: () => void
  verificacion: () => void
  entrar: (usuarioId: string) => void
}) {
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [identificador, setIdentificador] = useState('')
  const [password, setPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [verConfirmPassword, setVerConfirmPassword] = useState(false)
  const [enfocadoPass, setEnfocadoPass] = useState(false)
  const [resultado, setResultado] = useState('')
  const [cargando, setCargando] = useState(false)

  const esPasswordValida = (pass: string) => {
    return /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d\W]{6,}$/.test(pass)
  }

  async function registrar() {
    if (
      !nombre.trim() ||
      !apellido.trim() ||
      !identificador.trim() ||
      !password ||
      !confirmarPassword
    ) {
      setResultado('Completa todos los campos.')
      return
    }

    if (!esPasswordValida(password)) {
      setResultado('La contraseña debe ser alfanumérica (mínimo 6 caracteres, con letras y números).')
      return
    }

    if (password !== confirmarPassword) {
      setResultado('Las contraseñas no coinciden.')
      return
    }

    setCargando(true)
    setResultado('Creando cuenta...')

    try {
      const esEmail = identificador.includes('@')
      let data: any = null
      let error: any = null

      if (esEmail) {
        const res = await supabase.auth.signUp({
          email: identificador.trim(),
          password,
          options: {
            data: { nombre: `${nombre} ${apellido}`.trim() }
          }
        })
        data = res.data
        error = res.error
      } else {
        const res = await supabase.auth.signUp({
          phone: identificador.trim(),
          password,
          options: {
            data: { nombre: `${nombre} ${apellido}`.trim() }
          }
        })
        data = res.data
        error = res.error
      }

      if (error) {
        setResultado('ERROR: ' + error.message)
        return
      }

      if (data?.session) {
        setResultado('Cuenta creada correctamente.')
        setTimeout(() => {
          entrar(data.session.user.id)
        }, 800)
      } else {
        setResultado('Cuenta creada. Revisa tu correo o teléfono para verificarla.')
        setTimeout(() => {
          verificacion()
        }, 1200)
      }
    } catch (err) {
      console.error(err)
      setResultado('Ocurrió un error al crear la cuenta.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Logo />

        <div className="form-area">
          <h2>Crear cuenta</h2>

          <div className="input-group">
            <label>Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ingresa tu nombre"
            />
          </div>

          <div className="input-group">
            <label>Apellido</label>
            <input
              type="text"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              placeholder="Ingresa tu apellido"
            />
          </div>

          <div className="input-group">
            <label>Correo electrónico o Teléfono</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                placeholder="correo@ejemplo.com o +521234567890"
              />
              <div style={{ position: 'absolute', right: '14px', top: '16px', color: '#888' }}>
                {identificador.includes('@') ? <Mail size={18} /> : <Phone size={18} />}
              </div>
            </div>
          </div>

          <div className="input-group">
            <label>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={verPassword ? 'text' : 'password'}
                value={password}
                onFocus={() => setEnfocadoPass(true)}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Crea una contraseña"
              />
              <button
                type="button"
                onClick={() => setVerPassword(!verPassword)}
                style={{ position: 'absolute', right: '12px', top: '14px', background: 'none', border: 'none', cursor: 'pointer', color: '#6e6462' }}
              >
                {verPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {enfocadoPass && (
              <p style={{ fontSize: '11px', color: '#B3282D', marginTop: '6px', fontWeight: 600 }}>
                * Mínimo 6 caracteres, debe contener letras y números (alfanumérica).
              </p>
            )}
          </div>

          <div className="input-group">
            <label>Confirmar contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={verConfirmPassword ? 'text' : 'password'}
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                placeholder="Repite tu contraseña"
              />
              <button
                type="button"
                onClick={() => setVerConfirmPassword(!verConfirmPassword)}
                style={{ position: 'absolute', right: '12px', top: '14px', background: 'none', border: 'none', cursor: 'pointer', color: '#6e6462' }}
              >
                {verConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button className="primary-button" onClick={registrar} disabled={cargando}>
            {cargando ? 'Creando...' : 'Crear cuenta'}
          </button>

          <p className="resultado">{resultado}</p>

          <button className="link-button" onClick={login}>
            ¿Ya tienes una cuenta? Iniciar sesión
          </button>

          <button className="link-button" onClick={volver}>
            Volver
          </button>
        </div>
      </section>
    </main>
  )
}

function Verificacion({ login }: { login: () => void }) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <Logo />

        <div className="form-area">
          <h2>Verifica tu cuenta</h2>
          <p className="welcome-text">
            Hemos enviado un enlace o código de confirmación a tu correo o teléfono.
          </p>
          <p>Revisa tu bandeja de entrada o mensajes de texto.</p>
          <p>
            Después de verificar tu cuenta, regresa a la aplicación e inicia sesión.
          </p>

          <button className="primary-button" onClick={login}>
            Ir a iniciar sesión
          </button>
        </div>
      </section>
    </main>
  )
}

function Intereses({ terminar }: { terminar: () => void }) {
  const [opciones, setOpciones] = useState<any[]>([])
  const [seleccionados, setSeleccionados] = useState<number[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [resultado, setResultado] = useState('')

  useEffect(() => {
    async function cargar() {
      try {
        const { data, error } = await obtenerPreferencias()

        if (error) {
          console.error(error)
          setResultado('No se pudieron cargar los intereses.')
          return
        }

        setOpciones(data || [])
      } catch (error) {
        console.error(error)
        setResultado('Ocurrió un error al cargar los intereses.')
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [])

  function cambiarSeleccion(id: number) {
    setSeleccionados((actual) => {
      if (actual.includes(id)) {
        return actual.filter((item) => item !== id)
      }
      return [...actual, id]
    })
  }

  async function guardar() {
    if (seleccionados.length === 0) {
      setResultado('Selecciona al menos un interés.')
      return
    }

    setGuardando(true)
    setResultado('Guardando preferencias...')

    try {
      const { data } = await supabase.auth.getUser()
      const usuario = data.user

      if (!usuario) {
        setResultado('No se encontró el usuario.')
        return
      }

      const { error } = await guardarPreferencias(usuario.id, seleccionados)

      if (error) {
        console.error(error)
        setResultado('ERROR: ' + error.message)
        return
      }

      setResultado('Preferencias guardadas correctamente.')

      setTimeout(() => {
        terminar()
      }, 800)
    } catch (error) {
      console.error(error)
      setResultado('Ocurrió un error al guardar.')
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="form-area">
            <h2>Cargando intereses...</h2>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Logo />

        <div className="form-area">
          <h2>¿Qué te interesa?</h2>

          <p className="welcome-text">
            Selecciona los temas que más te interesan para personalizar tu experiencia.
          </p>

          <div className="explore-grid">
            {opciones.map((opcion) => {
              const seleccionado = seleccionados.includes(opcion.id)

              return (
                <button
                  key={opcion.id}
                  type="button"
                  className="explore-card"
                  onClick={() => cambiarSeleccion(opcion.id)}
                  style={{
                    border: seleccionado ? '3px solid currentColor' : undefined
                  }}
                >
                  <strong>
                    {seleccionado ? 'Seleccionado: ' : ''}
                    {opcion.nombre}
                  </strong>
                </button>
              )
            })}
          </div>

          <button className="primary-button" onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar preferencias'}
          </button>

          <p className="resultado">{resultado}</p>
        </div>
      </section>
    </main>
  )
}