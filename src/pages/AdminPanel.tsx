import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { 
  ShieldCheck, ArrowLeft, Trash2, Edit3, Plus, AlertTriangle, Check, X, MapPin, Search, Utensils, Image as ImageIcon 
} from 'lucide-react'

type AdminPanelProps = {
  volver: () => void
}

export default function AdminPanel({ volver }: AdminPanelProps) {
  const [esAdmin, setEsAdmin] = useState<boolean | null>(null)
  const [seccion, setSeccion] = useState<'lugares' | 'eventos' | 'gastronomia'>('lugares')
  const [lugares, setLugares] = useState<any[]>([])
  const [eventos, setEventos] = useState<any[]>([])
  const [gastronomia, setGastronomia] = useState<any[]>([])
  const [categoriasBD, setCategoriasBD] = useState<any[]>([
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

  // Estados para el mapa interactivo y campos del formulario de lugares
  const [latSelected, setLatSelected] = useState<number>(19.0586)
  const [lngSelected, setLngSelected] = useState<number>(-98.3038)
  const [direccionInput, setDireccionInput] = useState<string>('')
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  const CORREO_ADMIN = 'nypgc23@gmail.com'

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

      const [resLugares, resEventos, resPlatillos, resBebidas, resCategorias] = await Promise.all([
        supabase.from('lugares_turisticos').select('*').order('nombre', { ascending: true }),
        supabase.from('eventos').select('*').order('id_evento', { ascending: false }),
        supabase.from('platillos').select('*, imagenes_platillo(*)').order('nombre', { ascending: true }),
        supabase.from('bebidas').select('*, imagenes_bebida(*)').order('nombre', { ascending: true }),
        supabase.from('categorias').select('*').order('id_categoria', { ascending: true })
      ])

      if (montado) {
        if (resLugares.data) setLugares(resLugares.data)
        if (resEventos.data) setEventos(resEventos.data)
        
        const listaPlatillos = (resPlatillos.data || []).map((p: any) => ({ ...p, categoriaGastro: 'Platillo', id_real: p.id_platillo }))
        const listaBebidas = (resBebidas.data || []).map((b: any) => ({ ...b, categoriaGastro: 'Bebida', id_real: b.id_bebida }))
        setGastronomia([...listaPlatillos, ...listaBebidas])

        if (resCategorias.data && resCategorias.data.length > 0) {
          setCategoriasBD(resCategorias.data)
        }
      }
      setCargando(false)
    }

    verificarYData()

    return () => {
      montado = false
    }
  }, [])

  // Inicializar mapa interactivo cuando se abre el modal de lugares
  useEffect(() => {
    if ((creandoNuevo || itemEditando) && seccion === 'lugares') {
      const initialLat = itemEditando?.latitud || 19.0586
      const initialLng = itemEditando?.longitud || -98.3038
      setLatSelected(initialLat)
      setLngSelected(initialLng)
      setDireccionInput(itemEditando?.direccion || '')
      setMensajeForm(null)

      const timer = setTimeout(() => {
        if (mapRef.current && !mapInstanceRef.current && (window as any).L) {
          const L = (window as any).L
          const map = L.map(mapRef.current).setView([initialLat, initialLng], 15)

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
          }).addTo(map)

          const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map)
          markerRef.current = marker

          marker.on('dragend', function (e: any) {
            const pos = e.target.getLatLng()
            setLatSelected(pos.lat)
            setLngSelected(pos.lng)
          })

          map.on('click', function (e: any) {
            const pos = e.latlng
            marker.setLatLng(pos)
            setLatSelected(pos.lat)
            setLngSelected(pos.lng)
          })

          mapInstanceRef.current = map
        } else if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize()
          mapInstanceRef.current.setView([initialLat, initialLng], 15)
          if (markerRef.current) {
            markerRef.current.setLatLng([initialLat, initialLng])
          }
        }
      }, 300)

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

  async function handleBuscarUbicacion() {
    if (!direccionInput.trim()) return

    const regexCoords = /@(-?\d+\.\d+),(-?\d+\.\d+)/
    const match = direccionInput.match(regexCoords)

    if (match && match[1] && match[2]) {
      const lat = parseFloat(match[1])
      const lng = parseFloat(match[2])
      actualizarMapaCoordenadas(lat, lng, '¡Ubicación reflejada desde el enlace!')
      return
    }

    if (direccionInput.includes('goo.gl') || direccionInput.includes('share.google')) {
      setMensajeForm('Enlace detectado. Ubicando en Cholula (ajusta el pin si lo requieres)...')
      setTipoMensajeForm('exito')
      actualizarMapaCoordenadas(19.0586, -98.3038, 'Enlace registrado. Ajusta el pin en el mapa.')
      return
    }

    try {
      setMensajeForm('Buscando dirección o código postal...')
      setTipoMensajeForm('exito')
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccionInput + ', Cholula, Puebla, México')}`)
      const data = await res.json()

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)
        actualizarMapaCoordenadas(lat, lng, '¡Ubicación actualizada en el mapa!')
      } else {
        setMensajeForm('No se localizó exactamente. Puedes ajustar el marcador manualmente en el mapa.')
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

    const nombre = formData.get('nombre') as string
    const descripcion = formData.get('descripcion') as string

    if (seccion === 'lugares') {
      const direccion = formData.get('direccion') as string
      const categoria_id = parseInt(formData.get('categoria_id') as string) || 1
      const horario = formData.get('horario') as string
      const costo_entrada = parseFloat(formData.get('costo_entrada') as string) || 0
      const telefono = formData.get('telefono') as string

      const payloadLugar: any = {
        nombre,
        descripcion,
        direccion,
        categoria_id,
        horario,
        costo_entrada,
        telefono,
        latitud: latSelected,
        longitud: lngSelected,
        estado: true
      }

      if (itemEditando) {
        const { error } = await supabase.from('lugares_turisticos').update(payloadLugar).eq('id_lugar', itemEditando.id_lugar)
        if (error) { setMensajeForm('Error al actualizar: ' + error.message); setTipoMensajeForm('error'); return }
        setLugares(prev => prev.map(l => l.id_lugar === itemEditando.id_lugar ? { ...l, ...payloadLugar } : l))
      } else {
        const { data, error } = await supabase.from('lugares_turisticos').insert(payloadLugar).select().single()
        if (error || !data) { setMensajeForm('Error al crear lugar: ' + (error?.message || 'Desconocido')); setTipoMensajeForm('error'); return }
        setLugares(prev => [data, ...prev])
      }
    } else if (seccion === 'eventos') {
      const fecha_inicio = formData.get('fecha_inicio') as string
      const fecha_fin = formData.get('fecha_fin') as string
      const lugar = formData.get('lugar') as string
      const horario = formData.get('horario') as string
      const costo = parseFloat(formData.get('costo') as string) || 0
      const temporada = formData.get('temporada') as string || 'Todo el año'

      const payloadEvento: any = {
        nombre,
        descripcion,
        fecha_inicio: fecha_inicio ? new Date(fecha_inicio).toISOString() : null,
        fecha_fin: fecha_fin ? new Date(fecha_fin).toISOString() : null,
        lugar,
        horario,
        costo,
        temporada,
        estado: true
      }

      if (itemEditando) {
        const { error } = await supabase.from('eventos').update(payloadEvento).eq('id_evento', itemEditando.id_evento)
        if (error) { setMensajeForm('Error al actualizar evento: ' + error.message); setTipoMensajeForm('error'); return }
        setEventos(prev => prev.map(ev => ev.id_evento === itemEditando.id_evento ? { ...ev, ...payloadEvento } : ev))
      } else {
        const { data, error } = await supabase.from('eventos').insert(payloadEvento).select().single()
        if (error || !data) { setMensajeForm('Error al crear evento: ' + (error?.message || 'Desconocido')); setTipoMensajeForm('error'); return }
        setEventos(prev => [data, ...prev])
      }
    } else {
      // Gastronomía (Platillo o Bebida)
      const tipoGastro = formData.get('tipoGastro') as string
      const preparacion = formData.get('preparacion') as string
      const ingredientesInput = formData.get('ingredientes') as string
      const ingredientes = ingredientesInput ? ingredientesInput.split(',').map(i => i.trim()) : []
      const urlImagen = formData.get('url_imagen') as string

      if (tipoGastro === 'Platillo') {
        const payloadPlatillo: any = {
          nombre,
          descripcion,
          preparacion,
          ingredientes,
          estado: true
        }

        if (itemEditando && itemEditando.categoriaGastro === 'Platillo') {
          const { error } = await supabase.from('platillos').update(payloadPlatillo).eq('id_platillo', itemEditando.id_real)
          if (error) { setMensajeForm('Error al actualizar: ' + error.message); setTipoMensajeForm('error'); return }
          
          if (urlImagen.trim()) {
            await supabase.from('imagenes_platillo').delete().eq('id_platillo', itemEditando.id_real)
            await supabase.from('imagenes_platillo').insert({
              id_platillo: itemEditando.id_real,
              url: urlImagen.trim(),
              es_principal: true,
              orden: 1
            })
          }

          setGastronomia(prev => prev.map(g => g.id_real === itemEditando.id_real && g.categoriaGastro === 'Platillo' ? { ...g, ...payloadPlatillo } : g))
        } else {
          if (itemEditando) {
            await supabase.from('bebidas').delete().eq('id_bebida', itemEditando.id_real)
          }
          const { data, error } = await supabase.from('platillos').insert(payloadPlatillo).select().single()
          if (error || !data) { setMensajeForm('Error al crear platillo: ' + (error?.message || 'Desconocido')); setTipoMensajeForm('error'); return }
          
          if (urlImagen.trim()) {
            await supabase.from('imagenes_platillo').insert({
              id_platillo: data.id_platillo,
              url: urlImagen.trim(),
              es_principal: true,
              orden: 1
            })
          }

          setGastronomia(prev => [
            { ...data, categoriaGastro: 'Platillo', id_real: data.id_platillo }, 
            ...prev.filter(g => !(itemEditando && g.id_real === itemEditando.id_real && g.categoriaGastro === itemEditando.categoriaGastro))
          ])
        }
      } else {
        const payloadBebida: any = {
          nombre,
          descripcion,
          tipo_bebida: 'Bebida tradicional',
          preparacion,
          ingredientes,
          estado: true
        }

        if (itemEditando && itemEditando.categoriaGastro === 'Bebida') {
          const { error } = await supabase.from('bebidas').update(payloadBebida).eq('id_bebida', itemEditando.id_real)
          if (error) { setMensajeForm('Error al actualizar: ' + error.message); setTipoMensajeForm('error'); return }

          if (urlImagen.trim()) {
            await supabase.from('imagenes_bebida').delete().eq('id_bebida', itemEditando.id_real)
            await supabase.from('imagenes_bebida').insert({
              id_bebida: itemEditando.id_real,
              url: urlImagen.trim(),
              es_principal: true,
              orden: 1
            })
          }

          setGastronomia(prev => prev.map(g => g.id_real === itemEditando.id_real && g.categoriaGastro === 'Bebida' ? { ...g, ...payloadBebida } : g))
        } else {
          if (itemEditando) {
            await supabase.from('platillos').delete().eq('id_platillo', itemEditando.id_real)
          }
          const { data, error } = await supabase.from('bebidas').insert(payloadBebida).select().single()
          if (error || !data) { setMensajeForm('Error al crear bebida: ' + (error?.message || 'Desconocido')); setTipoMensajeForm('error'); return }

          if (urlImagen.trim()) {
            await supabase.from('imagenes_bebida').insert({
              id_bebida: data.id_bebida,
              url: urlImagen.trim(),
              es_principal: true,
              orden: 1
            })
          }

          setGastronomia(prev => [
            { ...data, categoriaGastro: 'Bebida', id_real: data.id_bebida }, 
            ...prev.filter(g => !(itemEditando && g.id_real === itemEditando.id_real && g.categoriaGastro === itemEditando.categoriaGastro))
          ])
        }
      }
    }

    alert('¡Registro guardado con éxito!')
    cerrarModalForm()
  }

  async function handleEliminar(item: any) {
    if (!confirm('¿Estás seguro de eliminar este elemento?')) return

    if (seccion === 'lugares') {
      const { error } = await supabase.from('lugares_turisticos').delete().eq('id_lugar', item.id_lugar)
      if (error) { alert('No se pudo eliminar: ' + error.message); return }
      setLugares(prev => prev.filter(l => l.id_lugar !== item.id_lugar))
    } else if (seccion === 'eventos') {
      const { error } = await supabase.from('eventos').delete().eq('id_evento', item.id_evento)
      if (error) { alert('No se pudo eliminar: ' + error.message); return }
      setEventos(prev => prev.filter(e => e.id_evento !== item.id_evento))
    } else {
      const tabla = item.categoriaGastro === 'Platillo' ? 'platillos' : 'bebidas'
      const idField = item.categoriaGastro === 'Platillo' ? 'id_platillo' : 'id_bebida'
      const { error } = await supabase.from(tabla).delete().eq(idField, item.id_real)
      if (error) { alert('No se pudo eliminar: ' + error.message); return }
      setGastronomia(prev => prev.filter(g => !(g.id_real === item.id_real && g.categoriaGastro === item.categoriaGastro)))
    }
    alert('Eliminado correctamente.')
  }

  function abrirNuevo() {
    setItemEditando(null)
    setCreandoNuevo(true)
  }

  function cerrarModalForm() {
    setCreandoNuevo(false)
    setItemEditando(null)
    setMensajeForm(null)
  }

  if (cargando) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#fdfbfa' }}>
        <p style={{ fontWeight: 600, color: '#400d0f' }}>Cargando panel de control...</p>
      </div>
    )
  }

  if (!esAdmin) {
    return (
      <main style={{ padding: '40px', textAlign: 'center', maxWidth: '400px', margin: '60px auto' }}>
        <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #f2ece9' }}>
          <AlertTriangle size={45} color="#B3282D" style={{ marginBottom: '14px' }} />
          <h2 style={{ color: '#400d0f', margin: '0 0 8px 0', fontSize: '20px' }}>Acceso Restringido</h2>
          <p style={{ color: '#6e6462', fontSize: '14px', marginBottom: '24px' }}>Esta sección es exclusiva para el administrador autorizado.</p>
          <button onClick={volver} style={{ backgroundColor: '#B3282D', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>Regresar al Perfil</button>
        </div>
      </main>
    )
  }

  const listaActual = seccion === 'lugares' ? lugares : seccion === 'eventos' ? eventos : gastronomia

  return (
    <main style={{ padding: '24px', maxWidth: '700px', margin: '0 auto', paddingBottom: '90px', fontFamily: 'inherit', backgroundColor: '#fdfbfa', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', backgroundColor: '#fff', padding: '16px 20px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f2ece9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: '#fdf5f5', padding: '10px', borderRadius: '12px' }}>
            <ShieldCheck size={28} color="#B3282D" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', color: '#400d0f', fontWeight: 700 }}>Panel de Administración</h1>
            <p style={{ margin: 0, fontSize: '12px', color: '#6e6462' }}>Gestión centralizada de Cholula</p>
          </div>
        </div>
        <button onClick={volver} style={{ background: '#fdf5f5', border: '1px solid #f9e2e2', color: '#B3282D', padding: '8px 14px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
          <ArrowLeft size={16} /> Salir
        </button>
      </header>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f2ece9', padding: '4px', borderRadius: '12px' }}>
          <button
            onClick={() => { setSeccion('lugares'); cerrarModalForm(); }}
            style={{ padding: '8px 14px', borderRadius: '10px', border: 'none', backgroundColor: seccion === 'lugares' ? '#fff' : 'transparent', color: seccion === 'lugares' ? '#400d0f' : '#6e6462', fontWeight: 700, fontSize: '12px', cursor: 'pointer', boxShadow: seccion === 'lugares' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none' }}
          >
            Lugares ({lugares.length})
          </button>
          <button
            onClick={() => { setSeccion('eventos'); cerrarModalForm(); }}
            style={{ padding: '8px 14px', borderRadius: '10px', border: 'none', backgroundColor: seccion === 'eventos' ? '#fff' : 'transparent', color: seccion === 'eventos' ? '#400d0f' : '#6e6462', fontWeight: 700, fontSize: '12px', cursor: 'pointer', boxShadow: seccion === 'eventos' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none' }}
          >
            Eventos ({eventos.length})
          </button>
          <button
            onClick={() => { setSeccion('gastronomia'); cerrarModalForm(); }}
            style={{ padding: '8px 14px', borderRadius: '10px', border: 'none', backgroundColor: seccion === 'gastronomia' ? '#fff' : 'transparent', color: seccion === 'gastronomia' ? '#400d0f' : '#6e6462', fontWeight: 700, fontSize: '12px', cursor: 'pointer', boxShadow: seccion === 'gastronomia' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none' }}
          >
            Gastronomía ({gastronomia.length})
          </button>
        </div>

        <button
          type="button"
          onClick={abrirNuevo}
          style={{ backgroundColor: '#2e7d32', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '12px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(46,125,50,0.2)' }}
        >
          <Plus size={16} /> Nuevo
        </button>
      </div>

      {/* MODAL / VENTANA FLOTANTE */}
      {(creandoNuevo || itemEditando) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <form onSubmit={handleGuardar} style={{ backgroundColor: '#fff', padding: '28px', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', maxWidth: '540px', maxHeight: '92vh', overflowY: 'auto', border: '1px solid #f2ece9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f2ece9', paddingBottom: '10px' }}>
              <h4 style={{ margin: 0, color: '#400d0f', fontSize: '17px', fontWeight: 700 }}>
                {itemEditando ? `Editar ${seccion}` : `Registrar Nuevo en ${seccion}`}
              </h4>
              <button type="button" onClick={cerrarModalForm} style={{ background: '#f2ece9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} color="#400d0f" /></button>
            </div>

            {mensajeForm && (
              <div style={{ 
                backgroundColor: tipoMensajeForm === 'exito' ? '#e8f5e9' : '#ffebee', 
                color: tipoMensajeForm === 'exito' ? '#2e7d32' : '#c62828', 
                padding: '10px 14px', 
                borderRadius: '10px', 
                fontSize: '12px', 
                fontWeight: 600, 
                border: `1px solid ${tipoMensajeForm === 'exito' ? '#c8e6c9' : '#ffcdd2'}`
              }}>
                {mensajeForm}
              </div>
            )}

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#400d0f', display: 'block', marginBottom: '4px' }}>Nombre</label>
              <input name="nombre" defaultValue={itemEditando?.nombre || ''} required placeholder="Nombre principal" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #dcd6d3', fontSize: '13px', outline: 'none' }} />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#400d0f', display: 'block', marginBottom: '4px' }}>Descripción detallada</label>
              <textarea name="descripcion" defaultValue={itemEditando?.descripcion || ''} rows={2} placeholder="Breve reseña o información" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #dcd6d3', fontSize: '13px', outline: 'none', resize: 'vertical' }} />
            </div>

            {seccion === 'lugares' ? (
              <>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#400d0f', display: 'block', marginBottom: '4px' }}>Dirección o Enlace de Google Maps</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      name="direccion" 
                      value={direccionInput}
                      onChange={(e) => setDireccionInput(e.target.value)}
                      placeholder="Ej. 72760 o https://maps.app.goo.gl/..." 
                      style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #dcd6d3', fontSize: '13px', outline: 'none' }} 
                    />
                    <button 
                      type="button" 
                      onClick={handleBuscarUbicacion}
                      style={{ backgroundColor: '#400d0f', color: '#fff', border: 'none', padding: '0 16px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontWeight: 600, fontSize: '13px' }}
                    >
                      <Search size={16} /> Buscar
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#400d0f', display: 'block', marginBottom: '4px' }}>Categoría</label>
                  <select name="categoria_id" defaultValue={itemEditando?.categoria_id || categoriasBD[0]?.id_categoria} required style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #dcd6d3', fontSize: '13px', outline: 'none', backgroundColor: '#fff', cursor: 'pointer' }}>
                    {categoriasBD.map((cat) => (
                      <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#400d0f', display: 'block', marginBottom: '4px' }}>Horario</label>
                    <input name="horario" defaultValue={itemEditando?.horario || ''} placeholder="Ej. 09:00 - 18:00" style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #dcd6d3', fontSize: '13px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#400d0f', display: 'block', marginBottom: '4px' }}>Costo de Entrada ($)</label>
                    <input name="costo_entrada" type="number" step="any" defaultValue={itemEditando?.costo_entrada || 0} placeholder="0.00" style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #dcd6d3', fontSize: '13px', outline: 'none' }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#400d0f', display: 'block', marginBottom: '4px' }}>Teléfono</label>
                  <input name="telefono" defaultValue={itemEditando?.telefono || ''} placeholder="Opcional" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #dcd6d3', fontSize: '13px', outline: 'none' }} />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#400d0f', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <MapPin size={16} color="#B3282D" /> Pin en el Mapa:
                  </label>
                  <div ref={mapRef} style={{ width: '100%', height: '170px', borderRadius: '12px', border: '1px solid #dcd6d3', zIndex: 1 }} />
                </div>
              </>
            ) : seccion === 'eventos' ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#400d0f', display: 'block', marginBottom: '4px' }}>Fecha Inicio</label>
                    <input name="fecha_inicio" type="datetime-local" defaultValue={itemEditando?.fecha_inicio ? itemEditando.fecha_inicio.slice(0, 16) : ''} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #dcd6d3', fontSize: '12px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#400d0f', display: 'block', marginBottom: '4px' }}>Fecha Fin</label>
                    <input name="fecha_fin" type="datetime-local" defaultValue={itemEditando?.fecha_fin ? itemEditando.fecha_fin.slice(0, 16) : ''} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #dcd6d3', fontSize: '12px', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#400d0f', display: 'block', marginBottom: '4px' }}>Lugar / Recinto</label>
                    <input name="lugar" defaultValue={itemEditando?.lugar || ''} placeholder="Ubicación del evento" style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #dcd6d3', fontSize: '13px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#400d0f', display: 'block', marginBottom: '4px' }}>Costo ($)</label>
                    <input name="costo" type="number" step="any" defaultValue={itemEditando?.costo || 0} placeholder="0.00" style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #dcd6d3', fontSize: '13px', outline: 'none' }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#400d0f', display: 'block', marginBottom: '4px' }}>Temporada</label>
                  <input name="temporada" defaultValue={itemEditando?.temporada || 'Todo el año'} placeholder="Ej. Todo el año, Feria..." style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #dcd6d3', fontSize: '13px', outline: 'none' }} />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#400d0f', display: 'block', marginBottom: '4px' }}>Categoría de Gastronomía</label>
                  <select name="tipoGastro" defaultValue={itemEditando?.categoriaGastro || 'Platillo'} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #dcd6d3', fontSize: '13px', outline: 'none', backgroundColor: '#fff', cursor: 'pointer' }}>
                    <option value="Platillo">Platillo</option>
                    <option value="Bebida">Bebida</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#400d0f', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <ImageIcon size={15} color="#B3282D" /> Imagen del Platillo / Bebida
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input 
                      name="url_imagen" 
                      placeholder="Pega aquí la URL de la imagen de Google..." 
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #dcd6d3', fontSize: '13px', outline: 'none' }} 
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#6e6462', fontWeight: 600 }}>O sube desde tu dispositivo:</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const localUrl = URL.createObjectURL(file)
                            const inputUrl = e.currentTarget.form?.elements.namedItem('url_imagen') as HTMLInputElement
                            if (inputUrl) inputUrl.value = localUrl
                          }
                        }}
                        style={{ fontSize: '11px', color: '#6e6462' }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#400d0f', display: 'block', marginBottom: '4px' }}>Preparación</label>
                  <textarea name="preparacion" defaultValue={itemEditando?.preparacion || ''} rows={2} placeholder="Pasos de preparación" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #dcd6d3', fontSize: '13px', outline: 'none', resize: 'vertical' }} />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#400d0f', display: 'block', marginBottom: '4px' }}>Ingredientes (separados por coma)</label>
                  <input name="ingredientes" defaultValue={Array.isArray(itemEditando?.ingredientes) ? itemEditando.ingredientes.join(', ') : (itemEditando?.ingredientes || '')} placeholder="Ingrediente 1, Ingrediente 2..." style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #dcd6d3', fontSize: '13px', outline: 'none' }} />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" style={{ backgroundColor: '#B3282D', color: '#fff', border: 'none', padding: '12px 18px', borderRadius: '12px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flex: 1, boxShadow: '0 4px 12px rgba(179,40,45,0.2)' }}>
                <Check size={18} /> Guardar registro
              </button>
              <button type="button" onClick={cerrarModalForm} style={{ backgroundColor: '#f2ece9', color: '#400d0f', border: 'none', padding: '12px 18px', borderRadius: '12px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', flex: 1 }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LISTA DE ELEMENTOS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {listaActual.length === 0 ? (
          <p style={{ color: '#6e6462', fontSize: '13px', textAlign: 'center', padding: '30px' }}>No hay elementos registrados en esta sección.</p>
        ) : (
          listaActual.map((item, idx) => {
            const idKey = seccion === 'lugares' ? item.id_lugar : seccion === 'eventos' ? item.id_evento : `${item.categoriaGastro}-${item.id_real || idx}`
            const detalleExtra = seccion === 'lugares' ? item.direccion : seccion === 'eventos' ? item.lugar : `${item.categoriaGastro} tradicional`

            return (
              <div key={idKey} style={{ backgroundColor: '#fff', padding: '14px 18px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #f2ece9', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
                  <div style={{ backgroundColor: '#fdf5f5', padding: '10px', borderRadius: '12px', flexShrink: 0 }}>
                    <Utensils size={20} color="#B3282D" />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4 style={{ margin: '0 0 3px 0', fontSize: '14px', color: '#2d1515', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.nombre}</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6e6462', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{detalleExtra || 'Sin detalles'}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
                  <button 
                    onClick={() => { setItemEditando(item); setCreandoNuevo(false); }} 
                    title="Editar"
                    style={{ background: '#fdf5f5', border: '1px solid #f9e2e2', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Edit3 size={16} color="#B3282D" />
                  </button>
                  <button 
                    onClick={() => handleEliminar(item)} 
                    title="Eliminar"
                    style={{ background: '#fff5f5', border: '1px solid #ffebee', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Trash2 size={16} color="#d32f2f" />
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