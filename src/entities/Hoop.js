import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { RIM_Y, RIM_Z, RIM_RADIUS, BACKBOARD_Z } from '../data/constants.js'
import { createBackboardTexture } from '../utils/textures.js'

export class Hoop {
  constructor(scene, physicsWorld) {
    this.scene = scene
    this.physicsWorld = physicsWorld
    this.rimBodies = []
    this.backboardBody = null
    this.netMesh = null
    this._netRipple = false
    this._netRippleTime = 0
    this._build()
  }

  _build() {
    const group = new THREE.Group()
    this.scene.add(group)

    // Support pole
    const poleGeo = new THREE.CylinderGeometry(0.05, 0.07, RIM_Y + 1, 8)
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.3 })
    const pole = new THREE.Mesh(poleGeo, poleMat)
    pole.position.set(0, (RIM_Y + 1) / 2, BACKBOARD_Z + 0.3)
    pole.castShadow = true
    this.scene.add(pole)

    // Backboard
    const bbGeo = new THREE.BoxGeometry(1.83, 1.07, 0.05)
    const bbMat = new THREE.MeshPhysicalMaterial({
      map: createBackboardTexture(),
      transparent: true,
      transmission: 0.5,
      roughness: 0.1,
      metalness: 0.05,
      color: 0xaaccff,
      opacity: 0.85,
    })
    const bb = new THREE.Mesh(bbGeo, bbMat)
    bb.position.set(0, RIM_Y + 0.535, BACKBOARD_Z)
    bb.castShadow = false
    bb.receiveShadow = true
    this.scene.add(bb)

    // Backboard physics body
    this.backboardBody = new CANNON.Body({ mass: 0 })
    this.backboardBody.addShape(new CANNON.Box(new CANNON.Vec3(0.915, 0.535, 0.025)))
    this.backboardBody.position.set(0, RIM_Y + 0.535, BACKBOARD_Z)
    this.physicsWorld.add(this.backboardBody)

    // Rim arm
    const armGeo = new THREE.BoxGeometry(0.05, 0.04, 0.42)
    const armMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.7, roughness: 0.4 })
    const arm = new THREE.Mesh(armGeo, armMat)
    arm.position.set(0, RIM_Y, BACKBOARD_Z - 0.2)
    this.scene.add(arm)

    // Rim torus
    const rimGeo = new THREE.TorusGeometry(RIM_RADIUS, 0.022, 8, 32)
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xFF6600, metalness: 0.6, roughness: 0.4 })
    const rim = new THREE.Mesh(rimGeo, rimMat)
    rim.rotation.x = Math.PI / 2
    rim.position.set(0, RIM_Y, RIM_Z)
    rim.castShadow = true
    this.scene.add(rim)

    // Rim physics — two box bodies approximating front/back of rim
    const rimFront = new CANNON.Body({ mass: 0, restitution: 0.6 })
    rimFront.addShape(new CANNON.Sphere(0.03))
    rimFront.position.set(0, RIM_Y, RIM_Z - RIM_RADIUS)
    this.physicsWorld.add(rimFront)
    this.rimBodies.push(rimFront)

    const rimBack = new CANNON.Body({ mass: 0, restitution: 0.6 })
    rimBack.addShape(new CANNON.Sphere(0.03))
    rimBack.position.set(0, RIM_Y, RIM_Z + RIM_RADIUS)
    this.physicsWorld.add(rimBack)
    this.rimBodies.push(rimBack)

    const rimLeft = new CANNON.Body({ mass: 0, restitution: 0.6 })
    rimLeft.addShape(new CANNON.Sphere(0.03))
    rimLeft.position.set(-RIM_RADIUS, RIM_Y, RIM_Z)
    this.physicsWorld.add(rimLeft)
    this.rimBodies.push(rimLeft)

    const rimRight = new CANNON.Body({ mass: 0, restitution: 0.6 })
    rimRight.addShape(new CANNON.Sphere(0.03))
    rimRight.position.set(RIM_RADIUS, RIM_Y, RIM_Z)
    this.physicsWorld.add(rimRight)
    this.rimBodies.push(rimRight)

    // Net
    this._buildNet()
  }

  _buildNet() {
    const netPoints = []
    const strands = 12
    const rings = 6
    const rimY = RIM_Y
    const rimZ = RIM_Z
    const rimR = RIM_RADIUS
    const netDepth = 0.45  // net hangs down

    // Store original vertex positions for ripple
    this._netVertices = []

    for (let s = 0; s < strands; s++) {
      const angle = (s / strands) * Math.PI * 2
      for (let r = 0; r <= rings; r++) {
        const t = r / rings
        const ringRadius = rimR * (1 - t * 0.35)
        const y = rimY - t * netDepth
        const x = Math.cos(angle) * ringRadius
        const z = rimZ + Math.sin(angle) * ringRadius
        netPoints.push(x, y, z)
        this._netVertices.push({ x, y, z })
      }
      // Connect strands at bottom
      netPoints.push(Math.cos(angle) * rimR * 0.65, rimY - netDepth, rimZ + Math.sin(angle) * rimR * 0.65)
    }

    const positions = new Float32Array(netPoints)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.85, transparent: true })
    this.netMesh = new THREE.LineSegments(geo, mat)
    this.scene.add(this.netMesh)
  }

  triggerNetRipple() {
    this._netRipple = true
    this._netRippleTime = 0
  }

  update(dt) {
    if (this._netRipple) {
      this._netRippleTime += dt
      const t = this._netRippleTime
      const pos = this.netMesh.geometry.attributes.position
      for (let i = 0; i < pos.count; i++) {
        const orig = this._netVertices[i] || { x: pos.getX(i), y: pos.getY(i), z: pos.getZ(i) }
        const wave = Math.sin(t * 18 - i * 0.4) * 0.04 * Math.exp(-t * 3)
        pos.setXYZ(i, orig.x + wave, orig.y, orig.z + wave)
      }
      pos.needsUpdate = true
      if (this._netRippleTime > 1.2) this._netRipple = false
    }
  }
}
