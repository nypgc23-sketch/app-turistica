import { supabase } from '../lib/supabaseClient'

// Registrar usuario
export async function registrarUsuario({
  email,
  password,
  nombre,
  apellido
}: {
  email: string
  password: string
  nombre: string
  apellido: string
}) {
  const { data, error } =
    await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          apellido
        }
      }
    })

  return {
    data,
    error
  }
}

// Iniciar sesión
export async function iniciarSesion(
  email: string,
  password: string
) {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password
    })

  return {
    data,
    error
  }
}

// Cerrar sesión
export async function cerrarSesion() {
  const { error } =
    await supabase.auth.signOut()

  return {
    error
  }
}

// Recuperar contraseña
export async function recuperarPassword(
  email: string
) {
  const { data, error } =
    await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo:
          'http://localhost:5173/restablecer'
      }
    )

  return {
    data,
    error
  }
}

// Cambiar contraseña
export async function actualizarPassword(
  password: string
) {
  const { data, error } =
    await supabase.auth.updateUser({
      password
    })

  return {
    data,
    error
  }
}

// Obtener preferencias
export async function obtenerPreferencias() {
  const { data, error } =
    await supabase
      .from('preferencias_tipo')
      .select('*')
      .order('id_preferencia') // Corregido

  return {
    data,
    error
  }
}

// Revisar si tiene preferencias (Sin bloque de prueba para que no rompa el flujo)
export async function tienePreferencias(
  usuarioId: string
) {
  const { data, error } =
    await supabase
      .from('preferencias_usuario')
      .select('id_preferencia') // Corregido
      .eq('id_usuario', usuarioId) // Corregido
      .limit(1)

  return {
    tiene:
      !!data &&
      data.length > 0,
    error
  }
}

// Obtener preferencias del usuario
export async function obtenerPreferenciasUsuario(
  usuarioId: string
) {
  // Buscar las preferencias del usuario
  const {
    data: preferenciasUsuario,
    error: errorUsuario
  } =
    await supabase
      .from('preferencias_usuario')
      .select('id_preferencia') // Corregido
      .eq('id_usuario', usuarioId) // Corregido

  if (errorUsuario) {
    return {
      data: [],
      error: errorUsuario
    }
  }

  // Revisar si tiene preferencias
  if (
    !preferenciasUsuario ||
    preferenciasUsuario.length === 0
  ) {
    return {
      data: [],
      error: null
    }
  }

  // Obtener los IDs
  const ids =
    preferenciasUsuario.map(
      item => item.id_preferencia // Corregido
    )

  // Buscar los nombres
  const {
    data: tipos,
    error: errorTipos
  } =
    await supabase
      .from('preferencias_tipo')
      .select('*')
      .in('id_preferencia', ids) // Corregido
      .order('id_preferencia') // Corregido

  if (errorTipos) {
    return {
      data: [],
      error: errorTipos
    }
  }

  return {
    data: tipos || [],
    error: null
  }
}

// Guardar preferencias
export async function guardarPreferencias(
  usuarioId: string,
  preferencias: number[]
) {
  // Eliminar preferencias anteriores
  const {
    error: errorEliminar
  } =
    await supabase
      .from('preferencias_usuario')
      .delete()
      .eq('id_usuario', usuarioId) // Corregido

  if (errorEliminar) {
    return {
      error: errorEliminar
    }
  }

  // Revisar si seleccionó alguna
  if (
    preferencias.length === 0
  ) {
    return {
      error: null
    }
  }

  // Crear registros
  const registros =
    preferencias.map(
      (preferenciaId) => ({
        id_usuario: usuarioId, // Corregido
        id_preferencia: preferenciaId // Corregido
      })
    )

  const { error } =
    await supabase
      .from('preferencias_usuario')
      .insert(registros)

  return {
    error
  }
}