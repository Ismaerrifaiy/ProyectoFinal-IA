import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="text-green-600 text-2xl">Acceso correcto</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Has iniciado sesión correctamente y tu identidad ha sido verificada.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
