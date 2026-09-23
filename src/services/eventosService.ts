import { supabase } from '../lib/supabaseClient'

// Obtener eventos próximos de un lugar
export async function obtenerEventosProximos(nombreLugar: string) {
  const ahora = new Date().toISOString()

  const { data, error } = await supabase
    .from('eventos')
    .select(`
      id_evento,
      nombre,
      descripcion,
      fecha_inicio,
      fecha_fin,
      lugar,
      horario,
      costo
    `)
    .eq('estado', true)
    .gte('fecha_inicio', ahora)
    .ilike('lugar', `%${nombreLugar}%`)
    .order('fecha_inicio')
    .limit(3)

  return {
    data: data || [],
    error
  }
}

// Obtener TODOS los eventos activos 
export async function obtenerEventos() {
  const { data, error } = await supabase
    .from('eventos')
    .select(`
      *,
      imagenes_evento (
        url,
        es_principal,
        orden
      )
    `)
    .eq('estado', true)
    .order('fecha_inicio', { ascending: true })

  if (error) console.error('Error al obtener eventos:', error)
  return { data, error }
}

// Obtener un evento por ID
export async function obtenerEventoPorId(idEvento: number) {
  const { data, error } = await supabase
    .from('eventos')
    .select(`
      *,
      imagenes_evento (
        url,
        es_principal,
        orden
      )
    `)
    .eq('id_evento', idEvento)
    .single()

  if (error) console.error('Error al obtener evento:', error)
  return { data, error }
}

// Obtener ID del usuario desde la tabla usuarios
async function obtenerUsuarioBD() {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) return null

  const { data, error } = await supabase
    .from('usuarios')
    .select('id_usuario')
    .eq('auth_user_id', authData.user.id)
    .single()

  if (error || !data) {
    console.error('No se encontró el usuario:', error)
    return null
  }
  return data.id_usuario
}

// Verificar si un evento está agendado por el usuario
export async function estaAgendado(eventoId: number) {
  const usuarioId = await obtenerUsuarioBD()
  if (!usuarioId) return { agendado: false, error: null }

  const { data, error } = await supabase
    .from('eventos_usuario')
    .select('id_evento_usuario')
    .eq('id_usuario', usuarioId)
    .eq('id_evento', eventoId)
    .maybeSingle()

  if (error) {
    console.error('Error verificando evento agendado:', error)
    return { agendado: false, error }
  }
  return { agendado: !!data, error: null }
}

// Agendar un evento
export async function agendarEvento(eventoId: number) {
  const usuarioId = await obtenerUsuarioBD()
  if (!usuarioId) {
    return { data: null, error: new Error('Usuario no autenticado') }
  }

  const { data, error } = await supabase
    .from('eventos_usuario')
    .insert({
      id_usuario: usuarioId,
      id_evento: eventoId
    })
    .select()

  if (error) {
    console.error('Error agendando evento:', error)
    return { data: null, error }
  }
  return { data, error: null }
}

// Eliminar un evento agendado
export async function eliminarEventoAgendado(eventoId: number) {
  const usuarioId = await obtenerUsuarioBD()
  if (!usuarioId) {
    return { data: null, error: new Error('Usuario no autenticado') }
  }

  const { data, error } = await supabase
    .from('eventos_usuario')
    .delete()
    .eq('id_usuario', usuarioId)
    .eq('id_evento', eventoId)
    .select()

  if (error) {
    console.error('Error eliminando evento agendado:', error)
    return { data: null, error }
  }
  return { data, error: null }
}

// Obtener todos los eventos agendados
export async function obtenerEventosAgendados() {
  const usuarioId = await obtenerUsuarioBD()
  if (!usuarioId) {
    return { data: [], error: new Error('Usuario no autenticado') }
  }

  const { data, error } = await supabase
    .from('eventos_usuario')
    .select(`
      id_evento_usuario,
      fecha_agendado,
      evento:eventos (
        id_evento,
        nombre,
        descripcion,
        fecha_inicio,
        fecha_fin,
        lugar,
        horario,
        costo,
        imagenes_evento (
          url,
          es_principal
        )
      )
    `)
    .eq('id_usuario', usuarioId)
    .order('fecha_agendado', { ascending: false })

  if (error) {
    console.error('Error obteniendo eventos agendados:', error)
    return { data: [], error }
  }

  // Transformar datos para simplificar asegurando que 'evento' no sea nulo
  const eventos = (data || []).filter(item => item.evento).map(item => ({
    id_evento_usuario: item.id_evento_usuario,
    fecha_agendado: item.fecha_agendado,
    ...(Array.isArray(item.evento) ? item.evento[0] : item.evento)
  }))

  return { data: eventos, error: null }
}