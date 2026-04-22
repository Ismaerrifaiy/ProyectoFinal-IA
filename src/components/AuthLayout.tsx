import RibbonBackground from '@/components/ui/RibbonBackground'
import { IsmAuthLogoFull } from '@/components/ui/IsmAuthLogo'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <RibbonBackground />

      {/* Logo */}
      <header className="relative z-10 px-5 sm:px-10 py-6">
        <IsmAuthLogoFull className="text-xl" />
      </header>

      {/* Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl px-6 py-8 sm:px-12 sm:py-10">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-5 sm:px-10 py-5 text-xs text-slate-600 flex gap-4 justify-center">
        <span>© {new Date().getFullYear()} IsmAuth</span>
        <span>Ismail Errifaiy</span>
      </footer>
    </div>
  )
}
