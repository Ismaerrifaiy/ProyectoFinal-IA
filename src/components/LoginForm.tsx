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
    const match = await isSamePerson(storedDescriptor, capturedDescriptor)
    if (match) {
      router.push('/dashboard')
    } else {
      const supabase = createClient()
      await supabase.auth.signOut()
      setError('Reconocimiento facial fallido. La cara no coincide.')
      setStep('credentials')
    }
  }

  function handleGoogle() {
    const supabase = createClient()
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      {params.get('registered') && (
        <Alert>
          <AlertDescription>Cuenta creada. Ahora inicia sesión.</AlertDescription>
        </Alert>
      )}

      {step === 'credentials' && (
        <div className="flex flex-col gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogle}
            className="flex items-center gap-2 w-full"
          >
            <GoogleIcon />
            Continuar con Google
          </Button>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">o</span>
            <div className="flex-1 h-px bg-border" />
          </div>

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
        </div>
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
