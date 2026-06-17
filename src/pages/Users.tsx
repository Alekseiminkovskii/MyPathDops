import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useRole } from '../hooks/useRole'

interface Profile {
  id: string
  email: string
  full_name: string | null
  role: 'pm' | 'safety_manager' | 'tech'
}

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  pm:             { bg: '#e3f2fd', color: '#1565c0' },
  safety_manager: { bg: '#f3e5f5', color: '#6a1b9a' },
  tech:           { bg: '#e8f5e9', color: '#2e7d32' },
}

const S = 20

export function Users() {
  const navigate = useNavigate()
  const { role: currentRole, loading: roleLoading } = useRole()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ email: '', password: '', full_name: '', role: 'tech' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => { fetchProfiles() }, [])

  async function fetchProfiles() {
    const { data } = await supabase
      .from('profiles').select('*').order('created_at', { ascending: true })
    if (data) setProfiles(data as Profile[])
    setLoading(false)
  }

  async function handleRoleChange(profileId: string, newRole: string) {
    setSaving(profileId)
    await supabase.from('profiles').update({ role: newRole }).eq('id', profileId)
    setProfiles(prev => prev.map(p =>
      p.id === profileId ? { ...p, role: newRole as Profile['role'] } : p
    ))
    setSaving(null)
  }

  async function handleCreateUser() {
    if (!form.email || !form.password) return
    setCreating(true)
    setCreateError('')

    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(form),
      }
    )

    const json = await res.json()
    if (json.error) {
      setCreateError(json.error)
    } else {
      setForm({ email: '', password: '', full_name: '', role: 'tech' })
      setShowForm(false)
      fetchProfiles()
    }
    setCreating(false)
  }

  if (roleLoading || loading) return <div style={{ padding: 40 }}>Loading...</div>
  if (currentRole !== 'pm')   return <div style={{ padding: 40, color: '#c62828' }}>Access denied</div>

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

        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#1a1a1a' }}>
            Team ({profiles.length})
          </h1>
          <button onClick={() => setShowForm(s => !s)}
            style={{ backgroundColor: '#1a1a1a', color: '#fff', border: 'none',
              borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
            + Add User
          </button>
        </div>

        {showForm && (
          <div style={{ backgroundColor: '#fff', borderRadius: 10, padding: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 16 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>
              New User
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input placeholder="Full name" value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14 }} />
              <input placeholder="Email" type="email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14 }} />
              <input placeholder="Temporary password" type="password" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14 }} />
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14 }}>
                <option value="tech">Technician</option>
                <option value="safety_manager">Safety Manager</option>
                <option value="pm">Project Manager</option>
              </select>

              {createError && (
                <p style={{ margin: 0, color: '#c62828', fontSize: 13 }}>{createError}</p>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleCreateUser} disabled={creating}
                  style={{ backgroundColor: '#1a1a1a', color: '#fff', border: 'none',
                    borderRadius: 8, padding: '10px 20px', fontSize: 14,
                    cursor: creating ? 'wait' : 'pointer', opacity: creating ? 0.7 : 1 }}>
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button onClick={() => { setShowForm(false); setCreateError('') }}
                  style={{ backgroundColor: '#fff', color: '#666', border: '1px solid #e0e0e0',
                    borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {profiles.map(profile => {
            const rc = ROLE_COLORS[profile.role] ?? { bg: '#f5f5f5', color: '#888' }
            return (
              <div key={profile.id} style={{ backgroundColor: '#fff', borderRadius: 10,
                padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>
                    {profile.full_name || '—'}
                  </div>
                  <div style={{ fontSize: 13, color: '#888' }}>{profile.email}</div>
                </div>
                <select value={profile.role} disabled={saving === profile.id}
                  onChange={e => handleRoleChange(profile.id, e.target.value)}
                  style={{ fontSize: 12, fontWeight: 600, padding: '5px 10px', borderRadius: 20,
                    border: `1px solid ${rc.color}`, backgroundColor: rc.bg, color: rc.color,
                    cursor: 'pointer', opacity: saving === profile.id ? 0.6 : 1 }}>
                  <option value="tech">Technician</option>
                  <option value="safety_manager">Safety Manager</option>
                  <option value="pm">Project Manager</option>
                </select>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}