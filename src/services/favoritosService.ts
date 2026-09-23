import { supabase } from '../lib/supabaseClient'


// Obtener el id_usuario de nuestra tabla usuarios
// utilizando el UUID de Supabase Auth.

async function obtenerIdUsuario(
  usuarioAuthId: string
) {

  const {
    data: usuario,
    error
  } = await supabase
    .from('usuarios')
    .select('id_usuario')
    .eq('auth_user_id', usuarioAuthId)
    .single()

  if (error || !usuario) {
    return {
      idUsuario: null,
      error:
        error ||
        new Error(
          'No se encontró el usuario.'
        )
    }
  }

  return {
    idUsuario: usuario.id_usuario,
    error: null
  }
}


// Verificar si un lugar está en favoritos

export async function esFavorito(
  usuarioAuthId: string,
  idLugar: number
) {

  const resultado =
    await obtenerIdUsuario(
      usuarioAuthId
    )

  if (
    resultado.error ||
    resultado.idUsuario === null
  ) {
    return {
      esFavorito: false,
      error: resultado.error
    }
  }

  const {
    data,
    error
  } = await supabase
    .from('favoritos')
    .select('id_favorito')
    .eq(
      'id_usuario',
      resultado.idUsuario
    )
    .eq(
      'tipo_contenido',
      'lugar'
    )
    .eq(
      'id_contenido',
      idLugar
    )
    .maybeSingle()

  if (error) {
    return {
      esFavorito: false,
      error
    }
  }

  return {
    esFavorito: !!data,
    error: null
  }
}


// Agregar un lugar a favoritos

export async function agregarFavorito(
  usuarioAuthId: string,
  idLugar: number
) {

  const resultado =
    await obtenerIdUsuario(
      usuarioAuthId
    )

  if (
    resultado.error ||
    resultado.idUsuario === null
  ) {
    return {
      data: null,
      error:
        resultado.error ||
        new Error(
          'No se encontró el usuario.'
        )
    }
  }

  const usuarioId =
    resultado.idUsuario


  // Verificar si ya existe.

  const {
    data: existente,
    error: errorBusqueda
  } = await supabase
    .from('favoritos')
    .select('id_favorito')
    .eq(
      'id_usuario',
      usuarioId
    )
    .eq(
      'tipo_contenido',
      'lugar'
    )
    .eq(
      'id_contenido',
      idLugar
    )
    .maybeSingle()

  if (errorBusqueda) {
    return {
      data: null,
      error: errorBusqueda
    }
  }


  // Evitar duplicados.

  if (existente) {
    return {
      data: existente,
      error: null
    }
  }


  // Crear favorito.

  const {
    data,
    error
  } = await supabase
    .from('favoritos')
    .insert({
      id_usuario: usuarioId,
      tipo_contenido: 'lugar',
      id_contenido: idLugar
    })
    .select()
    .single()

  return {
    data,
    error
  }
}


// Eliminar un favorito

export async function eliminarFavorito(
  usuarioAuthId: string,
  idLugar: number
) {

  const resultado =
    await obtenerIdUsuario(
      usuarioAuthId
    )

  if (
    resultado.error ||
    resultado.idUsuario === null
  ) {
    return {
      data: null,
      error:
        resultado.error ||
        new Error(
          'No se encontró el usuario.'
        )
    }
  }

  const usuarioId =
    resultado.idUsuario


  const {
    data,
    error
  } = await supabase
    .from('favoritos')
    .delete()
    .eq(
      'id_usuario',
      usuarioId
    )
    .eq(
      'tipo_contenido',
      'lugar'
    )
    .eq(
      'id_contenido',
      idLugar
    )
    .select()
    .maybeSingle()

  return {
    data,
    error
  }
}


// Obtener los favoritos de un usuario

export async function obtenerFavoritosUsuario(
  usuarioAuthId: string
) {

  const resultado =
    await obtenerIdUsuario(
      usuarioAuthId
    )

  if (
    resultado.error ||
    resultado.idUsuario === null
  ) {
    return {
      data: [],
      error:
        resultado.error ||
        new Error(
          'No se encontró el usuario.'
        )
    }
  }

  const usuarioId =
    resultado.idUsuario


  // Obtener favoritos.

  const {
    data: favoritos,
    error: errorFavoritos
  } = await supabase
    .from('favoritos')
    .select(`
      id_favorito,
      id_usuario,
      tipo_contenido,
      id_contenido,
      fecha_registro
    `)
    .eq(
      'id_usuario',
      usuarioId
    )
    .eq(
      'tipo_contenido',
      'lugar'
    )
    .order(
      'fecha_registro',
      {
        ascending: false
      }
    )


  if (errorFavoritos) {
    return {
      data: [],
      error: errorFavoritos
    }
  }


  if (
    !favoritos ||
    favoritos.length === 0
  ) {
    return {
      data: [],
      error: null
    }
  }


  // Obtener IDs de lugares.

  const idsLugares =
    favoritos.map(
      favorito =>
        favorito.id_contenido
    )


  // Obtener información de lugares.

  const {
    data: lugares,
    error: errorLugares
  } = await supabase
    .from('lugares_turisticos')
    .select(`
      id_lugar,
      nombre,
      descripcion,
      direccion,
      latitud,
      longitud,
      horario,
      costo_entrada,
      telefono,
      categorias_lugar (
        id_categoria,
        nombre,
        descripcion
      ),
      imagenes_lugar (
        id_imagen,
        url,
        descripcion,
        es_principal,
        orden
      )
    `)
    .in(
      'id_lugar',
      idsLugares
    )
    .eq(
      'estado',
      true
    )


  if (errorLugares) {
    return {
      data: [],
      error: errorLugares
    }
  }


  // Combinar favoritos con lugares.

  const resultadoFinal =
    favoritos.map(
      favorito => {

        const lugar =
          lugares?.find(
            item =>
              item.id_lugar ===
              favorito.id_contenido
          )

        return {
          ...favorito,
          lugar:
            lugar || null
        }
      }
    )


  return {
    data: resultadoFinal,
    error: null
  }
}