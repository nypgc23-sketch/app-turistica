
import { supabase } from './supabaseClient'

let cachePerfil: any = null
let authIdCacheado: string | null = null
let ultimaVerificacion = 0
let promesaPerfil: Promise<any> | null = null
let ultimoFallo = 0

const TIEMPO_CACHE = 30000
const TIEMPO_BLOQUEO_ERROR = 10000

export async function obtenerUsuarioCacheado() {
  const ahora = Date.now()

  if (promesaPerfil) {
    return promesaPerfil
  }

  if (
    cachePerfil &&
    ahora - ultimaVerificacion < TIEMPO_CACHE
  ) {
    return cachePerfil
  }

  if (
    ultimoFallo &&
    ahora - ultimoFallo < TIEMPO_BLOQUEO_ERROR
  ) {
    return cachePerfil
  }

  promesaPerfil = cargarUsuario()

  try {
    return await promesaPerfil
  } finally {
    promesaPerfil = null
  }
}

async function cargarUsuario() {
  try {
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession()

    if (sessionError) {
      throw new Error(sessionError.message)
    }

    const currentAuthId =
      session?.user?.id || null

    if (!currentAuthId) {
      limpiarCacheUsuario()
      return null
    }

    if (
      authIdCacheado &&
      currentAuthId !== authIdCacheado
    ) {
      cachePerfil = null
      ultimaVerificacion = 0
      ultimoFallo = 0
    }

    return await sincronizarUsuario(session)
  } catch (err) {
    ultimoFallo = Date.now()

    console.error(
      'Error obteniendo usuario en caché:',
      err
    )

    return cachePerfil
  }
}

async function sincronizarUsuario(session: any) {
  try {
    if (!session?.user) {
      return null
    }

    const user = session.user
    const authId = user.id
    const email = user.email || ''

    authIdCacheado = authId

    const {
      data: datosUsuario,
      error: usuarioError
    } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_user_id', authId)
      .maybeSingle()

    if (usuarioError) {
      throw new Error(usuarioError.message)
    }

    if (datosUsuario) {
      cachePerfil = datosUsuario
      ultimaVerificacion = Date.now()
      ultimoFallo = 0

      return cachePerfil
    }

    if (email) {
      const {
        data: porCorreo,
        error: correoError
      } = await supabase
        .from('usuarios')
        .select('*')
        .eq('correo', email)
        .maybeSingle()

      if (correoError) {
        throw new Error(correoError.message)
      }

      if (porCorreo) {
        if (!porCorreo.auth_user_id) {
          const {
            error: actualizacionError
          } = await supabase
            .from('usuarios')
            .update({
              auth_user_id: authId
            })
            .eq(
              'id_usuario',
              porCorreo.id_usuario
            )

          if (actualizacionError) {
            throw new Error(
              actualizacionError.message
            )
          }

          porCorreo.auth_user_id = authId
        }

        cachePerfil = porCorreo
        ultimaVerificacion = Date.now()
        ultimoFallo = 0

        return cachePerfil
      }
    }

    const nombreAuto =
      user.user_metadata?.nombre ||
      email.split('@')[0] ||
      'Explorador'

    const {
      data: nuevoUsuario,
      error: errorCreacion
    } = await supabase
      .from('usuarios')
      .insert([
        {
          nombre: nombreAuto,
          correo: email,
          auth_user_id: authId
        }
      ])
      .select()
      .maybeSingle()

    if (errorCreacion) {
      throw new Error(errorCreacion.message)
    }

    if (nuevoUsuario) {
      cachePerfil = nuevoUsuario
      ultimaVerificacion = Date.now()
      ultimoFallo = 0
    }

    return cachePerfil
  } catch (err) {
    ultimoFallo = Date.now()

    console.error(
      'Error sincronizando usuario en caché:',
      err
    )

    return cachePerfil
  }
}

export function limpiarCacheUsuario() {
  cachePerfil = null
  authIdCacheado = null
  ultimaVerificacion = 0
  ultimoFallo = 0
  promesaPerfil = null
}
