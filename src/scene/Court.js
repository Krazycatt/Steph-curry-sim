import * as THREE from 'three'
import { COURT_W, COURT_D, GOLD } from '../data/constants.js'
import { SHOT_SPOTS } from '../data/shotSpots.js'
import { createCourtTexture } from '../utils/textures.js'

export class Court {
  constructor(scene) {
    this.scene = scene
    this.spotMarkers = []
    this._animTime = 0
    this._build()
  }

  _build() {
    // Main court floor
    const courtTex = createCourtTexture()
    courtTex.wrapS = courtTex.wrapT = THREE.RepeatWrapping
    const floorGeo = new THREE.PlaneGeometry(COURT_W * 2, COURT_D * 2)
    const floorMat = new THREE.MeshStandardMaterial({ map: courtTex, roughness: 0.7, metalness: 0.05 })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    this.scene.add(floor)

    // Extended dark floor outside court
    const extGeo = new THREE.PlaneGeometry(60, 60)
    const extMat = new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.9 })
    const ext = new THREE.Mesh(extGeo, extMat)
    ext.rotation.x = -Math.PI / 2
    ext.position.y = -0.001
    ext.receiveShadow = true
    this.scene.add(ext)

    // Arena walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0a0a2e, roughness: 1 })
    const wallConfigs = [
      { w: 60, h: 14, pos: [0, 7, -16], rotY: 0 },       // back wall (behind player)
      { w: 60, h: 14, pos: [0, 7, 18], rotY: Math.PI },   // far wall (behind hoop)
      { w: 40, h: 14, pos: [-18, 7, 1], rotY: Math.PI/2 },
      { w: 40, h: 14, pos: [18, 7, 1], rotY: -Math.PI/2 },
    ]
    wallConfigs.forEach(({ w, h, pos, rotY }) => {
      const geo = new THREE.PlaneGeometry(w, h)
      const mesh = new THREE.Mesh(geo, wallMat)
      mesh.position.set(...pos)
      mesh.rotation.y = rotY
      this.scene.add(mesh)
    })

    // Simple crowd silhouettes (rows of boxes)
    this._buildCrowd()

    // Shot spot markers
    SHOT_SPOTS.forEach((spot) => {
      const geo = new THREE.TorusGeometry(0.4, 0.04, 8, 32)
      const mat = new THREE.MeshStandardMaterial({
        color: 0xFFC72C,
        emissive: 0xFFC72C,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.5,
      })
      const ring = new THREE.Mesh(geo, mat)
      ring.rotation.x = -Math.PI / 2
      ring.position.set(spot.x, 0.02, -spot.z) // z is negative in spot data, positive in scene toward hoop
      this.scene.add(ring)
      this.spotMarkers.push(ring)
    })
  }

  _buildCrowd() {
    // Simple colored box rows for crowd silhouettes
    const colors = [0x1a1a4e, 0x2a2a5e, 0x1D428A]
    for (let row = 0; row < 4; row++) {
      for (let col = -12; col <= 12; col += 1.2) {
        const h = 1.2 + Math.random() * 0.6
        const geo = new THREE.BoxGeometry(0.9, h, 0.4)
        const mat = new THREE.MeshStandardMaterial({ color: colors[Math.floor(Math.random() * colors.length)] })
        const mesh = new THREE.Mesh(geo, mat)
        const side = Math.random() < 0.5 ? -1 : 1
        mesh.position.set(col, h / 2, side * (16 + row * 1.5))
        this.scene.add(mesh)
      }
    }
  }

  update(dt) {
    this._animTime += dt
    this.spotMarkers.forEach((ring, i) => {
      // gentle pulse for all inactive markers
      ring.material.emissiveIntensity = 0.2 + 0.15 * Math.sin(this._animTime * 2 + i)
    })
  }

  highlightSpot(idx) {
    this.spotMarkers.forEach((ring, i) => {
      if (i === idx) {
        ring.material.opacity = 1.0
        ring.material.emissiveIntensity = 1.0
        ring.scale.setScalar(1.2)
      } else {
        ring.material.opacity = 0.4
        ring.material.emissiveIntensity = 0.2
        ring.scale.setScalar(1.0)
      }
    })
  }
}
