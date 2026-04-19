'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/login')
      } else {
        setChecking(false)
      }
    })
  }, [router])

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Verificando sesión...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="text-green-600 text-2xl">Acceso correcto</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Has iniciado sesión correctamente y tu identidad ha sido verificada.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
