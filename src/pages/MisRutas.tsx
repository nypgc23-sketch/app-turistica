import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  obtenerRutasUsuario,
  obtenerLugaresDeRuta,
  eliminarLugarDeRuta
} from '../services/rutaService'
import MapaRuta from '../components/MapaRuta'
import { 
  Calendar, ChevronRight, Route, 
  Trash2, Coffee, ArrowLeft, CheckCircle, Check, Copy, Navigation, MapPin, Plus, X, Utensils, Flag, CalendarDays, Layers
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

// Algoritmo de Grafo (Vecino más cercano / Haversine) para ordenar por cercanía geográfica
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
  
  // Estados para el Modal de Generación Manual de Ruta
  const [abrirModalGenerar, setAbrirModalGenerar] = useState(false)
  const [nombreNuevaRuta, setNombreNuevaRuta] = useState('')
  const [fechaInicioRuta, setFechaInicioRuta] = useState('')
  const [duracionDias, setDuracionDias] = useState<1 | 2>(2) // Permite alternar entre 1 o 2 días
  
  // Listas maestras para el formulario
  const [lugaresDisponibles, setLugaresDisponibles] = useState<any[]>([])
  const [eventosDisponibles, setEventosDisponibles] = useState<any[]>([])
  const [platillosDisponibles, setPlatillosDisponibles] = useState<any[]>([])
  const [bebidasDisponibles, setBebidasDisponibles] = useState<any[]>([])

  // Selecciones del usuario en el formulario
  const [lugaresSeleccionadosIds, setLugaresSeleccionadosIds] = useState<number[]>([])
  const [eventosSeleccionadosIds, setEventosSeleccionadosIds] = useState<number[]>([])
  const [gastronomiaSeleccionada, setGastronomiaSeleccionada] = useState<string[]>([])

  const [cargando, setCargando] = useState(true)
  const [cargandoLugares, setCargandoLugares] = useState(false)
  const [guardandoEstado, setGuardandoEstado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  useEffect(() => {
    let montado = true

    async function cargarDatosIniciales() {
      setCargando(true)
      setError(null)

      const [resultadoRutas, resLugares, resEventos, resPlatillos, resBebidas] = await Promise.all([
        obtenerRutasUsuario(),
        supabase.from('lugares_turisticos').select('*').order('nombre', { ascending: true }),
        supabase.from('eventos').select('*').order('nombre', { ascending: true }),
        supabase.from('platillos').select('*').order('nombre', { ascending: true }),
        supabase.from('bebidas').select('*').order('nombre', { ascending: true })
      ])

      if (!montado) return

      if (resultadoRutas.error) {
        console.error('Error obteniendo rutas:', resultadoRutas.error)
        setError('No se pudieron cargar tus rutas.')
      } else {
        setRutas(resultadoRutas.data || [])
      }

      if (resLugares.data) setLugaresDisponibles(resLugares.data)
      if (resEventos.data) setEventosDisponibles(resEventos.data)
      if (resPlatillos.data) setPlatillosDisponibles(resPlatillos.data)
      if (resBebidas.data) setBebidasDisponibles(resBebidas.data)

      setCargando(false)
    }

    cargarDatosIniciales()

    return () => {
      montado = false
    }
  }, [])

  useEffect(() => {
    if (!mensaje) return
    const timer = setTimeout(() => setMensaje(null), 3000)
    return () => clearTimeout(timer)
  }, [mensaje])

  /**
   * ============================================================================
   * [LÍNEA 621] - DOCUMENTACIÓN V2: GENERADOR DE RUTA TURÍSTICA POR INTELIGENCIA ARTIFICIAL
   * ============================================================================
   * Esta función está documentada y reservada para la Versión 2 de la app.
   * Su propósito será conectar con un servicio de IA para analizar preferencias,
   * conciertos, eventos actuales y recomendar rutas automatizadas.
   * ============================================================================
   */
  /* 
  const handleRutaInteligenteClick = () => {
    alert(
      '¡Próximamente en la Versión 2 (IA)!\n\n' +
      'Este generador inteligente analizará tus experiencias previas, gustos, ' +
      'actividades actuales, conciertos y avisos en tiempo real para recomendarte ' +
      'la ruta y los lugares ideales mediante Inteligencia Artificial.'
    )
  }
  */

  async function seleccionarRuta(ruta: Ruta) {
    setRutaSeleccionada(ruta)
    setCargandoLugares(true)
    setError(null)
    setMensaje(null)

    const resultado = await obtenerLugaresDeRuta(ruta.id_ruta)

    if (resultado.error) {
      console.error('Error obteniendo lugares:', resultado.error)
      setError('No se pudieron cargar los lugares de esta ruta.')
      setLugares([])
      setCargandoLugares(false)
      return
    }

    setLugares(resultado.data || [])
    setCargandoLugares(false)
  }

  async function quitarLugar(idDetalleRuta: number) {
    if (!rutaSeleccionada) return
    setMensaje(null)

    const resultado = await eliminarLugarDeRuta(idDetalleRuta)

    if (resultado.error) {
      console.error('Error eliminando lugar:', resultado.error)
      setMensaje('No se pudo quitar el lugar de la ruta.')
      return
    }

    setLugares(prev => prev.filter(l => l.id_detalle_ruta !== idDetalleRuta))
    setMensaje('Lugar quitado de la ruta.')
  }

  async function clonarRuta(idRutaOriginal: number, e: React.MouseEvent) {
    e.stopPropagation()
    setMensaje('Clonando itinerario...')

    const rutaOriginal = rutas.find(r => r.id_ruta === idRutaOriginal)
    if (!rutaOriginal) return

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      setMensaje('Inicia sesión para clonar rutas.')
      return
    }

    const { data: nuevaRuta, error: errRuta } = await supabase
      .from('rutas')
      .insert({
        id_usuario: userData.user.id,
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

  // Guardar la nueva ruta creada por el usuario en el formulario (1 o 2 Días)
  async function handleCrearRutaManual(e: React.FormEvent) {
    e.preventDefault()
    if (!nombreNuevaRuta.trim()) {
      alert('Por favor ingresa un nombre para tu ruta.')
      return
    }

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      alert('Debes iniciar sesión para guardar tu ruta.')
      return
    }

    // 1. Insertar la cabecera de la ruta
    const { data: nuevaRuta, error: errRuta } = await supabase
      .from('rutas')
      .insert({
        id_usuario: userData.user.id,
        tipo_ruta: 'manual',
        nombre: nombreNuevaRuta.trim(),
        descripcion: `Inicia el ${fechaInicioRuta || 'Próximamente'} (Duración: ${duracionDias} Día${duracionDias > 1 ? 's' : ''}). Gastronomía: ${gastronomiaSeleccionada.join(', ') || 'Ninguna'}`,
        duracion_dias: duracionDias,
        estado: true
      })
      .select()
      .single()

    if (errRuta || !nuevaRuta) {
      alert('Error al crear la ruta: ' + (errRuta?.message || 'Desconocido'))
      return
    }

    // 2. Insertar los lugares seleccionados repartidos equitativamente según los días elegidos
    if (lugaresSeleccionadosIds.length > 0) {
      const detallesAInsertar = lugaresSeleccionadosIds.map((idLugar, index) => {
        const diaAsignado = (index % duracionDias) + 1
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
    setEventosSeleccionadosIds([])
    setGastronomiaSeleccionada([])
    alert(`¡Tu ruta de ${duracionDias} día(s) ha sido creada con éxito! Podrás editar o eliminar lugares en cualquier momento.`)
  }

  const { distanciaKm, tiempoMinutos } = estimarTiempoTrayecto(lugares)

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
          <div className="dashboard-card">
            <p>{cargando ? 'Cargando tus rutas...' : error}</p>
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
                  <strong>{rutaSeleccionada.duracion_dias} Días</strong>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <Route size={20} color="#B3282D" />
                  <span className="stat-label">Paradas</span>
                  <strong>{lugares.length} lugares</strong>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <Navigation size={20} color="#B3282D" />
                  <span className="stat-label">Trayecto</span>
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

            {cargandoLugares ? (
              <p className="cargando-texto">Calculando la ruta óptima por cercanía...</p>
            ) : lugares.length === 0 ? (
              <div className="empty-state">
                <Coffee size={40} color="#B3282D" />
                <p>Esta ruta todavía no tiene lugares agregados.</p>
              </div>
            ) : (
              <div className="itinerario-lista">
                {Array.from(
                  { length: rutaSeleccionada.duracion_dias },
                  (_, i) => i + 1
                ).map(dia => {
                  const lugaresDelDiaBrutos = lugares.filter(lugar => lugar.dia === dia)

                  if (lugaresDelDiaBrutos.length === 0) return null

                  const lugaresDelDia = ordenarPorCercania(lugaresDelDiaBrutos)
                  const lugaresConCoordenadas = lugaresDelDia.filter(
                    l => l.latitud !== null && l.longitud !== null
                  )

                  return (
                    <div key={dia} className="dia-grupo" style={{ marginBottom: '24px' }}>
                      <div className="dia-header" style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="dia-badge" style={{ backgroundColor: '#B3282D', color: '#fff', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>
                          Día {dia}
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

                      {lugaresConCoordenadas.length > 0 && (
                        <div className="mapa-ruta-wrapper" style={{ marginTop: '20px', borderRadius: '16px', overflow: 'hidden', height: '420px', border: '1px solid #f2ece9', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                          <MapaRuta
                            lugares={lugaresConCoordenadas.map((lugar, idx) => ({
                              id_lugar: lugar.id_lugar,
                              nombre: lugar.nombre,
                              latitud: lugar.latitud!,
                              longitud: lugar.longitud!,
                              orden_visita: idx + 1
                            }))}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
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
            {/* ÚNICO BOTÓN SUPERIOR PARA GENERAR RUTA */}
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

            {/* MODAL REDISEÑADO: AMPLIO, MODERNO E INTERACTIVO */}
            {abrirModalGenerar && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(20, 10, 10, 0.55)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999,
                padding: '20px'
              }}>
                <form 
                  onSubmit={handleCrearRutaManual} 
                  style={{ 
                    backgroundColor: '#ffffff', 
                    padding: '36px', 
                    borderRadius: '28px', 
                    boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.3)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '24px', 
                    width: '100%', 
                    maxWidth: '720px', 
                    maxHeight: '94vh', 
                    overflowY: 'auto',
                    border: '1px solid #f2e4e4'
                  }}
                >
                  {/* Encabezado del Modal */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #faf0f0', paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ backgroundColor: '#fdf2f2', padding: '12px', borderRadius: '16px', color: '#B3282D', display: 'flex', boxShadow: '0 4px 12px rgba(179, 40, 45, 0.15)' }}>
                        <Route size={26} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, color: '#2d1515', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.3px' }}>Crear Nuevo Itinerario</h3>
                        <p style={{ margin: '3px 0 0 0', fontSize: '13.5px', color: '#6e6462' }}>Configura los días, lugares y experiencias de tu viaje</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setAbrirModalGenerar(false)} 
                      style={{ background: '#f8f1f1', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                    >
                      <X size={20} color="#2d1515" />
                    </button>
                  </div>

                  {/* Fila 1: Nombre, Fecha de Inicio y Selector de Duración (1 o 2 Días) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#2d1515', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Flag size={14} color="#B3282D" /> Nombre de la Ruta
                      </label>
                      <input 
                        value={nombreNuevaRuta} 
                        onChange={e => setNombreNuevaRuta(e.target.value)} 
                        required 
                        placeholder="Ej. Fin de semana en Cholula" 
                        style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #e8deda', fontSize: '13.5px', outline: 'none', backgroundColor: '#fdfbfb' }} 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#2d1515', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <CalendarDays size={14} color="#B3282D" /> Fecha de Inicio
                      </label>
                      <input 
                        type="date" 
                        value={fechaInicioRuta} 
                        onChange={e => setFechaInicioRuta(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #e8deda', fontSize: '13.5px', outline: 'none', backgroundColor: '#fdfbfb' }} 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#2d1515', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Calendar size={14} color="#B3282D" /> Duración
                      </label>
                      <div style={{ display: 'flex', gap: '6px', height: '46px' }}>
                        <button
                          type="button"
                          onClick={() => setDuracionDias(1)}
                          style={{
                            flex: 1,
                            borderRadius: '12px',
                            border: duracionDias === 1 ? '2px solid #B3282D' : '1.5px solid #e8deda',
                            backgroundColor: duracionDias === 1 ? '#fdf2f2' : '#fdfbfb',
                            color: duracionDias === 1 ? '#B3282D' : '#6e6462',
                            fontWeight: duracionDias === 1 ? '8px' : '600',
                            fontSize: '13px',
                            cursor: 'pointer',
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
                            borderRadius: '12px',
                            border: duracionDias === 2 ? '2px solid #B3282D' : '1.5px solid #e8deda',
                            backgroundColor: duracionDias === 2 ? '#fdf2f2' : '#fdfbfb',
                            color: duracionDias === 2 ? '#B3282D' : '#6e6462',
                            fontWeight: duracionDias === 2 ? '8px' : '600',
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          2 Días
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Sección 2: Selección de Lugares Turísticos */}
                  <div style={{ backgroundColor: '#faf4f4', padding: '18px', borderRadius: '18px', border: '1px solid #f2e2e2' }}>
                    <label style={{ fontSize: '13.5px', fontWeight: 800, color: '#2d1515', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <MapPin size={16} color="#B3282D" /> Selecciona los Lugares a visitar
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' }}>
                      {lugaresDisponibles.map(lugar => {
                        const seleccionado = lugaresSeleccionadosIds.includes(lugar.id_lugar)
                        return (
                          <div 
                            key={lugar.id_lugar} 
                            onClick={() => {
                              if (seleccionado) setLugaresSeleccionadosIds(lugaresSeleccionadosIds.filter(id => id !== lugar.id_lugar))
                              else setLugaresSeleccionadosIds([...lugaresSeleccionadosIds, lugar.id_lugar])
                            }}
                            style={{ 
                              fontSize: '13px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '10px', 
                              cursor: 'pointer',
                              padding: '10px 14px',
                              borderRadius: '12px',
                              backgroundColor: seleccionado ? '#ffffff' : '#ffffff',
                              border: seleccionado ? '2px solid #B3282D' : '1px solid #e6d8d5',
                              boxShadow: seleccionado ? '0 4px 12px rgba(179, 40, 45, 0.12)' : 'none',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={seleccionado}
                              onChange={() => {}} 
                              style={{ accentColor: '#B3282D', width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <span style={{ fontWeight: seleccionado ? '700' : '500', color: seleccionado ? '#B3282D' : '#2d1515', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {lugar.nombre}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Sección 3: Eventos de Interés */}
                  <div style={{ backgroundColor: '#faf4f4', padding: '18px', borderRadius: '18px', border: '1px solid #f2e2e2' }}>
                    <label style={{ fontSize: '13.5px', fontWeight: 800, color: '#2d1515', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <Layers size={16} color="#B3282D" /> Eventos de interés
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px', maxHeight: '130px', overflowY: 'auto' }}>
                      {eventosDisponibles.length === 0 ? (
                        <span style={{ fontSize: '13px', color: '#6e6462', fontStyle: 'italic' }}>No hay eventos registrados actualmente.</span>
                      ) : (
                        eventosDisponibles.map(evento => {
                          const seleccionado = eventosSeleccionadosIds.includes(evento.id_evento)
                          return (
                            <div 
                              key={evento.id_evento} 
                              onClick={() => {
                                if (seleccionado) setEventosSeleccionadosIds(eventosSeleccionadosIds.filter(id => id !== evento.id_evento))
                                else setEventosSeleccionadosIds([...eventosSeleccionadosIds, evento.id_evento])
                              }}
                              style={{ 
                                fontSize: '13px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '10px', 
                                cursor: 'pointer',
                                padding: '10px 14px',
                                borderRadius: '12px',
                                backgroundColor: '#ffffff',
                                border: seleccionado ? '2px solid #B3282D' : '1px solid #e6d8d5',
                                boxShadow: seleccionado ? '0 4px 12px rgba(179, 40, 45, 0.12)' : 'none'
                              }}
                            >
                              <input 
                                type="checkbox" 
                                checked={seleccionado}
                                onChange={() => {}}
                                style={{ accentColor: '#B3282D', width: '16px', height: '16px', cursor: 'pointer' }}
                              />
                              <span style={{ fontWeight: seleccionado ? '700' : '500', color: seleccionado ? '#B3282D' : '#2d1515', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {evento.nombre}
                              </span>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>

                  {/* Sección 4: Gastronomía y Bebidas */}
                  <div style={{ backgroundColor: '#faf4f4', padding: '18px', borderRadius: '18px', border: '1px solid #f2e2e2' }}>
                    <label style={{ fontSize: '13.5px', fontWeight: 800, color: '#2d1515', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <Utensils size={16} color="#B3282D" /> Gastronomía y Bebidas Típicas
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxHeight: '150px', overflowY: 'auto' }}>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '11px', color: '#B3282D', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Platillos</div>
                        {platillosDisponibles.map(p => {
                          const itemStr = `Platillo: ${p.nombre}`
                          const seleccionado = gastronomiaSeleccionada.includes(itemStr)
                          return (
                            <div 
                              key={`plat-${p.id_platillo}`} 
                              onClick={() => {
                                if (seleccionado) setGastronomiaSeleccionada(gastronomiaSeleccionada.filter(i => i !== itemStr))
                                else setGastronomiaSeleccionada([...gastronomiaSeleccionada, itemStr])
                              }}
                              style={{ 
                                fontSize: '12.5px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                cursor: 'pointer',
                                padding: '8px 12px',
                                borderRadius: '10px',
                                marginBottom: '6px',
                                backgroundColor: '#ffffff',
                                border: seleccionado ? '1.5px solid #B3282D' : '1px solid #e6d8d5'
                              }}
                            >
                              <input 
                                type="checkbox" 
                                checked={seleccionado}
                                onChange={() => {}}
                                style={{ accentColor: '#B3282D', width: '14px', height: '14px', cursor: 'pointer' }}
                              />
                              <span style={{ color: seleccionado ? '#B3282D' : '#2d1515', fontWeight: seleccionado ? '700' : '400' }}>{p.nombre}</span>
                            </div>
                          )
                        })}
                      </div>

                      <div>
                        <div style={{ fontWeight: '800', fontSize: '11px', color: '#B3282D', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Bebidas</div>
                        {bebidasDisponibles.map(b => {
                          const itemStr = `Bebida: ${b.nombre}`
                          const seleccionado = gastronomiaSeleccionada.includes(itemStr)
                          return (
                            <div 
                              key={`beb-${b.id_bebida}`} 
                              onClick={() => {
                                if (seleccionado) setGastronomiaSeleccionada(gastronomiaSeleccionada.filter(i => i !== itemStr))
                                else setGastronomiaSeleccionada([...gastronomiaSeleccionada, itemStr])
                              }}
                              style={{ 
                                fontSize: '12.5px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                cursor: 'pointer',
                                padding: '8px 12px',
                                borderRadius: '10px',
                                marginBottom: '6px',
                                backgroundColor: '#ffffff',
                                border: seleccionado ? '1.5px solid #B3282D' : '1px solid #e6d8d5'
                              }}
                            >
                              <input 
                                type="checkbox" 
                                checked={seleccionado}
                                onChange={() => {}}
                                style={{ accentColor: '#B3282D', width: '14px', height: '14px', cursor: 'pointer' }}
                              />
                              <span style={{ color: seleccionado ? '#B3282D' : '#2d1515', fontWeight: seleccionado ? '700' : '400' }}>{b.nombre}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Botones de Acción del Modal */}
                  <div style={{ display: 'flex', gap: '14px', marginTop: '6px' }}>
                    <button 
                      type="submit" 
                      style={{ 
                        backgroundColor: '#B3282D', 
                        color: '#fff', 
                        border: 'none', 
                        padding: '16px 24px', 
                        borderRadius: '16px', 
                        fontWeight: 800, 
                        fontSize: '14.5px', 
                        cursor: 'pointer', 
                        flex: 1,
                        boxShadow: '0 8px 20px rgba(179, 40, 45, 0.35)',
                        transition: 'transform 0.2s'
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
                        padding: '16px 20px', 
                        borderRadius: '16px', 
                        fontWeight: 700, 
                        fontSize: '14px', 
                        cursor: 'pointer', 
                        flex: 0.5 
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
                <p>
                  Explora lugares en la aplicación o genera tu ruta para comenzar.
                </p>
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
                        marginRight: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Copy size={18} color="#B3282D" />
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