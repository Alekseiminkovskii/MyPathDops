import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { Login } from './Login'
import { JobsList } from './pages/JobsList'
import type { Session } from '@supabase/supabase-js'
import { JobDetail } from './pages/JobDetail'
import { Certifications } from './pages/Certifications'
import { TeamCertifications } from './pages/TeamCertifications'
import { TechCertifications } from './pages/TechCertifications'
import { Users } from './pages/Users'
import { JSAPage } from './pages/JSAPage'

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
      <Route path="/jobs/:id/jsa" element={
        session ? <JSAPage /> : <Navigate to="/login" />
      } />
      <Route path="/certifications" element={
        session ? <Certifications /> : <Navigate to="/login" />
      } />
      <Route path="/team-certifications" element={
        session ? <TeamCertifications /> : <Navigate to="/login" />
      } />
      <Route path="/certifications/:userId" element={
        session ? <TechCertifications /> : <Navigate to="/login" />
      } />
      <Route path="/users" element={
        session ? <Users /> : <Navigate to="/login" />
      } />
    </Routes>
  )
}

export default App