// face-api.js usa APIs del browser (canvas, document) — NUNCA importar a nivel de módulo
// Se carga dinámicamente solo en el cliente

let modelsLoaded = false

export async function loadModels(): Promise<void> {
  if (modelsLoaded) return
  const faceapi = await import('face-api.js')
  const MODEL_URL = '/models'
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ])
  modelsLoaded = true
}

export async function getDescriptor(
  input: HTMLVideoElement | HTMLCanvasElement
): Promise<Float32Array | null> {
  const faceapi = await import('face-api.js')
  const detection = await faceapi
    .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks(true)
    .withFaceDescriptor()
  return detection?.descriptor ?? null
}

export async function isSamePerson(
  descriptor1: number[] | Float32Array,
  descriptor2: number[] | Float32Array,
  threshold = 0.5
): Promise<boolean> {
  const faceapi = await import('face-api.js')
  const d1 = descriptor1 instanceof Float32Array ? descriptor1 : new Float32Array(descriptor1)
  const d2 = descriptor2 instanceof Float32Array ? descriptor2 : new Float32Array(descriptor2)
  const distance = faceapi.euclideanDistance(d1, d2)
  return distance < threshold
}
