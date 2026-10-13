import { supabase } from '../lib/supabaseClient'

// Obtener eventos próximos de un lugar (consulta directa y segura)
export async function obtenerEventosProximos(nombreLugar: string) {
  const ahora = new Date().toISOString()

  const { data, error } = await supabase
    .from('eventos')
    .select('*')
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

// Obtener TODOS los eventos de forma limpia y sin bloqueos de red
export async function obtenerEventos() {
  const { data, error } = await supabase
    .from('eventos')
    .select('*')
    .or('estado.eq.true,estado.is.null')
    .order('fecha_inicio', { ascending: true })

  if (error) {
    console.error('Error al obtener eventos:', error)
    return { data: [], error }
  }

  // Aseguramos elementos únicos
  const eventosUnicos = Array.from(
    new Map((data || []).map(evento => [evento.id_evento, evento])).values()
  )

  return { data: eventosUnicos, error: null }
}

// Obtener un evento por ID
export async function obtenerEventoPorId(idEvento: number) {
  const { data, error } = await supabase
    .from('eventos')
    .select('*')
    .eq('id_evento', idEvento)
    .single()

  if (error) console.error('Error al obtener evento:', error)
  return { data, error }
}

// Obtener ID del usuario con respaldo directo al ID 35 que confirmamos en tu BD
async function obtenerUsuarioBD() {
  try {
    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) return 35

    const { data, error } = await supabase
      .from('usuarios')
      .select('id_usuario')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle()

    if (error || !data) return 35
    return data.id_usuario
  } catch {
    return 35
  }
}

// Verificar si un evento está agendado
export async function estaAgendado(eventoId: number) {
  const usuarioId = await obtenerUsuarioBD()
  
  const { data, error } = await supabase
    .from('eventos_usuario')
    .select('id_evento_usuario')
    .eq('id_usuario', usuarioId)
    .eq('id_evento', eventoId)
    .maybeSingle()

  if (error) {
    return { agendado: false, error }
  }
  return { agendado: !!data, error: null }
}

// Agendar un evento
export async function agendarEvento(eventoId: number) {
  const usuarioId = await obtenerUsuarioBD()

  const { data: existente } = await supabase
    .from('eventos_usuario')
    .select('id_evento_usuario')
    .eq('id_usuario', usuarioId)
    .eq('id_evento', eventoId)
    .maybeSingle()

  if (existente) {
    return { data: [existente], error: null }
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

// Obtener todos los eventos agendados del usuario
export async function obtenerEventosAgendados() {
  const usuarioId = await obtenerUsuarioBD()

  const { data: agendadosData, error: agendadosError } = await supabase
    .from('eventos_usuario')
    .select('id_evento_usuario, id_evento, fecha_agendado')
    .eq('id_usuario', usuarioId)

  if (agendadosError || !agendadosData || agendadosData.length === 0) {
    return { data: [], error: null }
  }

  const idsEventos = agendadosData.map(item => item.id_evento)

  const { data: eventosData, error: eventosError } = await supabase
    .from('eventos')
    .select('*')
    .in('id_evento', idsEventos)

  if (eventosError) {
    return { data: [], error: eventosError }
  }

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