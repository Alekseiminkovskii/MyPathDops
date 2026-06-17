import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export type Role = 'pm' | 'safety_manager' | 'tech' | null

export function useRole() {
  const [role, setRole]       = useState<Role>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRole() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setRole((data?.role as Role) ?? null)
      setLoading(false)
    }
    fetchRole()
  }, [])

  return { role, loading }
}