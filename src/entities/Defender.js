import * as THREE from 'three'
import { lerp } from '../utils/math.js'
import { RIM_Z } from '../data/constants.js'

function box(w, h, d, color) {
  const geo = new THREE.BoxGeometry(w, h, d)
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 })
  return new THREE.Mesh(geo, mat)
}

export class Defender {
  constructor(scene) {
    this.scene = scene
    this.root = new THREE.Group()
    this.root.visible = false
    scene.add(this.root)
    this._build()
    this._targetPos = new THREE.Vector3(3, 0, -2)
    this._animTime = 0
    this._contesting = false
  }

  _build() {
    // Simple blocky defender in white jersey
    const body = box(0.42, 0.58, 0.24, 0xffffff)
    body.position.y = 0.29
    this.root.add(body)

    const shorts = box(0.44, 0.22, 0.24, 0x333333)
    shorts.position.y = 0.11
    this.root.add(shorts)

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x7a4520, roughness: 0.9 })
    )
    head.position.y = 0.87 + 0.17
    this.root.add(head)

    this.rightArm = new THREE.Group()
    this.rightArm.position.set(0.28, 0.78, 0)
    this.root.add(this.rightArm)
    const ra = box(0.1, 0.55, 0.1, 0x7a4520)
    this.rightArm.add(ra)

    this.leftArm = new THREE.Group()
    this.leftArm.position.set(-0.28, 0.78, 0)
    this.root.add(this.leftArm)
    const la = box(0.1, 0.55, 0.1, 0x7a4520)
    this.leftArm.add(la)

    this.root.position.y = 0
  }

  setVisible(v) {
    this.root.visible = v
  }

  update(dt, curryPos, modeActive, timeLeft, curryAnimState) {
    if (!this.root.visible) return
    this._animTime += dt

    // Determine target position: offset from curry toward hoop
    const dx = 0 - curryPos.x
    const dz = RIM_Z - curryPos.z
    const len = Math.sqrt(dx * dx + dz * dz)
    const defDist = modeActive && timeLeft < 60 ? 1.2 : 1.8
    this._targetPos.set(
      curryPos.x + (dx / len) * defDist,
      0,
      curryPos.z + (dz / len) * defDist
    )

    this.root.position.x = lerp(this.root.position.x, this._targetPos.x, 0.05)
    this.root.position.z = lerp(this.root.position.z, this._targetPos.z, 0.05)

    // Face curry
    const faceDx = curryPos.x - this.root.position.x
    const faceDz = curryPos.z - this.root.position.z
    this.root.rotation.y = Math.atan2(faceDx, faceDz)

    // Contest arms
    this._contestng = curryAnimState === 'windUp' || curryAnimState === 'release'
    const targetArmX = this._contestng ? -1.8 : -0.3
    this.rightArm.rotation.x = lerp(this.rightArm.rotation.x, targetArmX, 0.12)
    this.leftArm.rotation.x = lerp(this.leftArm.rotation.x, targetArmX, 0.12)

    // Defensive shuffle bob
    this.root.position.y = Math.abs(Math.sin(this._animTime * 4)) * 0.03
  }
}
