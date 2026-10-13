import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Calendar, ArrowLeft, Sparkles, Compass, Layers } from 'lucide-react'

type HistoriaProps = {
  volver: () => void
}

type ArticuloHistoria = {
  id_historia: number
  titulo: string
  contenido: string
  epoca: string | null
  multimedia_url: string | null
  tipo_multimedia: 'imagen' | 'video' | null
  orden: number
}

export default function Historia({ volver }: HistoriaProps) {
  const [articulos, setArticulos] = useState<ArticuloHistoria[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarHistoria()
  }, [])

  async function cargarHistoria() {
    setCargando(true)
    const { data, error } = await supabase
      .from('historia_cholula')
      .select('*')
      .order('orden', { ascending: true })

    if (!error && data) {
      setArticulos(data)
    }
    setCargando(false)
  }

  return (
    <main style={{ backgroundColor: '#faf5f2', minHeight: '100vh', paddingBottom: '120px', fontFamily: 'inherit' }}>
      
      {/* HEADER DECORATIVO E IMPACTANTE */}
      <header style={{
        background: 'linear-gradient(135deg, #400d0f 0%, #6b1414 50%, #991b1b 100%)',
        padding: '42px 20px 70px 20px',
        color: '#ffffff',
        borderBottomLeftRadius: '45px',
        borderBottomRightRadius: '45px',
        boxShadow: '0 18px 40px rgba(107, 20, 20, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.06, pointerEvents: 'none' }}>
          <Compass size={240} color="#ffffff" />
        </div>

        <div style={{ maxWidth: '750px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles size={16} color="#fca5a5" />
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#fca5a5' }}>
                Patrimonio Milenario
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '30px', fontWeight: 900, letterSpacing: '-0.5px' }}>
              Historia de Cholula
            </h1>
          </div>

          <button 
            onClick={volver} 
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              padding: '10px 20px',
              borderRadius: '16px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '13px',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }}
          >
            <ArrowLeft size={16} /> Volver
          </button>
        </div>
      </header>

      {/* CONTENEDOR DE TARJETAS FLOTANTES */}
      <div style={{ maxWidth: '750px', margin: '-35px auto 0 auto', padding: '0 20px', position: 'relative', zIndex: 10 }}>
        
        {cargando && (
          <div style={{ backgroundColor: '#ffffff', padding: '50px', borderRadius: '28px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#6e6462', margin: 0, fontWeight: 700 }}>Explorando los archivos de Cholula...</p>
          </div>
        )}

        {!cargando && articulos.length === 0 && (
          <div style={{ backgroundColor: '#ffffff', textAlign: 'center', padding: '70px 24px', borderRadius: '32px', boxShadow: '0 15px 40px rgba(0,0,0,0.06)', border: '1px solid #f2ece9' }}>
            <div style={{ backgroundColor: '#fdf5f5', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <Layers size={32} color="#831818" />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#2d1515', fontWeight: 900 }}>Aún no hay historias registradas</h3>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#6e6462' }}>Añade contenido desde el panel de administración para darle vida a esta sección.</p>
          </div>
        )}

        {!cargando && articulos.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {articulos.map((art, index) => (
              <article 
                key={art.id_historia}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '30px',
                  overflow: 'hidden',
                  boxShadow: '0 15px 45px rgba(131, 24, 24, 0.08)',
                  border: '1px solid #f2e6e3',
                  padding: '28px',
                  position: 'relative'
                }}
              >
                {/* Indicador numérico decorativo */}
                <div style={{
                  position: 'absolute',
                  top: '24px',
                  right: '24px',
                  backgroundColor: '#fdf2f2',
                  color: '#831818',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '12px',
                  border: '1px solid #fecaca'
                }}>
                  0{index + 1}
                </div>

                {art.epoca && (
                  <div style={{ marginBottom: '14px' }}>
                    <span style={{ 
                      backgroundColor: '#831818', 
                      color: '#ffffff', 
                      padding: '6px 14px', 
                      borderRadius: '14px', 
                      fontSize: '11px', 
                      fontWeight: 800, 
                      textTransform: 'uppercase', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(131, 24, 24, 0.2)'
                    }}>
                      <Calendar size={13} color="#fca5a5" /> {art.epoca}
                    </span>
                  </div>
                )}

                <h2 style={{ margin: '0 0 14px 0', fontSize: '22px', fontWeight: 900, color: '#2d1515', lineHeight: 1.35, paddingRight: '30px' }}>
                  {art.titulo}
                </h2>

                <p style={{ margin: '0 0 20px 0', fontSize: '14.5px', color: '#4a3f3c', lineHeight: 1.75, whiteSpace: 'pre-line' }}>
                  {art.contenido}
                </p>

                {art.multimedia_url && (
                  <div style={{ 
                    borderRadius: '20px', 
                    overflow: 'hidden', 
                    backgroundColor: '#1a1a1a', 
                    marginTop: '20px', 
                    border: '1px solid #e8deda', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    {art.tipo_multimedia === 'video' ? (
                      <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0 }}>
                        <iframe 
                          src={art.multimedia_url.includes('watch?v=') ? art.multimedia_url.replace('watch?v=', 'embed/') : art.multimedia_url} 
                          title={art.titulo}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <img 
                        src={art.multimedia_url} 
                        alt={art.titulo} 
                        style={{ 
                          width: '100%', 
                          maxHeight: '450px', 
                          objectFit: 'contain', 
                          display: 'block',
                          backgroundColor: '#f9f6f5',
                          transition: 'transform 0.3s ease'
                        }} 
                      />
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}