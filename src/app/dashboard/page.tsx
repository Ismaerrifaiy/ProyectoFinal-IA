'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { LogOut, Loader2, ShieldCheck, User } from 'lucide-react'
import { IsmAuthLogoFull } from '@/components/ui/IsmAuthLogo'
import RibbonBackground from '@/components/ui/RibbonBackground'
import { Button } from '@/components/ui/button'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export default function DashboardPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace('/login')
      } else {
        setUser(data.session.user)
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', data.session.user.id)
          .single()
        setUsername(profile?.username ?? null)
        setChecking(false)
      }
    })
  }, [router])

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-8 w-8 text-slate-400" />
      </main>
    )
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'U'
  const email = user?.email ?? ''

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <RibbonBackground />

      {/* Header — solo logo */}
      <header className="relative z-10 px-5 sm:px-10 py-6">
        <IsmAuthLogoFull className="text-xl" />
      </header>

      {/* Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl px-6 py-8 sm:px-12 sm:py-10 flex flex-col gap-8">

          {/* Header: avatar + nombre */}
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                <span className="text-white text-lg font-bold">{initials}</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <ShieldCheck className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-[22px] font-semibold text-slate-900 leading-snug">Bienvenido{username ? `, ${username}` : ''}</h1>
              <p className="text-sm text-slate-400 mt-0.5">{email}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100" />

          {/* Filas de info */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">Estado de sesión</span>
              <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-100 px-3 py-1 rounded-full">Activa</span>
            </div>
            <div className="border-t border-slate-50" />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">Verificación</span>
              <span className="text-xs font-medium text-violet-700 bg-violet-50 border border-violet-100 px-3 py-1 rounded-full">Facial ✓</span>
            </div>
            <div className="border-t border-slate-50" />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">Proveedor</span>
              <span className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full">
                {user?.app_metadata?.provider ?? 'email'}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100" />

          {/* Botón cerrar sesión */}
          <Button
            onClick={handleSignOut}
            disabled={signingOut}
            variant="outline"
            className="w-full gap-2 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
          >
            {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            {signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </Button>

        </div>
      </main>

      <footer className="relative z-10 px-5 sm:px-10 py-5 text-xs text-slate-600 flex gap-4 justify-center">
        <span>© {new Date().getFullYear()} IsmAuth</span>
        <span>Ismail Errifaiy</span>
      </footer>
    </div>
  )
}
