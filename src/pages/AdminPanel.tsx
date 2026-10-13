import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { 
  ShieldCheck, ArrowLeft, Trash2, Edit3, Plus, AlertTriangle, Check, X, MapPin, Search, Utensils, Image as ImageIcon, Calendar 
} from 'lucide-react'

type AdminPanelProps = {
  volver: () => void
}

export default function AdminPanel({ volver }: AdminPanelProps) {
  const [esAdmin, setEsAdmin] = useState<boolean | null>(null)
  const [seccion, setSeccion] = useState<'lugares' | 'eventos' | 'gastronomia' | 'historia'>('lugares')
  const [lugares, setLugares] = useState<any[]>([])
  const [eventos, setEventos] = useState<any[]>([])
  const [gastronomia, setGastronomia] = useState<any[]>([])
  const [historia, setHistoria] = useState<any[]>([])
  const [categoriasBD] = useState<any[]>([
    { id_categoria: 1, nombre: 'Histórico' },
    { id_categoria: 2, nombre: 'Religioso' },
    { id_categoria: 3, nombre: 'Cultural' },
    { id_categoria: 4, nombre: 'Arqueológico' },
    { id_categoria: 5, nombre: 'Natural' },
    { id_categoria: 6, nombre: 'Recreativo' },
    { id_categoria: 7, nombre: 'Restaurante' },
    { id_categoria: 8, nombre: 'Mercado' }
  ])
  const [cargando, setCargando] = useState(true)
  const [mensajeForm, setMensajeForm] = useState<string | null>(null)
  const [tipoMensajeForm, setTipoMensajeForm] = useState<'exito' | 'error'>('exito')

  const [itemEditando, setItemEditando] = useState<any | null>(null)
  const [creandoNuevo, setCreandoNuevo] = useState(false)

  const [horaInicioVal, setHoraInicioVal] = useState('09:00')
  const [ampmInicioVal, setAmpmInicioVal] = useState('AM')
  const [horaFinVal, setHoraFinVal] = useState('05:00')
  const [ampmFinVal, setAmpmFinVal] = useState('PM')

  const [horaEventoInicioVal, setHoraEventoInicioVal] = useState('09:00')
  const [ampmEventoInicioVal, setAmpmEventoInicioVal] = useState('AM')
  const [horaEventoFinVal, setHoraEventoFinVal] = useState('05:00')
  const [ampmEventoFinVal, setAmpmEventoFinVal] = useState('PM')

  const [lugaresSeleccionados, setLugaresSeleccionados] = useState<number[]>([])
  const [tipoDisponibilidad, setTipoDisponibilidad] = useState<string>('Todo el año')
  const [temporadaSeleccionada, setTemporadaSeleccionada] = useState<string>('Septiembre - Octubre')
  const [urlImagenInput, setUrlImagenInput] = useState<string>('')
  const [urlImagenEventoInput, setUrlImagenEventoInput] = useState<string>('')
  const [urlImagenLugarInput, setUrlImagenLugarInput] = useState<string>('')
  const [urlImagenHistoriaInput, setUrlImagenHistoriaInput] = useState<string>('')

  const [latSelected, setLatSelected] = useState<number>(19.0657)
  const [lngSelected, setLngSelected] = useState<number>(-98.3031)
  const [direccionInput, setDireccionInput] = useState<string>('')
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  const CORREO_ADMIN = 'nypgc23@gmail.com'

  const horasOpciones = [
    '01:00', '01:30', '02:00', '02:30', '03:00', '03:30',
    '04:00', '04:30', '05:00', '05:30', '06:00', '06:30',
    '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30'
  ]

  async function recargarDatosCompletos() {
    try {
      const resLugares = await supabase
        .from('lugares_turisticos')
        .select('*')
        .order('nombre', { ascending: true })

      if (resLugares.data) {
        const lugaresConImgs = resLugares.data.map((lugar) => ({
          ...lugar,
          imagenFinal: lugar.imagen || lugar.imagen_url || ''
        }))
        setLugares(lugaresConImgs)
      }

      const resEventos = await supabase
        .from('eventos')
        .select('*')
        .order('id_evento', { ascending: false })

      if (resEventos.data) {
        const eventosConImgs = resEventos.data.map((evento) => ({
          ...evento,
          imagenFinal: evento.imagen || ''
        }))
        setEventos(eventosConImgs)
      }

      const [resPlatillos, resBebidas] = await Promise.all([
        supabase.from('platillos').select('*').order('nombre', { ascending: true }),
        supabase.from('bebidas').select('*').order('nombre', { ascending: true })
      ])

      const listaPlatillos = (resPlatillos.data || []).map((p: any) => ({
        ...p,
        imagenFinal: p.imagen || '',
        categoriaGastro: 'Platillo',
        id_real: p.id_platillo
      }))

      const listaBebidas = (resBebidas.data || []).map((b: any) => ({
        ...b,
        imagenFinal: b.imagen || '',
        categoriaGastro: 'Bebida',
        id_real: b.id_bebida
      }))

      setGastronomia([...listaPlatillos, ...listaBebidas])

      const resHistoria = await supabase
        .from('historia_cholula')
        .select('*')
        .order('orden', { ascending: true })

      if (resHistoria.data) {
        const historiaConImgs = resHistoria.data.map((h) => ({
          ...h,
          imagenFinal: h.multimedia_url || ''
        }))
        setHistoria(historiaConImgs)
      }
    } catch (e) {
      console.error('Error recargando datos', e)
    }
  }

  useEffect(() => {
    let montado = true

    async function verificarYData() {
      setCargando(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session || session.user.email !== CORREO_ADMIN) {
        if (montado) setEsAdmin(false)
        setCargando(false)
        return
      }

      if (montado) setEsAdmin(true)
      await recargarDatosCompletos()
      if (montado) setCargando(false)
    }

    verificarYData()

    return () => {
      montado = false
    }
  }, [])

  useEffect(() => {
    async function cargarRelaciones() {
      if (itemEditando && seccion === 'gastronomia') {
        const temp = itemEditando.temporada || 'Todo el año'
        if (temp.toLowerCase().includes('todo') || temp.toLowerCase().includes('año')) {
          setTipoDisponibilidad('Todo el año')
          setTemporadaSeleccionada('Septiembre - Octubre')
        } else {
          setTipoDisponibilidad('Temporada Especial')
          setTemporadaSeleccionada(temp)
        }

        setUrlImagenInput(itemEditando.imagenFinal || '')

        const tablaRel = itemEditando.categoriaGastro === 'Platillo' ? 'platillos_lugares' : 'bebidas_lugares'
        const idField = itemEditando.categoriaGastro === 'Platillo' ? 'id_platillo' : 'id_bebida'
        
        try {
          const { data } = await supabase
            .from(tablaRel)
            .select('id_lugar')
            .eq(idField, itemEditando.id_real)

          if (data) {
            setLugaresSeleccionados(data.map((r: any) => r.id_lugar))
          }
        } catch {}
      } else if (itemEditando && seccion === 'eventos') {
        setUrlImagenEventoInput(itemEditando.imagenFinal || '')

        if (itemEditando.horario) {
          const partes = itemEditando.horario.split('-')
          if (partes.length === 2) {
            const ini = partes[0].trim()
            const fin = partes[1].trim()
            const [hIni, mIniAmPm] = ini.split(' ')
            if (hIni) setHoraEventoInicioVal(hIni)
            if (mIniAmPm) setAmpmEventoInicioVal(mIniAmPm)
            const [hFin, mFinAmPm] = fin.split(' ')
            if (hFin) setHoraEventoFinVal(hFin)
            if (mFinAmPm) setAmpmEventoFinVal(mFinAmPm)
          }
        }
      } else if (itemEditando && seccion === 'lugares') {
        setUrlImagenLugarInput(itemEditando.imagenFinal || '')

        if (itemEditando.horario) {
          const partes = itemEditando.horario.split('-')
          if (partes.length === 2) {
            const ini = partes[0].trim()
            const fin = partes[1].trim()
            const [hIni, mIniAmPm] = ini.split(' ')
            if (hIni) setHoraInicioVal(hIni)
            if (mIniAmPm) setAmpmInicioVal(mIniAmPm)
            const [hFin, mFinAmPm] = fin.split(' ')
            if (hFin) setHoraFinVal(hFin)
            if (mFinAmPm) setAmpmFinVal(mFinAmPm)
          }
        }
      } else if (itemEditando && seccion === 'historia') {
        setUrlImagenHistoriaInput(itemEditando.multimedia_url || '')
      } else {
        setLugaresSeleccionados([])
        setTipoDisponibilidad('Todo el año')
        setTemporadaSeleccionada('Septiembre - Octubre')
        setUrlImagenInput('')
        setUrlImagenEventoInput('')
        setUrlImagenLugarInput('')
        setUrlImagenHistoriaInput('')
        setHoraInicioVal('09:00')
        setAmpmInicioVal('AM')
        setHoraFinVal('05:00')
        setAmpmFinVal('PM')
        setHoraEventoInicioVal('09:00')
        setAmpmEventoInicioVal('AM')
        setHoraEventoFinVal('05:00')
        setAmpmEventoFinVal('PM')
      }
    }
    cargarRelaciones()
  }, [itemEditando, seccion])

  useEffect(() => {
    if ((creandoNuevo || itemEditando) && seccion === 'lugares') {
      const initialLat = itemEditando?.latitud !== null && itemEditando?.latitud !== undefined ? Number(itemEditando.latitud) : 19.0657
      const initialLng = itemEditando?.longitud !== null && itemEditando?.longitud !== undefined ? Number(itemEditando.longitud) : -98.3031
      
      setLatSelected(initialLat)
      setLngSelected(initialLng)
      setDireccionInput(itemEditando?.direccion || '')
      setMensajeForm(null)

      const timer = setTimeout(() => {
        if (mapRef.current) {
          if (!mapInstanceRef.current && (window as any).L) {
            const L = (window as any).L
            const map = L.map(mapRef.current).setView([initialLat, initialLng], 16)

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap'
            }).addTo(map)

            const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map)
            markerRef.current = marker

            marker.on('dragend', async function (e: any) {
              const pos = e.target.getLatLng()
              setLatSelected(pos.lat)
              setLngSelected(pos.lng)
              await obtenerDireccionInversa(pos.lat, pos.lng)
            })

            map.on('click', async function (e: any) {
              const pos = e.latlng
              marker.setLatLng(pos)
              setLatSelected(pos.lat)
              setLngSelected(pos.lng)
              await obtenerDireccionInversa(pos.lat, pos.lng)
            })

            mapInstanceRef.current = map
          } else if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize()
            mapInstanceRef.current.setView([initialLat, initialLng], 16)
            if (markerRef.current) {
              markerRef.current.setLatLng([initialLat, initialLng])
            }
          }
        }
      }, 350)

      return () => {
        clearTimeout(timer)
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
          markerRef.current = null
        }
      }
    }
  }, [creandoNuevo, itemEditando, seccion])

  async function obtenerDireccionInversa(lat: number, lng: number) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      const data = await res.json()
      if (data && data.display_name) {
        setDireccionInput(data.display_name)
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleBuscarUbicacion() {
    if (!direccionInput.trim()) return

    const regexCoords = /@(-?\d+\.\d+),(-?\d+\.\d+)/
    const match = direccionInput.match(regexCoords)

    if (match && match[1] && match[2]) {
      const lat = parseFloat(match[1])
      const lng = parseFloat(match[2])
      actualizarMapaCoordenadas(lat, lng, '¡Ubicación reflejada desde el enlace!')
      await obtenerDireccionInversa(lat, lng)
      return
    }

    try {
      setMensajeForm('Buscando dirección...')
      setTipoMensajeForm('exito')
      const queryBusqueda = `${direccionInput}, Cholula, Puebla, México`
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryBusqueda)}`)
      const data = await res.json()

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)
        actualizarMapaCoordenadas(lat, lng, '¡Ubicación exacta encontrada!')
        if (data[0].display_name) {
          setDireccionInput(data[0].display_name)
        }
      } else {
        setMensajeForm('No se localizó exactamente. Haz clic en el mapa para fijar el punto.')
        setTipoMensajeForm('error')
      }
    } catch (err) {
      console.error(err)
      setMensajeForm('Error al buscar la ubicación.')
      setTipoMensajeForm('error')
    }
  }

  function actualizarMapaCoordenadas(lat: number, lng: number, mensajeExito: string) {
    setLatSelected(lat)
    setLngSelected(lng)
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng], 16)
      markerRef.current.setLatLng([lat, lng])
    }
    setMensajeForm(mensajeExito)
    setTipoMensajeForm('exito')
  }

  async function handleGuardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    const titulo = formData.get('titulo') as string
    const contenido = formData.get('contenido') as string

    if (seccion === 'lugares') {
      const nombre = titulo
      const descripcion = contenido
      const direccion = formData.get('direccion') as string
      const categoria_id = parseInt(formData.get('categoria_id') as string) || 1
      const horarioFormateado = `${horaInicioVal} ${ampmInicioVal} - ${horaFinVal} ${ampmFinVal}`
      const costo_entrada = parseFloat(formData.get('costo_entrada') as string) || 0
      const telefono = formData.get('telefono') as string

      const payloadLugar: any = {
        nombre,
        descripcion,
        direccion,
        categoria_id,
        horario: horarioFormateado,
        costo_entrada,
        telefono,
        latitud: latSelected,
        longitud: lngSelected,
        estado: true,
        imagen: urlImagenLugarInput.trim() || null,
        imagen_url: urlImagenLugarInput.trim() || null
      }

      if (itemEditando) {
        const { error } = await supabase.from('lugares_turisticos').update(payloadLugar).eq('id_lugar', itemEditando.id_lugar)
        if (error) { alert('Error al actualizar lugar: ' + error.message); return }
      } else {
        const { error } = await supabase.from('lugares_turisticos').insert(payloadLugar)
        if (error) { alert('Error al crear lugar: ' + error.message); return }
      }

    } else if (seccion === 'eventos') {
      const nombre = titulo
      const descripcion = contenido
      const fecha_inicio_input = formData.get('fecha_inicio') as string
      const fecha_fin_input = formData.get('fecha_fin') as string
      const lugar = formData.get('lugar') as string
      const horarioFormateado = `${horaEventoInicioVal} ${ampmEventoInicioVal} - ${horaEventoFinVal} ${ampmEventoFinVal}`
      const costo = parseFloat(formData.get('costo') as string) || 0
      const temporada = formData.get('temporada') as string || 'Todo el año'

      const fechaInicioIso = fecha_inicio_input ? new Date(`${fecha_inicio_input}T00:00:00`).toISOString() : null
      const fechaFinIso = fecha_fin_input ? new Date(`${fecha_fin_input}T23:59:59`).toISOString() : null

      const payloadEvento: any = {
        nombre,
        descripcion,
        fecha_inicio: fechaInicioIso,
        fecha_fin: fechaFinIso,
        lugar,
        horario: horarioFormateado,
        costo,
        temporada,
        estado: true,
        imagen: urlImagenEventoInput.trim() || null
      }

      if (itemEditando) {
        const { error } = await supabase.from('eventos').update(payloadEvento).eq('id_evento', itemEditando.id_evento)
        if (error) { alert('Error al actualizar evento: ' + error.message); return }
      } else {
        const { error } = await supabase.from('eventos').insert(payloadEvento)
        if (error) { alert('Error al crear evento: ' + error.message); return }
      }

    } else if (seccion === 'historia') {
      const epoca = formData.get('epoca') as string
      const orden = parseInt(formData.get('orden') as string) || 0
      const tipo_multimedia = formData.get('tipo_multimedia') as 'imagen' | 'video'

      const payloadHistoria: any = {
        titulo,
        contenido,
        epoca,
        orden,
        multimedia_url: urlImagenHistoriaInput.trim() || null,
        tipo_multimedia: urlImagenHistoriaInput.trim() ? tipo_multimedia : null,
        estado: true
      }

      if (itemEditando) {
        const { error } = await supabase.from('historia_cholula').update(payloadHistoria).eq('id_historia', itemEditando.id_historia)
        if (error) { alert('Error al actualizar historia: ' + error.message); return }
      } else {
        const { error } = await supabase.from('historia_cholula').insert(payloadHistoria)
        if (error) { alert('Error al crear historia: ' + error.message); return }
      }

    } else {
      const nombre = titulo
      const descripcion = contenido
      const tipoGastro = formData.get('tipoGastro') as string
      const preparacion = formData.get('preparacion') as string
      const ingredientesInput = formData.get('ingredientes') as string
      const ingredientes = ingredientesInput ? ingredientesInput.split(',').map(i => i.trim()) : []
      const temporadaFinal = tipoDisponibilidad === 'Todo el año' ? 'Todo el año' : temporadaSeleccionada

      if (tipoGastro === 'Platillo') {
        const payloadPlatillo: any = {
          nombre,
          descripcion,
          preparacion,
          ingredientes,
          temporada: temporadaFinal,
          estado: true,
          imagen: urlImagenInput.trim() || null
        }

        let idPlatilloReal = itemEditando?.categoriaGastro === 'Platillo' ? itemEditando.id_real : null

        if (itemEditando && itemEditando.categoriaGastro === 'Platillo') {
          const { error } = await supabase.from('platillos').update(payloadPlatillo).eq('id_platillo', idPlatilloReal)
          if (error) { alert('Error al actualizar platillo: ' + error.message); return }
        } else {
          if (itemEditando) {
            try { await supabase.from('bebidas').delete().eq('id_bebida', itemEditando.id_real) } catch {}
          }
          const { data, error } = await supabase.from('platillos').insert(payloadPlatillo).select().single()
          if (error || !data) { alert('Error al crear platillo: ' + (error?.message || 'Desconocido')); return }
          idPlatilloReal = data.id_platillo
        }

        if (idPlatilloReal) {
          try {
            await supabase.from('platillos_lugares').delete().eq('id_platillo', idPlatilloReal)
            if (lugaresSeleccionados.length > 0) {
              const rels = lugaresSeleccionados.map(idLugar => ({ id_platillo: idPlatilloReal, id_lugar: idLugar }))
              await supabase.from('platillos_lugares').insert(rels)
            }
          } catch {}
        }

      } else {
        const payloadBebida: any = {
          nombre,
          descripcion,
          tipo_bebida: 'Bebida tradicional',
          preparacion,
          ingredientes,
          temporada: temporadaFinal,
          estado: true,
          imagen: urlImagenInput.trim() || null
        }

        let idBebidaReal = itemEditando?.categoriaGastro === 'Bebida' ? itemEditando.id_real : null

        if (itemEditando && itemEditando.categoriaGastro === 'Bebida') {
          const { error } = await supabase.from('bebidas').update(payloadBebida).eq('id_bebida', idBebidaReal)
          if (error) { alert('Error al actualizar bebida: ' + error.message); return }
        } else {
          if (itemEditando) {
            try { await supabase.from('platillos').delete().eq('id_platillo', itemEditando.id_real) } catch {}
          }
          const { data, error } = await supabase.from('bebidas').insert(payloadBebida).select().single()
          if (error || !data) { alert('Error al crear bebida: ' + (error?.message || 'Desconocido')); return }
          idBebidaReal = data.id_bebida
        }

        if (idBebidaReal) {
          try {
            await supabase.from('bebidas_lugares').delete().eq('id_bebida', idBebidaReal)
            if (lugaresSeleccionados.length > 0) {
              const rels = lugaresSeleccionados.map(idLugar => ({ id_bebida: idBebidaReal, id_lugar: idLugar }))
              await supabase.from('bebidas_lugares').insert(rels)
            }
          } catch {}
        }
      }
    }

    alert('¡Registro guardado con éxito!')
    cerrarModalForm()
    await recargarDatosCompletos()
  }

  async function handleEliminar(item: any) {
    if (!confirm('¿Estás seguro de eliminar este elemento?')) return

    if (seccion === 'lugares') {
      const idLugar = item.id_lugar
      try {
        await supabase.from('detalle_ruta').delete().eq('id_lugar', idLugar)
        await supabase.from('favoritos').delete().eq('id_lugar', idLugar)
        await supabase.from('platillos_lugares').delete().eq('id_lugar', idLugar)
        await supabase.from('bebidas_lugares').delete().eq('id_lugar', idLugar)
      } catch {}

      const { error } = await supabase.from('lugares_turisticos').delete().eq('id_lugar', idLugar)
      if (error) { alert('No se pudo eliminar: ' + error.message); return }
    } else if (seccion === 'eventos') {
      const { error } = await supabase.from('eventos').delete().eq('id_evento', item.id_evento)
      if (error) { alert('No se pudo eliminar: ' + error.message); return }
    } else if (seccion === 'historia') {
      const { error } = await supabase.from('historia_cholula').delete().eq('id_historia', item.id_historia)
      if (error) { alert('No se pudo eliminar: ' + error.message); return }
    } else {
      const tabla = item.categoriaGastro === 'Platillo' ? 'platillos' : 'bebidas'
      const idField = item.categoriaGastro === 'Platillo' ? 'id_platillo' : 'id_bebida'
      const tablaRel = item.categoriaGastro === 'Platillo' ? 'platillos_lugares' : 'bebidas_lugares'

      try { await supabase.from(tablaRel).delete().eq(idField, item.id_real) } catch {}

      const { error } = await supabase.from(tabla).delete().eq(idField, item.id_real)
      if (error) { alert('No se pudo eliminar: ' + error.message); return }
    }
    alert('Eliminado correctamente.')
    await recargarDatosCompletos()
  }

  function abrirNuevo() {
    setItemEditando(null)
    setLugaresSeleccionados([])
    setTipoDisponibilidad('Todo el año')
    setTemporadaSeleccionada('Septiembre - Octubre')
    setUrlImagenInput('')
    setUrlImagenEventoInput('')
    setUrlImagenLugarInput('')
    setUrlImagenHistoriaInput('')
    setHoraInicioVal('09:00')
    setAmpmInicioVal('AM')
    setHoraFinVal('05:00')
    setAmpmFinVal('PM')
    setHoraEventoInicioVal('09:00')
    setAmpmEventoInicioVal('AM')
    setHoraEventoFinVal('05:00')
    setAmpmEventoFinVal('PM')
    setCreandoNuevo(true)
  }

  function cerrarModalForm() {
    setCreandoNuevo(false)
    setItemEditando(null)
    setMensajeForm(null)
    setLugaresSeleccionados([])
    setUrlImagenInput('')
    setUrlImagenEventoInput('')
    setUrlImagenLugarInput('')
    setUrlImagenHistoriaInput('')
  }

  if (cargando) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#fcf9f7' }}>
        <p style={{ fontWeight: 600, color: '#831818' }}>Cargando panel de control...</p>
      </div>
    )
  }

  if (!esAdmin) {
    return (
      <main style={{ padding: '40px', textAlign: 'center', maxWidth: '400px', margin: '60px auto' }}>
        <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '24px', boxShadow: '0 12px 30px rgba(0,0,0,0.08)', border: '1px solid #f2ece9' }}>
          <AlertTriangle size={45} color="#831818" style={{ marginBottom: '14px' }} />
          <h2 style={{ color: '#2d1515', margin: '0 0 8px 0', fontSize: '20px' }}>Acceso Restringido</h2>
          <p style={{ color: '#7a6e6b', fontSize: '14px', marginBottom: '24px' }}>Esta sección es exclusiva para el administrador autorizado.</p>
          <button onClick={volver} style={{ backgroundColor: '#831818', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '14px', cursor: 'pointer', fontWeight: 'bold', width: '100%', boxShadow: '0 4px 12px rgba(131,24,24,0.25)' }}>Regresar al Perfil</button>
        </div>
      </main>
    )
  }

  const listaActual = seccion === 'lugares' ? lugares : seccion === 'eventos' ? eventos : seccion === 'historia' ? historia : gastronomia
  const lugaresParaComer = lugares.filter(l => {
    const nombreLower = (l.nombre || '').toLowerCase()
    const descLower = (l.descripcion || '').toLowerCase()
    const catId = Number(l.categoria_id)
    return catId === 7 || catId === 8 || nombreLower.includes('mercado') || nombreLower.includes('restaurante') || nombreLower.includes('oxxo') || descLower.includes('oxxo') || descLower.includes('tienda')
  })

  return (
    <main style={{ padding: '24px 20px', maxWidth: '650px', margin: '0 auto', paddingBottom: '110px', fontFamily: 'inherit', backgroundColor: '#fcf9f7', minHeight: '100vh' }}>
      
      <header style={{ 
        background: 'linear-gradient(135deg, #6b1414 0%, #831818 100%)', 
        padding: '24px 20px', 
        color: '#fff',
        borderRadius: '24px',
        boxShadow: '0 12px 30px rgba(131, 24, 24, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: '12px', borderRadius: '16px', backdropFilter: 'blur(8px)', display: 'flex' }}>
            <ShieldCheck size={26} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, letterSpacing: '-0.3px' }}>Panel de Administración</h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#ffcccc', fontWeight: 500 }}>Gestión centralizada de Cholula</p>
          </div>
        </div>
        <button 
          onClick={volver} 
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            transition: 'background 0.2s'
          }}
        >
          <ArrowLeft size={16} /> Salir
        </button>
      </header>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px', backgroundColor: '#f0e6d8', padding: '6px', borderRadius: '16px', flex: 1, minWidth: '260px', overflowX: 'auto' }}>
          {[
            { key: 'lugares', label: `Lugares (${lugares.length})` },
            { key: 'eventos', label: `Eventos (${eventos.length})` },
            { key: 'gastronomia', label: `Gastronomía (${gastronomia.length})` },
            { key: 'historia', label: `Historia (${historia.length})` }
          ].map((tab) => {
            const activo = seccion === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => { seccion !== tab.key && setSeccion(tab.key as any); cerrarModalForm(); }}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: activo ? '#831818' : 'transparent',
                  color: activo ? '#fff' : '#5a4a42',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  boxShadow: activo ? '0 4px 12px rgba(131, 24, 24, 0.2)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={abrirNuevo}
          style={{
            backgroundColor: '#831818',
            color: '#fff',
            border: 'none',
            padding: '12px 18px',
            borderRadius: '14px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 6px 16px rgba(131, 24, 24, 0.25)',
            transition: 'transform 0.1s'
          }}
        >
          <Plus size={18} /> Nuevo
        </button>
      </div>

      {(creandoNuevo || itemEditando) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <form onSubmit={handleGuardar} style={{
            backgroundColor: '#fff',
            padding: '28px',
            borderRadius: '24px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            width: '100%',
            maxWidth: '540px',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #f0e6d8'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f2ece9', paddingBottom: '12px' }}>
              <h4 style={{ margin: 0, color: '#2d1515', fontSize: '18px', fontWeight: 800 }}>
                {itemEditando ? `Editar ${seccion}` : `Registrar Nuevo en ${seccion}`}
              </h4>
              <button 
                type="button" 
                onClick={cerrarModalForm} 
                style={{ background: '#f5efec', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} color="#2d1515" />
              </button>
            </div>

            {mensajeForm && (
              <div style={{ 
                backgroundColor: tipoMensajeForm === 'exito' ? '#e6f4ea' : '#fce8e6', 
                color: tipoMensajeForm === 'exito' ? '#137333' : '#c5221f', 
                padding: '12px 14px', 
                borderRadius: '12px', 
                fontSize: '13px', 
                fontWeight: 600, 
                border: `1px solid ${tipoMensajeForm === 'exito' ? '#ceead6' : '#fad2cf'}`
              }}>
                {mensajeForm}
              </div>
            )}

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#5a4a42', display: 'block', marginBottom: '6px' }}>{seccion === 'historia' ? 'Título del relato' : 'Nombre'}</label>
              <input name="titulo" defaultValue={itemEditando?.nombre || itemEditando?.titulo || ''} required placeholder="Nombre principal" style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #d1c7c2', fontSize: '14px', outline: 'none' }} />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#5a4a42', display: 'block', marginBottom: '6px' }}>{seccion === 'historia' ? 'Contenido detallado' : 'Descripción detallada'}</label>
              <textarea name="contenido" defaultValue={itemEditando?.descripcion || itemEditando?.contenido || ''} rows={3} required placeholder="Breve reseña o información" style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #d1c7c2', fontSize: '14px', outline: 'none', resize: 'vertical' }} />
            </div>

            {seccion === 'lugares' ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#5a4a42', display: 'block', marginBottom: '6px' }}>Categoría</label>
                    <select name="categoria_id" defaultValue={itemEditando?.categoria_id || 1} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #d1c7c2', fontSize: '14px', outline: 'none', backgroundColor: '#fff' }}>
                      {categoriasBD.map((categoria) => (
                        <option key={categoria.id_categoria} value={categoria.id_categoria}>{categoria.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#5a4a42', display: 'block', marginBottom: '6px' }}>Teléfono</label>
                    <input name="telefono" defaultValue={itemEditando?.telefono || ''} placeholder="Número de contacto" style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #d1c7c2', fontSize: '14px', outline: 'none' }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#5a4a42', display: 'block', marginBottom: '6px' }}>Dirección o Ubicación en Mapa</label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input name="direccion" value={direccionInput} onChange={(e) => setDireccionInput(e.target.value)} placeholder="Ej. Calle 14 Poniente, Cholula..." style={{ flex: 1, minWidth: 0, padding: '12px 14px', borderRadius: '12px', border: '1px solid #d1c7c2', fontSize: '14px', outline: 'none' }} />
                    <button type="button" onClick={handleBuscarUbicacion} style={{ backgroundColor: '#831818', color: '#fff', border: 'none', padding: '0 14px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                      <Search size={16} /> Buscar
                    </button>
                  </div>
                  <p style={{ fontSize: '11px', color: '#7a6e6b', margin: 0 }}>💡 <i>Haz clic en el mapa o arrastra el marcador para fijar la ubicación exacta del lugar.</i></p>
                </div>

                <div style={{ height: '220px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #d1c7c2', backgroundColor: '#f5f1ee' }}>
                  <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#5a4a42', display: 'block', marginBottom: '6px' }}>Horario de apertura</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px' }}>
                      <select value={horaInicioVal} onChange={(e) => setHoraInicioVal(e.target.value)} style={{ width: '100%', padding: '11px 8px', borderRadius: '10px', border: '1px solid #d1c7c2', background: '#fff' }}>
                        {horasOpciones.map((hora) => <option key={hora} value={hora}>{hora}</option>)}
                      </select>
                      <select value={ampmInicioVal} onChange={(e) => setAmpmInicioVal(e.target.value)} style={{ padding: '11px 8px', borderRadius: '10px', border: '1px solid #d1c7c2', background: '#fff' }}>
                        <option>AM</option><option>PM</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#5a4a42', display: 'block', marginBottom: '6px' }}>Horario de cierre</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px' }}>
                      <select value={horaFinVal} onChange={(e) => setHoraFinVal(e.target.value)} style={{ width: '100%', padding: '11px 8px', borderRadius: '10px', border: '1px solid #d1c7c2', background: '#fff' }}>
                        {horasOpciones.map((hora) => <option key={hora} value={hora}>{hora}</option>)}
                      </select>
                      <select value={ampmFinVal} onChange={(e) => setAmpmFinVal(e.target.value)} style={{ padding: '11px 8px', borderRadius: '10px', border: '1px solid #d1c7c2', background: '#fff' }}>
                        <option>AM</option><option>PM</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#5a4a42', display: 'block', marginBottom: '6px' }}>Costo de entrada ($)</label>
                  <input name="costo_entrada" type="number" step="any" min="0" defaultValue={itemEditando?.costo_entrada ?? 0} placeholder="0.00" style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #d1c7c2', fontSize: '14px', outline: 'none' }} />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#2d1515', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <ImageIcon size={16} color="#831818" /> Imagen del Lugar (.jpg o .png)
                  </label>
                  {urlImagenLugarInput ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#faf5f4', padding: '10px', borderRadius: '12px', border: '1px solid #f0e2e2', marginBottom: '8px' }}>
                      <img src={urlImagenLugarInput} alt="Vista previa" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }} />
                      <p style={{ margin: 0, flex: 1, fontSize: '12px', fontWeight: 600, color: '#2d1515' }}>Foto cargada correctamente</p>
                      <button type="button" onClick={() => setUrlImagenLugarInput('')} style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Quitar foto</button>
                    </div>
                  ) : null}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input value={urlImagenLugarInput} onChange={(e) => setUrlImagenLugarInput(e.target.value)} placeholder="Pega aquí la URL..." style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #d1c7c2', fontSize: '14px', outline: 'none', backgroundColor: '#faf9f8' }} />
                    <input type="file" accept="image/jpeg, image/png, image/jpg" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (event) => { const base64 = event.target?.result as string; if (base64) setUrlImagenLugarInput(base64) }; reader.readAsDataURL(file) }} style={{ fontSize: '12px', color: '#7a6e6b' }} />
                  </div>
                </div>
              </>
            ) : seccion === 'eventos' ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#5a4a42', display: 'block', marginBottom: '6px' }}>Fecha Inicio</label>
                    <input name="fecha_inicio" type="date" defaultValue={itemEditando?.fecha_inicio ? itemEditando.fecha_inicio.slice(0, 10) : ''} style={{ width: '100%', padding: '12px 12px', borderRadius: '12px', border: '1px solid #d1c7c2', fontSize: '13px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#5a4a42', display: 'block', marginBottom: '6px' }}>Fecha Fin</label>
                    <input name="fecha_fin" type="date" defaultValue={itemEditando?.fecha_fin ? itemEditando.fecha_fin.slice(0, 10) : ''} style={{ width: '100%', padding: '12px 12px', borderRadius: '12px', border: '1px solid #d1c7c2', fontSize: '13px', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#5a4a42', display: 'block', marginBottom: '6px' }}>Hora de Inicio</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px' }}>
                      <select value={horaEventoInicioVal} onChange={(e) => setHoraEventoInicioVal(e.target.value)} style={{ width: '100%', padding: '11px 8px', borderRadius: '10px', border: '1px solid #d1c7c2', background: '#fff' }}>
                        {horasOpciones.map((hora) => <option key={hora} value={hora}>{hora}</option>)}
                      </select>
                      <select value={ampmEventoInicioVal} onChange={(e) => setAmpmEventoInicioVal(e.target.value)} style={{ padding: '11px 8px', borderRadius: '10px', border: '1px solid #d1c7c2', background: '#fff' }}>
                        <option>AM</option><option>PM</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#5a4a42', display: 'block', marginBottom: '6px' }}>Hora de Fin</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px' }}>
                      <select value={horaEventoFinVal} onChange={(e) => setHoraEventoFinVal(e.target.value)} style={{ width: '100%', padding: '11px 8px', borderRadius: '10px', border: '1px solid #d1c7c2', background: '#fff' }}>
                        {horasOpciones.map((hora) => <option key={hora} value={hora}>{hora}</option>)}
                      </select>
                      <select value={ampmEventoFinVal} onChange={(e) => setAmpmEventoFinVal(e.target.value)} style={{ padding: '11px 8px', borderRadius: '10px', border: '1px solid #d1c7c2', background: '#fff' }}>
                        <option>AM</option><option>PM</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#5a4a42', display: 'block', marginBottom: '6px' }}>Lugar / Recinto</label>
                    <input name="lugar" defaultValue={itemEditando?.lugar || ''} placeholder="Ubicación del evento" style={{ width: '100%', padding: '12px 12px', borderRadius: '12px', border: '1px solid #d1c7c2', fontSize: '14px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#5a4a42', display: 'block', marginBottom: '6px' }}>Costo ($)</label>
                    <input name="costo" type="number" step="any" defaultValue={itemEditando?.costo || 0} placeholder="0.00" style={{ width: '100%', padding: '12px 12px', borderRadius: '12px', border: '1px solid #d1c7c2', fontSize: '14px', outline: 'none' }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#2d1515', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <ImageIcon size={16} color="#831818" /> Imagen del Evento (.jpg o .png)
                  </label>

                  {urlImagenEventoInput ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#faf5f4', padding: '10px', borderRadius: '12px', border: '1px solid #f0e2e2', marginBottom: '8px' }}>
                      <img src={urlImagenEventoInput} alt="Vista previa" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #d1c7c2' }} />
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#2d1515', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Foto cargada correctamente</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setUrlImagenEventoInput('')}
                        style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Quitar foto
                      </button>
                    </div>
                  ) : null}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input 
                      value={urlImagenEventoInput}
                      onChange={(e) => setUrlImagenEventoInput(e.target.value)}
                      placeholder="Pega aquí la URL..." 
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #d1c7c2', fontSize: '14px', outline: 'none', backgroundColor: '#faf9f8' }} 
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#7a6e6b', fontWeight: 600 }}>O sube imagen:</span>
                      <input 
                        type="file" 
                        accept="image/jpeg, image/png, image/jpg"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (uploadEvent) => {
                              const base64String = uploadEvent.target?.result as string
                              if (base64String) setUrlImagenEventoInput(base64String)
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                        style={{ fontSize: '12px', color: '#7a6e6b' }}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : seccion === 'historia' ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#5a4a42', display: 'block', marginBottom: '6px' }}>Época o Periodo</label>
                    <input name="epoca" defaultValue={itemEditando?.epoca || ''} placeholder="Ej. Prehispánica" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #d1c7c2' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#5a4a42', display: 'block', marginBottom: '6px' }}>Orden</label>
                    <input name="orden" type="number" defaultValue={itemEditando?.orden ?? 0} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #d1c7c2' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#5a4a42', display: 'block', marginBottom: '6px' }}>Tipo Multimedia</label>
                    <select name="tipo_multimedia" defaultValue={itemEditando?.tipo_multimedia || 'imagen'} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #d1c7c2', background: '#fff' }}>
                      <option value="imagen">Imagen (Archivo o URL)</option>
                      <option value="video">Video (YouTube)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#5a4a42', display: 'block', marginBottom: '6px' }}>URL del Video (si aplica)</label>
                    <input value={urlImagenHistoriaInput} onChange={(e) => setUrlImagenHistoriaInput(e.target.value)} placeholder="https://youtube.com/..." style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #d1c7c2' }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#2d1515', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <ImageIcon size={16} color="#831818" /> O Sube Imagen desde tu Dispositivo
                  </label>
                  {urlImagenHistoriaInput && !urlImagenHistoriaInput.includes('youtube') && !urlImagenHistoriaInput.includes('youtu.be') ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#faf5f4', padding: '10px', borderRadius: '12px', border: '1px solid #f0e2e2', marginBottom: '8px' }}>
                      <img src={urlImagenHistoriaInput} alt="Vista previa" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }} />
                      <p style={{ margin: 0, flex: 1, fontSize: '12px', fontWeight: 600, color: '#2d1515' }}>Imagen cargada</p>
                      <button type="button" onClick={() => setUrlImagenHistoriaInput('')} style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Quitar</button>
                    </div>
                  ) : null}
                  <input 
                    type="file" 
                    accept="image/jpeg, image/png, image/jpg"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (uploadEvent) => {
                          const base64 = uploadEvent.target?.result as string
                          if (base64) setUrlImagenHistoriaInput(base64)
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                    style={{ fontSize: '12px', color: '#7a6e6b' }}
                  />
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#5a4a42', display: 'block', marginBottom: '6px' }}>Categoría de Gastronomía</label>
                    <select name="tipoGastro" defaultValue={itemEditando?.categoriaGastro || 'Platillo'} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #d1c7c2', fontSize: '14px', outline: 'none', backgroundColor: '#fff', cursor: 'pointer' }}>
                      <option value="Platillo">Platillo</option>
                      <option value="Bebida">Bebida</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#5a4a42', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                      <Calendar size={14} color="#831818" /> Disponibilidad
                    </label>
                    <select 
                      value={tipoDisponibilidad} 
                      onChange={(e) => setTipoDisponibilidad(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #d1c7c2', fontSize: '14px', outline: 'none', backgroundColor: '#fff', cursor: 'pointer' }}
                    >
                      <option value="Todo el año">Todo el año</option>
                      <option value="Temporada Especial">Temporada Especial</option>
                    </select>
                  </div>
                </div>

                {tipoDisponibilidad === 'Temporada Especial' && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#831818', display: 'block', marginBottom: '6px' }}>Selecciona el periodo o temporada:</label>
                    <select 
                      value={temporadaSeleccionada}
                      onChange={(e) => setTemporadaSeleccionada(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #f0d5d5', fontSize: '14px', outline: 'none', backgroundColor: '#fdf5f5', cursor: 'pointer' }}
                    >
                      <option value="Enero - Febrero">Enero - Febrero</option>
                      <option value="Marzo - Abril">Marzo - Abril</option>
                      <option value="Mayo - Junio">Mayo - Junio</option>
                      <option value="Julio - Agosto">Julio - Agosto</option>
                      <option value="Septiembre - Octubre">Septiembre - Octubre</option>
                      <option value="Noviembre - Diciembre">Noviembre - Diciembre</option>
                    </select>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#2d1515', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <ImageIcon size={16} color="#831818" /> Imagen del Platillo / Bebida (.jpg o .png)
                  </label>

                  {urlImagenInput ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#faf5f4', padding: '10px', borderRadius: '12px', border: '1px solid #f0e2e2', marginBottom: '8px' }}>
                      <img src={urlImagenInput} alt="Vista previa" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #d1c7c2' }} />
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#2d1515', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Foto cargada correctamente</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setUrlImagenInput('')}
                        style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Quitar foto
                      </button>
                    </div>
                  ) : null}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input 
                      value={urlImagenInput}
                      onChange={(e) => setUrlImagenInput(e.target.value)}
                      placeholder="Pega aquí la URL..." 
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #d1c7c2', fontSize: '14px', outline: 'none', backgroundColor: '#faf9f8' }} 
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#7a6e6b', fontWeight: 600 }}>O sube imagen desde tu dispositivo:</span>
                      <input 
                        type="file" 
                        accept="image/jpeg, image/png, image/jpg"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            if (!file.type.includes('jpeg') && !file.type.includes('png') && !file.type.includes('jpg')) {
                              alert('Por favor selecciona únicamente un archivo formato JPG o PNG.')
                              e.target.value = ''
                              return
                            }
                            const reader = new FileReader()
                            reader.onload = (uploadEvent) => {
                              const base64String = uploadEvent.target?.result as string
                              if (base64String) {
                                setUrlImagenInput(base64String)
                              }
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                        style={{ fontSize: '12px', color: '#7a6e6b' }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#5a4a42', display: 'block', marginBottom: '6px' }}>Preparación</label>
                  <textarea name="preparacion" defaultValue={itemEditando?.preparacion || ''} rows={2} placeholder="Pasos de preparación" style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #d1c7c2', fontSize: '14px', outline: 'none', resize: 'vertical' }} />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#5a4a42', display: 'block', marginBottom: '6px' }}>Ingredientes (separados por coma)</label>
                  <input name="ingredientes" defaultValue={Array.isArray(itemEditando?.ingredientes) ? itemEditando.ingredientes.join(', ') : (itemEditando?.ingredientes || '')} placeholder="Ingrediente 1, Ingrediente 2..." style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #d1c7c2', fontSize: '14px', outline: 'none' }} />
                </div>

                <div style={{ backgroundColor: '#faf5f4', padding: '16px', borderRadius: '16px', border: '1px solid #f0e2e2' }}>
                  <label style={{ fontSize: '13px', fontWeight: 800, color: '#2d1515', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                    <MapPin size={16} color="#831818" /> ¿Dónde encontrarlo? (Comercios, mercados y restaurantes)
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', paddingRight: '4px' }}>
                    {lugaresParaComer.map((lugar) => {
                      const seleccionado = lugaresSeleccionados.includes(lugar.id_lugar)
                      return (
                        <label key={lugar.id_lugar} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#2d1515', cursor: 'pointer', backgroundColor: '#fff', padding: '10px 14px', borderRadius: '12px', border: '1px solid #f2ece9' }}>
                          <input 
                            type="checkbox" 
                            checked={seleccionado}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setLugaresSeleccionados(prev => [...prev, lugar.id_lugar])
                              } else {
                                setLugaresSeleccionados(prev => prev.filter(id => id !== lugar.id_lugar))
                              }
                            }}
                            style={{ accentColor: '#831818', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ fontWeight: 600 }}>{lugar.nombre}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button type="submit" style={{ backgroundColor: '#831818', color: '#fff', border: 'none', padding: '14px 18px', borderRadius: '14px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flex: 1, boxShadow: '0 6px 16px rgba(131,24,24,0.25)' }}>
                <Check size={18} /> Guardar registro
              </button>
              <button type="button" onClick={cerrarModalForm} style={{ backgroundColor: '#f2ece9', color: '#5a4a42', border: 'none', padding: '14px 18px', borderRadius: '14px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', flex: 1 }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {listaActual.length === 0 ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '40px', textAlign: 'center', color: '#7a6e6b', border: '1px solid #f2ece9' }}>
            No hay elementos registrados en esta sección.
          </div>
        ) : (
          listaActual.map((item, idx) => {
            const idKey = seccion === 'lugares' ? item.id_lugar : seccion === 'eventos' ? item.id_evento : seccion === 'historia' ? item.id_historia : `${item.categoriaGastro}-${item.id_real || idx}`
            const detalleExtra = seccion === 'lugares' ? item.direccion : seccion === 'eventos' ? item.lugar : seccion === 'historia' ? (item.epoca || 'Historia') : `${item.categoriaGastro} · ${item.temporada || 'Todo el año'}`
            const fotoMostrada = item.imagenFinal
            const nombreMostrado = item.nombre || item.titulo

            return (
              <div 
                key={idKey} 
                style={{ 
                  backgroundColor: '#fff', 
                  padding: '16px 20px', 
                  borderRadius: '20px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  border: '1px solid #f2ece9', 
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flex: 1 }}>
                  {fotoMostrada ? (
                    <img 
                      src={fotoMostrada} 
                      alt={nombreMostrado} 
                      style={{ width: '48px', height: '48px', borderRadius: '14px', objectFit: 'cover', border: '1px solid #f0e2e2', flexShrink: 0 }} 
                    />
                  ) : (
                    <div style={{ backgroundColor: '#fdf5f5', padding: '12px', borderRadius: '14px', flexShrink: 0, color: '#831818', display: 'flex' }}>
                      <Utensils size={22} />
                    </div>
                  )}

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#2d1515', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombreMostrado}</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#7a6e6b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{detalleExtra || 'Sin detalles'}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
                  <button 
                    onClick={() => { setItemEditando(item); setCreandoNuevo(false); }} 
                    title="Editar"
                    style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', width: '38px', height: '38px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                  >
                    <Edit3 size={18} color="#831818" />
                  </button>
                  <button 
                    onClick={() => handleEliminar(item)} 
                    title="Eliminar"
                    style={{ backgroundColor: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '12px', width: '38px', height: '38px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                  >
                    <Trash2 size={18} color="#dc2626" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

    </main>
  )
}