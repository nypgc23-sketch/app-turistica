import { useEffect, useState } from 'react'
import { obtenerLugarPorId } from '../services/lugaresService'
import MapaLugar from '../components/MapaLugar'
import { obtenerEventosProximos } from '../services/eventosService'
import { supabase } from '../lib/supabaseClient'
import {
  agregarFavorito,
  eliminarFavorito,
  esFavorito
} from '../services/favoritosService'
import {
  crearRuta,
  obtenerRutaUsuario,
  agregarLugarARuta
} from '../services/rutaService'
import { Heart, Route, Calendar, MapPin, Clock, DollarSign, Phone, FileText, Info } from 'lucide-react'


type LugarSeleccionado = {
  id_lugar: number
  nombre: string
}


type DetalleLugarProps = {
  lugar: LugarSeleccionado
  volver: () => void
  iniciarSesion: () => void
  registrarse: () => void
}


type LugarDetalle = {
  id_lugar: number
  nombre: string
  descripcion: string | null
  direccion: string | null
  latitud: number | null
  longitud: number | null
  horario: string | null
  costo_entrada: number | null
  telefono: string | null

  categorias_lugar:
    | {
        id_categoria: number
        nombre: string
        descripcion: string | null
      }
    | null

  imagenes_lugar: {
    id_imagen: number
    url: string
    descripcion: string | null
    es_principal: boolean
    orden: number | null
  }[]
}


type EventoProximo = {
  id_evento: number
  nombre: string
  descripcion: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
  lugar: string | null
  horario: string | null
  costo: number | null
}


