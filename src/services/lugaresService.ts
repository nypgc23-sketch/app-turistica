import { supabase } from '../lib/supabaseClient'

let cacheLugares: any[] | null = null
let ultimaCargaLugares = 0

let promesaLugares: Promise<{
  data: any[]
  error: any
}> | null = null

const TIEMPO_CACHE = 15000

// Obtener lugares
export async function obtenerLugares() {
  const ahora = Date.now()

  if (
    cacheLugares !== null &&
    ahora - ultimaCargaLugares < TIEMPO_CACHE
  ) {
    return {
      data: cacheLugares,
      error: null
    }
  }

  if (promesaLugares) {
    return promesaLugares
  }

  promesaLugares = cargarLugaresDesdeSupabase()

  try {
    const resultado = await promesaLugares

    if (!resultado.error) {
      cacheLugares = resultado.data
      ultimaCargaLugares = Date.now()
    }

    return resultado
  } finally {
    promesaLugares = null
  }
}

// Cargar lugares desde la base de datos
async function cargarLugaresDesdeSupabase() {
  try {
    const {
      data: categoriasData,
      error: catError
    } = await supabase
      .from('categorias_lugar')
      .select('*')

    if (catError) {
      console.error(
        'Error obteniendo categorías:',
        catError
      )
    }

    const categorias = categoriasData || []

    const {
      data: lugares,
      error
    } = await supabase
      .from('lugares_turisticos')
      .select('*')
      .eq('estado', true)
      .order('nombre', {
        ascending: true
      })

    if (error) {
      console.error(
        'Error obteniendo lugares:',
        error
      )

      return {
        data: [],
        error
      }
    }

    if (
      !lugares ||
      lugares.length === 0
    ) {
      return {
        data: [],
        error: null
      }
    }

    const idsLugares = lugares.map(
      (lugar: any) =>
        lugar.id_lugar
    )

    const {
      data: imagenesData,
      error: imgError
    } = await supabase
      .from('imagenes_lugar')
      .select('*')
      .in(
        'id_lugar',
        idsLugares
      )
      .order('orden', {
        ascending: true
      })

    if (imgError) {
      console.error(
        'Error obteniendo imágenes:',
        imgError
      )
    }

    const imagenes = imagenesData || []

    const lugaresCompletos =
      lugares.map(
        (lugar: any) => {
          const categoria =
            categorias.find(
              (cat: any) =>
                cat.id_categoria ===
                lugar.id_categoria
            )

          const imagenesLugar =
            imagenes.filter(
              (imagen: any) =>
                imagen.id_lugar ===
                lugar.id_lugar
            )

          return {
            ...lugar,
            categorias_lugar:
              categoria || null,
            imagenes_lugar:
              imagenesLugar
          }
        }
      )

    return {
      data: lugaresCompletos,
      error: null
    }
  } catch (error) {
    console.error(
      'Error inesperado cargando lugares:',
      error
    )

    return {
      data: [],
      error
    }
  }
}

// Obtener lugar por ID
export async function obtenerLugarPorId(
  idLugar: number
) {
  try {
    if (
      idLugar === null ||
      idLugar === undefined ||
      idLugar === 0 ||
      isNaN(Number(idLugar))
    ) {
      return {
        data: null,
        error: {
          message: 'ID de lugar inválido'
        }
      }
    }

    const {
      data: lugar,
      error
    } = await supabase
      .from('lugares_turisticos')
      .select('*')
      .eq(
        'id_lugar',
        idLugar
      )
      .eq('estado', true)
      .maybeSingle()

    if (error) {
      console.error(
        'Error obteniendo lugar:',
        error
      )

      return {
        data: null,
        error
      }
    }

    if (!lugar) {
      return {
        data: null,
        error: null
      }
    }

    const [
      categoriaResponse,
      imagenesResponse
    ] = await Promise.all([
      lugar.id_categoria
        ? supabase
            .from('categorias_lugar')
            .select('*')
            .eq(
              'id_categoria',
              lugar.id_categoria
            )
            .maybeSingle()
        : Promise.resolve({
            data: null,
            error: null
          }),

      supabase
        .from('imagenes_lugar')
        .select('*')
        .eq(
          'id_lugar',
          idLugar
        )
        .order('orden', {
          ascending: true
        })
    ])

    if (categoriaResponse.error) {
      console.error(
        'Error obteniendo categoría:',
        categoriaResponse.error
      )
    }

    if (imagenesResponse.error) {
      console.error(
        'Error obteniendo imágenes:',
        imagenesResponse.error
      )
    }

    return {
      data: {
        ...lugar,
        categorias_lugar:
          categoriaResponse.data ||
          null,
        imagenes_lugar:
          imagenesResponse.data ||
          []
      },
      error:
        categoriaResponse.error ||
        imagenesResponse.error ||
        null
    }
  } catch (error) {
    console.error(
      'Error inesperado obteniendo lugar:',
      error
    )

    return {
      data: null,
      error
    }
  }
}

// Limpiar caché
export function limpiarCacheLugares() {
  cacheLugares = null
  ultimaCargaLugares = 0
  promesaLugares = null
}