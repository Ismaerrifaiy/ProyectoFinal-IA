'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { isSamePerson } from '@/lib/face'
import FaceCapture from '@/components/FaceCapture'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState<'credentials' | 'face'>('credentials')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [storedDescriptor, setStoredDescriptor] = useState<number[] | null>(null)

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !data.user) {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('face_descriptor')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile) {
      setError('No se encontró el perfil del usuario.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    setStoredDescriptor(profile.face_descriptor as number[])
    setLoading(false)
    setStep('face')
  }

  async function handleFace(capturedDescriptor: Float32Array) {
    if (!storedDescriptor) return
    const match = isSamePerson(storedDescriptor, capturedDescriptor)
    if (match) {
      router.push('/dashboard')
    } else {
      const supabase = createClient()
      await supabase.auth.signOut()
      setError('Reconocimiento facial fallido. La cara no coincide.')
      setStep('credentials')
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      {params.get('registered') && (
        <Alert>
          <AlertDescription>Cuenta creada. Ahora inicia sesión.</AlertDescription>
        </Alert>
      )}

      {step === 'credentials' && (
        <form onSubmit={handleCredentials} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'Verificando...' : 'Continuar'}
          </Button>
        </form>
      )}

      {step === 'face' && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-center text-muted-foreground">
            Credenciales correctas. Ahora verifica tu identidad con la cámara.
          </p>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <FaceCapture onCapture={handleFace} label="Verificar identidad" />
        </div>
      )}
    </div>
  )
}
