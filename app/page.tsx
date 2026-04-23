'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      setLoading(false)
    }

    checkSession()
  }, [])

  if (loading) {
    return <div>Cargando...</div>
  }

  return (
    <main>
      <h1>🗣️ Chismecito</h1>
      <p>Bienvenido a la red social local del barrio</p>
      {session ? (
        <div>
          <p>Sesión activa: {session.user?.email}</p>
        </div>
      ) : (
        <div>
          <p>Por favor inicia sesión</p>
        </div>
      )}
    </main>
  )
}
