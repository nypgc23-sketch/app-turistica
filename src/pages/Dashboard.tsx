import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { 
  MapPin, Landmark, UtensilsCrossed, CalendarDays, BookOpen, Route, 
  Sun, Cloud, CloudRain, Search, ChevronRight, Heart, Compass, Menu, X, ArrowRight 
} from 'lucide-react'

type DashboardProps = {
  mapa: () => void
  lugares: () => void
  gastronomia: () => void
  eventos: () => void
  historia: () => void
  favoritos: () => void
  misRutas: () => void
  perfil: () => void
  seleccionarLugar: (lugar: { id_lugar: number; nombre: string }) => void
  seleccionarEvento: (evento: { id_evento: number; nombre: string }) => void
}

type ClimaData = {
  temp: number
  descripcion: string
  codigo: number
}

export default function Dashboard({
  mapa,
  lugares,
  gastronomia,
  eventos,
  historia,
  favoritos,
  misRutas,
  perfil,
  seleccionarLugar,  
  seleccionarEvento: _seleccionarEvento
}: DashboardProps) {
  const [nombre, setNombre] = useState('Explorador')
  const [menuAbierto, setMenuAbierto] = useState(false)
  
  // Estados para la búsqueda interactiva
  const [textoBusqueda, setTextoBusqueda] = useState('')
  const [sugerencias, setSugerencias] = useState<any[]>([])
  const [busquedaActiva, setBusquedaActiva] = useState(false)

  // Clima real dinámico obtenido mediante API meteorológica
  const [clima, setClima] = useState<ClimaData>({
    temp: 22,
    descripcion: 'Cargando clima...',
    codigo: 0
  })

  useEffect(() => {
    let activo = true

    async function cargarDatosSeguros() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user || !activo) return

        const user = session.user
        let nombreBase = user.user_metadata?.nombre || user.email?.split('@')[0] || 'Explorador'

        let { data: datosUsuario } = await supabase
          .from('usuarios')
          .select('nombre')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        if (!datosUsuario && user.email) {
          const { data: usuarioPorCorreo } = await supabase
            .from('usuarios')
            .select('nombre')
            .eq('correo', user.email)
            .maybeSingle()
          datosUsuario = usuarioPorCorreo
        }

        if (datosUsuario?.nombre && activo) {
          nombreBase = datosUsuario.nombre
        }

        if (activo) {
          setNombre(nombreBase.charAt(0).toUpperCase() + nombreBase.slice(1))
        }

        const { data: lugaresRes } = await supabase.from('lugares_turisticos').select('id_lugar, nombre, direccion')
        if (lugaresRes && activo) {
          setSugerencias(lugaresRes.map((item: any) => ({ id: item.id_lugar, nombre: item.nombre, direccion: item.direccion })))
        }
      } catch (err) {
        console.error('Error no crítico en dashboard:', err)
      }
    }

    // Consulta de Clima Real vía Open-Meteo (Coordenadas de San Andrés Cholula: 19.0586, -98.3038)
    async function obtenerClimaReal() {
      try {
        const respuesta = await fetch('https://api.open-meteo.com/v1/forecast?latitude=19.0586&longitude=-98.3038&current_weather=true')
        const data = await respuesta.json()
        if (activo && data?.current_weather) {
          const temp = Math.round(data.current_weather.temperature)
          const codigoWMO = data.current_weather.weathercode

          // Interpretación de códigos meteorológicos WMO
          let desc = 'Despejado'
          if (codigoWMO >= 1 && codigoWMO <= 3) desc = 'Parcialmente nublado'
          else if (codigoWMO >= 51 && codigoWMO <= 67) desc = 'Lluvia ligera'
          else if (codigoWMO >= 95) desc = 'Tormenta eléctrica'
          else if (temp > 24) desc = 'Cálido y soleado'
          else if (temp < 15) desc = 'Fresco'

          setClima({
            temp,
            descripcion: desc,
            codigo: codigoWMO
          })
        }
      } catch (e) {
        console.error('Error cargando clima real:', e)
        if (activo) {
          setClima({ temp: 21, descripcion: 'Clima templado', codigo: 0 })
        }
      }
    }

    cargarDatosSeguros()
    obtenerClimaReal()

    return () => {
      activo = false
    }
  }, [])

  // Filtrar sugerencias de búsqueda
  const lugaresFiltrados = textoBusqueda.trim() === '' 
    ? [] 
    : sugerencias.filter(item => item.nombre.toLowerCase().includes(textoBusqueda.toLowerCase())).slice(0, 5)

  return (
    <main style={{ backgroundColor: '#fcf8f7', minHeight: '100vh', paddingBottom: '110px', fontFamily: 'inherit' }}>
      
      {/* HEADER PRINCIPAL CON DISEÑO FLUIDO Y ELEGANTE */}
      <header style={{ 
        background: 'linear-gradient(135deg, #7a1c1c 0%, #B3282D 100%)', 
        padding: '24px 20px 36px 20px', 
        color: '#fff',
        borderBottomLeftRadius: '36px',
        borderBottomRightRadius: '36px',
        boxShadow: '0 12px 30px rgba(179, 40, 45, 0.25)',
        position: 'relative'
      }}>
        {/* Fila Superior: Saludo y Menú */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <p style={{ fontSize: '13px', opacity: 0.85, fontWeight: 500, margin: 0 }}>¡Hola, viajero!</p>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, letterSpacing: '-0.3px' }}>{nombre}</h1>
          </div>
          <button 
            onClick={() => setMenuAbierto(!menuAbierto)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '14px',
              padding: '10px',
              cursor: 'pointer',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
              transition: 'background 0.2s'
            }}
            aria-label="Abrir menú"
          >
            {menuAbierto ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Tarjeta de Clima en Tiempo Real */}
        <div style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.15)', 
          backdropFilter: 'blur(12px)',
          borderRadius: '18px', 
          padding: '16px 20px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          marginBottom: '20px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '11px', opacity: 0.85, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Clima actual • Cholula</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <strong style={{ fontSize: '24px', fontWeight: 700 }}>{clima.temp}°C</strong>
              <span style={{ fontSize: '13px', opacity: 0.9, fontWeight: 500 }}>{clima.descripcion}</span>
            </div>
          </div>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)', padding: '12px', borderRadius: '14px' }}>
            {clima.codigo >= 51 ? <CloudRain size={26} color="#fff" /> : clima.temp > 20 ? <Sun size={26} color="#ffd54f" /> : <Cloud size={26} color="#fff" />}
          </div>
        </div>

        {/* Buscador Interactivo */}
        <div style={{ position: 'relative' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            backgroundColor: '#fff', 
            borderRadius: '16px', 
            padding: '14px 18px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
          }}>
            <Search size={18} color="#B3282D" style={{ marginRight: '12px', flexShrink: 0 }} />
            <input 
              type="text" 
              placeholder="Busca lugares, atracciones, comida..." 
              value={textoBusqueda}
              onChange={(e) => setTextoBusqueda(e.target.value)}
              onFocus={() => setBusquedaActiva(true)}
              onBlur={() => setTimeout(() => setBusquedaActiva(false), 250)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: '#333', backgroundColor: 'transparent' }}
            />
            {textoBusqueda && (
              <button 
                onClick={() => setTextoBusqueda('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}
              >
                <X size={16} color="#888" />
              </button>
            )}
          </div>
          
          {/* Resultados de Búsqueda Flotantes */}
          {busquedaActiva && lugaresFiltrados.length > 0 && (
            <div style={{ 
              position: 'absolute', top: '64px', left: 0, right: 0, 
              backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 14px 35px rgba(0,0,0,0.18)', 
              zIndex: 30, overflow: 'hidden', border: '1px solid #eee', maxHeight: '260px', overflowY: 'auto'
            }}>
              {lugaresFiltrados.map((item) => (
                <div
                  key={item.id}
                  onMouseDown={() => {
                    seleccionarLugar({ id_lugar: item.id, nombre: item.nombre })
                    setTextoBusqueda('')
                    setBusquedaActiva(false)
                  }}
                  style={{ 
                    padding: '14px 18px', 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    borderBottom: '1px solid #f5f0ef', 
                    cursor: 'pointer', 
                    backgroundColor: '#fff',
                    transition: 'background 0.2s'
                  }}
                >
                  <MapPin size={16} color="#B3282D" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#2d1515' }}>{item.nombre}</div>
                    <div style={{ fontSize: '12px', color: '#6e6462' }}>{item.direccion || 'San Andrés Cholula'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* MENÚ LATERAL ORIGINAL */}
      {menuAbierto && (
        <div className="menu-overlay" onClick={() => setMenuAbierto(false)}>
          <div className="menu-lateral" onClick={(e) => e.stopPropagation()}>
            <div className="menu-header">
              <h3>Menú</h3>
              <button onClick={() => setMenuAbierto(false)}><X size={20} /></button>
            </div>
            <div className="menu-lista">
              <button onClick={() => setMenuAbierto(false)}><Compass size={20} /> Inicio</button>
              <button onClick={() => { perfil(); setMenuAbierto(false); }}><Heart size={20} /> Perfil</button>
              <button onClick={() => { mapa(); setMenuAbierto(false); }}><MapPin size={20} /> Mapa</button>
              <button onClick={() => { misRutas(); setMenuAbierto(false); }}><Route size={20} /> Mis rutas</button>
              <button onClick={() => { eventos(); setMenuAbierto(false); }}><CalendarDays size={20} /> Mis eventos</button>
              <button onClick={() => { favoritos(); setMenuAbierto(false); }}><Heart size={20} /> Favoritos</button>
              <button onClick={() => { historia(); setMenuAbierto(false); }}><BookOpen size={20} /> Historia</button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '26px', maxWidth: '600px', margin: '0 auto' }}>
        
        {/* ACCESOS RÁPIDOS */}
        <section>
          <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#2d1515', margin: 0 }}>Accesos rápidos</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            {[
              { label: 'Lugares', icon: Landmark, onClick: lugares, color: '#B3282D', bg: '#fdf5f5' },
              { label: 'Gastronomía', icon: UtensilsCrossed, onClick: gastronomia, color: '#e65100', bg: '#fff3e0' },
              { label: 'Eventos', icon: CalendarDays, onClick: eventos, color: '#1565c0', bg: '#e3f2fd' },
              { label: 'Historia', icon: BookOpen, onClick: historia, color: '#6a1b9a', bg: '#f3e5f5' },
              { label: 'Rutas', icon: Route, onClick: misRutas, color: '#c2185b', bg: '#fce4ec' },
              { label: 'Mapa', icon: MapPin, onClick: mapa, color: '#2e7d32', bg: '#e8f5e9' }
            ].map((item, idx) => {
              const Icono = item.icon
              return (
                <button
                  key={idx}
                  onClick={item.onClick}
                  style={{
                    backgroundColor: '#fff',
                    border: '1px solid #f2ece9',
                    borderRadius: '20px',
                    padding: '20px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                >
                  <div style={{ backgroundColor: item.bg, padding: '14px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icono size={24} color={item.color} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#400d0f' }}>{item.label}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* TARJETA DESTACADA: ORGANIZA TUS RUTAS */}
        <section 
          onClick={misRutas}
          style={{
            background: 'linear-gradient(135deg, #2d1515 0%, #400d0f 100%)',
            borderRadius: '24px',
            padding: '24px',
            color: '#fff',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ maxWidth: '75%', zIndex: 2 }}>
            <span style={{ backgroundColor: 'rgba(179, 40, 45, 0.6)', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', display: 'inline-block', marginBottom: '8px' }}>
              Itinerarios a tu medida
            </span>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700 }}>Organiza tus Rutas</h3>
            <p style={{ margin: 0, fontSize: '13px', opacity: 0.85, lineHeight: 1.4 }}>
              Diseña tus recorridos diarios por Cholula optimizados por cercanía geográfica.
            </p>
          </div>
          <div style={{ 
            backgroundColor: '#B3282D', borderRadius: '50%', width: '48px', height: '48px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(179, 40, 45, 0.4)', zIndex: 2
          }}>
            <ArrowRight size={22} color="#fff" />
          </div>
        </section>

        {/* SECCIÓN DESCUBRE CHOLULA REDISEÑADA CON IMAGEN DE FONDO ATRACTIVA */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#2d1515', margin: 0 }}>Descubre Cholula</h2>
            <button onClick={lugares} style={{ background: 'none', border: 'none', color: '#B3282D', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              Ver más <ChevronRight size={16} />
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
              backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.75)), url("https://images.unsplash.com/photo-1585464658022-d102bf37d777?auto=format&fit=crop&w=1000&q=80")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              minHeight: '160px'
            }}
          >
            <span style={{ backgroundColor: '#B3282D', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold', width: 'fit-content', marginBottom: '8px' }}>
              Pueblo Mágico
            </span>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 700 }}>Explora la magia de Cholula</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', opacity: 0.9, lineHeight: 1.4, maxWidth: '90%' }}>
              Conoce los rincones históricos, la gastronomía tradicional y sus templos milenarios.
            </p>
            <button style={{ backgroundColor: '#fff', color: '#B3282D', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', width: 'fit-content', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              Explorar ahora
            </button>
          </div>
        </section>

        {/* PRÓXIMOS EVENTOS */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#2d1515', margin: 0 }}>Próximos eventos</h2>
            <button onClick={eventos} style={{ background: 'none', border: 'none', color: '#B3282D', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              Ver todos <ChevronRight size={16} />
            </button>
          </div>

          <div onClick={eventos} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #f2ece9', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ backgroundColor: '#fdf5f5', padding: '16px', borderRadius: '16px', color: '#B3282D', fontWeight: 'bold', fontSize: '12px' }}>
              Prox
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#2d1515', fontWeight: 700 }}>Eventos y festividades</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#6e6462' }}>Descubre las próximas actividades en San Andrés Cholula.</p>
            </div>
          </div>
        </section>

      </div>
    </main>
  )
}