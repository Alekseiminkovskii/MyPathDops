import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { ImageZoomModal } from '../components/ImageZoomModal'

interface Cert {
  id: number
  name: string
  cert_type: string
  issued_at: string | null
  expires_at: string
  scan_url: string | null
}

interface Profile {
  email: string
  full_name: string | null
}

function getDaysUntil(dateStr: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(dateStr)
  return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function StatusBadge({ days }: { days: number }) {
  if (days < 0) return (
    <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px',
      borderRadius: 20, backgroundColor: '#ffebee', color: '#c62828' }}>
      Expired {Math.abs(days)}d ago
    </span>
  )
  if (days <= 30) return (
    <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px',
      borderRadius: 20, backgroundColor: '#fff8e1', color: '#f57f17' }}>
      Expires in {days}d
    </span>
  )
  return (
    <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px',
      borderRadius: 20, backgroundColor: '#e8f5e9', color: '#2e7d32' }}>
      Valid · {days}d left
    </span>
  )
}

const S = 20

export function TechCertifications() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [certs, setCerts] = useState<Cert[]>([])
  const [loading, setLoading] = useState(true)
  const [viewScan, setViewScan] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    let ignore = false
    async function load() {
      const [{ data: profileData }, { data: certsData }] = await Promise.all([
        supabase.from('profiles').select('email, full_name').eq('id', userId).single(),
        supabase.from('certifications').select('*')
          .eq('user_id', userId).order('expires_at', { ascending: true }),
      ])
      if (!ignore) {
        if (profileData) setProfile(profileData as Profile)
        if (certsData) setCerts(certsData as Cert[])
        setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [userId])

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>

  const displayName = profile?.full_name ?? profile?.email ?? 'Technician'
  const expired     = certs.filter(c => getDaysUntil(c.expires_at) < 0)
  const expiringSoon = certs.filter(c => { const d = getDaysUntil(c.expires_at); return d >= 0 && d <= 30 })
  const valid       = certs.filter(c => getDaysUntil(c.expires_at) > 30)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5',
      fontFamily: 'system-ui, sans-serif', padding: `40px ${S}px`, textAlign: 'left' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        <button onClick={() => navigate('/team-certifications')}
          style={{ background: 'none', border: 'none', color: '#888',
            fontSize: 14, cursor: 'pointer', padding: '0 0 24px',
            display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back to Team
        </button>

        <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 600, color: '#1a1a1a' }}>
          {displayName}
        </h1>
        {profile?.full_name && (
          <p style={{ margin: '0 0 12px', color: '#888', fontSize: 14 }}>{profile.email}</p>
        )}

        {expired.length > 0 && (
          <div style={{ backgroundColor: '#ffebee', borderRadius: 8,
            padding: '10px 16px', marginBottom: 8,
            fontSize: 13, color: '#c62828', fontWeight: 500 }}>
            ⚠ {expired.length} certification{expired.length > 1 ? 's' : ''} expired
          </div>
        )}
        {expiringSoon.length > 0 && (
          <div style={{ backgroundColor: '#fff8e1', borderRadius: 8,
            padding: '10px 16px', marginBottom: 8,
            fontSize: 13, color: '#f57f17', fontWeight: 500 }}>
            ⏱ {expiringSoon.length} expiring within 30 days
          </div>
        )}

        <p style={{ margin: '0 0 24px', color: '#666', fontSize: 15 }}>
          {certs.length} total · {valid.length} valid · {expiringSoon.length} expiring · {expired.length} expired
        </p>

        {certs.length === 0 ? (
          <div style={{ backgroundColor: '#fff', borderRadius: 10, padding: 32,
            textAlign: 'center', color: '#aaa', fontSize: 14,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            No certifications found
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0,
            display: 'flex', flexDirection: 'column', gap: 8 }}>
            {certs.map(cert => {
              const days = getDaysUntil(cert.expires_at)
              return (
                <li key={cert.id} style={{ backgroundColor: '#fff', borderRadius: 10,
                  padding: `14px ${S}px`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  display: 'flex', alignItems: 'center', gap: 12,
                  borderLeft: `3px solid ${days < 0 ? '#ef9a9a' : days <= 30 ? '#ffe082' : '#a5d6a7'}` }}>

                  {cert.scan_url ? (
                    <img src={cert.scan_url} alt="cert scan"
                      onClick={() => setViewScan(cert.scan_url!)}
                      style={{ width: 44, height: 44, objectFit: 'cover',
                        borderRadius: 6, cursor: 'zoom-in', flexShrink: 0,
                        border: '1px solid #e0e0e0' }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 6,
                      backgroundColor: '#f5f5f5', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, color: '#ccc', border: '1px solid #e0e0e0' }}>
                      📄
                    </div>
                  )}

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>
                      {cert.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      {cert.cert_type} · Expires {new Date(cert.expires_at).toLocaleDateString('en-US')}
                    </div>
                  </div>

                  <StatusBadge days={days} />
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {viewScan && (
        <ImageZoomModal src={viewScan} alt="cert scan" onClose={() => setViewScan(null)} />
      )}
    </div>
  )
}
