import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

interface TechProfile {
  id: string
  email: string
  full_name: string | null
}

const S = 20

export function TeamCertifications() {
  const navigate = useNavigate()
  const [techs, setTechs] = useState<TechProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('role', 'tech')
        .order('email')
      if (!ignore) {
        if (data) setTechs(data as TechProfile[])
        setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5',
      fontFamily: 'system-ui, sans-serif', padding: `40px ${S}px`, textAlign: 'left' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        <button onClick={() => navigate('/jobs')}
          style={{ background: 'none', border: 'none', color: '#888',
            fontSize: 14, cursor: 'pointer', padding: '0 0 24px',
            display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back to Jobs
        </button>

        <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 600, color: '#1a1a1a' }}>
          Team Certifications
        </h1>
        <p style={{ margin: '0 0 24px', color: '#666', fontSize: 15 }}>
          {techs.length} technician{techs.length !== 1 ? 's' : ''}
        </p>

        {techs.length === 0 ? (
          <div style={{ backgroundColor: '#fff', borderRadius: 10, padding: 32,
            textAlign: 'center', color: '#aaa', fontSize: 14,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            No technicians found
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0,
            display: 'flex', flexDirection: 'column', gap: 8 }}>
            {techs.map(tech => (
              <li key={tech.id}
                onClick={() => navigate(`/certifications/${tech.id}`)}
                style={{ backgroundColor: '#fff', borderRadius: 10,
                  padding: `14px ${S}px`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 21,
                  backgroundColor: '#1a1a1a', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: 17 }}>
                    {(tech.full_name ?? tech.email).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {tech.full_name ?? tech.email}
                  </div>
                  {tech.full_name && (
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{tech.email}</div>
                  )}
                </div>
                <span style={{ color: '#ccc', fontSize: 20, flexShrink: 0 }}>›</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
