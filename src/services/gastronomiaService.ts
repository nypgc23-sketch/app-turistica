import { supabase } from '../lib/supabaseClient'

const TIEMPO_CACHE = 30000

let cachePlatillos: any[] | null = null
let cacheBebidas: any[] | null = null

let ultimaCargaPlatillos = 0
let ultimaCargaBebidas = 0

let promesaPlatillos: Promise<{
  data: any[] | null
  error: any
}> | null = null

let promesaBebidas: Promise<{
  data: any[] | null
  error: any
}> | null = null

const cacheLugaresPlatillo = new Map<
  number,
  {
    data: any[]
    timestamp: number
  }
>()

const cacheLugaresBebida = new Map<
  number,
  {
    data: any[]
    timestamp: number
  }
>()

const promesasLugaresPlatillo = new Map<
  number,
  Promise<{ data: any[]; error: any }>
>()

const promesasLugaresBebida = new Map<
  number,
  Promise<{ data: any[]; error: any }>
>()

export async function obtenerPlatillos() {
  const ahora = Date.now()

  if (
    cachePlatillos &&
    ahora - ultimaCargaPlatillos < TIEMPO_CACHE
  ) {
    return {
      data: cachePlatillos,
      error: null
    }
  }

  if (promesaPlatillos) {
    return promesaPlatillos
  }

  promesaPlatillos = (async () => {
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
      console.error(
        'Error al obtener platillos:',
        error
      )

      return {
        data: null,
        error
      }
    }

    cachePlatillos = data || []
    ultimaCargaPlatillos = Date.now()

    return {
      data: cachePlatillos,
      error: null
    }
  })()

  try {
    return await promesaPlatillos
  } finally {
    promesaPlatillos = null
  }
}

export async function obtenerBebidas() {
  const ahora = Date.now()

  if (
    cacheBebidas &&
    ahora - ultimaCargaBebidas < TIEMPO_CACHE
  ) {
    return {
      data: cacheBebidas,
      error: null
    }
  }

  if (promesaBebidas) {
    return promesaBebidas
  }

  promesaBebidas = (async () => {
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
      console.error(
        'Error al obtener bebidas:',
        error
      )

      return {
        data: null,
        error
      }
    }

    cacheBebidas = data || []
    ultimaCargaBebidas = Date.now()

    return {
      data: cacheBebidas,
      error: null
    }
  })()

  try {
    return await promesaBebidas
  } finally {
    promesaBebidas = null
  }
}

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
    .order('nombre', {
      ascending: true
    })

  if (error) {
    console.error(
      'Error al obtener categorias:',
      error
    )
  }

  return { data, error }
}

export async function obtenerLugaresPorPlatillo(
  idPlatillo: number
) {
  const ahora = Date.now()

  const cache = cacheLugaresPlatillo.get(idPlatillo)
  if (cache && ahora - cache.timestamp < TIEMPO_CACHE) {
    return { data: cache.data, error: null }
  }

  const promesaExistente = promesasLugaresPlatillo.get(idPlatillo)
  if (promesaExistente) {
    return promesaExistente
  }

  const promesa = (async () => {
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
      .select('*')
      .in('id_lugar', idsLugares)
      .eq('estado', true)

    if (error) {
      console.error('Error al obtener lugares por platillo:', error)
      return { data: [], error }
    }

    return { data: lugares || [], error: null }
  })()

  promesasLugaresPlatillo.set(idPlatillo, promesa)

  try {
    const resultado = await promesa
    if (!resultado.error) {
      cacheLugaresPlatillo.set(idPlatillo, {
        data: resultado.data,
        timestamp: Date.now()
      })
    }
    return resultado
  } finally {
    promesasLugaresPlatillo.delete(idPlatillo)
  }
}
export async function obtenerLugaresPorBebida(
  idBebida: number
) {
  const ahora = Date.now()

  const cache =
    cacheLugaresBebida.get(idBebida)

  if (
    cache &&
    ahora - cache.timestamp < TIEMPO_CACHE
  ) {
    return {
      data: cache.data,
      error: null
    }
  }

  const promesaExistente =
    promesasLugaresBebida.get(idBebida)

  if (promesaExistente) {
    return promesaExistente
  }

  const promesa = (async () => {
    const {
      data: relacion,
      error: errorRelacion
    } = await supabase
      .from('bebidas_lugares')
      .select('id_lugar')
      .eq('id_bebida', idBebida)

    if (
      errorRelacion ||
      !relacion ||
      relacion.length === 0
    ) {
      return {
        data: [],
        error: errorRelacion
      }
    }

    const idsLugares = relacion.map(
      (item: any) => item.id_lugar
    )

    const {
      data: lugares,
      error
    } = await supabase
      .from('lugares_turisticos')
      .select(`
        id_lugar,
        nombre,
        descripcion,
        direccion,
        categoria_id,
        latitud,
        longitud,
        horario,
        telefono,
        costo_entrada,
        estado,
        imagenes_lugar (
          url,
          es_principal,
          orden
        )
      `)
      .in('id_lugar', idsLugares)
      .eq('estado', true)

    if (error) {
      console.error(
        'Error al obtener lugares por bebida:',
        error
      )

      return {
        data: [],
        error
      }
    }

    return {
      data: lugares || [],
      error: null
    }
  })()

  promesasLugaresBebida.set(
    idBebida,
    promesa
  )

  try {
    const resultado = await promesa

    if (!resultado.error) {
      cacheLugaresBebida.set(
        idBebida,
        {
          data: resultado.data,
          timestamp: Date.now()
        }
      )
    }

    return resultado
  } finally {
    promesasLugaresBebida.delete(
      idBebida
    )
  }
}

export async function obtenerLugarPorId(
  idLugar: number
) {
  const {
    data,
    error
  } = await supabase
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
    console.error(
      'Error al obtener lugar:',
      error
    )
  }

  return {
    data,
    error
  }
}

export function limpiarCacheGastronomia() {
  cachePlatillos = null
  cacheBebidas = null

  ultimaCargaPlatillos = 0
  ultimaCargaBebidas = 0

  promesaPlatillos = null
  promesaBebidas = null

  cacheLugaresPlatillo.clear()
  cacheLugaresBebida.clear()

  promesasLugaresPlatillo.clear()
  promesasLugaresBebida.clear()
}