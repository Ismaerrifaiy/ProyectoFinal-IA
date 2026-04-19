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
