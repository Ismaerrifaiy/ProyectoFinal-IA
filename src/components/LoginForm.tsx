'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { isSamePerson } from '@/lib/face'
import FaceCapture from '@/components/FaceCapture'
import { AlertCircle, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import StepIndicator from '@/components/StepIndicator'

export default function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState<'credentials' | 'face'>('credentials')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [comparing, setComparing] = useState(false)
  const [storedDescriptor, setStoredDescriptor] = useState<number[] | null>(null)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError || !data.user) {
        setError('Email o contraseña incorrectos.')
        setLoading(false)
        return
      }
      const { data: profile, error: profileError } = await supabase
        .from('profiles').select('face_descriptor').eq('id', data.user.id).single()
      if (profileError || !profile || !profile.face_descriptor || (profile.face_descriptor as unknown[]).length === 0) {
        setError('No encontramos tu perfil. Intenta registrarte de nuevo.')
        await supabase.auth.signOut()
        setLoading(false)
        return
      }
      setStoredDescriptor(profile.face_descriptor as number[])
      setLoading(false)
      setStep('face')
    } catch {
      setError('Algo salió mal. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  async function handleFace(captured: Float32Array) {
    if (!storedDescriptor) { setStep('credentials'); return }
    setComparing(true)
    setError(null)
    try {
      const match = await isSamePerson(storedDescriptor, captured)
      if (match) {
        router.push('/dashboard')
      } else {
        setError('No coincide con la foto registrada. Inténtalo otra vez.')
      }
    } catch {
      setError('No pudimos leer tu cara. Asegúrate de tener buena iluminación.')
    } finally {
      setComparing(false)
    }
  }

  async function handleForgotPassword() {
    if (!email) { setError('Escribe tu email primero y luego pulsa "Olvidé mi contraseña".'); return }
    setResetLoading(true)
    setError(null)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    })
    setResetLoading(false)
    setResetSent(true)
  }

  function handleGoogle() {
    const supabase = createClient()
    supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })
  }

  function handleGitHub() {
    const supabase = createClient()
    supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: `${window.location.origin}/auth/callback` } })
  }

  return (
    <div className="flex flex-col gap-7 w-full">
      <StepIndicator steps={['Acceso', 'Tu cara']} current={step === 'credentials' ? 0 : 1} />

      {params.get('registered') && step === 'credentials' && (
        <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
          Cuenta creada. Ya puedes entrar.
        </p>
      )}

      {step === 'credentials' && (
        <div key="credentials" className="flex flex-col gap-5" style={{ animation: 'stepIn 0.35s ease both' }}>
          <h2 className="text-[22px] font-semibold text-slate-900 leading-snug">
            Inicia sesión en tu cuenta
          </h2>

          <form onSubmit={handleCredentials} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-slate-600 text-sm">Correo electrónico</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-600 text-sm">Contraseña</Label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  className="text-xs text-violet-600 hover:underline disabled:opacity-50"
                >
                  {resetLoading ? 'Enviando...' : '¿Olvidaste tu contraseña?'}
                </button>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" className="pr-10" />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {resetSent && (
              <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                Te hemos enviado un enlace a <strong>{email}</strong>. Revisa tu bandeja de entrada.
              </p>
            )}

            {error && (
              <p className="text-sm text-red-600 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />{error}
              </p>
            )}

            <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white mt-1" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Comprobando...</> : 'Continuar'}
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-slate-400">o</span>
            <Separator className="flex-1" />
          </div>

          <div className="flex flex-col gap-2">
            <Button type="button" variant="outline" onClick={handleGoogle} className="w-full gap-2">
              <GoogleIcon /> Continuar con Google
            </Button>
            <Button type="button" variant="outline" onClick={handleGitHub} className="w-full gap-2">
              <GitHubIcon /> Continuar con GitHub
            </Button>
          </div>

          <p className="text-sm text-slate-500 text-center">
            ¿Primera vez?{' '}
            <a href="/register" className="text-violet-600 hover:underline">Crea una cuenta</a>
          </p>
        </div>
      )}

      {step === 'face' && (
        <div key="face" className="flex flex-col gap-5" style={{ animation: 'stepIn 0.35s ease both' }}>
          <button
            type="button"
            onClick={async () => { const s = createClient(); await s.auth.signOut(); setStep('credentials'); setError(null) }}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors w-fit"
          >
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>

          <div>
            <h2 className="text-[22px] font-semibold text-slate-900 leading-snug">Un momento más</h2>
            <p className="text-sm text-slate-500 mt-1">Mira a la cámara para confirmar que eres tú</p>
          </div>

          <FaceCapture onCapture={handleFace} label="Soy yo" disabled={comparing} />

          {comparing && (
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Comprobando...
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />{error}
            </p>
          )}

        </div>
      )}

      <style>{`
        @keyframes stepIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  )
}
