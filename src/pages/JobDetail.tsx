import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { COPDocument } from '../components/COPDocument'

type JobStatus = 'Active' | 'Completed' | 'Pending'

interface Job {
  id: number
  site_name: string
  status: JobStatus
  date: string
}

interface Photo {
  id: number
  url: string
  label: string
  created_at: string
  lat: number | null
  lng: number | null
  taken_at: string | null
}

const statusColors: Record<string, { bg: string; color: string }> = {
  Active:    { bg: '#e8f5e9', color: '#2e7d32' },
  Completed: { bg: '#e3f2fd', color: '#1565c0' },
  Pending:   { bg: '#fff8e1', color: '#f57f17' },
}

const S = 20

export function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState<Job | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [label, setLabel] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function fetchData() {
      const [{ data: jobData }, { data: photosData }] = await Promise.all([
        supabase.from('jobs').select('*').eq('id', id).single(),
        supabase.from('photos').select('*').eq('job_id', id).order('created_at', { ascending: false }),
      ])
      if (jobData) setJob(jobData as Job)
      if (photosData) setPhotos(photosData as Photo[])
      setLoading(false)
    }
    fetchData()
  }, [id])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const takenAt = new Date().toISOString()

    let lat: number | null = null
    let lng: number | null = null

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          enableHighAccuracy: true,
        })
      })
      lat = position.coords.latitude
      lng = position.coords.longitude
    } catch {
      console.warn('GPS недоступен — продолжаем без координат')
    }

    const filename = `${id}/${Date.now()}_${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(filename, file)

    if (uploadError) {
      console.error(uploadError)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('photos')
      .getPublicUrl(filename)

    await supabase.from('photos').insert([{
      job_id: Number(id),
      url: publicUrl,
      label: label || file.name,
      lat,
      lng,
      taken_at: takenAt,
    }])

    setLabel('')
    if (fileRef.current) fileRef.current.value = ''

    const { data } = await supabase
      .from('photos').select('*').eq('job_id', id)
      .order('created_at', { ascending: false })
    if (data) setPhotos(data as Photo[])
    setUploading(false)
  }

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>
  if (!job) return <div style={{ padding: 40 }}>Job not found</div>

  const badge = statusColors[job.status] ?? { bg: '#f0f0f0', color: '#666' }

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
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
  <PDFDownloadLink
    document={<COPDocument job={job} photos={photos} />}
    fileName={`COP_${job.site_name.replace(/\s+/g, '_')}.pdf`}
  >
    {({ loading }) => (
      <button style={{
        backgroundColor: '#1565c0', color: '#fff', border: 'none',
        borderRadius: 8, padding: '10px 20px', fontSize: 14,
        cursor: loading ? 'wait' : 'pointer',
        opacity: loading ? 0.7 : 1,
      }}>
        {loading ? 'Generating PDF...' : '⬇ Download COP'}
      </button>
    )}
  </PDFDownloadLink>
</div>
        <div style={{ backgroundColor: '#fff', borderRadius: 10,
          padding: `24px ${S}px`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-start', marginBottom: 16 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#1a1a1a' }}>
              {job.site_name}
            </h1>
            <span style={{ fontSize: 13, fontWeight: 500, padding: '4px 12px',
              borderRadius: 20, backgroundColor: badge.bg, color: badge.color,
              whiteSpace: 'nowrap' }}>
              {job.status}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#888', width: 60 }}>Date</span>
              <span style={{ fontSize: 13, color: '#1a1a1a' }}>{job.date}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#888', width: 60 }}>Job ID</span>
              <span style={{ fontSize: 13, color: '#1a1a1a' }}>#{job.id}</span>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: 10,
          padding: `24px ${S}px`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>
            Photos ({photos.length})
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            <input
              placeholder="Photo label (e.g. Alpha pos 1)"
              value={label}
              onChange={e => setLabel(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 8,
                border: '1px solid #e0e0e0', fontSize: 14 }}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              style={{ padding: '10px 14px', borderRadius: 8,
                border: '1px solid #e0e0e0', fontSize: 14,
                cursor: 'pointer', backgroundColor: '#fafafa' }}
            />
            {uploading && (
              <p style={{ margin: 0, fontSize: 13, color: '#888' }}>Uploading...</p>
            )}
          </div>

          {photos.length === 0 ? (
            <div style={{ border: '2px dashed #e0e0e0', borderRadius: 8,
              padding: 32, textAlign: 'center', color: '#aaa', fontSize: 14 }}>
              No photos yet
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {photos.map(photo => (
                <div key={photo.id} style={{ borderRadius: 8, overflow: 'hidden',
                  border: '1px solid #e0e0e0' }}>
                  <img
                    src={photo.url}
                    alt={photo.label}
                    style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{ padding: '8px 10px', fontSize: 12, color: '#666' }}>
                    <div style={{ fontWeight: 500, marginBottom: 2 }}>{photo.label}</div>
                    {photo.taken_at && (
                      <div>{new Date(photo.taken_at).toLocaleString()}</div>
                    )}
                    {photo.lat && photo.lng && (
                      <div style={{ color: '#aaa' }}>
                        {photo.lat.toFixed(5)}, {photo.lng.toFixed(5)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}