import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useRole } from '../hooks/useRole'

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

const emptyForm = { site_name: '', status: 'Active', date: '' }
const S = 20

export function JobsList() {
  const [jobs, setJobs]       = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(emptyForm)
  const [saving, setSaving]     = useState(false)
  const navigate  = useNavigate()
  const { role }  = useRole()

  useEffect(() => { fetchJobs() }, [])

  async function fetchJobs() {
    const { data, error } = await supabase.from('jobs').select('*')
    if (error) console.error(error)
    else setJobs(data as Job[])
    setLoading(false)
  }

  async function handleSubmit() {
    if (!form.site_name || !form.date) return
    setSaving(true)
    const { error } = await supabase.from('jobs').insert([form])
    if (error) console.error(error)
    else { setForm(emptyForm); setShowForm(false); fetchJobs() }
    setSaving(false)
  }

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5',
      fontFamily: 'system-ui, sans-serif', padding: `40px ${S}px`, textAlign: 'left' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 8 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, color: '#1a1a1a' }}>
            Jobs
          </h1>
          <div style={{ display: 'flex', gap: 8 }}>
            {role === 'pm' && (
              <button onClick={() => setShowForm(!showForm)}
                style={{ backgroundColor: '#1a1a1a', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '8px 16px', fontSize: 14, cursor: 'pointer' }}>
                {showForm ? 'Cancel' : '+ Add Job'}
              </button>
            )}
            <button onClick={() => navigate('/certifications')}
              style={{ backgroundColor: 'transparent', color: '#888',
                border: '1px solid #e0e0e0', borderRadius: 8,
                padding: '8px 16px', fontSize: 14, cursor: 'pointer' }}>
              Certifications
            </button>
            {(role === 'pm' || role === 'safety_manager') && (
              <button onClick={() => navigate('/team-certifications')}
                style={{ backgroundColor: 'transparent', color: '#888',
                  border: '1px solid #e0e0e0', borderRadius: 8,
                  padding: '8px 16px', fontSize: 14, cursor: 'pointer' }}>
                Team Certs
              </button>
            )}
            {role === 'pm' && (
              <button onClick={() => navigate('/users')}
                style={{ backgroundColor: 'transparent', color: '#888',
                  border: '1px solid #e0e0e0', borderRadius: 8,
                  padding: '8px 16px', fontSize: 14, cursor: 'pointer' }}>
                Team
              </button>
            )}
            <button onClick={() => supabase.auth.signOut()}
              style={{ backgroundColor: 'transparent', color: '#888',
                border: '1px solid #e0e0e0', borderRadius: 8,
                padding: '8px 16px', fontSize: 14, cursor: 'pointer' }}>
              Sign out
            </button>
          </div>
        </div>

        <p style={{ margin: '0 0 24px', color: '#666', fontSize: 15 }}>
          {jobs.length} sites in queue
        </p>

        {showForm && role === 'pm' && (
          <div style={{ backgroundColor: '#fff', borderRadius: 10,
            padding: `16px ${S}px`, marginBottom: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Site name (e.g. Verizon — Tower #4821)"
                value={form.site_name}
                onChange={e => setForm({ ...form, site_name: e.target.value })}
                style={{ padding: '10px 14px', borderRadius: 8,
                  border: '1px solid #e0e0e0', fontSize: 14 }} />
              <select value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                style={{ padding: '10px 14px', borderRadius: 8,
                  border: '1px solid #e0e0e0', fontSize: 14 }}>
                <option>Active</option>
                <option>Pending</option>
                <option>Completed</option>
              </select>
              <input type="date" value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                style={{ padding: '10px 14px', borderRadius: 8,
                  border: '1px solid #e0e0e0', fontSize: 14 }} />
              <button onClick={handleSubmit} disabled={saving}
                style={{ backgroundColor: '#2e7d32', color: '#fff', border: 'none',
                  borderRadius: 8, padding: 10, fontSize: 14, cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Save Job'}
              </button>
            </div>
          </div>
        )}

        <ul style={{ listStyle: 'none', margin: 0, padding: 0,
          display: 'flex', flexDirection: 'column', gap: 12 }}>
          {jobs.map(job => {
            const badge = statusColors[job.status] ?? { bg: '#f0f0f0', color: '#666' }
            return (
              <li key={job.id} onClick={() => navigate(`/jobs/${job.id}`)}
                style={{ backgroundColor: '#fff', borderRadius: 10,
                  padding: `16px ${S}px`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 16, cursor: 'pointer' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>
                    {job.site_name}
                  </span>
                  <span style={{ fontSize: 14, color: '#888' }}>{job.date}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, padding: '4px 12px',
                  borderRadius: 20, backgroundColor: badge.bg, color: badge.color,
                  whiteSpace: 'nowrap' }}>
                  {job.status}
                </span>
              </li>
            )
          })}
        </ul>

      </div>
    </div>
  )
}