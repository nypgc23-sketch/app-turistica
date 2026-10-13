import { useState } from 'react'
import { iniciarSesion } from '../services/authService'
import { supabase } from '../lib/supabaseClient'
import { Eye, EyeOff, Mail, ArrowLeft, Lock } from 'lucide-react'

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

  /*
  const loginSocial = async (provider: 'google' | 'facebook' | 'apple') => {
    setCargando(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin }
      })
      if (error) {
        setError(`El proveedor ${provider.toUpperCase()} debe estar habilitado en tu panel de Supabase (Authentication > Providers).`)
      }
    } catch {
      setError('Error de conexión con el proveedor externo, verifica tu red.')
    }
    setCargando(false)
  }
  */

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
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: 'linear-gradient(135deg, rgba(35, 8, 9, 0.88) 0%, rgba(70, 15, 17, 0.95) 100%), url("/imagenes/cholula-bg.jpg")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '36px',
        padding: '42px 36px',
        width: '100%',
        maxWidth: '460px',
        boxShadow: '0 30px 60px rgba(0, 0, 0, 0.45)',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          background: 'linear-gradient(90deg, #831818, #b91c1c, #fca5a5)'
        }} />

        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', color: '#831818', background: '#fdf2f2', padding: '6px 14px', borderRadius: '20px', display: 'inline-block', marginBottom: '12px' }}>
            San Andrés Cholula
          </span>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '27px', fontWeight: 900, color: '#1a0b0b', letterSpacing: '-0.7px' }}>
            {mostrarOlvide ? 'Recupera tu acceso' : 'Bienvenido de nuevo'}
          </h2>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#665c58', fontWeight: 500 }}>
            {mostrarOlvide ? 'Te guiaremos paso a paso a tu correo.' : 'Explora la historia y cultura milenaria.'}
          </p>
        </div>

        {mostrarOlvide ? (
          <form onSubmit={recuperarContrasena} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#4a3f3c' }}>Correo electrónico</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={correoRecuperacion}
                  onChange={(e) => setCorreoRecuperacion(e.target.value)}
                  autoComplete="email"
                  required
                  style={{ width: '100%', padding: '15px 44px 15px 16px', borderRadius: '16px', border: '1.5px solid #e2d7d2', fontSize: '14.5px', outline: 'none', backgroundColor: '#fcf9f8', color: '#1a0b0b', fontWeight: 600 }}
                />
                <div style={{ position: 'absolute', right: '16px', top: '17px', color: '#9c8f8a' }}>
                  <Mail size={18} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={cargando} style={{ backgroundColor: '#831818', color: '#fff', border: 'none', padding: '15px', borderRadius: '16px', fontWeight: 800, fontSize: '14.5px', cursor: 'pointer', boxShadow: '0 10px 25px rgba(131, 24, 24, 0.3)' }}>
              {cargando ? 'Enviando enlace...' : 'Enviar correo de recuperación'}
            </button>

            <button type="button" onClick={() => setMostrarOlvide(false)} style={{ background: 'none', border: 'none', color: '#831818', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer', textAlign: 'center', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <ArrowLeft size={16} /> Volver a iniciar sesión
            </button>
          </form>
        ) : (
          <>
            {/* BOTONES DE REDES SOCIALES (COMENTADOS TEMPORALMENTE)
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
              <button 
                type="button" 
                onClick={() => loginSocial('google')} 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '16px', border: '1.5px solid #e2d7d2', backgroundColor: '#fcf9f8', cursor: 'pointer', transition: 'all 0.2s' }}
                title="Continuar con Google"
              >
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#4285F4' }}>G</span>
              </button>
              <button 
                type="button" 
                onClick={() => loginSocial('facebook')} 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '16px', border: '1.5px solid #e2d7d2', backgroundColor: '#fcf9f8', cursor: 'pointer', transition: 'all 0.2s' }}
                title="Continuar con Facebook"
              >
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#1877F2' }}>f</span>
              </button>
              <button 
                type="button" 
                onClick={() => loginSocial('apple')} 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '16px', border: '1.5px solid #e2d7d2', backgroundColor: '#fcf9f8', cursor: 'pointer', transition: 'all 0.2s' }}
                title="Continuar con Apple"
              >
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#000' }}></span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', textAlign: 'center', color: '#b5a49e', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '18px 0' }}>
              <div style={{ flex: 1, borderBottom: '1.5px solid #f0e6e2' }} />
              <span style={{ padding: '0 12px' }}>o ingresa con tu cuenta</span>
              <div style={{ flex: 1, borderBottom: '1.5px solid #f0e6e2' }} />
            </div>
            */}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#4a3f3c' }}>Correo electrónico</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={identificador}
                    onChange={(e) => setIdentificador(e.target.value)}
                    autoComplete="email"
                    required
                    style={{ width: '100%', padding: '15px 44px 15px 16px', borderRadius: '16px', border: '1.5px solid #e2d7d2', fontSize: '14.5px', outline: 'none', backgroundColor: '#fcf9f8', color: '#1a0b0b', fontWeight: 600 }}
                  />
                  <div style={{ position: 'absolute', right: '16px', top: '17px', color: '#9c8f8a' }}>
                    <Mail size={18} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#4a3f3c' }}>Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={verPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    style={{ width: '100%', padding: '15px 44px 15px 16px', borderRadius: '16px', border: '1.5px solid #e2d7d2', fontSize: '14.5px', outline: 'none', backgroundColor: '#fcf9f8', color: '#1a0b0b', fontWeight: 600 }}
                  />
                  <div style={{ position: 'absolute', left: '16px', top: '17px', display: 'none' }}>
                    <Lock size={18} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setVerPassword(!verPassword)}
                    style={{ position: 'absolute', right: '14px', top: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#9c8f8a', display: 'flex', alignItems: 'center' }}
                  >
                    {verPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div style={{ textAlign: 'right', marginTop: '-4px' }}>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#831818', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer', padding: 0 }}
                  onClick={() => setMostrarOlvide(true)}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button type="submit" disabled={cargando} style={{ backgroundColor: '#831818', color: '#fff', border: 'none', padding: '15px', borderRadius: '16px', fontWeight: 800, fontSize: '14.5px', cursor: 'pointer', boxShadow: '0 10px 25px rgba(131, 24, 24, 0.3)', transition: 'all 0.2s' }}>
                {cargando ? 'Validando acceso...' : 'Iniciar sesión'}
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '22px', fontSize: '13.5px' }}>
              <button type="button" onClick={registro} style={{ background: 'none', border: 'none', color: '#831818', fontWeight: 800, cursor: 'pointer' }}>
                Crear cuenta nueva
              </button>
              <button type="button" onClick={volver} style={{ background: 'none', border: 'none', color: '#665c58', fontWeight: 700, cursor: 'pointer' }}>
                Volver
              </button>
            </div>
          </>
        )}

        {error && <p style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '13px', borderRadius: '14px', fontSize: '13.5px', fontWeight: 600, textAlign: 'center', marginTop: '16px', border: '1.5px solid #fecaca' }}>{error}</p>}
        {mensajeExito && <p style={{ backgroundColor: '#f0fdf4', color: '#16a34a', padding: '13px', borderRadius: '14px', fontSize: '13.5px', fontWeight: 600, textAlign: 'center', marginTop: '16px', border: '1.5px solid #bbf7d0' }}>{mensajeExito}</p>}
      </div>
    </main>
  )
}