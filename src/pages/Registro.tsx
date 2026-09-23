import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Eye, EyeOff, Mail, Phone } from 'lucide-react'

type RegistroProps = {
  volver: () => void
  iniciarSesion: () => void
  entrar?: (usuarioId: string) => void
}

export default function Registro({ volver, iniciarSesion, entrar }: RegistroProps) {
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [identificador, setIdentificador] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [verConfirmPassword, setVerConfirmPassword] = useState(false)
  const [enfocadoPass, setEnfocadoPass] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const esPasswordValida = (pass: string) => {
    return /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d\W]{6,}$/.test(pass)
  }

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMensaje(null)

    if (!esPasswordValida(password)) {
      setError('La contraseña debe ser alfanumérica (mínimo 6 caracteres, con letras y números).')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setCargando(true)
    const esEmail = identificador.includes('@')

    if (esEmail) {
      const { data, error } = await supabase.auth.signUp({
        email: identificador.trim(),
        password,
        options: {
          data: { nombre: `${nombre} ${apellido}`.trim() }
        }
      })

      if (error) {
        setError(error.message)
      } else {
        setMensaje('¡Cuenta creada con éxito! Revisa tu correo o confirma más tarde desde tu perfil.')
        if (data.session && entrar) {
          entrar(data.session.user.id)
        } else {
          setTimeout(() => iniciarSesion(), 1500)
        }
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        phone: identificador.trim(),
        password,
        options: {
          data: { nombre: `${nombre} ${apellido}`.trim() }
        }
      })

      if (error) {
        setError(error.message)
      } else {
        setMensaje('¡Registro completado! Te hemos enviado un código por SMS.')
        if (data.session && entrar) {
          entrar(data.session.user.id)
        } else {
          setTimeout(() => iniciarSesion(), 1500)
        }
      }
    }
    setCargando(false)
  }

  return (
    <div className="welcome-container">
      <div className="welcome-card" style={{ maxWidth: '440px', padding: '32px 28px' }}>
        <span className="welcome-brand">San Andrés Cholula</span>
        <h2 className="welcome-title" style={{ fontSize: '24px' }}>Crear cuenta</h2>

        <form onSubmit={handleRegistro} style={{ textAlign: 'left', marginTop: '16px' }}>
          
          {/* NOMBRE */}
          <div className="input-group">
            <label>Nombre</label>
            <input
              type="text"
              placeholder="Ingresa tu nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          {/* APELLIDO */}
          <div className="input-group">
            <label>Apellido</label>
            <input
              type="text"
              placeholder="Ingresa tu apellido"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              required
            />
          </div>

          {/* CORREO O TELÉFONO */}
          <div className="input-group">
            <label>Correo electrónico o Teléfono</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="correo@ejemplo.com o +521234567890"
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                required
              />
              <div style={{ position: 'absolute', right: '14px', top: '16px', color: '#888' }}>
                {identificador.includes('@') ? <Mail size={18} /> : <Phone size={18} />}
              </div>
            </div>
          </div>

          {/* CONTRASEÑA Y VER/OCULTAR */}
          <div className="input-group">
            <label>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={verPassword ? 'text' : 'password'}
                placeholder="Crea una contraseña"
                value={password}
                onFocus={() => setEnfocadoPass(true)}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setVerPassword(!verPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '14px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6e6462'
                }}
              >
                {verPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* ALERTA DE REGLA AL ENFOCAR / ESCRIBIR */}
            {enfocadoPass && (
              <p style={{ fontSize: '11px', color: '#B3282D', marginTop: '6px', fontWeight: 600 }}>
                * Debe tener al menos 6 caracteres e incluir letras y números (alfanumérica).
              </p>
            )}
          </div>

          {/* CONFIRMAR CONTRASEÑA */}
          <div className="input-group">
            <label>Confirmar contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={verConfirmPassword ? 'text' : 'password'}
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setVerConfirmPassword(!verConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '14px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6e6462'
                }}
              >
                {verConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary-welcome" disabled={cargando} style={{ marginTop: '12px' }}>
            {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        {error && <p className="resultado error" style={{ marginTop: '12px' }}>{error}</p>}
        {mensaje && <p className="resultado success" style={{ marginTop: '12px' }}>{mensaje}</p>}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '13px' }}>
          <button type="button" className="link-button" onClick={iniciarSesion}>
            ¿Ya tienes cuenta? Iniciar sesión
          </button>
          <button type="button" className="link-button" onClick={volver}>
            Volver
          </button>
        </div>
      </div>
    </div>
  )
}