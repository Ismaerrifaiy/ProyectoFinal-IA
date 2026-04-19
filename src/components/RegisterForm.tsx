'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import FaceCapture from '@/components/FaceCapture'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function RegisterForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [descriptor, setDescriptor] = useState<Float32Array | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!descriptor) {
      setError('Debes capturar tu cara antes de registrarte.')
      return
    }
    setLoading(true)
    setError(null)

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username, descriptor: Array.from(descriptor) }),
    })

    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Error al registrar.')
      setLoading(false)
      return
    }

    router.push('/login?registered=true')
  }

  if (success) {
    return (
      <Alert>
        <AlertDescription>
          Cuenta creada. Revisa tu email y confirma tu cuenta, luego vuelve a intentar registrarte para guardar tu cara.
          <br /><br />
          <strong>Tip:</strong> Para evitar esto, desactiva la confirmación de email en Supabase Dashboard → Authentication → Email → desactiva "Confirm email".
        </AlertDescription>
      </Alert>
    )
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
        <span className="text-xs text-muted-foreground">o regístrate con email</span>
        <div className="flex-1 h-px bg-border" />
      </div>

    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
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
        <Label htmlFor="username">Nombre de usuario</Label>
        <Input
          id="username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="password">Contraseña (mín. 6 caracteres)</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label>Reconocimiento facial</Label>
        <p className="text-xs text-muted-foreground">
          Colócate frente a la cámara y pulsa &quot;Capturar cara&quot;.
        </p>
        <FaceCapture onCapture={setDescriptor} />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={loading || !descriptor}>
        {loading ? 'Registrando...' : 'Crear cuenta'}
      </Button>
    </form>
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
