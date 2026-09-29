import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import MapaRuta from '../components/MapaRuta'
import { 
  Calendar, ChevronRight, Route, 
  Trash2, Coffee, ArrowLeft, CheckCircle, Check, Copy, Navigation, MapPin, Plus, X, Utensils, Flag, CalendarDays, Layers, Store
} from 'lucide-react'

type Ruta = {
  id_ruta: number
  nombre: string
  descripcion: string | null
  duracion_dias: number
  completada?: boolean
}

type LugarRuta = {
  id_detalle_ruta: number
  id_lugar: number
  orden_visita: number
  dia: number
  nombre: string
  direccion: string | null
  latitud: number | null
  longitud: number | null
}

type MisRutasProps = {
  volver: () => void
  seleccionarLugar: (lugar: { id_lugar: number; nombre: string }) => void
}

function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function ordenarPorCercania(puntos: LugarRuta[]): LugarRuta[] {
  if (puntos.length <= 1) return puntos

  const resultado: LugarRuta[] = []
  const noVisitados = [...puntos]

  let actual = noVisitados.shift()!
  resultado.push(actual)

  while (noVisitados.length > 0) {
    let masCercanoIndex = 0
    let distanciaMinima = Infinity

    for (let i = 0; i < noVisitados.length; i++) {
      if (
        actual.latitud === null || actual.longitud === null ||
        noVisitados[i].latitud === null || noVisitados[i].longitud === null
      ) {
        continue
      }

      const dist = calcularDistancia(
        actual.latitud, actual.longitud,
        noVisitados[i].latitud!, noVisitados[i].longitud!
      )

      if (dist < distanciaMinima) {
        distanciaMinima = dist
        masCercanoIndex = i
      }
    }

    actual = noVisitados.splice(masCercanoIndex, 1)[0]
    resultado.push(actual)
  }

  return resultado
}

function estimarTiempoTrayecto(puntos: LugarRuta[]) {
  const puntosValidos = puntos.filter(p => p.latitud !== null && p.longitud !== null)
  if (puntosValidos.length < 2) return { distanciaKm: 0, tiempoMinutos: 0 }

  let distanciaTotalKm = 0
  for (let i = 0; i < puntosValidos.length - 1; i++) {
    distanciaTotalKm += calcularDistancia(
      puntosValidos[i].latitud!, puntosValidos[i].longitud!,
      puntosValidos[i + 1].latitud!, puntosValidos[i + 1].longitud!
    )
  }

  const tiempoMinutos = Math.max(5, Math.round((distanciaTotalKm / 20) * 60))
  return { distanciaKm: Number(distanciaTotalKm.toFixed(1)), tiempoMinutos }
}

