import { supabase } from '../lib/supabaseClient'

export async function obtenerLugares() {
  const { data: lugaresBase, error } = await supabase
    .from('lugares_turisticos')
    .select('*')
    .eq('estado', true)
    .order('nombre')

  if (error) {
    console.error("Error obteniendo lugares:", error)
    return { data: [], error }
  }

  if (!lugaresBase || lugaresBase.length === 0) {
    return { data: [], error: null }
  }

  const categoriaIds = lugaresBase.map(l => l.categoria_id).filter(Boolean)
  const lugarIds = lugaresBase.map(l => l.id_lugar)

  try {
    // Consultas protegidas individualmente para evitar fallos en bloque
    const [categoriasRes, imagenesRes] = await Promise.all([
      categoriaIds.length > 0 
        ? supabase.from('categorias_lugar').select('*').in('id_categoria', categoriaIds)
        : Promise.resolve({ data: [] }),
      lugarIds.length > 0 
        ? supabase.from('imagenes_lugar').select('*').in('id_lugar', lugarIds)
        : Promise.resolve({ data: [] })
    ])

    const lugares = lugaresBase.map(lugar => ({
      ...lugar,
      categorias_lugar: categoriasRes.data?.find((c: any) => c.id_categoria === lugar.categoria_id) || null,
      imagenes_lugar: imagenesRes.data?.filter((i: any) => i.id_lugar === lugar.id_lugar) || []
    }))

    return { data: lugares, error: null }
  } catch (err) {
    console.error("Error procesando relaciones de lugares:", err)
    // Devuelve al menos los datos base si fallan las relaciones secundarias
    return { data: lugaresBase, error: null }
  }
}

export async function obtenerLugarPorId(idLugar: number) {
  const { data: lugarBase, error } = await supabase
    .from('lugares_turisticos')
    .select('*')
    .eq('id_lugar', idLugar)
    .eq('estado', true)
    .single()

  if (error || !lugarBase) {
    console.error("Error obteniendo lugar por ID:", error)
    return { data: null, error }
  }

  try {
    const [categoriaRes, imagenesRes] = await Promise.all([
      lugarBase.categoria_id
        ? supabase
            .from('categorias_lugar')
            .select('*')
            .eq('id_categoria', lugarBase.categoria_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),

      supabase
        .from('imagenes_lugar')
        .select('*')
        .eq('id_lugar', idLugar)
        .order('orden', { ascending: true })
    ])

    const lugar = {
      ...lugarBase,
      categorias_lugar: categoriaRes.data || null,
      imagenes_lugar: imagenesRes.data || []
    }

    return { data: lugar, error: null }
  } catch (err) {
    console.error("Error al procesar detalle del lugar:", err)
    return { data: lugarBase, error: null }
  }
}