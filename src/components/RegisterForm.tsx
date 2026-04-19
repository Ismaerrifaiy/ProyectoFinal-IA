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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!descriptor) {
      setError('Debes capturar tu cara antes de registrarte.')
      return
    }
    setLoading(true)
    setError(null)

    const supabase = createClient()

    // 1. Crear usuario en Supabase Auth
    const { data, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError || !data.user) {
      setError(authError?.message ?? 'Error al registrar el usuario.')
      setLoading(false)
      return
    }

    // 2. Si no hay sesión (email no confirmado), hacer login para obtenerla
    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError('Usuario creado pero no se pudo iniciar sesión: ' + signInError.message)
        setLoading(false)
        return
      }
    }

    // 3. Guardar perfil con descriptor facial
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      username,
      face_descriptor: Array.from(descriptor),
    })
    if (profileError) {
      setError('Error al guardar el perfil: ' + profileError.message)
      setLoading(false)
      return
    }

    router.push('/login?registered=true')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
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
        <Label htmlFor="password">Contraseña</Label>
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
  )
}
