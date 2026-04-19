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
    let stream: MediaStream | undefined

    async function init() {
      try {
        await loadModels()
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setStatus('ready')
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setError('Error: ' + msg)
        console.error('[FaceCapture]', err)
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
