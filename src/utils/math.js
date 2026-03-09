import * as THREE from 'three'

export const lerp = (a, b, t) => a + (b - a) * t
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v))
export const randomRange = (min, max) => min + Math.random() * (max - min)
export const randomSign = () => Math.random() < 0.5 ? -1 : 1
export const degToRad = (d) => d * Math.PI / 180
export const easeOutQuad = (t) => 1 - (1 - t) * (1 - t)
export const easeInOutQuad = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
export const vecLerp = (v1, v2, t) => new THREE.Vector3(
  lerp(v1.x, v2.x, t), lerp(v1.y, v2.y, t), lerp(v1.z, v2.z, t)
)
