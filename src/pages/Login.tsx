import { useState } from 'react'
import { iniciarSesion } from '../services/authService'
import { supabase } from '../lib/supabaseClient'
import { Eye, EyeOff, Mail } from 'lucide-react'

type LoginProps = {
  volver: () => void
  registro: () => void
  entrar: (usuarioId: string) => void
}

export default function Login({ volver, registro, entrar }: LoginProps) {
  const [identificador, setIdentificador] = useState('')
  const [password, setPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [mostrarOlvide, setMostrarOlvide] = useState(false)
  const [correoRecuperacion, setCorreoRecuperacion] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')

  const loginSocial = async (provider: 'google' | 'facebook' | 'apple') => {
    setCargando(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin }
      })
      if (error) {
        setError(`El inicio de sesión con ${provider.toUpperCase()} requiere configurar sus llaves API en Supabase.`)
      }
    } catch (err: any) {
      setError('Error de conexión, verifica.')
    }
    setCargando(false)
  }

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setCargando(true)
    setError('')
    setMensajeExito('')

    const { data, error } = await iniciarSesion(identificador, password)

    if (error) {
      setError(error.message || 'Error al iniciar sesión. Verifica tus datos.')
      setCargando(false)
      return
    }

    if (data?.session) {
      entrar(data.session.user.id)
    } else {
      setError('No se pudo obtener la sesión activa.')
      setCargando(false)
    }
  }

  const recuperarContrasena = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMensajeExito('')

    if (!correoRecuperacion.trim()) {
      setError('Ingresa tu correo electrónico.')
      return
    }

    setCargando(true)
    const { error } = await supabase.auth.resetPasswordForEmail(correoRecuperacion.trim(), {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) {
      setError(error.message || 'Error al enviar el correo de recuperación.')
    } else {
      setMensajeExito('Te hemos enviado un correo para restablecer tu contraseña.')
      setMostrarOlvide(false)
    }
    setCargando(false)
  }

  return (
    <div className="welcome-container">
      <div className="welcome-card" style={{ maxWidth: '440px', padding: '32px 28px' }}>
        <span className="welcome-brand">San Andrés Cholula</span>
        <h2 className="welcome-title" style={{ fontSize: '24px' }}>
          {mostrarOlvide ? 'Recuperar Contraseña' : 'Iniciar sesión'}
        </h2>

        {mostrarOlvide ? (
          <form onSubmit={recuperarContrasena} style={{ textAlign: 'left', marginTop: '16px' }}>
            <div className="input-group">
              <label>Correo electrónico</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={correoRecuperacion}
                  onChange={(e) => setCorreoRecuperacion(e.target.value)}
                  required
                />
                <div style={{ position: 'absolute', right: '14px', top: '16px', color: '#888' }}>
                  <Mail size={18} />
                </div>
              </div>
            </div>
            <button type="submit" className="btn-primary-welcome" disabled={cargando}>
              {cargando ? 'Enviando...' : 'Enviar correo de recuperación'}
            </button>
            <button
              type="button"
              className="link-button"
              onClick={() => setMostrarOlvide(false)}
              style={{ width: '100%', marginTop: '8px', textAlign: 'center' }}
            >
              Volver a iniciar sesión
            </button>
          </form>
        ) : (
          <>
            <div className="social-buttons-modern" style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '14px 0' }}>
              <button type="button" className="social-btn-modern" onClick={() => loginSocial('google')}>
                <span className="social-icon">G</span> Continuar con Google
              </button>
              <button type="button" className="social-btn-modern" onClick={() => loginSocial('facebook')}>
                <span className="social-icon">f</span> Continuar con Facebook
              </button>
              <button type="button" className="social-btn-modern" onClick={() => loginSocial('apple')}>
                <span className="social-icon"></span> Continuar con Apple
              </button>
            </div>

            <div className="divider" style={{ margin: '16px 0', fontSize: '12px' }}>O ingresa con tu cuenta</div>

            <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
              <div className="input-group">
                <label>Correo electrónico</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={identificador}
                    onChange={(e) => setIdentificador(e.target.value)}
                    required
                  />
                  <div style={{ position: 'absolute', right: '14px', top: '16px', color: '#888' }}>
                    <Mail size={18} />
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label>Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={verPassword ? 'text' : 'password'}
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setVerPassword(!verPassword)}
                    style={{ position: 'absolute', right: '12px', top: '14px', background: 'none', border: 'none', cursor: 'pointer', color: '#6e6462' }}
                  >
                    {verPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div style={{ textAlign: 'right', marginBottom: '14px' }}>
                <button
                  type="button"
                  className="link-button"
                  style={{ fontSize: '12px', padding: 0 }}
                  onClick={() => setMostrarOlvide(true)}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button type="submit" className="btn-primary-welcome" disabled={cargando}>
                {cargando ? 'Ingresando...' : 'Iniciar sesión'}
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '13px' }}>
              <button type="button" className="link-button" onClick={registro}>
                ¿No tienes cuenta? Registrarse
              </button>
              <button type="button" className="link-button" onClick={volver}>
                Volver
              </button>
            </div>
          </>
        )}

        {error && <p className="resultado error" style={{ marginTop: '12px' }}>{error}</p>}
        {mensajeExito && <p className="resultado success" style={{ marginTop: '12px' }}>{mensajeExito}</p>}
      </div>
    </div>
  )
}