export default function MisRutas({ volver, seleccionarLugar }: MisRutasProps) {
  const [rutas, setRutas] = useState<Ruta[]>([])
  const [rutaSeleccionada, setRutaSeleccionada] = useState<Ruta | null>(null)
  const [lugares, setLugares] = useState<LugarRuta[]>([])
  const [diaActivo, setDiaActivo] = useState<number>(1)
  
  const [abrirModalGenerar, setAbrirModalGenerar] = useState(false)
  const [nombreNuevaRuta, setNombreNuevaRuta] = useState('')
  const [fechaInicioRuta, setFechaInicioRuta] = useState('')
  const [duracionDias, setDuracionDias] = useState<1 | 2>(2)
  
  const [lugaresTuristicos, setLugaresTuristicos] = useState<any[]>([])
  const [lugaresComerciales, setLugaresComerciales] = useState<any[]>([])
  const [eventosDisponibles, setEventosDisponibles] = useState<any[]>([])
  const [platillosDisponibles, setPlatillosDisponibles] = useState<any[]>([])
  const [bebidasDisponibles, setBebidasDisponibles] = useState<any[]>([])

  const [lugaresSeleccionadosIds, setLugaresSeleccionadosIds] = useState<number[]>([])
  const [comerciosSeleccionadosIds, setComerciosSeleccionadosIds] = useState<number[]>([])
  const [eventosSeleccionadosIds, setEventosSeleccionadosIds] = useState<number[]>([])
  const [gastronomiaSeleccionada, setGastronomiaSeleccionada] = useState<string[]>([])

  const [cargando, setCargando] = useState(true)
  const [cargandoLugares, setCargandoLugares] = useState(false)
  const [guardandoEstado, setGuardandoEstado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const fechaHoy = new Date().toISOString().split('T')[0]
  const fechaUnAnioDespues = new Date()
  fechaUnAnioDespues.setFullYear(fechaUnAnioDespues.getFullYear() + 1)
  const fechaMax = fechaUnAnioDespues.toISOString().split('T')[0]

  useEffect(() => {
    let montado = true

    async function cargarDatosDirectos() {
      setCargando(true)
      setError(null)

      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          setError('Necesitas iniciar sesión para ver y gestionar tus rutas.')
          setCargando(false)
          return
        }

        const [resRutas, resLugares, resEventos, resPlatillos, resBebidas] = await Promise.all([
          supabase.from('rutas').select('*').order('id_ruta', { ascending: false }),
          supabase.from('lugares_turisticos').select('*').order('nombre', { ascending: true }),
          supabase.from('eventos').select('*').order('nombre', { ascending: true }),
          supabase.from('platillos').select('*').order('nombre', { ascending: true }),
          supabase.from('bebidas').select('*').order('nombre', { ascending: true })
        ])

        if (!montado) return

        if (resRutas.error) {
          console.error('Error obteniendo rutas de Supabase:', resRutas.error)
          setError('No se pudieron cargar tus rutas.')
        } else {
          setRutas(resRutas.data || [])
        }

        if (resLugares.data) {
          const comerciales = resLugares.data.filter((l: any) => 
            l.nombre.toLowerCase().includes('restaurante') || 
            l.nombre.toLowerCase().includes('casita') ||
            l.nombre.toLowerCase().includes('oxxo') ||
            l.nombre.toLowerCase().includes('mercado')
          )
          const turisticos = resLugares.data.filter((l: any) => !comerciales.includes(l))

          setLugaresTuristicos(turisticos)
          setLugaresComerciales(comerciales)
        }

        if (resEventos.data) setEventosDisponibles(resEventos.data)
        if (resPlatillos.data) setPlatillosDisponibles(resPlatillos.data)
        if (resBebidas.data) setBebidasDisponibles(resBebidas.data)

      } catch (err) {
        console.error('Excepción cargando datos:', err)
        setError('Ocurrió un error al conectar con la base de datos.')
      } finally {
        if (montado) setCargando(false)
      }
    }

    cargarDatosDirectos()

    return () => {
      montado = false
    }
  }, [])

  useEffect(() => {
    if (!mensaje) return
    const timer = setTimeout(() => setMensaje(null), 3000)
    return () => clearTimeout(timer)
  }, [mensaje])

  async function seleccionarRuta(ruta: Ruta) {
    setRutaSeleccionada(ruta)
    setDiaActivo(1)
    setCargandoLugares(true)
    setError(null)
    setMensaje(null)

    const { data: detalles, error: errDetalles } = await supabase
      .from('detalle_ruta')
      .select(`
        id_detalle_ruta,
        id_lugar,
        orden_visita,
        dia,
        lugares_turisticos (
          nombre,
          direccion,
          latitud,
          longitud
        )
      `)
      .eq('id_ruta', ruta.id_ruta)
      .order('dia', { ascending: true })
      .order('orden_visita', { ascending: true })

    if (errDetalles) {
      console.error('Error obteniendo lugares de ruta:', errDetalles)
      setError('No se pudieron cargar los lugares de esta ruta.')
      setLugares([])
      setCargandoLugares(false)
      return
    }

    const lugaresFormateados: LugarRuta[] = (detalles || []).map((d: any, index: number) => ({
      id_detalle_ruta: d.id_detalle_ruta,
      id_lugar: d.id_lugar,
      orden_visita: d.orden_visita || index + 1,
      dia: d.dia || (index >= 5 ? 2 : 1),
      nombre: d.lugares_turisticos?.nombre || 'Lugar sin nombre',
      direccion: d.lugares_turisticos?.direccion || null,
      latitud: d.lugares_turisticos?.latitud !== null && d.lugares_turisticos?.latitud !== undefined ? Number(d.lugares_turisticos.latitud) : null,
      longitud: d.lugares_turisticos?.longitud !== null && d.lugares_turisticos?.longitud !== undefined ? Number(d.lugares_turisticos.longitud) : null
    }))

    setLugares(lugaresFormateados)
    setCargandoLugares(false)
  }

  async function quitarLugar(idDetalleRuta: number) {
    if (!rutaSeleccionada) return
    setMensaje(null)

    const { error } = await supabase
      .from('detalle_ruta')
      .delete()
      .eq('id_detalle_ruta', idDetalleRuta)

    if (error) {
      console.error('Error eliminando lugar:', error)
      setMensaje('No se pudo quitar el lugar de la ruta.')
      return
    }

    setLugares(prev => prev.filter(l => l.id_detalle_ruta !== idDetalleRuta))
    setMensaje('Lugar quitado de la ruta.')
  }

  async function eliminarRutaCompleta(idRuta: number, e: React.MouseEvent) {
    e.stopPropagation()
    const confirmar = window.confirm('¿Estás segura de que deseas eliminar esta ruta por completo?')
    if (!confirmar) return

    setMensaje('Eliminando ruta...')

    await supabase.from('detalle_ruta').delete().eq('id_ruta', idRuta)

    const { error } = await supabase.from('rutas').delete().eq('id_ruta', idRuta)

    if (error) {
      console.error('Error eliminando ruta:', error)
      setMensaje('No se pudo eliminar la ruta.')
      return
    }

    setRutas(prev => prev.filter(r => r.id_ruta !== idRuta))
    if (rutaSeleccionada?.id_ruta === idRuta) {
      setRutaSeleccionada(null)
    }
    setMensaje('¡Ruta eliminada con éxito!')
  }

  async function clonarRuta(idRutaOriginal: number, e: React.MouseEvent) {
    e.stopPropagation()
    setMensaje('Clonando itinerario...')

    const rutaOriginal = rutas.find(r => r.id_ruta === idRutaOriginal)
    if (!rutaOriginal) return

    const { data: nuevaRuta, error: errRuta } = await supabase
      .from('rutas')
      .insert({
        tipo_ruta: 'manual',
        nombre: `${rutaOriginal.nombre} (Copia)`,
        descripcion: rutaOriginal.descripcion,
        duracion_dias: rutaOriginal.duracion_dias,
        estado: true
      })
      .select()
      .single()

    if (errRuta || !nuevaRuta) {
      setMensaje('Error al duplicar la ruta.')
      return
    }

    const { data: detalles } = await supabase
      .from('detalle_ruta')
      .select('*')
      .eq('id_ruta', idRutaOriginal)

    if (detalles && detalles.length > 0) {
      const nuevosDetalles = detalles.map((d: any) => ({
        id_ruta: nuevaRuta.id_ruta,
        id_lugar: d.id_lugar,
        dia: d.dia,
        orden_visita: d.orden_visita
      }))
      await supabase.from('detalle_ruta').insert(nuevosDetalles)
    }

    setRutas(prev => [...prev, nuevaRuta])
    setMensaje('¡Itinerario duplicado!')
  }

  async function marcarCompletada(idRuta: number) {
    setGuardandoEstado(true)
    setMensaje(null)

    try {
      const nuevoEstado = !rutaSeleccionada?.completada
      const { error } = await supabase
        .from('rutas')
        .update({ completada: nuevoEstado })
        .eq('id_ruta', idRuta)

      if (error) {
        console.error('Error actualizando estado de ruta:', error)
        setMensaje('No se pudo actualizar el estado de la ruta.')
        setGuardandoEstado(false)
        return
      }

      setRutaSeleccionada(prev => prev ? { ...prev, completada: nuevoEstado } : null)
      setRutas(prev => prev.map(r => r.id_ruta === idRuta ? { ...r, completada: nuevoEstado } : r))
      setMensaje(nuevoEstado ? '¡Ruta marcada como terminada!' : 'Ruta marcada como pendiente.')
    } catch (err) {
      console.error(err)
      setMensaje('Ocurrió un error al actualizar la ruta.')
    } finally {
      setGuardandoEstado(false)
    }
  }

  async function handleCrearRutaManual(e: React.FormEvent) {
    e.preventDefault()
    if (!nombreNuevaRuta.trim()) {
      alert('Por favor ingresa un nombre para tu ruta.')
      return
    }

    const descripcionTexto = `Inicia el ${fechaInicioRuta || 'Próximamente'} (Duración: ${duracionDias} Día${duracionDias > 1 ? 's' : ''})${gastronomiaSeleccionada.length > 0 ? `. Gastronomía: ${gastronomiaSeleccionada.join(', ')}` : ''}`

    const { data: nuevaRuta, error: errRuta } = await supabase
      .from('rutas')
      .insert({
        tipo_ruta: 'manual',
        nombre: nombreNuevaRuta.trim(),
        descripcion: descripcionTexto,
        duracion_dias: duracionDias,
        estado: true
      })
      .select()
      .single()

    if (errRuta || !nuevaRuta) {
      alert('Error al crear la ruta: ' + (errRuta?.message || 'Desconocido'))
      return
    }

    const todosLosLugaresIds = [...lugaresSeleccionadosIds, ...comerciosSeleccionadosIds]

    if (todosLosLugaresIds.length > 0) {
      const detallesAInsertar = todosLosLugaresIds.map((idLugar, index) => {
        const diaAsignado = index >= 5 ? 2 : 1
        return {
          id_ruta: nuevaRuta.id_ruta,
          id_lugar: idLugar,
          dia: diaAsignado,
          orden_visita: index + 1
        }
      })
      await supabase.from('detalle_ruta').insert(detallesAInsertar)
    }

    setRutas(prev => [nuevaRuta, ...prev])
    setAbrirModalGenerar(false)
    setNombreNuevaRuta('')
    setFechaInicioRuta('')
    setLugaresSeleccionadosIds([])
    setComerciosSeleccionadosIds([])
    setEventosSeleccionadosIds([])
    setGastronomiaSeleccionada([])
    alert(`¡Tu ruta ha sido creada con éxito!`)
  }

  const tieneMasDeCincoLugares = lugares.length > 5

  const lugaresDelDiaBrutos = lugares.filter((_, index) => {
    if (diaActivo === 1) return index < 5
    return index >= 5 && index < 10
  })

  const lugaresDelDia = ordenarPorCercania(lugaresDelDiaBrutos)

  const lugaresConCoordenadasAjustadas = lugaresDelDia
    .filter(l => l.latitud !== null && l.longitud !== null)
    .map((l, idx, arr) => {
      let lat = Number(l.latitud)
      let lon = Number(l.longitud)

      const duplicadosPrevios = arr.slice(0, idx).filter(
        prev => Number(prev.latitud) === lat && Number(prev.longitud) === lon
      ).length

      if (duplicadosPrevios > 0) {
        const angulo = duplicadosPrevios * (Math.PI / 2)
        lat += Math.sin(angulo) * 0.0004 * duplicadosPrevios
        lon += Math.cos(angulo) * 0.0004 * duplicadosPrevios
      }

      return {
        id_lugar: l.id_lugar,
        nombre: l.nombre,
        latitud: lat,
        longitud: lon,
        orden_visita: idx + 1
      }
    })

  const { distanciaKm, tiempoMinutos } = estimarTiempoTrayecto(lugaresDelDia)

  if (cargando || (error && rutas.length === 0)) {
    return (
      <main className="app-page mis-rutas-page">
        <header className="app-header">
          <div>
            <h1>Descubre Cholula</h1>
            <p>Mis rutas</p>
          </div>
          <button className="link-button" onClick={volver}>
            Volver
          </button>
        </header>

        <section className="content-area">
          <div className="dashboard-card" style={{ textAlign: 'center', padding: '30px' }}>
            <p style={{ color: '#B3282D', fontWeight: 600 }}>{error || 'Cargando tus rutas...'}</p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="app-page mis-rutas-page">
      <header className="app-header">
        <div>
          <h1>Descubre Cholula</h1>
          <p>{rutaSeleccionada ? rutaSeleccionada.nombre : 'Mis rutas'}</p>
        </div>
        <button 
          className="link-button" 
          onClick={rutaSeleccionada ? () => setRutaSeleccionada(null) : volver}
        >
          {rutaSeleccionada ? 'Cambiar ruta' : 'Volver'}
        </button>
      </header>

      <section className="content-area mis-rutas-contenido">
        {rutaSeleccionada ? (
          <div className="detalle-ruta-contenido">
            <div className="stats-ruta-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', alignItems: 'center' }}>
                <div className="stat-item">
                  <Calendar size={20} color="#B3282D" />
                  <span className="stat-label">Duración</span>
                  <strong>{tieneMasDeCincoLugares ? '2 Días' : '1 Día'}</strong>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <Route size={20} color="#B3282D" />
                  <span className="stat-label">Paradas Total</span>
                  <strong>{lugares.length} lugares</strong>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <Navigation size={20} color="#B3282D" />
                  <span className="stat-label">Trayecto Día {diaActivo}</span>
                  <strong>{distanciaKm} km</strong>
                  <small style={{ fontSize: '11px', color: '#6e6462' }}>~{tiempoMinutos} min</small>
                </div>
              </div>

              <button
                type="button"
                className={`primary-button ${rutaSeleccionada.completada ? 'completada-btn' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '8px',
                  backgroundColor: rutaSeleccionada.completada ? '#2e7d32' : '#B3282D'
                }}
                onClick={() => marcarCompletada(rutaSeleccionada.id_ruta)}
                disabled={guardandoEstado}
              >
                <CheckCircle size={18} color="#fff" />
                {guardandoEstado
                  ? 'Guardando...'
                  : rutaSeleccionada.completada
                  ? 'Ruta completada (Desmarcar)'
                  : 'Marcar como terminada'}
              </button>
            </div>

            {/* BOTONES DE DÍA 1 Y DÍA 2 AUTOMÁTICOS */}
            <div style={{ display: 'flex', gap: '12px', margin: '16px 0' }}>
              <button
                type="button"
                onClick={() => setDiaActivo(1)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '14px',
                  border: diaActivo === 1 ? '2px solid #B3282D' : '1px solid #f2ece9',
                  backgroundColor: diaActivo === 1 ? '#B3282D' : '#fff',
                  color: diaActivo === 1 ? '#fff' : '#2d1515',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: diaActivo === 1 ? '0 4px 14px rgba(179, 40, 45, 0.25)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Día 1
              </button>
              
              <button
                type="button"
                onClick={() => {
                  if (tieneMasDeCincoLugares) {
                    setDiaActivo(2)
                  } else {
                    setMensaje('Agrega más de 5 lugares a tu ruta para habilitar el Día 2.')
                  }
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '14px',
                  border: diaActivo === 2 ? '2px solid #B3282D' : '1px solid #f2ece9',
                  backgroundColor: diaActivo === 2 ? '#B3282D' : (tieneMasDeCincoLugares ? '#fff' : '#f9f6f5'),
                  color: diaActivo === 2 ? '#fff' : (tieneMasDeCincoLugares ? '#2d1515' : '#a89e9c'),
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: tieneMasDeCincoLugares ? 'pointer' : 'not-allowed',
                  boxShadow: diaActivo === 2 ? '0 4px 14px rgba(179, 40, 45, 0.25)' : 'none',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                Día 2 {!tieneMasDeCincoLugares && <span style={{ fontSize: '10px', display: 'block', fontWeight: 'normal' }}>(&gt; 5 lugares)</span>}
              </button>
            </div>

            {cargandoLugares ? (
              <p className="cargando-texto">Calculando la ruta óptima por cercanía...</p>
            ) : lugaresDelDia.length === 0 ? (
              <div className="empty-state">
                <Coffee size={40} color="#B3282D" />
                <p>No hay lugares asignados para el Día {diaActivo}.</p>
              </div>
            ) : (
              <div className="itinerario-lista">
                <div className="dia-grupo" style={{ marginBottom: '24px' }}>
                  <div className="dia-header" style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="dia-badge" style={{ backgroundColor: '#B3282D', color: '#fff', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>
                      Mostrando itinerario del Día {diaActivo}
                    </span>
                    <span style={{ fontSize: '12px', color: '#6e6462' }}>Puedes eliminar lugares cuando lo desees</span>
                  </div>

                  <div className="lugares-lista-dia" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {lugaresDelDia.map((lugar, idx) => (
                      <div
                        key={lugar.id_detalle_ruta}
                        className="lugar-item"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '16px 20px',
                          borderRadius: '16px',
                          border: '1px solid #f2ece9',
                          backgroundColor: '#fff',
                          boxShadow: '0 4px 12px rgba(179, 40, 45, 0.04)',
                          cursor: 'pointer'
                        }}
                        onClick={() =>
                          seleccionarLugar({
                            id_lugar: lugar.id_lugar,
                            nombre: lugar.nombre
                          })
                        }
                      >
                        <div className="lugar-info" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                          <span style={{ 
                            backgroundColor: '#B3282D', 
                            color: '#fff', 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '15px', 
                            fontWeight: 'bold',
                            boxShadow: '0 2px 6px rgba(179, 40, 45, 0.3)',
                            flexShrink: 0 
                          }}>
                            {idx + 1}
                          </span>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <h4 style={{ margin: 0, fontSize: '16px', color: '#2d1515', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {lugar.nombre}
                            </h4>
                            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6e6462', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <MapPin size={13} color="#B3282D" style={{ flexShrink: 0 }} /> 
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{lugar.direccion || 'Ubicación central en Cholula'}</span>
                            </p>
                          </div>
                        </div>

                        <div className="lugar-acciones" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, marginLeft: '12px' }}>
                          <button
                            className="icon-btn"
                            title="Quitar lugar de la ruta"
                            aria-label={`Quitar ${lugar.nombre}`}
                            onClick={e => {
                              e.stopPropagation()
                              quitarLugar(lugar.id_detalle_ruta)
                            }}
                            style={{ background: '#fdf5f5', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Trash2 size={16} color="#B3282D" />
                          </button>
                          
                          <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '13px', fontWeight: 700, color: '#B3282D' }}>
                            Ver lugar <ChevronRight size={16} color="#B3282D" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* MAPA ACTUALIZADO */}
                  {lugaresConCoordenadasAjustadas.length > 0 && (
                    <div className="mapa-ruta-wrapper" style={{ marginTop: '20px', borderRadius: '16px', overflow: 'hidden', height: '420px', border: '1px solid #f2ece9', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                      <MapaRuta
                        key={`mapa-ruta-${rutaSeleccionada.id_ruta}-dia-${diaActivo}`}
                        lugares={lugaresConCoordenadasAjustadas}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {mensaje && <p className="resultado">{mensaje}</p>}

            <button
              className="btn-bottom-action"
              onClick={() => setRutaSeleccionada(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '14px',
                marginTop: '16px',
                backgroundColor: '#333',
                color: '#fff',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <ArrowLeft size={20} color="#fff" /> Volver a mis rutas
            </button>
          </div>
        ) : (
          <div className="seccion-principal-rutas">
            <div className="seccion-superior-rutas" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <button
                type="button"
                onClick={() => setAbrirModalGenerar(true)}
                style={{
                  backgroundColor: '#B3282D',
                  color: '#fff',
                  border: 'none',
                  padding: '16px 24px',
                  borderRadius: '16px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 8px 20px rgba(179, 40, 45, 0.25)',
                  width: '100%',
                  justifyContent: 'center',
                  transition: 'transform 0.2s ease'
                }}
              >
                <Plus size={22} /> Generar mi Ruta
              </button>
            </div>

            {abrirModalGenerar && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(20, 10, 10, 0.5)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999,
                padding: '16px'
              }}>
                <form 
                  onSubmit={handleCrearRutaManual} 
                  style={{ 
                    backgroundColor: '#ffffff', 
                    padding: '28px', 
                    borderRadius: '24px', 
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.18)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '20px', 
                    width: '100%', 
                    maxWidth: '720px', 
                    maxHeight: '90vh', 
                    overflowY: 'auto',
                    border: '1px solid #f0e2e2'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f4eae8', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ backgroundColor: '#fdf2f2', padding: '8px', borderRadius: '12px', color: '#B3282D', display: 'flex' }}>
                        <Route size={22} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, color: '#2d1515', fontSize: '18px', fontWeight: 800 }}>Crear Itinerario Personalizado</h3>
                        <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#6e6462' }}>Personaliza tu experiencia de viaje</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setAbrirModalGenerar(false)} 
                      style={{ background: '#f8f1f1', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <X size={18} color="#2d1515" />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.9fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#2d1515', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                        <Flag size={13} color="#B3282D" /> Nombre
                      </label>
                      <input 
                        value={nombreNuevaRuta} 
                        onChange={e => setNombreNuevaRuta(e.target.value)} 
                        required 
                        placeholder="Mi ruta en Cholula" 
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1.5px solid #e8deda', fontSize: '13px', outline: 'none', backgroundColor: '#faf6f5' }} 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#2d1515', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                        <CalendarDays size={13} color="#B3282D" /> Fecha Inicio
                      </label>
                      <input 
                        type="date" 
                        min={fechaHoy}
                        max={fechaMax}
                        value={fechaInicioRuta} 
                        onChange={e => setFechaInicioRuta(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1.5px solid #e8deda', fontSize: '13px', outline: 'none', backgroundColor: '#faf6f5' }} 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#2d1515', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                        <Calendar size={13} color="#B3282D" /> Duración
                      </label>
                      <div style={{ display: 'flex', gap: '6px', height: '40px' }}>
                        <button
                          type="button"
                          onClick={() => setDuracionDias(1)}
                          style={{
                            flex: 1,
                            borderRadius: '10px',
                            border: duracionDias === 1 ? '2px solid #B3282D' : '1.5px solid #e8deda',
                            backgroundColor: duracionDias === 1 ? '#B3282D' : '#faf6f5',
                            color: duracionDias === 1 ? '#ffffff' : '#6e6462',
                            fontWeight: duracionDias === 1 ? '700' : '500',
                            fontSize: '12.5px',
                            cursor: 'pointer',
                            boxShadow: duracionDias === 1 ? '0 4px 12px rgba(179, 40, 45, 0.25)' : 'none',
                            transition: 'all 0.2s'
                          }}
                        >
                          1 Día
                        </button>
                        <button
                          type="button"
                          onClick={() => setDuracionDias(2)}
                          style={{
                            flex: 1,
                            borderRadius: '10px',
                            border: duracionDias === 2 ? '2px solid #B3282D' : '1.5px solid #e8deda',
                            backgroundColor: duracionDias === 2 ? '#B3282D' : '#faf6f5',
                            color: duracionDias === 2 ? '#ffffff' : '#6e6462',
                            fontWeight: duracionDias === 2 ? '700' : '500',
                            fontSize: '12.5px',
                            cursor: 'pointer',
                            boxShadow: duracionDias === 2 ? '0 4px 12px rgba(179, 40, 45, 0.25)' : 'none',
                            transition: 'all 0.2s'
                          }}
                        >
                          2 Días
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* LUGARES */}
                  <div style={{ backgroundColor: '#faf5f5', padding: '16px', borderRadius: '18px', border: '1px solid #f0e0df', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#2d1515', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <MapPin size={13} color="#B3282D" /> Lugares Turísticos a Visitar ({lugaresSeleccionadosIds.length})
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '8px', maxHeight: '140px', overflowY: 'auto' }}>
                        {lugaresTuristicos.map(lugar => {
                          const seleccionado = lugaresSeleccionadosIds.includes(lugar.id_lugar)
                          return (
                            <button
                              type="button"
                              key={lugar.id_lugar} 
                              onClick={() => {
                                if (seleccionado) setLugaresSeleccionadosIds(lugaresSeleccionadosIds.filter(id => id !== lugar.id_lugar))
                                else setLugaresSeleccionadosIds([...lugaresSeleccionadosIds, lugar.id_lugar])
                              }}
                              style={{ 
                                fontSize: '12px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                cursor: 'pointer',
                                padding: '10px 12px',
                                borderRadius: '12px',
                                backgroundColor: seleccionado ? '#B3282D' : '#ffffff',
                                color: seleccionado ? '#ffffff' : '#2d1515',
                                border: seleccionado ? '1.5px solid #B3282D' : '1.5px solid #e8d6d2',
                                boxShadow: seleccionado ? '0 4px 12px rgba(179, 40, 45, 0.25)' : '0 2px 4px rgba(0,0,0,0.01)',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                textAlign: 'left',
                                width: '100%'
                              }}
                            >
                              <span style={{ 
                                width: '15px', 
                                height: '15px', 
                                borderRadius: '4px', 
                                border: seleccionado ? '2px solid #fff' : '2px solid #ccc',
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                backgroundColor: seleccionado ? '#fff' : 'transparent',
                                color: '#B3282D',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                flexShrink: 0
                              }}>
                                {seleccionado ? '✓' : ''}
                              </span>
                              <span style={{ fontWeight: seleccionado ? '700' : '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {lugar.nombre}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px dashed #e4d0cc', paddingTop: '12px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#2d1515', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <Store size={13} color="#B3282D" /> Lugares para Comer ({comerciosSeleccionadosIds.length})
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '8px', maxHeight: '130px', overflowY: 'auto' }}>
                        {lugaresComerciales.length === 0 ? (
                          <span style={{ fontSize: '12px', color: '#6e6462', fontStyle: 'italic' }}>No hay restaurantes registrados.</span>
                        ) : (
                          lugaresComerciales.map(lugar => {
                            const seleccionado = comerciosSeleccionadosIds.includes(lugar.id_lugar)
                            return (
                              <button
                                type="button"
                                key={lugar.id_lugar} 
                                onClick={() => {
                                  if (seleccionado) setComerciosSeleccionadosIds(comerciosSeleccionadosIds.filter(id => id !== lugar.id_lugar))
                                  else setComerciosSeleccionadosIds([...comerciosSeleccionadosIds, lugar.id_lugar])
                                }}
                                style={{ 
                                  fontSize: '12px', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '8px', 
                                  cursor: 'pointer',
                                  padding: '10px 12px',
                                  borderRadius: '12px',
                                  backgroundColor: seleccionado ? '#B3282D' : '#ffffff',
                                  color: seleccionado ? '#ffffff' : '#2d1515',
                                  border: seleccionado ? '1.5px solid #B3282D' : '1.5px solid #e8d6d2',
                                  boxShadow: seleccionado ? '0 4px 12px rgba(179, 40, 45, 0.25)' : '0 2px 4px rgba(0,0,0,0.01)',
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  textAlign: 'left',
                                  width: '100%'
                                }}
                              >
                                <span style={{ 
                                  width: '15px', 
                                  height: '15px', 
                                  borderRadius: '4px', 
                                  border: seleccionado ? '2px solid #fff' : '2px solid #ccc',
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  backgroundColor: seleccionado ? '#fff' : 'transparent',
                                  color: '#B3282D',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  flexShrink: 0
                                }}>
                                  {seleccionado ? '✓' : ''}
                                </span>
                                <span style={{ fontWeight: seleccionado ? '700' : '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {lugar.nombre}
                                </span>
                              </button>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Eventos */}
                  <div style={{ backgroundColor: '#faf5f5', padding: '14px', borderRadius: '18px', border: '1px solid #f0e0df' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#2d1515', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <Layers size={14} color="#B3282D" /> Eventos de interés ({eventosSeleccionadosIds.length})
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                      {eventosDisponibles.length === 0 ? (
                        <span style={{ fontSize: '12px', color: '#6e6462', fontStyle: 'italic' }}>No hay eventos registrados.</span>
                      ) : (
                        eventosDisponibles.map(evento => {
                          const seleccionado = eventosSeleccionadosIds.includes(evento.id_evento)
                          return (
                            <button
                              type="button"
                              key={evento.id_evento} 
                              onClick={() => {
                                if (seleccionado) setEventosSeleccionadosIds(eventosSeleccionadosIds.filter(id => id !== evento.id_evento))
                                else setEventosSeleccionadosIds([...eventosSeleccionadosIds, evento.id_evento])
                              }}
                              style={{ 
                                fontSize: '12px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                cursor: 'pointer',
                                padding: '10px 12px',
                                borderRadius: '12px',
                                backgroundColor: seleccionado ? '#B3282D' : '#ffffff',
                                color: seleccionado ? '#ffffff' : '#2d1515',
                                border: seleccionado ? '1.5px solid #B3282D' : '1.5px solid #e8d6d2',
                                boxShadow: seleccionado ? '0 4px 12px rgba(179, 40, 45, 0.25)' : '0 2px 4px rgba(0,0,0,0.01)',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                textAlign: 'left',
                                width: '100%'
                              }}
                            >
                              <span style={{ 
                                width: '15px', 
                                height: '15px', 
                                borderRadius: '4px', 
                                border: seleccionado ? '2px solid #fff' : '2px solid #ccc',
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                backgroundColor: seleccionado ? '#fff' : 'transparent',
                                color: '#B3282D',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                flexShrink: 0
                              }}>
                                {seleccionado ? '✓' : ''}
                              </span>
                              <span style={{ fontWeight: seleccionado ? '700' : '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {evento.nombre}
                              </span>
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>

                  {/* Gastronomía */}
                  <div style={{ backgroundColor: '#faf5f5', padding: '14px', borderRadius: '18px', border: '1px solid #f0e0df' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#2d1515', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <Utensils size={14} color="#B3282D" /> Gastronomía ({gastronomiaSeleccionada.length})
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxHeight: '130px', overflowY: 'auto' }}>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '10.5px', color: '#B3282D', textTransform: 'uppercase', marginBottom: '4px' }}>Platillos</div>
                        {platillosDisponibles.map(p => {
                          const itemStr = `Platillo: ${p.nombre}`
                          const seleccionado = gastronomiaSeleccionada.includes(itemStr)
                          return (
                            <button
                              type="button"
                              key={`plat-${p.id_platillo}`} 
                              onClick={() => {
                                if (seleccionado) setGastronomiaSeleccionada(gastronomiaSeleccionada.filter(i => i !== itemStr))
                                else setGastronomiaSeleccionada([...gastronomiaSeleccionada, itemStr])
                              }}
                              style={{ 
                                fontSize: '11.5px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                cursor: 'pointer',
                                padding: '8px 10px',
                                borderRadius: '10px',
                                marginBottom: '4px',
                                backgroundColor: seleccionado ? '#B3282D' : '#ffffff',
                                color: seleccionado ? '#ffffff' : '#2d1515',
                                border: seleccionado ? '1.5px solid #B3282D' : '1.5px solid #e8d6d2',
                                textAlign: 'left',
                                width: '100%',
                                transition: 'all 0.2s'
                              }}
                            >
                              <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: seleccionado ? '#fff' : 'transparent', border: seleccionado ? 'none' : '1.5px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B3282D', fontSize: '10px', fontWeight: 'bold', flexShrink: 0 }}>{seleccionado ? '✓' : ''}</span>
                              <span style={{ fontWeight: seleccionado ? '700' : '400', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</span>
                            </button>
                          )
                        })}
                      </div>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '10.5px', color: '#B3282D', textTransform: 'uppercase', marginBottom: '4px' }}>Bebidas</div>
                        {bebidasDisponibles.map(b => {
                          const itemStr = `Bebida: ${b.nombre}`
                          const seleccionado = gastronomiaSeleccionada.includes(itemStr)
                          return (
                            <button
                              type="button"
                              key={`beb-${b.id_bebida}`} 
                              onClick={() => {
                                if (seleccionado) setGastronomiaSeleccionada(gastronomiaSeleccionada.filter(i => i !== itemStr))
                                else setGastronomiaSeleccionada([...gastronomiaSeleccionada, itemStr])
                              }}
                              style={{ 
                                fontSize: '11.5px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                cursor: 'pointer',
                                padding: '8px 10px',
                                borderRadius: '10px',
                                marginBottom: '4px',
                                backgroundColor: seleccionado ? '#B3282D' : '#ffffff',
                                color: seleccionado ? '#ffffff' : '#2d1515',
                                border: seleccionado ? '1.5px solid #B3282D' : '1.5px solid #e8d6d2',
                                textAlign: 'left',
                                width: '100%',
                                transition: 'all 0.2s'
                              }}
                            >
                              <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: seleccionado ? '#fff' : 'transparent', border: seleccionado ? 'none' : '1.5px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B3282D', fontSize: '10px', fontWeight: 'bold', flexShrink: 0 }}>{seleccionado ? '✓' : ''}</span>
                              <span style={{ fontWeight: seleccionado ? '700' : '400', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.nombre}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Acciones Modal */}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                    <button 
                      type="submit" 
                      style={{ 
                        backgroundColor: '#B3282D', 
                        color: '#fff', 
                        border: 'none', 
                        padding: '14px 20px', 
                        borderRadius: '14px', 
                        fontWeight: 800, 
                        fontSize: '14px', 
                        cursor: 'pointer', 
                        flex: 1,
                        boxShadow: '0 8px 20px rgba(179, 40, 45, 0.25)',
                        transition: 'transform 0.1s ease'
                      }}
                    >
                      Guardar e Iniciar Ruta
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setAbrirModalGenerar(false)} 
                      style={{ 
                        backgroundColor: '#f2ece9', 
                        color: '#400d0f', 
                        border: 'none', 
                        padding: '14px 18px', 
                        borderRadius: '14px', 
                        fontWeight: 700, 
                        fontSize: '14px', 
                        cursor: 'pointer', 
                        flex: 0.5,
                        transition: 'background-color 0.2s'
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            <h2 className="seccion-titulo">Tus itinerarios</h2>

            {rutas.length === 0 ? (
              <div className="empty-state">
                <Route size={48} color="#B3282D" />
                <h3>Todavía no tienes rutas creadas</h3>
                <p>Explora lugares en la aplicación o genera tu ruta para comenzar.</p>
              </div>
            ) : (
              <div className="rutas-lista" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {rutas.map(ruta => (
                  <div
                    key={ruta.id_ruta}
                    className="ruta-card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '18px',
                      borderRadius: '16px',
                      backgroundColor: '#fff',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                      cursor: 'pointer',
                      border: ruta.completada ? '1px solid #4caf50' : '1px solid #f0e0e0'
                    }}
                    onClick={() => seleccionarRuta(ruta)}
                  >
                    <div 
                      className="ruta-card-icono"
                      style={{
                        backgroundColor: ruta.completada ? '#2e7d32' : '#B3282D',
                        padding: '14px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '16px',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                      }}
                    >
                      {ruta.completada ? <Check size={24} color="#fff" /> : <Route size={24} color="#fff" />}
                    </div>
                    <div className="ruta-card-info" style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#2d1515' }}>{ruta.nombre}</h3>
                      <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6e6462' }}>
                        {ruta.descripcion || 'Ruta personalizada de exploración.'}
                      </p>
                      <span className="ruta-duracion" style={{ fontSize: '12px', fontWeight: 'bold', color: ruta.completada ? '#2e7d32' : '#B3282D', backgroundColor: '#fdf5f5', padding: '4px 10px', borderRadius: '20px', display: 'inline-block' }}>
                        {ruta.duracion_dias} Día(s) planeados {ruta.completada ? '• Completada' : ''}
                      </span>
                    </div>

                    <button
                      className="icon-btn"
                      title="Duplicar esta ruta"
                      onClick={(e) => clonarRuta(ruta.id_ruta, e)}
                      style={{
                        background: '#fdf5f5',
                        border: 'none',
                        borderRadius: '50%',
                        padding: '10px',
                        marginRight: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s'
                      }}
                    >
                      <Copy size={18} color="#B3282D" />
                    </button>

                    <button
                      className="icon-btn"
                      title="Eliminar esta ruta"
                      onClick={(e) => eliminarRutaCompleta(ruta.id_ruta, e)}
                      style={{
                        background: '#fdf5f5',
                        border: 'none',
                        borderRadius: '50%',
                        padding: '10px',
                        marginRight: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s'
                      }}
                    >
                      <Trash2 size={18} color="#B3282D" />
                    </button>

                    <ChevronRight size={22} color="#B3282D" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  )
}