import { Suspense } from 'react'
import LoginForm from '@/components/LoginForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">Iniciar sesión</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Suspense>
            <LoginForm />
          </Suspense>
          <p className="text-sm text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="underline">
              Regístrate
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
