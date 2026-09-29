import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { 
  Lock, Camera, MapPin, Route, Heart, 
  Bell, Moon, LogOut, ChevronRight, Calendar, Plus, X, ShieldCheck
} from 'lucide-react'

type PerfilProps = {
  volver: () => void
  onVerEventos?: () => void
  onCerrarSesion?: () => void
  irAdmin?: () => void
  cambiarPantalla?: (pantalla: string) => void // <-- Añadido para control directo
}

export default function Perfil({ volver, onVerEventos, onCerrarSesion, irAdmin, cambiarPantalla }: PerfilProps) {
  const [usuario, setUsuario] = useState<any>(null)
  const [nombreBD, setNombreBD] = useState('Usuario')
  const [modoOscuro, setModoOscuro] = useState(false)
  const [notificaciones, setNotificaciones] = useState(true)
  
  const [lugaresVisitados, setLugaresVisitados] = useState(0)
  const [rutasRealizadas, setRutasRealizadas] = useState(0)
  const [favoritosGuardados, setFavoritosGuardados] = useState(0)

  const [intereses, setIntereses] = useState<string[]>(['Gastronomía', 'Historia', 'Iglesias', 'Cultura'])
  const [nuevoInteres, setNuevoInteres] = useState('')
  const [agregandoInteres, setAgregandoInteres] = useState(false)

  const [mensaje, setMensaje] = useState<string | null>(null)
  const [cambiandoPass, setCambiandoPass] = useState(false)
  const [nuevaPass, setNuevaPass] = useState('')

  const CORREO_ADMIN = 'nypgc23@gmail.com'

  useEffect(() => {
    cargarDatosPerfil()
  }, [])

  async function cargarDatosPerfil() {
    try {
      const { data, error } = await supabase.auth.getSession()
      
      if (error || !data?.session?.user) {
        setNombreBD('Usuario')
        return
      }

      const user = data.session.user
      setUsuario(user)

      let nombreFinal = user.user_metadata?.nombre || user.email?.split('@')[0] || 'Viajero'
      setNombreBD(nombreFinal.charAt(0).toUpperCase() + nombreFinal.slice(1))

      let { data: datosUsuario } = await supabase
        .from('usuarios')
        .select('id_usuario, nombre')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (!datosUsuario && user.email) {
        const { data: usuarioPorCorreo } = await supabase
          .from('usuarios')
          .select('id_usuario, nombre')
          .eq('correo', user.email)
          .maybeSingle()
        
        datosUsuario = usuarioPorCorreo
      }

      if (datosUsuario?.nombre) {
        setNombreBD(datosUsuario.nombre)
      }

      const numericId = datosUsuario?.id_usuario

      let rts: any[] = []
      let favs: any[] = []

      if (numericId) {
        const [resRutas, resFavs] = await Promise.all([
          supabase.from('rutas').select('id_ruta, completada').eq('id_usuario', numericId),
          supabase.from('favoritos').select('id_favorito').eq('id_usuario', numericId)
        ])

        if (resRutas.data) rts = resRutas.data
        if (resFavs.data) favs = resFavs.data
      }

      const completadas = rts.filter((r: any) => r.completada).length
      setRutasRealizadas(rts.length)
      setFavoritosGuardados(favs.length)
      setLugaresVisitados(completadas * 3 + favs.length)

    } catch (err) {
      console.error('Error controlado en perfil:', err)
    }
  }

  async function cambiarFotoPerfil(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return
    const archivo = e.target.files[0]
    setMensaje('Procesando imagen...')

    const reader = new FileReader()
    reader.readAsDataURL(archivo)
    reader.onload = async () => {
      const base64Image = reader.result as string
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: base64Image }
      })

      if (error) {
        setMensaje('Error al actualizar la foto de perfil.')
      } else {
        setMensaje('¡Foto de perfil actualizada!')
        cargarDatosPerfil()
      }
    }
  }

  async function actualizarContrasena(e: React.FormEvent) {
    e.preventDefault()
    if (!nuevaPass) return

    const { error } = await supabase.auth.updateUser({ password: nuevaPass })

    if (error) {
      setMensaje('Error al actualizar contraseña.')
    } else {
      setMensaje('¡Contraseña actualizada correctamente!')
      setCambiandoPass(false)
      setNuevaPass('')
    }
  }

  async function guardarInteresesBD(nuevosIntereses: string[]) {
    setIntereses(nuevosIntereses)
    await supabase.auth.updateUser({
      data: { intereses: nuevosIntereses }
    })
  }

  function agregarInteres() {
    if (!nuevoInteres.trim()) return
    if (!intereses.includes(nuevoInteres.trim())) {
      const listaActualizada = [...intereses, nuevoInteres.trim()]
      guardarInteresesBD(listaActualizada)
    }
    setNuevoInteres('')
    setAgregandoInteres(false)
  }

  function eliminarInteres(tag: string) {
    const listaActualizada = intereses.filter(i => i !== tag)
    guardarInteresesBD(listaActualizada)
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
    if (onCerrarSesion) {
      onCerrarSesion()
    } else {
      volver()
    }
  }

  const esAdmin = usuario?.email === CORREO_ADMIN

  return (
    <main className="app-page perfil-page">
      <header className="app-header">
        <div>
          <h1>San Andrés Cholula</h1>
          <p>Mi Perfil</p>
        </div>
        <button className="link-button" onClick={volver} style={{ color: '#7B1E34' }}>
          Volver
        </button>
      </header>

      <section className="content-area perfil-container">
        <div className="perfil-card">
          
          <div className="perfil-avatar">
            <div className="avatar-circle" style={{ position: 'relative' }}>
              {usuario?.user_metadata?.avatar_url ? (
                <img src={usuario.user_metadata.avatar_url} alt="Perfil" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div className="avatar-letra">{nombreBD.charAt(0).toUpperCase() || 'U'}</div>
              )}
              
              <label htmlFor="input-avatar" style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                background: '#7B1E34',
                padding: '8px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}>
                <Camera size={16} color="#fff" />
                <input 
                  id="input-avatar" 
                  type="file" 
                  accept="image/*" 
                  onChange={cambiarFotoPerfil} 
                  style={{ display: 'none' }} 
                />
              </label>
            </div>

            <h2>{nombreBD}</h2>
            <p className="perfil-email">{usuario?.email}</p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#2e7d32', margin: '8px 0', fontSize: '13px', fontWeight: 700 }}>
              <ShieldCheck size={18} /> Cuenta Activa
            </div>

            <button 
              className="btn-toggle-detalles" 
              onClick={() => setCambiandoPass(!cambiandoPass)}
              style={{ marginTop: '6px', color: '#7B1E34', background: 'none', border: '1px solid #7B1E34', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Lock size={14} /> {cambiandoPass ? 'Cancelar' : 'Cambiar contraseña'}
            </button>

            {cambiandoPass && (
              <form onSubmit={actualizarContrasena} style={{ marginTop: '12px', width: '100%', maxWidth: '280px' }}>
                <input 
                  type="password" 
                  placeholder="Nueva contraseña"
                  value={nuevaPass}
                  onChange={e => setNuevaPass(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid #ccc',
                    marginBottom: '8px'
                  }}
                />
                <button type="submit" style={{ width: '100%', height: '40px', fontSize: '13px', backgroundColor: '#7B1E34', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  Guardar nueva contraseña
                </button>
              </form>
            )}
          </div>

          {mensaje && <p className="resultado" style={{ textAlign: 'center', marginBottom: '15px' }}>{mensaje}</p>}

          <hr className="divider" />

          {/* SECCIÓN MIS EVENTOS - FORZADA A ABRIR MIS EVENTOS */}
          <div className="perfil-eventos">
            <div className="eventos-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={18} color="#7B1E34" /> Mis Eventos</h3>
              <button 
                className="btn-toggle-eventos" 
                onClick={() => {
                  if (onVerEventos) onVerEventos()
                  if (cambiarPantalla) cambiarPantalla('misEventos')
                }} 
                style={{ background: 'none', border: 'none', color: '#7B1E34', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Ver agenda <ChevronRight size={14} />
              </button>
            </div>
            <p className="sin-eventos">Consulta y gestiona tus eventos agendados en Cholula.</p>
          </div>

          <div style={{ marginTop: '20px', padding: '16px', background: '#fdf5f5', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#400d0f', fontWeight: 800 }}>
              Resumen de Actividad
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
              <div>
                <MapPin size={20} color="#7B1E34" />
                <strong style={{ display: 'block', fontSize: '18px', color: '#400d0f' }}>{lugaresVisitados}</strong>
                <span style={{ fontSize: '11px', color: '#6e6462' }}>Visitados</span>
              </div>
              <div>
                <Route size={20} color="#7B1E34" />
                <strong style={{ display: 'block', fontSize: '18px', color: '#400d0f' }}>{rutasRealizadas}</strong>
                <span style={{ fontSize: '11px', color: '#6e6462' }}>Rutas</span>
              </div>
              <div>
                <Heart size={20} color="#7B1E34" />
                <strong style={{ display: 'block', fontSize: '18px', color: '#400d0f' }}>{favoritosGuardados}</strong>
                <span style={{ fontSize: '11px', color: '#6e6462' }}>Favoritos</span>
              </div>
            </div>
          </div>

          <hr className="divider" />

          <div className="perfil-configuracion">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Mis Intereses</h3>
              <button 
                onClick={() => setAgregandoInteres(!agregandoInteres)}
                style={{ background: 'none', border: 'none', color: '#7B1E34', cursor: 'pointer', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} /> Agregar
              </button>
            </div>

            {agregandoInteres && (
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px', marginBottom: '8px' }}>
                <input 
                  type="text" 
                  placeholder="Nuevo interés..."
                  value={nuevoInteres}
                  onChange={e => setNuevoInteres(e.target.value)}
                  style={{ flex: 1, padding: '6px 10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px' }}
                />
                <button onClick={agregarInteres} style={{ padding: '0 12px', height: '32px', fontSize: '12px', backgroundColor: '#7B1E34', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  Guardar
                </button>
              </div>
            )}

            <div className="interest-list" style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {intereses.map(tag => (
                <span key={tag} className="interest-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#f2d6d0', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', color: '#400d0f' }}>
                  {tag}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => eliminarInteres(tag)} />
                </span>
              ))}
            </div>
          </div>

          <div className="perfil-configuracion">
            <div className="config-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <Bell size={18} color="#7B1E34" /> Notificaciones
              </span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={notificaciones} 
                  onChange={() => setNotificaciones(!notificaciones)} 
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <div className="perfil-configuracion">
            <div className="config-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <Moon size={18} color="#7B1E34" /> Modo Oscuro
              </span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={modoOscuro} 
                  onChange={() => {
                    setModoOscuro(!modoOscuro)
                    document.documentElement.classList.toggle('dark')
                  }} 
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {esAdmin && irAdmin && (
            <button 
              onClick={irAdmin} 
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', 
                marginTop: '16px', width: '100%', padding: '12px', backgroundColor: '#2d1515', 
                color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 
              }}
            >
              <ShieldCheck size={18} color="#ffd54f" /> Panel de Administrador
            </button>
          )}

          <button className="btn-cerrar-sesion" onClick={cerrarSesion} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '12px', width: '100%', padding: '12px', backgroundColor: '#5A1222', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            <LogOut size={18} /> Cerrar sesión
          </button>

        </div>
      </section>
    </main>
  )
}