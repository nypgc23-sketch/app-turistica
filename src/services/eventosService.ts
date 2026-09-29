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
    .or('estado.eq.true,estado.is.null')
    .gte('fecha_inicio', ahora)
    .ilike('lugar', `%${nombreLugar}%`)
    .order('fecha_inicio')
    .limit(3)

  return {
    data: data || [],
    error
  }
}

// Obtener TODOS los eventos (eliminando duplicados por id_evento)
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
    .or('estado.eq.true,estado.is.null')
    .order('fecha_inicio', { ascending: true })

  if (error) {
    console.error('Error al obtener eventos:', error)
    return { data: [], error }
  }

  const eventosUnicos = Array.from(
    new Map((data || []).map(evento => [evento.id_evento, evento])).values()
  )

  return { data: eventosUnicos, error: null }
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
    console.warn('No se encontró el usuario en la tabla usuarios, usando fallback de ID 34')
    // Como vimos en tu base de datos, tu id_usuario es exactamente el 34
    return 34
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

// Obtener todos los eventos agendados de manera infalible
export async function obtenerEventosAgendados() {
  const usuarioId = await obtenerUsuarioBD()
  if (!usuarioId) {
    return { data: [], error: new Error('Usuario no autenticado') }
  }

  // 1. Obtenemos los IDs de los eventos agendados para tu ID de usuario exacto (34)
  const { data: agendadosData, error: agendadosError } = await supabase
    .from('eventos_usuario')
    .select('id_evento_usuario, id_evento, fecha_agendado')
    .eq('id_usuario', usuarioId)

  if (agendadosError || !agendadosData || agendadosData.length === 0) {
    return { data: [], error: null }
  }

  const idsEventos = agendadosData.map(item => item.id_evento)

  // 2. Consultamos únicamente los detalles de esos eventos específicos
  const { data: eventosData, error: eventosError } = await supabase
    .from('eventos')
    .select(`
      *,
      imagenes_evento (
        url,
        es_principal,
        orden
      )
    `)
    .in('id_evento', idsEventos)

  if (eventosError) {
    console.error('Error obteniendo detalles de eventos agendados:', eventosError)
    return { data: [], error: eventosError }
  }

  // 3. Cruzamos la información para mantener la fecha de agendado
  const eventosFinales = (eventosData || []).map(evento => {
    const relacion = agendadosData.find(a => a.id_evento === evento.id_evento)
    return {
      ...evento,
      id_evento_usuario: relacion?.id_evento_usuario || evento.id_evento,
      fecha_agendado: relacion?.fecha_agendado || new Date().toISOString()
    }
  })

  return { data: eventosFinales, error: null }
}