export default function DetalleLugar({
  lugar,
  volver,
  iniciarSesion,
  registrarse
}: DetalleLugarProps) {

  const [detalle, setDetalle] =
    useState<LugarDetalle | null>(null)

  const [cargando, setCargando] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const [eventos, setEventos] =
    useState<EventoProximo[]>([])

  const [cargandoEventos, setCargandoEventos] =
    useState(true)


  // FAVORITOS

  const [esLugarFavorito, setEsLugarFavorito] =
    useState(false)

  const [cargandoFavorito, setCargandoFavorito] =
    useState(true)

  const [guardandoFavorito, setGuardandoFavorito] =
    useState(false)

  const [mensajeFavorito, setMensajeFavorito] =
    useState<string | null>(null)


  // RUTAS

  const [guardandoRuta, setGuardandoRuta] =
    useState(false)

  const [resultadoRuta, setResultadoRuta] =
    useState<string | null>(null)


  // Cargar información del lugar

  useEffect(() => {

    async function cargarLugar() {

      setCargando(true)
      setCargandoEventos(true)
      setCargandoFavorito(true)

      setError(null)
      setEventos([])
      setMensajeFavorito(null)
      setResultadoRuta(null)
      setEsLugarFavorito(false)


      const resultado =
        await obtenerLugarPorId(
          lugar.id_lugar
        )


      if (resultado.error) {

        console.error(
          'Error obteniendo lugar:',
          resultado.error
        )

        setError(
          'No se pudo cargar la información del lugar.'
        )

        setCargando(false)
        setCargandoEventos(false)
        setCargandoFavorito(false)

        return
      }


      setDetalle(resultado.data)


      if (resultado.data) {

        const resultadoEventos =
          await obtenerEventosProximos(
            resultado.data.nombre
          )


        if (resultadoEventos.error) {

          console.error(
            'Error obteniendo eventos:',
            resultadoEventos.error
          )

        } else {

          setEventos(
            resultadoEventos.data
          )
        }
      }


      // Revisar si el lugar es favorito

      const {
        data: {
          session
        }
      } = await supabase.auth.getSession()


      if (session) {

        const resultadoFavorito =
          await esFavorito(
            session.user.id,
            lugar.id_lugar
          )


        if (resultadoFavorito.error) {

          console.error(
            'Error verificando favorito:',
            resultadoFavorito.error
          )

        } else {

          setEsLugarFavorito(
            resultadoFavorito.esFavorito
          )
        }
      }


      setCargandoFavorito(false)
      setCargandoEventos(false)
      setCargando(false)
    }


    cargarLugar()

  }, [lugar.id_lugar])


  // Agregar o quitar favorito

  async function manejarFavorito() {
    setMensajeFavorito(null)
    setGuardandoFavorito(true)

    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      console.log('🔍 Verificando sesión para favoritos:', { 
        session: !!session, 
        user: session?.user?.id || 'no-user',
        error: error?.message || 'no-error'
      })

      // Validación más robusta
      if (error || !session || !session.user) {
        setMensajeFavorito('Para guardar este lugar necesitas iniciar sesión o crear una cuenta.')
        console.warn('❌ Sin sesión válida, cancelando operación de favoritos')
        setGuardandoFavorito(false)
        return // <--- ESTE RETURN ES CRÍTICO
      }

      if (!detalle) {
        setMensajeFavorito('No se puede guardar: lugar no encontrado')
        setGuardandoFavorito(false)
        return
      }

      console.log('✅ Sesión válida para favoritos:', session.user.id)

      // Si ya es favorito, eliminar
      if (esLugarFavorito) {
        const resultado = await eliminarFavorito(session.user.id, detalle.id_lugar)

        if (resultado.error) {
          console.error('Error eliminando favorito:', resultado.error)
          setMensajeFavorito('No se pudo quitar el lugar de favoritos.')
          setGuardandoFavorito(false)
          return
        }

        setEsLugarFavorito(false)
        setMensajeFavorito('Lugar eliminado de favoritos.')
        setGuardandoFavorito(false)
        return
      }

      // Si no es favorito, agregar
      const resultado = await agregarFavorito(session.user.id, detalle.id_lugar)

      if (resultado.error) {
        console.error('Error agregando favorito:', resultado.error)
        setMensajeFavorito('No se pudo guardar el lugar en favoritos.')
        setGuardandoFavorito(false)
        return
      }

      setEsLugarFavorito(true)
      setMensajeFavorito('Lugar agregado a favoritos.')
      setGuardandoFavorito(false)

    } catch (error) {
      console.error('Error en manejarFavorito:', error)
      setMensajeFavorito('Ocurrió un error inesperado.')
      setGuardandoFavorito(false)
    }
  }


  // Agregar lugar a una ruta

  async function manejarRuta(duracionDias: number) {
    setResultadoRuta(null)
    setGuardandoRuta(true)

    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      console.log('🔍 Verificando sesión para ruta:', { 
        session: !!session, 
        user: session?.user?.id || 'no-user',
        error: error?.message || 'no-error'
      })

      // Validación más robusta
      if (error || !session || !session.user) {
        setResultadoRuta('Para crear una ruta necesitas iniciar sesión o crear una cuenta.')
        console.warn('❌ Sin sesión válida, cancelando operación de ruta')
        setGuardandoRuta(false)
        return // <--- ESTE RETURN ES CRÍTICO
      }

      if (!detalle) {
        setResultadoRuta('No se puede añadir: lugar no encontrado')
        setGuardandoRuta(false)
        return
      }

      console.log('✅ Sesión válida para ruta:', session.user.id)

      const usuarioId = session.user.id

      // Buscar ruta existente
      let resultadoRuta = await obtenerRutaUsuario(usuarioId, duracionDias)

      if (resultadoRuta.error) {
        console.error('Error buscando ruta:', resultadoRuta.error)
        setResultadoRuta('No se pudo consultar la ruta.')
        setGuardandoRuta(false)
        return
      }

      // Crear ruta si no existe
      if (!resultadoRuta.data) {
        resultadoRuta = await crearRuta(usuarioId, duracionDias)

        if (resultadoRuta.error) {
          console.error('Error creando ruta:', resultadoRuta.error)
          setResultadoRuta('No se pudo crear la ruta.')
          setGuardandoRuta(false)
          return
        }
      }

      if (!resultadoRuta.data) {
        setResultadoRuta('No se pudo obtener la ruta.')
        setGuardandoRuta(false)
        return
      }

      // Agregar lugar a la ruta
      const resultadoLugar = await agregarLugarARuta(
        resultadoRuta.data.id_ruta,
        detalle.id_lugar
      )

      if (resultadoLugar.error) {
        console.error('Error agregando lugar a la ruta:', resultadoLugar.error)
        setResultadoRuta('No se pudo agregar el lugar a la ruta.')
        setGuardandoRuta(false)
        return
      }

      setResultadoRuta(
        duracionDias === 1
          ? 'Lugar añadido a tu ruta de 1 día.'
          : 'Lugar añadido a tu ruta de 2 días.'
      )
      setGuardandoRuta(false)

    } catch (error) {
      console.error('Error en manejarRuta:', error)
      setResultadoRuta('Ocurrió un error inesperado.')
      setGuardandoRuta(false)
    }
  }


  return (
    <main className="app-page">

      <header className="app-header">

        <div>

          <h1>
            San Andrés Cholula
          </h1>

        </div>


        <button
          className="link-button"
          onClick={volver}
        >
          Volver
        </button>

      </header>


      <section className="content-area">

        <h2 style={{ color: '#400d0f', marginBottom: '16px', fontWeight: 800 }}>
          {detalle?.nombre || lugar.nombre}
        </h2>


        {cargando && (

          <div className="dashboard-card" style={{ textAlign: 'center', padding: '30px' }}>

            <p style={{ color: '#6e6462' }}>
              Cargando información...
            </p>

          </div>

        )}


        {error && (

          <div className="dashboard-card" style={{ textAlign: 'center', padding: '30px' }}>

            <p style={{ color: '#B3282D' }}>
              {error}
            </p>

          </div>

        )}


        {detalle &&
          !cargando &&
          !error && (

            <>

              {/* IMÁGENES */}

              {detalle.imagenes_lugar.length > 0 && (

                <div className="place-detail-images" style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '16px', borderRadius: '16px' }}>

                  {detalle.imagenes_lugar.map(
                    (imagen) => (

                      <img
                        key={imagen.id_imagen}
                        src={imagen.url}
                        alt={
                          imagen.descripcion ||
                          detalle.nombre
                        }
                        style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', borderRadius: '16px' }}
                      />

                    )
                  )}

                </div>

              )}


              {/* DESCRIPCIÓN */}

              <div className="dashboard-card" style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>

                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#400d0f', fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                  <FileText size={18} color="#B3282D" /> Descripción
                </h3>

                <p style={{ color: '#6e6462', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
                  {detalle.descripcion ||
                    'La descripción no está disponible.'}
                </p>

              </div>


              {/* INFORMACIÓN */}

              <div className="dashboard-card" style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>

                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#400d0f', fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>
                  <Info size={18} color="#B3282D" /> Información general
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#400d0f' }}>

                  {detalle.categorias_lugar && (

                    <p style={{ margin: 0 }}>

                      <strong>
                        Categoría:
                      </strong>{' '}

                      {detalle.categorias_lugar.nombre}

                    </p>

                  )}


                  {detalle.direccion && (

                    <p style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', margin: 0 }}>

                      <MapPin size={16} color="#B3282D" style={{ marginTop: '2px', flexShrink: 0 }} />

                      <span>
                        {detalle.direccion}
                      </span>

                    </p>

                  )}


                  {detalle.horario && (

                    <p style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>

                      <Clock size={16} color="#B3282D" style={{ flexShrink: 0 }} />

                      <span>
                        {detalle.horario}
                      </span>

                    </p>

                  )}


                  {detalle.costo_entrada !== null && (

                    <p style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>

                      <DollarSign size={16} color="#B3282D" style={{ flexShrink: 0 }} />

                      <span>
                        {detalle.costo_entrada === 0
                          ? 'Entrada Gratis'
                          : `Costo: $${detalle.costo_entrada}`}
                      </span>

                    </p>

                  )}


                  {detalle.telefono && (

                    <p style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>

                      <Phone size={16} color="#B3282D" style={{ flexShrink: 0 }} />

                      <span>
                        {detalle.telefono}
                      </span>

                    </p>

                  )}

                </div>

              </div>


              {/* FAVORITOS Y RUTAS  */}

              <div className="dashboard-card" style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '12px' }}>


                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: esLugarFavorito ? '1px solid #B3282D' : 'none',
                    backgroundColor: esLugarFavorito ? '#fff' : '#B3282D',
                    color: esLugarFavorito ? '#B3282D' : '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}
                  onClick={manejarFavorito}
                  disabled={
                    guardandoFavorito ||
                    cargandoFavorito
                  }
                >

                  <Heart size={18} fill={esLugarFavorito ? '#B3282D' : 'none'} />

                  {cargandoFavorito
                    ? 'Comprobando...'
                    : guardandoFavorito
                      ? 'Guardando...'
                      : esLugarFavorito
                        ? 'Quitar de favoritos'
                        : 'Añadir a favoritos'}

                </button>


                {mensajeFavorito && (

                  <p style={{ fontSize: '13px', textAlign: 'center', color: '#6e6462', margin: 0 }}>

                    {mensajeFavorito.includes(
                      'iniciar sesión'
                    ) ? (

                      <>

                        Para guardar este lugar necesitas una cuenta.{' '}

                        <button
                          type="button"
                          className="link-button"
                          onClick={iniciarSesion}
                          style={{ color: '#B3282D', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Iniciar sesión
                        </button>

                        {' '}o{' '}

                        <button
                          type="button"
                          className="link-button"
                          onClick={registrarse}
                          style={{ color: '#B3282D', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Crear una cuenta
                        </button>

                        .

                      </>

                    ) : (

                      mensajeFavorito

                    )}

                  </p>

                )}


                <div style={{ height: '1px', backgroundColor: '#f2ece9', margin: '4px 0' }}></div>

                <span style={{ fontSize: '13px', fontWeight: 700, color: '#400d0f' }}>
                  Añadir a tus rutas de viaje:
                </span>


                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>

                  <button
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px',
                      borderRadius: '10px',
                      border: '1px solid #B3282D',
                      backgroundColor: '#fff',
                      color: '#B3282D',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    onClick={() =>
                      manejarRuta(1)
                    }
                    disabled={guardandoRuta}
                  >

                    <Route size={16} />

                    {guardandoRuta
                      ? 'Guardando...'
                      : 'Ruta de 1 día'}

                  </button>


                  <button
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px',
                      borderRadius: '10px',
                      border: '1px solid #B3282D',
                      backgroundColor: '#fff',
                      color: '#B3282D',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    onClick={() =>
                      manejarRuta(2)
                    }
                    disabled={guardandoRuta}
                  >

                    <Route size={16} />

                    {guardandoRuta
                      ? 'Guardando...'
                      : 'Ruta de 2 días'}

                  </button>

                </div>


                {resultadoRuta && (

                  <p style={{ fontSize: '13px', textAlign: 'center', color: '#6e6462', margin: 0 }}>

                    {resultadoRuta.includes(
                      'iniciar sesión'
                    ) ? (

                      <>

                        Para crear una ruta necesitas{' '}

                        <button
                          type="button"
                          className="link-button"
                          onClick={iniciarSesion}
                          style={{ color: '#B3282D', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          iniciar sesión
                        </button>

                        {' '}o{' '}

                        <button
                          type="button"
                          className="link-button"
                          onClick={registrarse}
                          style={{ color: '#B3282D', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Crear una cuenta
                        </button>

                        .

                      </>

                    ) : (

                      resultadoRuta

                    )}

                  </p>

                )}

              </div>


              {/* MAPA */}

              {detalle.latitud !== null &&
                detalle.longitud !== null && (

                  <MapaLugar
                    latitud={detalle.latitud}
                    longitud={detalle.longitud}
                    nombre={detalle.nombre}
                  />

                )}


              {/* EVENTOS */}

              <div className="dashboard-card" style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '16px', marginTop: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>

                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#400d0f', fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>
                  <Calendar size={18} color="#B3282D" /> Próximos eventos
                </h3>


                {cargandoEventos && (

                  <p style={{ color: '#6e6462', fontSize: '14px' }}>
                    Cargando eventos...
                  </p>

                )}


                {!cargandoEventos &&
                  eventos.length === 0 && (

                    <p style={{ color: '#6e6462', fontSize: '14px', margin: 0 }}>
                      No hay eventos próximos
                      registrados para este lugar.
                    </p>

                  )}


                {!cargandoEventos &&
                  eventos.length > 0 && (

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                      {eventos.map(
                        (evento) => (

                          <div
                            key={evento.id_evento}
                            className="event-card"
                            style={{
                              padding: '12px',
                              borderRadius: '12px',
                              backgroundColor: '#fdf5f5',
                              border: '1px solid #f2ece9'
                            }}
                          >

                            <h4 style={{ margin: '0 0 6px 0', color: '#400d0f', fontSize: '14px', fontWeight: 700 }}>
                              {evento.nombre}
                            </h4>


                            {evento.descripcion && (

                              <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#6e6462' }}>
                                {evento.descripcion}
                              </p>

                            )}


                            {evento.fecha_inicio && (

                              <p style={{ margin: '2px 0', fontSize: '12px', color: '#400d0f' }}>

                                <strong>
                                  Fecha:
                                </strong>{' '}

                                {new Date(
                                  evento.fecha_inicio
                                ).toLocaleDateString(
                                  'es-MX',
                                  {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  }
                                )}

                              </p>

                            )}


                            {evento.fecha_fin && (

                              <p style={{ margin: '2px 0', fontSize: '12px', color: '#400d0f' }}>

                                <strong>
                                  Hasta:
                                </strong>{' '}

                                {new Date(
                                  evento.fecha_fin
                                ).toLocaleDateString(
                                  'es-MX',
                                  {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  }
                                )}

                              </p>

                            )}


                            {evento.lugar && (

                              <p style={{ margin: '2px 0', fontSize: '12px', color: '#400d0f' }}>

                                <strong>
                                  Lugar:
                                </strong>{' '}

                                {evento.lugar}

                              </p>

                            )}


                            {evento.horario && (

                              <p style={{ margin: '2px 0', fontSize: '12px', color: '#400d0f' }}>

                                <strong>
                                  Horario:
                                </strong>{' '}

                                {evento.horario}

                              </p>

                            )}


                            {evento.costo !== null && (

                              <p style={{ margin: '2px 0', fontSize: '12px', color: '#400d0f' }}>

                                <strong>
                                  Costo:
                                </strong>{' '}

                                {evento.costo === 0
                                  ? 'Gratis'
                                  : `$${evento.costo}`}

                              </p>

                            )}

                          </div>

                        )
                      )}

                    </div>

                  )}

              </div>

            </>

          )}

      </section>

    </main>
  )
}