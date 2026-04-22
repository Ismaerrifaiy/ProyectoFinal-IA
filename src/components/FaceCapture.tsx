'use client'

import { useEffect, useRef, useState } from 'react'
import { loadModels, getDescriptor } from '@/lib/face'
import { Button } from '@/components/ui/button'
import { Loader2, ScanFace, CheckCircle2, AlertTriangle } from 'lucide-react'

interface FaceCaptureProps {
  onCapture: (descriptor: Float32Array) => void
  label?: string
  disabled?: boolean
}

type Status = 'loading' | 'ready' | 'capturing' | 'captured' | 'no-face'

export default function FaceCapture({ onCapture, label = 'Capturar', disabled = false }: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let stream: MediaStream | undefined
    async function init() {
      try {
        await loadModels()
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        })
        if (videoRef.current) videoRef.current.srcObject = stream
        setStatus('ready')
      } catch {
        setError('No se pudo acceder a la cámara.')
      }
    }
    init()
    return () => stream?.getTracks().forEach(t => t.stop())
  }, [])

  async function handleCapture() {
    if (!videoRef.current) return
    setStatus('capturing')
    try {
      const descriptor = await getDescriptor(videoRef.current)
      if (!descriptor) {
        setStatus('no-face')
        setTimeout(() => setStatus('ready'), 2500)
        return
      }
      setStatus('captured')
      onCapture(descriptor)
    } catch {
      setError('Error al detectar la cara.')
      setStatus('ready')
    }
  }

  const isCaptured  = status === 'captured'
  const isCapturing = status === 'capturing'
  const isNoFace    = status === 'no-face'
  const isLoading   = status === 'loading'

  return (
    <div className="flex flex-col items-center gap-5 w-full">

      {/* Video frame */}
      <div
        className="relative w-full rounded-2xl overflow-hidden bg-slate-950"
        style={{ aspectRatio: '4/3' }}
      >
        {/* Video */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)', opacity: isLoading ? 0 : 1, transition: 'opacity 0.5s' }}
          autoPlay muted playsInline
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 gap-3">
            <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
            <p className="text-sm text-slate-400">Cargando modelos…</p>
          </div>
        )}

        {/* Face oval guide */}
        {!isLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative" style={{ width: '54%', aspectRatio: '3/4' }}>
              <svg viewBox="0 0 100 133" className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <ellipse
                  cx="50" cy="66" rx="48" ry="63"
                  fill="none"
                  stroke={isCaptured ? '#22c55e' : isNoFace ? '#f59e0b' : 'white'}
                  strokeWidth="2.5"
                  strokeDasharray={isCaptured || isNoFace ? 'none' : '8 4'}
                  opacity="0.9"
                  className={isCapturing ? 'animate-pulse' : ''}
                  style={{ transition: 'stroke 0.4s' }}
                />
              </svg>

              {/* Scan line when capturing */}
              {isCapturing && (
                <div
                  className="absolute left-[4%] right-[4%] h-[2px] rounded-full"
                  style={{
                    background: 'linear-gradient(to right, transparent, #818cf8, #a78bfa, #818cf8, transparent)',
                    animation: 'scanline 1.2s ease-in-out infinite',
                    top: '10%',
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* Vignette */}
        {!isLoading && (
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse 80% 90% at 50% 50%, transparent 55%, rgba(2,6,23,0.55) 100%)',
          }} />
        )}

        {/* Captured: icon floats over video */}
        {isCaptured && (
          <div className="absolute bottom-5 left-0 right-0 flex justify-center pointer-events-none">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-4 py-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-green-300">Cara reconocida</span>
            </div>
          </div>
        )}

        {/* No face: icon floats over video */}
        {isNoFace && (
          <div className="absolute bottom-5 left-0 right-0 flex justify-center pointer-events-none">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-4 py-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-300">No se detectó ninguna cara</span>
            </div>
          </div>
        )}
      </div>

      {/* Instruction */}
      {!isLoading && !isCaptured && (
        <p className="text-xs text-slate-400 text-center">
          {isNoFace
            ? 'Asegúrate de que tu cara esté bien iluminada y centrada'
            : 'Centra tu cara dentro del óvalo y pulsa el botón'}
        </p>
      )}

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {/* Button */}
      {!isCaptured ? (
        <Button
          type="button"
          onClick={isNoFace ? () => setStatus('ready') : handleCapture}
          disabled={disabled || isLoading || isCapturing}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2"
        >
          {isCapturing
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Analizando…</>
            : <><ScanFace className="h-4 w-4" /> {isNoFace ? 'Intentar de nuevo' : label}</>
          }
        </Button>
      ) : (
        <Button type="button" variant="ghost" onClick={() => setStatus('ready')} className="w-full text-slate-400 text-sm">
          Repetir foto
        </Button>
      )}

      <style>{`
        @keyframes scanline {
          0%   { top: 10%; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 88%; opacity: 0; }
        }
      `}</style>
    </div>
  )
}
