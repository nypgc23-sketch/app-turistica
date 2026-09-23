import { supabase } from '../lib/supabaseClient'

// Coordenadas aproximadas de respaldo en San Andrés Cholula por si faltan en la base de datos
const COORDENADAS_DEFAULT_CHOLULA = {
  latitud: 19.0568,
  longitud: -98.3038
}

// Obtener id id usuario
async function obtenerIdUsuario(
  authUserId: string
) {

  const {
    data: usuario,
    error
  } = await supabase
    .from('usuarios')
    .select('id_usuario')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (error) {
    return {
      data: null,
      error
    }
  }

  if (!usuario) {
    return {
      data: null,
      error: new Error(
        'No se encontró el usuario en la tabla usuarios.'
      )
    }
  }

  return {
    data: usuario.id_usuario,
    error: null
  }
}


// Crear una ruta

export async function crearRuta(
  authUserId: string,
  duracionDias: number
) {

  const resultadoUsuario =
    await obtenerIdUsuario(authUserId)

  if (resultadoUsuario.error) {
    return {
      data: null,
      error: resultadoUsuario.error
    }
  }

  const usuarioId =
    resultadoUsuario.data

  if (!usuarioId) {
    return {
      data: null,
      error: new Error(
        'No se encontró el usuario.'
      )
    }
  }

  const nombre =
    duracionDias === 1
      ? 'Ruta de 1 día'
      : 'Ruta de 2 días'

  const {
    data,
    error
  } = await supabase
    .from('rutas')
    .insert({
      id_usuario: usuarioId,
      tipo_ruta: 'manual',
      nombre,
      descripcion:
        'Ruta turística creada por el usuario.',
      duracion_dias: duracionDias,
      estado: true
    })
    .select()
    .single()

  return {
    data,
    error
  }
}


// Obtener una ruta del usuario

export async function obtenerRutaUsuario(
  authUserId: string,
  duracionDias: number
) {

  const resultadoUsuario =
    await obtenerIdUsuario(authUserId)

  if (resultadoUsuario.error) {
    return {
      data: null,
      error: resultadoUsuario.error
    }
  }

  const usuarioId =
    resultadoUsuario.data

  if (!usuarioId) {
    return {
      data: null,
      error: new Error(
        'No se encontró el usuario.'
      )
    }
  }

  const {
    data,
    error
  } = await supabase
    .from('rutas')
    .select(`
      id_ruta,
      id_usuario,
      tipo_ruta,
      nombre,
      descripcion,
      duracion_dias,
      fecha_creacion,
      estado
    `)
    .eq('id_usuario', usuarioId)
    .eq('duracion_dias', duracionDias)
    .eq('estado', true)
    .order('fecha_creacion', {
      ascending: false
    })
    .limit(1)
    .maybeSingle()

  return {
    data,
    error
  }
}


// Obtener todas las rutas del usuario

export async function obtenerRutasUsuario() {

  const {
    data: {
      session
    }
  } = await supabase.auth.getSession()

  if (!session) {
    return {
      data: [],
      error: new Error(
        'Usuario no autenticado.'
      )
    }
  }

  const resultadoUsuario =
    await obtenerIdUsuario(
      session.user.id
    )

  if (resultadoUsuario.error) {
    return {
      data: [],
      error: resultadoUsuario.error
    }
  }

  const usuarioId =
    resultadoUsuario.data

  if (!usuarioId) {
    return {
      data: [],
      error: new Error(
        'No se encontró el usuario.'
      )
    }
  }

  const {
    data,
    error
  } = await supabase
    .from('rutas')
    .select(`
      id_ruta,
      nombre,
      descripcion,
      duracion_dias
    `)
    .eq('id_usuario', usuarioId)
    .eq('estado', true)
    .order('fecha_creacion', {
      ascending: false
    })

  return {
    data: data || [],
    error
  }
}


// Obtener el siguiente orden

export async function obtenerSiguienteOrden(
  idRuta: number,
  dia: number
) {

  const {
    data,
    error
  } = await supabase
    .from('detalle_ruta')
    .select('orden_visita')
    .eq('id_ruta', idRuta)
    .eq('dia', dia)
    .order('orden_visita', {
      ascending: false
    })
    .limit(1)
    .maybeSingle()

  if (error) {
    return {
      data: null,
      error
    }
  }

  const siguienteOrden =
    data?.orden_visita
      ? data.orden_visita + 1
      : 1

  return {
    data: siguienteOrden,
    error: null
  }
}


// Obtener día y orden disponibles

export async function obtenerSiguienteUbicacionRuta(
  idRuta: number,
  duracionDias: number
) {

  for (
    let dia = 1;
    dia <= duracionDias;
    dia++
  ) {

    const {
      count,
      error
    } = await supabase
      .from('detalle_ruta')
      .select(
        'id_detalle_ruta',
        {
          count: 'exact',
          head: true
        }
      )
      .eq('id_ruta', idRuta)
      .eq('dia', dia)

    if (error) {
      return {
        dia: null,
        orden: null,
        error
      }
    }

    const cantidad =
      count || 0

    if (cantidad < 6) {
      return {
        dia,
        orden: cantidad + 1,
        error: null
      }
    }
  }

  return {
    dia: null,
    orden: null,
    error: new Error(
      'La ruta ya tiene el máximo de lugares permitidos.'
    )
  }
}


