import RegisterForm from '@/components/RegisterForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">Crear cuenta</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <RegisterForm />
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="underline">
              Inicia sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
