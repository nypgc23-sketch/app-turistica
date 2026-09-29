import { supabase } from '../lib/supabaseClient'

// Obtener platillos activos
export async function obtenerPlatillos() {
  const { data, error } = await supabase
    .from('platillos')
    .select(`
      id_platillo,
      nombre,
      descripcion,
      preparacion,
      ingredientes,
      tipo_comida,
      precio,
      estado,
      id_categoria,
      temporada,
      categorias_platillo (
        id_categoria,
        nombre,
        descripcion
      ),
      imagenes_platillo (
        url,
        es_principal,
        orden
      )
    `)
    .eq('estado', true)
    .order('nombre', { ascending: true })

  if (error) {
    console.error('Error al obtener platillos:', error)
  }

  return { data, error }
}

// Obtener bebidas activas
export async function obtenerBebidas() {
  const { data, error } = await supabase
    .from('bebidas')
    .select(`
      id_bebida,
      nombre,
      descripcion,
      preparacion,
      ingredientes,
      tipo_bebida,
      precio,
      estado,
      temporada,
      imagenes_bebida (
        url,
        es_principal,
        orden
      )
    `)
    .eq('estado', true)
    .order('nombre', { ascending: true })

  if (error) {
    console.error('Error al obtener bebidas:', error)
  }

  return { data, error }
}

// Obtener categorias de platillos
export async function obtenerCategoriasPlatillo() {
  const { data, error } = await supabase
    .from('categorias_platillo')
    .select(`
      id_categoria,
      nombre,
      descripcion,
      estado
    `)
    .eq('estado', true)
    .order('nombre', { ascending: true })

  if (error) {
    console.error('Error al obtener categorias:', error)
  }

  return { data, error }
}

// Obtener lugares por platillo
export async function obtenerLugaresPorPlatillo(idPlatillo: number) {
  const { data: relacion, error: errorRelacion } = await supabase
    .from('platillos_lugares')
    .select('id_lugar')
    .eq('id_platillo', idPlatillo)

  if (errorRelacion || !relacion || relacion.length === 0) {
    return { data: [], error: errorRelacion }
  }

  const idsLugares = relacion.map((item: any) => item.id_lugar)

  const { data: lugares, error } = await supabase
    .from('lugares_turisticos')
    .select('id_lugar, nombre, descripcion, direccion, categoria_id, latitud, longitud, horario, telefono, costo_entrada, estado')
    .in('id_lugar', idsLugares)

  if (error) {
    console.error('Error al obtener lugares por platillo:', error)
    return { data: [], error }
  }

  return { data: lugares || [], error: null }
}

// Obtener lugares por bebida
export async function obtenerLugaresPorBebida(idBebida: number) {
  const { data: relacion, error: errorRelacion } = await supabase
    .from('bebidas_lugares')
    .select('id_lugar')
    .eq('id_bebida', idBebida)

  if (errorRelacion || !relacion || relacion.length === 0) {
    return { data: [], error: errorRelacion }
  }

  const idsLugares = relacion.map((item: any) => item.id_lugar)

  const { data: lugares, error } = await supabase
    .from('lugares_turisticos')
    .select('id_lugar, nombre, descripcion, direccion, categoria_id, latitud, longitud, horario, telefono, costo_entrada, estado')
    .in('id_lugar', idsLugares)

  if (error) {
    console.error('Error al obtener lugares por bebida:', error)
    return { data: [], error }
  }

  return { data: lugares || [], error: null }
}

// Obtener lugar por ID
export async function obtenerLugarPorId(idLugar: number) {
  const { data, error } = await supabase
    .from('lugares_turisticos')
    .select(`
      *,
      imagenes_lugar (
        url,
        es_principal,
        orden
      )
    `)
    .eq('id_lugar', idLugar)
    .single()

  if (error) {
    console.error('Error al obtener lugar:', error)
  }

  return { data, error }
}