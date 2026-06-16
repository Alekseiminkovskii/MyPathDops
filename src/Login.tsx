import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

const REMEMBER_KEY = 'mypathdops_remember_email'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY)
    if (saved) {
      setEmail(saved)
      setRemember(true)
    }
  }, [])

  async function handleSubmit() {
    if (!email || !password) return
    setLoading(true)
    setError('')

    if (remember) {
      localStorage.setItem(REMEMBER_KEY, email)
    } else {
      localStorage.removeItem(REMEMBER_KEY)
    }

    const { error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5',
      fontFamily: 'system-ui, sans-serif', display: 'flex',
      alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 12,
        padding: '32px 28px', width: 340,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>

        <h2 style={{ margin: '0 0 4px', fontSize: 22,
          fontWeight: 600, color: '#1a1a1a' }}>
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: '#888' }}>
          MyPathDops
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            autoComplete="off"
            onChange={e => setEmail(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 8,
              border: '1px solid #e0e0e0', fontSize: 14 }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            autoComplete="new-password"
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{ padding: '10px 14px', borderRadius: 8,
              border: '1px solid #e0e0e0', fontSize: 14 }}
          />

          {/* Remember me */}
          <label style={{ display: 'flex', alignItems: 'center',
            gap: 8, fontSize: 13, color: '#666', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              style={{ width: 14, height: 14, cursor: 'pointer' }}
            />
            Remember my email
          </label>

          {error && (
            <p style={{ margin: 0, fontSize: 13, color: '#c62828',
              backgroundColor: '#ffebee', padding: '8px 12px', borderRadius: 6 }}>
              {error}
            </p>
          )}

          <button onClick={handleSubmit} disabled={loading}
            style={{ backgroundColor: '#1a1a1a', color: '#fff', border: 'none',
              borderRadius: 8, padding: '10px', fontSize: 14,
              cursor: 'pointer', marginTop: 4 }}>
            {loading ? 'Loading...' : mode === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        </div>

        <p style={{ margin: '16px 0 0', fontSize: 13,
          color: '#888', textAlign: 'center' }}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <span onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            style={{ color: '#1a1a1a', cursor: 'pointer', fontWeight: 500 }}>
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </span>
        </p>
      </div>
    </div>
  )
}