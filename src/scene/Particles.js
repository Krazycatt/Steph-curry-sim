import * as THREE from 'three'
import { randomRange } from '../utils/math.js'

const POOL_SIZE = 120

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene
    this.pool = []
    this.active = []

    const geo = new THREE.SphereGeometry(0.06, 4, 4)
    for (let i = 0; i < POOL_SIZE; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xFFC72C, transparent: true, opacity: 0 })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.visible = false
      scene.add(mesh)
      this.pool.push({ mesh, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 1 })
    }
  }

  burst(position, count = 80, color = 0xFFC72C) {
    let spawned = 0
    for (const p of this.pool) {
      if (p.life <= 0 && spawned < count) {
        p.mesh.visible = true
        p.mesh.position.copy(position)
        p.mesh.material.color.setHex(color)
        p.vx = randomRange(-5, 5)
        p.vy = randomRange(3, 9)
        p.vz = randomRange(-5, 5)
        p.maxLife = randomRange(0.8, 1.5)
        p.life = p.maxLife
        this.active.push(p)
        spawned++
      }
    }
  }

  update(dt) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i]
      p.life -= dt
      if (p.life <= 0) {
        p.mesh.visible = false
        p.mesh.material.opacity = 0
        this.active.splice(i, 1)
        continue
      }
      p.vy -= 14 * dt  // gravity
      p.mesh.position.x += p.vx * dt
      p.mesh.position.y += p.vy * dt
      p.mesh.position.z += p.vz * dt
      p.mesh.material.opacity = p.life / p.maxLife
    }
  }
}
