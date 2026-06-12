import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { Login } from './Login'
import { JobsList } from './pages/JobsList'
import type { Session } from '@supabase/supabase-js'
import { JobDetail } from './pages/jobDetail'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>

  return (
    <Routes>
      <Route path="/login" element={
        session ? <Navigate to="/jobs" /> : <Login />
      } />
      <Route path="/jobs" element={
        session ? <JobsList /> : <Navigate to="/login" />
      } />
      <Route path="*" element={
        <Navigate to={session ? '/jobs' : '/login'} />
      } />
      <Route path="/jobs/:id" element={
        session ? <JobDetail /> : <Navigate to="/login" />
      } />
    </Routes>
  )
}

export default App