// Agregar un lugar a una ruta

export async function agregarLugarARuta(
  idRuta: number,
  idLugar: number
) {

  const {
    data: ruta,
    error: errorRuta
  } = await supabase
    .from('rutas')
    .select(`
      id_ruta,
      duracion_dias,
      estado
    `)
    .eq('id_ruta', idRuta)
    .eq('estado', true)
    .single()

  if (errorRuta) {
    return {
      data: null,
      error: errorRuta
    }
  }

  if (!ruta) {
    return {
      data: null,
      error: new Error(
        'No se encontró la ruta.'
      )
    }
  }

  const {
    data: existente,
    error: errorBusqueda
  } = await supabase
    .from('detalle_ruta')
    .select('id_detalle_ruta')
    .eq('id_ruta', idRuta)
    .eq('id_lugar', idLugar)
    .maybeSingle()

  if (errorBusqueda) {
    return {
      data: null,
      error: errorBusqueda
    }
  }

  if (existente) {
    return {
      data: existente,
      error: null
    }
  }

  const ubicacion =
    await obtenerSiguienteUbicacionRuta(
      idRuta,
      ruta.duracion_dias
    )

  if (ubicacion.error) {
    return {
      data: null,
      error: ubicacion.error
    }
  }

  if (
    ubicacion.dia === null ||
    ubicacion.orden === null
  ) {
    return {
      data: null,
      error: new Error(
        'No hay espacio disponible en la ruta.'
      )
    }
  }

  const {
    data,
    error
  } = await supabase
    .from('detalle_ruta')
    .insert({
      id_ruta: idRuta,
      id_lugar: idLugar,
      dia: ubicacion.dia,
      orden_visita: ubicacion.orden
    })
    .select()
    .single()

  return {
    data,
    error
  }
}


// Obtener los lugares de una ruta con respaldo de coordenadas si faltan en BD

export async function obtenerLugaresDeRuta(
  idRuta: number
) {

  const {
    data,
    error
  } = await supabase
    .from('detalle_ruta')
    .select(`
      id_detalle_ruta,
      id_lugar,
      orden_visita,
      dia,
      lugares_turisticos (
        id_lugar,
        nombre,
        direccion,
        latitud,
        longitud
      )
    `)
    .eq('id_ruta', idRuta)
    .order('dia', {
      ascending: true
    })
    .order('orden_visita', {
      ascending: true
    })

  if (error) {
    return {
      data: [],
      error
    }
  }

  const lugares =
    (data || []).map(
      (detalle: any) => {

        const lugar =
          Array.isArray(
            detalle.lugares_turisticos
          )
            ? detalle.lugares_turisticos[0]
            : detalle.lugares_turisticos

        const lat = lugar?.latitud !== null && lugar?.latitud !== undefined && !isNaN(Number(lugar.latitud))
          ? Number(lugar.latitud)
          : COORDENADAS_DEFAULT_CHOLULA.latitud

        const lon = lugar?.longitud !== null && lugar?.longitud !== undefined && !isNaN(Number(lugar.longitud))
          ? Number(lugar.longitud)
          : COORDENADAS_DEFAULT_CHOLULA.longitud

        return {
          id_detalle_ruta:
            detalle.id_detalle_ruta,

          id_lugar:
            detalle.id_lugar,

          orden_visita:
            detalle.orden_visita,

          dia:
            detalle.dia,

          nombre:
            lugar?.nombre ||
            'Lugar turístico',

          direccion:
            lugar?.direccion ||
            null,

          latitud: lat,
          longitud: lon
        }
      }
    )

  return {
    data: lugares,
    error: null
  }
}


// Eliminar un lugar de una ruta

export async function eliminarLugarDeRuta(
  idDetalleRuta: number
) {

  const {
    data: detalle,
    error: errorDetalle
  } = await supabase
    .from('detalle_ruta')
    .select(`
      id_ruta,
      dia
    `)
    .eq('id_detalle_ruta', idDetalleRuta)
    .single()

  if (errorDetalle) {
    return {
      data: null,
      error: errorDetalle
    }
  }

  if (!detalle) {
    return {
      data: null,
      error: new Error(
        'No se encontró el lugar de la ruta.'
      )
    }
  }

  const {
    error
  } = await supabase
    .from('detalle_ruta')
    .delete()
    .eq(
      'id_detalle_ruta',
      idDetalleRuta
    )

  if (error) {
    return {
      data: null,
      error
    }
  }

  const {
    data: restantes,
    error: errorRestantes
  } = await supabase
    .from('detalle_ruta')
    .select(`
      id_detalle_ruta,
      orden_visita
    `)
    .eq(
      'id_ruta',
      detalle.id_ruta
    )
    .eq(
      'dia',
      detalle.dia
    )
    .order('orden_visita', {
      ascending: true
    })

  if (errorRestantes) {
    return {
      data: null,
      error: errorRestantes
    }
  }

  for (
    let i = 0;
    i < (restantes || []).length;
    i++
  ) {

    const {
      error: errorOrden
    } = await supabase
      .from('detalle_ruta')
      .update({
        orden_visita: i + 1
      })
      .eq(
        'id_detalle_ruta',
        restantes[i].id_detalle_ruta
      )

    if (errorOrden) {
      return {
        data: null,
        error: errorOrden
      }
    }
  }

  return {
    data: true,
    error: null
  }
}