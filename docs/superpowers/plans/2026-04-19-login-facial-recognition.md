# Login con Reconocimiento Facial — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear una aplicación web con login (email + contraseña + reconocimiento facial) usando face-api.js en el cliente, Supabase como base de datos y Next.js con shadcn para la UI.

**Architecture:** El usuario se registra capturando su cara con la webcam; face-api.js extrae un descriptor facial (vector de 128 floats) que se guarda en Supabase junto a sus credenciales. En el login, tras validar email/contraseña con Supabase Auth, se vuelve a capturar la cara y se compara el descriptor nuevo con el almacenado usando distancia euclidiana — si es < 0.5 se concede acceso.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Supabase (Auth + DB), face-api.js, shadcn/ui, Tailwind CSS, Vercel.

---

## Mapa de Archivos

| Archivo | Responsabilidad |
|---|---|
| `src/lib/supabase.ts` | Cliente Supabase (browser + server) |
| `src/lib/face.ts` | Carga de modelos face-api.js + helpers descriptor |
| `src/components/FaceCapture.tsx` | Webcam, detección en tiempo real, captura descriptor |
| `src/components/LoginForm.tsx` | Formulario email + contraseña + paso facial |
| `src/components/RegisterForm.tsx` | Formulario registro + captura facial |
| `src/app/page.tsx` | Página principal → redirige a /login |
| `src/app/login/page.tsx` | Página de login |
| `src/app/register/page.tsx` | Página de registro |
| `src/app/dashboard/page.tsx` | Mensaje de acceso correcto |
| `supabase/migrations/20260419_profiles.sql` | Tabla profiles con face_descriptor |
| `public/models/` | Modelos de face-api.js (pesos del modelo) |

---

## Task 1: Scaffolding del proyecto

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `.env.local` (no se entrega, solo estructura)
- Modify: `package.json`

- [ ] **Step 1: Crear el proyecto Next.js**

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"
```

Responder: Yes a todas las opciones por defecto.

- [ ] **Step 2: Instalar dependencias**

```bash
npm install @supabase/supabase-js @supabase/ssr face-api.js
npx shadcn@latest init
```

Al inicializar shadcn elegir: Default style, Slate color, sí a CSS variables.

- [ ] **Step 3: Añadir componentes shadcn necesarios**

```bash
npx shadcn@latest add button input label card alert
```

- [ ] **Step 4: Descargar modelos de face-api.js en `public/models/`**

```bash
mkdir -p public/models
# Descargar desde el repo oficial de face-api.js:
# https://github.com/justadudewhohacks/face-api.js/tree/master/weights
# Archivos necesarios:
# - tiny_face_detector_model-weights_manifest.json + shard
# - face_landmark_68_model-weights_manifest.json + shard
# - face_recognition_net-weights_manifest.json + shard
curl -L https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json -o public/models/tiny_face_detector_model-weights_manifest.json
curl -L https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1 -o public/models/tiny_face_detector_model-shard1
curl -L https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_tiny_model-weights_manifest.json -o public/models/face_landmark_68_tiny_model-weights_manifest.json
curl -L https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_tiny_model-shard1 -o public/models/face_landmark_68_tiny_model-shard1
curl -L https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json -o public/models/face_recognition_model-weights_manifest.json
curl -L https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1 -o public/models/face_recognition_model-shard1
curl -L https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2 -o public/models/face_recognition_model-shard2
```

- [ ] **Step 5: Crear `.env.local`**

```bash
# .env.local (NO subir a git)
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
```

Añadir `.env.local` al `.gitignore` si no está ya.

- [ ] **Step 6: Commit inicial**

```bash
git init
git add .
git commit -m "chore: scaffolding next.js + supabase + face-api.js"
```

---

## Task 2: Base de datos en Supabase

**Files:**
- Create: `supabase/migrations/20260419_profiles.sql`

- [ ] **Step 1: Crear la migración SQL**

```sql
-- supabase/migrations/20260419_profiles.sql
-- Tabla que extiende auth.users con el descriptor facial
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  face_descriptor float8[] not null,   -- vector 128 floats de face-api.js
  created_at timestamptz default now()
);

