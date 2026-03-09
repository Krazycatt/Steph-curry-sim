import * as THREE from 'three'
import { RIM_Z } from '../data/constants.js'

export class Lighting {
  constructor(scene) {
    // Ambient fill
    const ambient = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambient)

    // Hemisphere
    const hemi = new THREE.HemisphereLight(0x4444ff, 0x996633, 0.3)
    scene.add(hemi)

    // 4 arena spotlights
    const spotPositions = [
      [6, 12, 4], [-6, 12, 4], [6, 12, 10], [-6, 12, 10]
    ]
    spotPositions.forEach(([x, y, z]) => {
      const spot = new THREE.SpotLight(0xfff5e0, 1.2)
      spot.position.set(x, y, z)
      spot.angle = 0.45
      spot.penumbra = 0.3
      spot.castShadow = true
      spot.shadow.mapSize.set(512, 512)
      spot.target.position.set(0, 0, 5)
      scene.add(spot)
      scene.add(spot.target)
    })

    // Rim point light
    const rimLight = new THREE.PointLight(0xFFC72C, 0.8, 8)
    rimLight.position.set(0, 5, RIM_Z)
    scene.add(rimLight)
  }
}
