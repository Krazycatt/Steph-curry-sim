import * as THREE from 'three'

/**
 * Generates a procedural hardwood court texture using the Canvas 2D API.
 * @returns {THREE.CanvasTexture}
 */
export function createCourtTexture() {
  const size = 1024
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  // Base wood fill
  ctx.fillStyle = '#C8902A'
  ctx.fillRect(0, 0, size, size)

  // Horizontal wood grain lines
  for (let i = 0; i < 80; i++) {
    const y = Math.random() * size
    const lineWidth = 0.5 + Math.random() * 1.0
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'
    ctx.lineWidth = lineWidth
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(size, y)
    ctx.stroke()
  }

  // White court lines
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 3

  // Outer boundary rectangle: (50,50) to (974,974)
  ctx.strokeRect(50, 50, 924, 924)

  // Paint box (key): centered, 160px wide, 340px tall from bottom
  const keyX = (size - 160) / 2
  const keyY = size - 50 - 340
  ctx.strokeRect(keyX, keyY, 160, 340)

  // Free throw circle: radius 80px at top of paint box
  ctx.beginPath()
  ctx.arc(size / 2, keyY, 80, 0, Math.PI * 2)
  ctx.stroke()

  // 3-point arc: from bottom corners, large radius arc
  // Save + clip to court boundary so arc stays inside
  ctx.save()
  ctx.beginPath()
  ctx.rect(50, 50, 924, 924)
  ctx.clip()

  ctx.beginPath()
  // Arc centered at the basket position (mid-court bottom), radius 720px
  // Basket is near the bottom center of the texture
  const basketX = size / 2
  const basketY = size - 50 - 80  // 80px inside the bottom boundary
  ctx.arc(basketX, basketY, 720, Math.PI, 2 * Math.PI)
  ctx.stroke()

  ctx.restore()

  // Center circle at top: radius 80px
  ctx.beginPath()
  ctx.arc(size / 2, 50 + 80, 80, 0, Math.PI * 2)
  ctx.stroke()

  return new THREE.CanvasTexture(canvas)
}

/**
 * Generates a procedural basketball texture using the Canvas 2D API.
 * @returns {THREE.CanvasTexture}
 */
export function createBallTexture() {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  // Base orange fill
  ctx.fillStyle = '#E8622A'
  ctx.fillRect(0, 0, size, size)

  // Black seam lines (two bezier curves forming great-circle-like seams)
  ctx.strokeStyle = '#111111'
  ctx.lineWidth = 4

  // Seam 1: horizontal S-curve
  ctx.beginPath()
  ctx.moveTo(0, size / 2)
  ctx.bezierCurveTo(size * 0.25, size * 0.25, size * 0.75, size * 0.75, size, size / 2)
  ctx.stroke()

  // Seam 2: vertical S-curve
  ctx.beginPath()
  ctx.moveTo(size / 2, 0)
  ctx.bezierCurveTo(size * 0.75, size * 0.25, size * 0.25, size * 0.75, size / 2, size)
  ctx.stroke()

  // Slight radial shading gradient — darker at the edges
  const gradient = ctx.createRadialGradient(
    size * 0.4, size * 0.35, size * 0.05,
    size * 0.5, size * 0.5, size * 0.65
  )
  gradient.addColorStop(0, 'rgba(255,255,255,0.12)')
  gradient.addColorStop(0.6, 'rgba(0,0,0,0.0)')
  gradient.addColorStop(1, 'rgba(0,0,0,0.45)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  return new THREE.CanvasTexture(canvas)
}

/**
 * Generates a procedural backboard texture using the Canvas 2D API.
 * @returns {THREE.CanvasTexture}
 */
export function createBackboardTexture() {
  const w = 256
  const h = 128
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')

  // Semi-transparent blue-white fill
  ctx.fillStyle = 'rgba(200,220,255,0.7)'
  ctx.fillRect(0, 0, w, h)

  // White border
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 3
  ctx.strokeRect(2, 2, w - 4, h - 4)

  // Orange target rectangle centered: 80×60px
  const rx = (w - 80) / 2
  const ry = (h - 60) / 2
  ctx.strokeStyle = '#FF6600'
  ctx.lineWidth = 3
  ctx.strokeRect(rx, ry, 80, 60)

  return new THREE.CanvasTexture(canvas)
}
