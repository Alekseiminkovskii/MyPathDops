import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { ImageZoomModal } from '../components/ImageZoomModal'

interface Cert {
  id: number
  name: string
  cert_type: string
  issued_at: string | null
  expires_at: string
  scan_url: string | null
  created_at: string
}

const CERT_TYPES = [
  // Tower & climbing
  'Competent Climber (NWSA)',
  'Tower Crew Lead (NWSA)',
  'Tower Site Manager (NWSA)',
  'Tower Rescue / Competent Rescuer',
  'Fall Protection Competent Person',
  // RF & telecom
  'RF Safety / EME Awareness',
  'Antenna Installation',
  'Fiber Optic Technician',
  'Telecommunications Technician',
  // OSHA & safety
  'OSHA 10-Hour',
  'OSHA 30-Hour',
  'Electrical Safety (NFPA 70E)',
  'Confined Space Entry',
  'Excavation & Trenching Safety',
  'Hazard Communication (HazCom)',
  'HAZWOPER 40-Hour',
  'Fire Extinguisher / Fire Safety',
  // Equipment
  'Aerial Lift / Boom Lift Operator',
  'Scissor Lift Operator',
  'Forklift Operator',
  'Rigging & Signaling',
  // Medical / emergency
  'First Aid / CPR / AED',
  'DOT Physical / Medical Card',
  // Driving & aviation
  'CDL (Commercial Driver\'s License)',
  'FAA Part 107 Drone Pilot',
  // Other
  'Other',
]

const S = 20

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

const emptyForm = { name: '', cert_type: CERT_TYPES[0], issued_at: '', expires_at: '' }

export function Certifications() {
  const navigate = useNavigate()
  const [certs, setCerts] = useState<Cert[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [viewScan, setViewScan] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchCerts() }, [])

  async function fetchCerts() {
    const { data } = await supabase
      .from('certifications')
      .select('*')
      .order('expires_at', { ascending: true })
    if (data) setCerts(data as Cert[])
    setLoading(false)
  }

  async function handleAdd() {
    if (!form.name || !form.expires_at) return
    setSaving(true)

    let scan_url: string | null = null
    const file = fileRef.current?.files?.[0]

    if (file) {
      setUploading(true)
      const filename = `${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('cert-scans')
        .upload(filename, file)
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('cert-scans')
          .getPublicUrl(filename)
        scan_url = publicUrl
      }
      setUploading(false)
    }

    await supabase.from('certifications').insert([{
      name: form.name,
      cert_type: form.cert_type,
      issued_at: form.issued_at || null,
      expires_at: form.expires_at,
      scan_url,
    }])

    setForm(emptyForm)
    if (fileRef.current) fileRef.current.value = ''
    setShowForm(false)
    fetchCerts()
    setSaving(false)
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this certification?')) return
    await supabase.from('certifications').delete().eq('id', id)
    fetchCerts()
  }

  const expired = certs.filter(c => getDaysUntil(c.expires_at) < 0)
  const expiringSoon = certs.filter(c => {
    const d = getDaysUntil(c.expires_at)
    return d >= 0 && d <= 30
  })
  const valid = certs.filter(c => getDaysUntil(c.expires_at) > 30)

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5',
      fontFamily: 'system-ui, sans-serif', padding: `40px ${S}px`,
      textAlign: 'left' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        <button onClick={() => navigate('/jobs')}
          style={{ background: 'none', border: 'none', color: '#888',
            fontSize: 14, cursor: 'pointer', padding: '0 0 24px',
            display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back to Jobs
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 8 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, color: '#1a1a1a' }}>
            Certifications
          </h1>
          <button onClick={() => setShowForm(!showForm)}
            style={{ backgroundColor: '#1a1a1a', color: '#fff', border: 'none',
              borderRadius: 8, padding: '8px 16px', fontSize: 14, cursor: 'pointer' }}>
            {showForm ? 'Cancel' : '+ Add'}
          </button>
        </div>

        {expired.length > 0 && (
          <div style={{ backgroundColor: '#ffebee', borderRadius: 8,
            padding: '10px 16px', marginBottom: 12,
            fontSize: 13, color: '#c62828', fontWeight: 500 }}>
            ⚠ {expired.length} certification{expired.length > 1 ? 's' : ''} expired
          </div>
        )}
        {expiringSoon.length > 0 && (
          <div style={{ backgroundColor: '#fff8e1', borderRadius: 8,
            padding: '10px 16px', marginBottom: 12,
            fontSize: 13, color: '#f57f17', fontWeight: 500 }}>
            ⏱ {expiringSoon.length} expiring within 30 days
          </div>
        )}

        <p style={{ margin: '0 0 24px', color: '#666', fontSize: 15 }}>
          {certs.length} total · {valid.length} valid · {expiringSoon.length} expiring · {expired.length} expired
        </p>

        {/* Add form */}
        {showForm && (
          <div style={{ backgroundColor: '#fff', borderRadius: 10,
            padding: `20px ${S}px`, marginBottom: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                placeholder="Full name (e.g. John Smith)"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                style={{ padding: '10px 14px', borderRadius: 8,
                  border: '1px solid #e0e0e0', fontSize: 14 }}
              />
              <select value={form.cert_type}
                onChange={e => setForm({ ...form, cert_type: e.target.value })}
                style={{ padding: '10px 14px', borderRadius: 8,
                  border: '1px solid #e0e0e0', fontSize: 14 }}>
                {CERT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Issued date</div>
                  <input type="date" value={form.issued_at}
                    onChange={e => setForm({ ...form, issued_at: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8,
                      border: '1px solid #e0e0e0', fontSize: 14, boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Expiry date *</div>
                  <input type="date" value={form.expires_at}
                    onChange={e => setForm({ ...form, expires_at: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8,
                      border: '1px solid #e0e0e0', fontSize: 14, boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Scan upload */}
              <div>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>
                  Certificate scan / photo (optional)
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,.pdf"
                  style={{ padding: '10px 14px', borderRadius: 8,
                    border: '1px solid #e0e0e0', fontSize: 14,
                    width: '100%', boxSizing: 'border-box',
                    backgroundColor: '#fafafa', cursor: 'pointer' }}
                />
              </div>

              <button onClick={handleAdd} disabled={saving || uploading}
                style={{ backgroundColor: '#2e7d32', color: '#fff', border: 'none',
                  borderRadius: 8, padding: 10, fontSize: 14, cursor: 'pointer' }}>
                {uploading ? 'Uploading scan...' : saving ? 'Saving...' : 'Save Certification'}
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {certs.length === 0 ? (
          <div style={{ backgroundColor: '#fff', borderRadius: 10, padding: 32,
            textAlign: 'center', color: '#aaa', fontSize: 14,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            No certifications yet
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

                  {/* Scan thumbnail */}
                  {cert.scan_url ? (
                    <img
                      src={cert.scan_url}
                      alt="cert scan"
                      onClick={() => setViewScan(cert.scan_url)}
                      style={{ width: 44, height: 44, objectFit: 'cover',
                        borderRadius: 6, cursor: 'pointer', flexShrink: 0,
                        border: '1px solid #e0e0e0' }}
                    />
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

                  <button onClick={() => handleDelete(cert.id)}
                    style={{ background: 'none', border: 'none',
                      color: '#ccc', fontSize: 16, cursor: 'pointer', padding: 4 }}>
                    ×
                  </button>
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