'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { isSamePerson } from '@/lib/face'
import FaceCapture from '@/components/FaceCapture'
import AuthLayout from '@/components/AuthLayout'
import { Loader2 } from 'lucide-react'

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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <AuthLayout>
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-[22px] font-semibold text-slate-900 leading-snug">
            {mode === 'register' ? 'Casi listo' : 'Un momento más'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {mode === 'register'
              ? 'Necesitamos una foto tuya para reconocerte la próxima vez'
              : 'Mira a la cámara para confirmar que eres tú'}
          </p>
        </div>

        <FaceCapture
          onCapture={handleCapture}
          label={mode === 'register' ? 'Tomar foto' : 'Soy yo'}
        />

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    </AuthLayout>
  )
}