-- Solo el propio usuario puede leer/escribir su perfil
alter table public.profiles enable row level security;

create policy "Usuario puede leer su propio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuario puede insertar su propio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);
```

- [ ] **Step 2: Ejecutar en Supabase**

Abrir el SQL Editor en https://supabase.com/dashboard → pegar el contenido del archivo → Run.

Verificar en Table Editor que la tabla `profiles` aparece con las columnas: `id`, `username`, `face_descriptor`, `created_at`.

- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: migration tabla profiles con face_descriptor"
```

---

## Task 3: Cliente Supabase y tipos

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/types/database.ts`

- [ ] **Step 1: Crear tipos de la base de datos**

```typescript
// src/types/database.ts
export interface Profile {
  id: string
  username: string
  face_descriptor: number[]
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
    }
  }
}
```

- [ ] **Step 2: Crear cliente Supabase**

```typescript
// src/lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase.ts src/types/database.ts
git commit -m "feat: cliente supabase tipado"
```

---

## Task 4: Utilidades de reconocimiento facial

**Files:**
- Create: `src/lib/face.ts`

- [ ] **Step 1: Escribir el módulo face.ts**

```typescript
// src/lib/face.ts
import * as faceapi from 'face-api.js'

let modelsLoaded = false

export async function loadModels(): Promise<void> {
  if (modelsLoaded) return
  const MODEL_URL = '/models'
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ])
  modelsLoaded = true
}

/**
 * Dada una imagen (video o canvas), devuelve el descriptor facial (128 floats)
 * o null si no se detecta ninguna cara.
 */
export async function getDescriptor(
  input: HTMLVideoElement | HTMLCanvasElement
): Promise<Float32Array | null> {
  const detection = await faceapi
    .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks(true)
    .withFaceDescriptor()
  return detection?.descriptor ?? null
}

/**
 * Compara dos descriptores. Devuelve true si son la misma persona.
 * Umbral 0.5 es el recomendado por face-api.js.
 */
