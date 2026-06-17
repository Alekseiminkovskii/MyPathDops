import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { COPDocument } from '../components/COPDocument'
import { JSAForm } from '../components/JSAForm'
import { useRole } from '../hooks/useRole'

type JobStatus = 'Active' | 'Completed' | 'Pending'
type QcStatus  = 'pending' | 'approved' | 'rejected'

interface Job {
  id: number
  site_name: string
  status: JobStatus
  date: string
  qc_finalized: boolean
}

interface Photo {
  id: number
  url: string
  label: string
  created_at: string
  lat: number | null
  lng: number | null
  taken_at: string | null
  qc_status: QcStatus
  qc_comment: string | null
}

const statusColors: Record<string, { bg: string; color: string }> = {
  Active:    { bg: '#e8f5e9', color: '#2e7d32' },
  Completed: { bg: '#e3f2fd', color: '#1565c0' },
  Pending:   { bg: '#fff8e1', color: '#f57f17' },
}

const QC_COLORS: Record<QcStatus, { bg: string; color: string; border: string; label: string }> = {
  pending:  { bg: '#f5f5f5', color: '#888',    border: '#e0e0e0', label: 'Pending'  },
  approved: { bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7', label: 'Approved' },
  rejected: { bg: '#ffebee', color: '#c62828', border: '#ef9a9a', label: 'Rejected' },
}

const STATUS_OPTIONS: JobStatus[] = ['Active', 'Completed', 'Pending']
const S = 20

export function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob]       = useState<Job | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading]     = useState(true)
  const [uploading, setUploading] = useState(false)
  const [label, setLabel]         = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  
  const { role } = useRole()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm]   = useState({ site_name: '', status: '', date: '' })
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState(false)

  // QC state
  const [qcComments, setQcComments]     = useState<Record<number, string>>({})
  const [qcLoading, setQcLoading]       = useState<number | null>(null)
  const [finalizingQC, setFinalizingQC] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const [{ data: jobData }, { data: photosData }] = await Promise.all([
        supabase.from('jobs').select('*').eq('id', id).single(),
        supabase.from('photos').select('*').eq('job_id', id).order('created_at', { ascending: false }),
      ])
      if (jobData) setJob(jobData as Job)
      if (photosData) {
        const ps = photosData as Photo[]
        setPhotos(ps)
        const comments: Record<number, string> = {}
        ps.forEach(p => { if (p.qc_comment) comments[p.id] = p.qc_comment })
        setQcComments(comments)
      }
      setLoading(false)
    }
    fetchData()
  }, [id])

  // QC computed
  const approvedCount = photos.filter(p => p.qc_status === 'approved').length
  const rejectedCount = photos.filter(p => p.qc_status === 'rejected').length
  const pendingCount  = photos.filter(p => p.qc_status === 'pending').length
  const canFinalize   = photos.length > 0 && rejectedCount === 0 && pendingCount === 0 && !job?.qc_finalized

  async function handleApprove(photoId: number) {
    setQcLoading(photoId)
    await supabase.from('photos').update({ qc_status: 'approved', qc_comment: null }).eq('id', photoId)
    setPhotos(prev => prev.map(p =>
      p.id === photoId ? { ...p, qc_status: 'approved', qc_comment: null } : p
    ))
    setQcLoading(null)
  }

  async function handleReject(photoId: number) {
    const comment = qcComments[photoId]?.trim() || null
    setQcLoading(photoId)
    await supabase.from('photos').update({ qc_status: 'rejected', qc_comment: comment }).eq('id', photoId)
    setPhotos(prev => prev.map(p =>
      p.id === photoId ? { ...p, qc_status: 'rejected', qc_comment: comment } : p
    ))
    setQcLoading(null)
  }

  async function handleFinalizeQC() {
    if (!canFinalize) return
    setFinalizingQC(true)
    await supabase.from('jobs').update({ qc_finalized: true }).eq('id', id)
    setJob(prev => prev ? { ...prev, qc_finalized: true } : prev)
    setFinalizingQC(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const takenAt = new Date().toISOString()
    let lat: number | null = null
    let lng: number | null = null
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, enableHighAccuracy: true })
      )
      lat = pos.coords.latitude
      lng = pos.coords.longitude
    } catch { console.warn('GPS недоступен') }

    const filename = `${id}/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage.from('photos').upload(filename, file)
    if (uploadError) { console.error(uploadError); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(filename)
    await supabase.from('photos').insert([{
      job_id: Number(id), url: publicUrl, label: label || file.name, lat, lng, taken_at: takenAt,
    }])

    setLabel('')
    if (fileRef.current) fileRef.current.value = ''
    const { data } = await supabase.from('photos').select('*').eq('job_id', id)
      .order('created_at', { ascending: false })
    if (data) setPhotos(data as Photo[])
    setUploading(false)
  }

  function startEditing() {
    if (!job) return
    setEditForm({ site_name: job.site_name, status: job.status, date: job.date })
    setIsEditing(true)
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('jobs').update(editForm).eq('id', id)
    if (error) { console.error(error) }
    else { setJob({ ...job!, ...editForm } as Job); setIsEditing(false) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!window.confirm('Delete this job and all its photos?')) return
    setDeleting(true)
    const { error } = await supabase.from('jobs').delete().eq('id', id)
    if (error) { console.error(error); setDeleting(false); return }
    navigate('/jobs')
  }

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>
  if (!job)    return <div style={{ padding: 40 }}>Job not found</div>

  const badge = statusColors[job.status] ?? { bg: '#f0f0f0', color: '#666' }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5',
      fontFamily: 'system-ui, sans-serif', padding: `40px ${S}px`, textAlign: 'left' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        <button onClick={() => navigate('/jobs')} style={{ background: 'none', border: 'none',
          color: '#888', fontSize: 14, cursor: 'pointer', padding: '0 0 24px',
          display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back to Jobs
        </button>

        <JSAForm jobId={Number(id)} />

        {/* COP — locked until QC finalized */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          {job.qc_finalized ? (
            <PDFDownloadLink
              document={<COPDocument job={job} photos={photos} />}
              fileName={`COP_${job.site_name.replace(/\s+/g, '_')}.pdf`}
            >
              {({ loading: pdfLoading }) => (
                <button style={{ backgroundColor: '#1565c0', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '10px 20px', fontSize: 14,
                  cursor: pdfLoading ? 'wait' : 'pointer', opacity: pdfLoading ? 0.7 : 1 }}>
                  {pdfLoading ? 'Generating PDF...' : '⬇ Download COP'}
                </button>
              )}
            </PDFDownloadLink>
          ) : (
            <button disabled title="Complete QC review to unlock" style={{
              backgroundColor: '#ccc', color: '#fff', border: 'none',
              borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'not-allowed' }}>
              🔒 Download COP
            </button>
          )}
        </div>

        {/* Job info */}
        <div style={{ backgroundColor: '#fff', borderRadius: 10, padding: `24px ${S}px`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-start', marginBottom: 16, gap: 12 }}>
            {isEditing ? (
              <input value={editForm.site_name}
                onChange={e => setEditForm({ ...editForm, site_name: e.target.value })}
                style={{ flex: 1, fontSize: 18, fontWeight: 600, color: '#1a1a1a',
                  padding: '6px 10px', borderRadius: 6, border: '1px solid #e0e0e0' }} />
            ) : (
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#1a1a1a' }}>
                {job.site_name}
              </h1>
            )}
            {isEditing ? (
              <select value={editForm.status}
                onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                style={{ fontSize: 13, padding: '4px 8px', borderRadius: 20, border: '1px solid #e0e0e0' }}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <span style={{ fontSize: 13, fontWeight: 500, padding: '4px 12px',
                borderRadius: 20, backgroundColor: badge.bg, color: badge.color, whiteSpace: 'nowrap' }}>
                {job.status}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#888', width: 60 }}>Date</span>
              {isEditing ? (
                <input type="date" value={editForm.date}
                  onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                  style={{ fontSize: 13, padding: '4px 8px', borderRadius: 6, border: '1px solid #e0e0e0' }} />
              ) : (
                <span style={{ fontSize: 13, color: '#1a1a1a' }}>{job.date}</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#888', width: 60 }}>Job ID</span>
              <span style={{ fontSize: 13, color: '#1a1a1a' }}>#{job.id}</span>
            </div>
          </div>
          {(role === 'pm' || role === 'safety_manager') && (
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {isEditing ? (
              <>
                <button onClick={handleSave} disabled={saving} style={{
                  backgroundColor: '#1565c0', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '8px 16px', fontSize: 13,
                  cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setIsEditing(false)} disabled={saving} style={{
                  backgroundColor: '#fff', color: '#e94b4b', border: '1px solid #e0e0e0',
                  borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button onClick={startEditing} style={{
                  backgroundColor: '#fff', color: '#1565c0', border: '1px solid #1565c0',
                  borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
                  Edit
                </button>
                <button onClick={handleDelete} disabled={deleting} style={{
                  backgroundColor: '#fff', color: '#c62828', border: '1px solid #c62828',
                  borderRadius: 8, padding: '8px 16px', fontSize: 13,
                  cursor: deleting ? 'wait' : 'pointer', opacity: deleting ? 0.7 : 1 }}>
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </>
            )}
          </div>
          )}
        </div>

        {/* Photos + QC */}
        <div style={{ backgroundColor: '#fff', borderRadius: 10, padding: `24px ${S}px`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>
            Photos ({photos.length})
          </h2>

          {/* Upload */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            <input placeholder="Photo label (e.g. Alpha pos 1)" value={label}
              onChange={e => setLabel(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14 }} />
            <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} disabled={uploading}
              style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e0e0e0',
                fontSize: 14, cursor: 'pointer', backgroundColor: '#fafafa' }} />
            {uploading && <p style={{ margin: 0, fontSize: 13, color: '#888' }}>Uploading...</p>}
          </div>

          {/* QC Progress Panel */}
          {photos.length > 0 && role === 'pm' && (
            <div style={{ marginBottom: 20, padding: 16, backgroundColor: '#f9f9f9',
              borderRadius: 8, border: '1px solid #e0e0e0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>
                    QC Review
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {approvedCount}/{photos.length} approved
                    {rejectedCount > 0 && <span style={{ color: '#c62828' }}> · {rejectedCount} rejected</span>}
                    {pendingCount  > 0 && <span style={{ color: '#888'    }}> · {pendingCount} pending</span>}
                  </div>
                </div>
                {job.qc_finalized ? (
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#2e7d32',
                    backgroundColor: '#e8f5e9', padding: '6px 14px', borderRadius: 8 }}>
                    ✓ QC Finalized
                  </span>
                ) : (
                  <button onClick={handleFinalizeQC} disabled={!canFinalize || finalizingQC}
                    title={!canFinalize ? 'Approve all photos first' : ''}
                    style={{ backgroundColor: canFinalize ? '#2e7d32' : '#ccc', color: '#fff',
                      border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13,
                      cursor: canFinalize ? 'pointer' : 'not-allowed', transition: 'background-color 0.2s' }}>
                    {finalizingQC ? 'Finalizing...' : 'Finalize QC'}
                  </button>
                )}
              </div>
              {/* Progress bar */}
              <div style={{ marginTop: 10, height: 4, backgroundColor: '#e0e0e0', borderRadius: 2 }}>
                <div style={{ height: '100%', borderRadius: 2, backgroundColor: '#2e7d32',
                  width: photos.length ? `${(approvedCount / photos.length) * 100}%` : '0%',
                  transition: 'width 0.3s ease' }} />
              </div>
            </div>
          )}

          {/* Photos grid */}
          {photos.length === 0 ? (
            <div style={{ border: '2px dashed #e0e0e0', borderRadius: 8,
              padding: 32, textAlign: 'center', color: '#aaa', fontSize: 14 }}>
              No photos yet
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {photos.map(photo => {
                const qc = QC_COLORS[photo.qc_status]
                const isQcLoading = qcLoading === photo.id
                return (
                  <div key={photo.id} style={{ borderRadius: 8, overflow: 'hidden',
                    border: `1px solid ${qc.border}` }}>
                    <img src={photo.url} alt={photo.label}
                      style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                    <div style={{ padding: '8px 10px', fontSize: 12, color: '#030303' }}>
                      <div style={{ fontWeight: 500, marginBottom: 2 }}>{photo.label}</div>
                      {photo.taken_at && <div>{new Date(photo.taken_at).toLocaleString()}</div>}
                      {photo.lat && photo.lng && (
                        <div style={{ color: '#aaa' }}>
                          {photo.lat.toFixed(5)}, {photo.lng.toFixed(5)}
                        </div>
                      )}

                      {/* QC badge */}
                      <div style={{ marginTop: 6 }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10,
                          backgroundColor: qc.bg, color: qc.color, fontWeight: 600 }}>
                          {qc.label}
                        </span>
                      </div>

                      {/* Rejection comment */}
                      {photo.qc_status === 'rejected' && photo.qc_comment && (
                        <div style={{ fontSize: 11, color: '#c62828', marginTop: 4,
                          fontStyle: 'italic', lineHeight: 1.4 }}>
                          ↳ {photo.qc_comment}
                        </div>
                      )}

                      {/* QC actions */}
                      {role === 'pm' && !job.qc_finalized && (
                        <div style={{ marginTop: 8 }}>
                          <input
                            placeholder="Rejection reason..."
                            value={qcComments[photo.id] || ''}
                            onChange={e => setQcComments(prev => ({ ...prev, [photo.id]: e.target.value }))}
                            style={{ width: '100%', padding: '5px 8px', fontSize: 11,
                              borderRadius: 6, border: '1px solid #e0e0e0',
                              boxSizing: 'border-box', marginBottom: 6, color: '#444' }}
                          />
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => handleApprove(photo.id)} disabled={isQcLoading}
                              style={{ flex: 1, padding: '5px 0', fontSize: 11, fontWeight: 600,
                                backgroundColor: photo.qc_status === 'approved' ? '#2e7d32' : '#fff',
                                color: photo.qc_status === 'approved' ? '#fff' : '#2e7d32',
                                border: '1px solid #2e7d32', borderRadius: 6,
                                cursor: isQcLoading ? 'wait' : 'pointer' }}>
                              ✓ Approve
                            </button>
                            <button onClick={() => handleReject(photo.id)} disabled={isQcLoading}
                              style={{ flex: 1, padding: '5px 0', fontSize: 11, fontWeight: 600,
                                backgroundColor: photo.qc_status === 'rejected' ? '#c62828' : '#fff',
                                color: photo.qc_status === 'rejected' ? '#fff' : '#c62828',
                                border: '1px solid #c62828', borderRadius: 6,
                                cursor: isQcLoading ? 'wait' : 'pointer' }}>
                              ✗ Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}