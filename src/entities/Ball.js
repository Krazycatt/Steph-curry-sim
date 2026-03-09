import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { BALL_RADIUS, BALL_MASS, RIM_Y } from '../data/constants.js'
import { createBallTexture } from '../utils/textures.js'

export class Ball {
  constructor(scene, physicsWorld) {
    this.scene = scene
    this.physicsWorld = physicsWorld
    this.active = false

    // Visual mesh
    const geo = new THREE.SphereGeometry(BALL_RADIUS, 16, 16)
    const mat = new THREE.MeshStandardMaterial({
      map: createBallTexture(),
      roughness: 0.7,
      metalness: 0.1,
    })
    this.mesh = new THREE.Mesh(geo, mat)
    this.mesh.castShadow = true
    scene.add(this.mesh)

    // Shadow circle on floor
    const shadowGeo = new THREE.CircleGeometry(0.18, 12)
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
    })
    this.shadowCircle = new THREE.Mesh(shadowGeo, shadowMat)
    this.shadowCircle.rotation.x = -Math.PI / 2
    this.shadowCircle.position.y = 0.01
    scene.add(this.shadowCircle)

    // Physics body
    this.body = new CANNON.Body({
      mass: BALL_MASS,
      linearDamping: 0.02,
      angularDamping: 0.1,
    })
    this.body.addShape(new CANNON.Sphere(BALL_RADIUS))
    this.body.collisionFilterGroup = 1
    this.body.collisionFilterMask = 1
    // Don't add to physics world until launched
  }

  launch(position, velocity, angularVelocity) {
    this.body.position.set(position.x, position.y, position.z)
    this.body.velocity.copy(velocity)
    this.body.angularVelocity.copy(angularVelocity)
    this.body.wakeUp()
    if (!this.active) {
      this.physicsWorld.add(this.body)
      this.active = true
    }
  }

  reset(position) {
    if (this.active) {
      this.physicsWorld.remove(this.body)
      this.active = false
    }
    this.body.velocity.set(0, 0, 0)
    this.body.angularVelocity.set(0, 0, 0)
    this.carry(position)
  }

  // Move ball to position when not in flight (carrying / dribbling)
  carry(position) {
    this.mesh.position.copy(position)
    this.shadowCircle.position.x = position.x
    this.shadowCircle.position.z = position.z
    const heightFrac = Math.max(0, Math.min(1, position.y / 4))
    this.shadowCircle.material.opacity = 0.35 * (1 - heightFrac * 0.8)
    this.shadowCircle.scale.setScalar(0.6 + heightFrac * 0.4)
  }

  sync() {
    if (!this.active) return
    this.mesh.position.set(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z,
    )
    this.mesh.quaternion.set(
      this.body.quaternion.x,
      this.body.quaternion.y,
      this.body.quaternion.z,
      this.body.quaternion.w,
    )
  }

  update() {
    if (!this.active) return
    const ballY = this.mesh.position.y
    const maxHeight = 8
    const heightFrac = Math.max(0, Math.min(1, ballY / maxHeight))
    // Shadow follows ball, scales with height
    this.shadowCircle.position.x = this.mesh.position.x
    this.shadowCircle.position.z = this.mesh.position.z
    this.shadowCircle.material.opacity = 0.35 * (1 - heightFrac * 0.7)
    const shadowScale = 0.5 + heightFrac * 0.5
    this.shadowCircle.scale.setScalar(shadowScale)
  }

  get position() { return this.mesh.position }
  get prevY() { return this._prevY }
  savePrevY() { this._prevY = this.mesh.position.y }
}
