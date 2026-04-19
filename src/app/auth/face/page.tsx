'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { isSamePerson } from '@/lib/face'
import FaceCapture from '@/components/FaceCapture'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Mode = 'loading' | 'register' | 'verify'

export default function FacePage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('loading')
  const [storedDescriptor, setStoredDescriptor] = useState<number[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace('/login')
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('face_descriptor')
        .eq('id', user.id)
        .single()

      if (profile?.face_descriptor) {
        setStoredDescriptor(profile.face_descriptor as number[])
        setMode('verify')
      } else {
        setMode('register')
      }
    })
  }, [router])

  async function handleCapture(descriptor: Float32Array) {
    setError(null)

    if (mode === 'register') {
      const res = await fetch('/api/save-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descriptor: Array.from(descriptor) }),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Error al guardar la cara.')
        return
      }
      router.push('/dashboard')
    } else {
      if (!storedDescriptor) return
      const match = await isSamePerson(storedDescriptor, descriptor)
      if (match) {
        router.push('/dashboard')
      } else {
        const supabase = createClient()
        await supabase.auth.signOut()
        setError('Reconocimiento facial fallido. La cara no coincide.')
        setTimeout(() => router.replace('/login'), 2000)
      }
    }
  }

  if (mode === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Cargando...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">
            {mode === 'register' ? 'Registra tu cara' : 'Verifica tu identidad'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-sm text-center text-muted-foreground">
            {mode === 'register'
              ? 'Primera vez con Google. Captura tu cara para futuros accesos.'
              : 'Credenciales correctas. Verifica tu identidad con la cámara.'}
          </p>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <FaceCapture
            onCapture={handleCapture}
            label={mode === 'register' ? 'Capturar cara' : 'Verificar identidad'}
          />
        </CardContent>
      </Card>
    </main>
  )
}
