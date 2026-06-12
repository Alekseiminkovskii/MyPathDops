import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

type JobStatus = 'Active' | 'Completed' | 'Pending'

interface Job {
  id: number
  site_name: string
  status: JobStatus
  date: string
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchJob() {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single()
      if (error) console.error(error)
      else setJob(data as Job)
      setLoading(false)
    }
    fetchJob()
  }, [id])

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>
  if (!job) return <div style={{ padding: 40 }}>Job not found</div>

  const badge = statusColors[job.status] ?? { bg: '#f0f0f0', color: '#666' }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5',
      fontFamily: 'system-ui, sans-serif', padding: `40px ${S}px`,
      textAlign: 'left' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Назад */}
        <button onClick={() => navigate('/jobs')}
          style={{ background: 'none', border: 'none', color: '#888',
            fontSize: 14, cursor: 'pointer', padding: '0 0 24px',
            display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back to Jobs
        </button>

        {/* Заголовок */}
        <div style={{ backgroundColor: '#fff', borderRadius: 10,
          padding: `24px ${S}px`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-start', marginBottom: 16 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600,
              color: '#1a1a1a' }}>
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

        {/* Фото — placeholder */}
        <div style={{ backgroundColor: '#fff', borderRadius: 10,
          padding: `24px ${S}px`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600,
            color: '#1a1a1a' }}>
            Photos
          </h2>
          <div style={{ border: '2px dashed #e0e0e0', borderRadius: 8,
            padding: 32, textAlign: 'center', color: '#aaa', fontSize: 14 }}>
            Photo upload coming soon
          </div>
        </div>

      </div>
    </div>
  )
}