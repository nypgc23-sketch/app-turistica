//Restablecer contrasña

import { useState } from 'react'

type RestablecerPasswordProps = {
  login: () => void
}

export default function RestablecerPassword({ login }: RestablecerPasswordProps) {
  const [password, setPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  const handleRestablecer = () => {
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirmarPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setCargando(true)
    setError('')
    setTimeout(() => {
      setCargando(false)
      setExito(true)
      setTimeout(login, 1500)
    }, 1000)
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="logo-area">
          <div className="logo-circle">SC</div>
        </div>
        <div className="form-area">
          <h2>Restablecer contraseña</h2>
          <p className="welcome-text">Ingresa tu nueva contraseña.</p>
          <div className="input-group">
            <label>Nueva contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nueva contraseña"
            />
          </div>
          <div className="input-group">
            <label>Confirmar contraseña</label>
            <input
              type="password"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              placeholder="Repite tu contraseña"
            />
          </div>
          <button
            className="primary-button"
            onClick={handleRestablecer}
            disabled={cargando || exito}
          >
            {cargando ? 'Actualizando...' : exito ? '✓ Actualizado' : 'Cambiar contraseña'}
          </button>
          {error && <p className="resultado error">{error}</p>}
          {exito && <p className="resultado success">Contraseña actualizada correctamente.</p>}
        </div>
      </section>
    </main>
  )
}