export function isSamePerson(
  descriptor1: number[] | Float32Array,
  descriptor2: number[] | Float32Array,
  threshold = 0.5
): boolean {
  const d1 = descriptor1 instanceof Float32Array ? descriptor1 : new Float32Array(descriptor1)
  const d2 = descriptor2 instanceof Float32Array ? descriptor2 : new Float32Array(descriptor2)
  const distance = faceapi.euclideanDistance(d1, d2)
  return distance < threshold
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/face.ts
git commit -m "feat: utilidades face-api.js (loadModels, getDescriptor, isSamePerson)"
```

---

## Task 5: Componente FaceCapture

**Files:**
- Create: `src/components/FaceCapture.tsx`

Este componente muestra la webcam, detecta si hay una cara en tiempo real y expone un botón para capturar el descriptor.

- [ ] **Step 1: Crear el componente**

```tsx
// src/components/FaceCapture.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { loadModels, getDescriptor } from '@/lib/face'
import { Button } from '@/components/ui/button'

interface FaceCaptureProps {
  onCapture: (descriptor: Float32Array) => void
  label?: string
}

export default function FaceCapture({ onCapture, label = 'Capturar cara' }: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'no-face' | 'captured'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let stream: MediaStream

    async function init() {
      try {
        await loadModels()
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setStatus('ready')
      } catch {
        setError('No se pudo acceder a la cámara o cargar los modelos.')
      }
    }

    init()
    return () => {
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [])

  async function handleCapture() {
    if (!videoRef.current) return
    const descriptor = await getDescriptor(videoRef.current)
    if (!descriptor) {
      setStatus('no-face')
      return
    }
    setStatus('captured')
    onCapture(descriptor)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <video
        ref={videoRef}
        className="rounded-lg w-64 h-48 object-cover bg-black"
        muted
        playsInline
      />
      {status === 'no-face' && (
        <p className="text-sm text-yellow-600">No se detectó ninguna cara. Inténtalo de nuevo.</p>
      )}
      {status === 'captured' && (
        <p className="text-sm text-green-600">Cara capturada correctamente.</p>
      )}
      <Button
        type="button"
        onClick={handleCapture}
        disabled={status === 'loading'}
        variant="outline"
      >
        {status === 'loading' ? 'Cargando modelos...' : label}
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/FaceCapture.tsx
git commit -m "feat: componente FaceCapture con webcam y detección facial"
```

---

## Task 6: Página y formulario de registro

**Files:**
- Create: `src/components/RegisterForm.tsx`
- Create: `src/app/register/page.tsx`

- [ ] **Step 1: Crear RegisterForm**

```tsx
// src/components/RegisterForm.tsx
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

    // 2. Guardar perfil con descriptor facial
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
          Colócate frente a la cámara y pulsa "Capturar cara".
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
```

- [ ] **Step 2: Crear la página de registro**

```tsx
// src/app/register/page.tsx
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
```

- [ ] **Step 3: Commit**

```bash
git add src/components/RegisterForm.tsx src/app/register/page.tsx
git commit -m "feat: página y formulario de registro con reconocimiento facial"
```

---

## Task 7: Página y formulario de login

**Files:**
- Create: `src/components/LoginForm.tsx`
- Create: `src/app/login/page.tsx`

- [ ] **Step 1: Crear LoginForm**

```tsx
// src/components/LoginForm.tsx
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

  // Paso 1: validar email + contraseña
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

    // Obtener descriptor guardado
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

    setStoredDescriptor(profile.face_descriptor)
    setLoading(false)
    setStep('face')
  }

  // Paso 2: verificar cara
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
```

- [ ] **Step 2: Crear la página de login**

```tsx
// src/app/login/page.tsx
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
```

- [ ] **Step 3: Commit**

```bash
git add src/components/LoginForm.tsx src/app/login/page.tsx
git commit -m "feat: página y formulario de login con 2 pasos (credenciales + cara)"
```

---

## Task 8: Página de dashboard y redirección raíz

**Files:**
- Create: `src/app/dashboard/page.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Crear página de acceso correcto**

```tsx
// src/app/dashboard/page.tsx
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
```

- [ ] **Step 2: Redirigir la raíz a /login**

```tsx
// src/app/page.tsx
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/login')
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx src/app/page.tsx
git commit -m "feat: dashboard con mensaje de acceso correcto + redirect raíz"
```

---

## Task 9: Despliegue en Vercel

**Files:**
- No new files (configuración en Vercel dashboard)

- [ ] **Step 1: Subir código a GitHub**

```bash
# Crear repo en GitHub y conectar
git remote add origin https://github.com/<tu-usuario>/<nombre-repo>.git
git branch -M main
git push -u origin main
```

- [ ] **Step 2: Importar en Vercel**

1. Ir a https://vercel.com/new
2. Importar el repositorio de GitHub
3. En "Environment Variables" añadir:
   - `NEXT_PUBLIC_SUPABASE_URL` = tu URL de Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = tu anon key
4. Click en **Deploy**

- [ ] **Step 3: Verificar despliegue**

Abrir la URL de Vercel → comprobar que `/login` carga, que la webcam funciona y que el flujo completo (registro → login → dashboard) funciona en producción.

---

## Entregables del proyecto

| Entregable | Descripción |
|---|---|
| Código fuente | Repositorio con todo el código (sin `.env.local`) |
| Diagrama DB | Ver abajo |
| API keys | **NO incluir** las claves de Supabase |

### Diagrama de la Base de Datos

```
┌─────────────────────────────────────────┐
│              auth.users                 │
│  (gestionado por Supabase Auth)         │
│  id: uuid (PK)                          │
│  email: text                            │
│  encrypted_password: text               │
└──────────────────┬──────────────────────┘
                   │ 1:1
                   ▼
┌─────────────────────────────────────────┐
│              public.profiles            │
│  id: uuid (PK, FK → auth.users.id)      │
│  username: text (UNIQUE)                │
│  face_descriptor: float8[]  ← 128 vals  │
│  created_at: timestamptz                │
└─────────────────────────────────────────┘
```

**RLS (Row Level Security):**
- Un usuario solo puede leer/escribir su propio perfil.
