import * as THREE from 'three'
import { lerp, clamp } from '../utils/math.js'
import { SKIN } from '../data/constants.js'

function limb(rTop, rBot, h, color) {
  const geo = new THREE.CylinderGeometry(rTop, rBot, h, 8)
  geo.translate(0, -h / 2, 0)  // pivot at top
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 })
  return new THREE.Mesh(geo, mat)
}

function box(w, h, d, color) {
  const geo = new THREE.BoxGeometry(w, h, d)
  geo.translate(0, -h / 2, 0)  // pivot at top
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 })
  return new THREE.Mesh(geo, mat)
}

export class CurryCharacter {
  constructor(scene) {
    this.scene = scene
    this.root = new THREE.Group()
    scene.add(this.root)

    this.targetPos = new THREE.Vector3(0, 0, 0)
    this.velocity = new THREE.Vector3()
    this.movementSpeed = 0
    this.MAX_SPEED = 4.5
    this._stationaryTime = 0
    this.animState = 'idle'
    this._animTime = 0
    this._stateTime = 0
    this._dribblePhase = 0
    this._celebCount = 0

    this._build()
  }

  _build() {
    const GOLD_C = 0xFFC72C
    const BLUE_C = 0x1D428A
    const WHITE_C = 0xffffff
    const SKIN_C = 0x8D5524

    // Hips (root child)
    this.hips = new THREE.Group()
    this.root.add(this.hips)
    this.root.position.y = 0

    // Torso (child of hips, y-offset up from hips)
    this.torsoGroup = new THREE.Group()
    this.torsoGroup.position.y = -0.22  // pivot at hips top
    this.hips.add(this.torsoGroup)

    const torsoMesh = new THREE.Mesh(
      (() => { const g = new THREE.BoxGeometry(0.44, 0.55, 0.24); g.translate(0, 0.275, 0); return g })(),
      new THREE.MeshStandardMaterial({ color: GOLD_C, roughness: 0.8 })
    )
    torsoMesh.castShadow = true
    this.torsoGroup.add(torsoMesh)

    // Head
    this.headGroup = new THREE.Group()
    this.headGroup.position.y = 0.55 + 0.02  // on top of torso
    this.torsoGroup.add(this.headGroup)

    const headMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 10, 10),
      new THREE.MeshStandardMaterial({ color: SKIN_C, roughness: 0.9 })
    )
    headMesh.position.y = 0.17
    headMesh.castShadow = true
    this.headGroup.add(headMesh)

    // Headband
    const bandGeo = new THREE.TorusGeometry(0.175, 0.025, 6, 20)
    const band = new THREE.Mesh(bandGeo, new THREE.MeshStandardMaterial({ color: WHITE_C }))
    band.rotation.x = Math.PI / 2
    band.position.y = 0.24
    this.headGroup.add(band)

    // Right arm (shooting arm)
    this.rightShoulderGroup = new THREE.Group()
    this.rightShoulderGroup.position.set(0.27, 0.48, 0)  // shoulder position on torso
    this.torsoGroup.add(this.rightShoulderGroup)

    this.rightUpperArm = limb(0.07, 0.065, 0.30, SKIN_C)
    this.rightUpperArm.castShadow = true
    this.rightShoulderGroup.add(this.rightUpperArm)

    this.rightElbowGroup = new THREE.Group()
    this.rightElbowGroup.position.y = -0.30
    this.rightShoulderGroup.add(this.rightElbowGroup)

    this.rightForearm = limb(0.065, 0.055, 0.28, SKIN_C)
    this.rightForearm.castShadow = true
    this.rightElbowGroup.add(this.rightForearm)

    this.rightWristGroup = new THREE.Group()
    this.rightWristGroup.position.y = -0.28
    this.rightElbowGroup.add(this.rightWristGroup)

    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8),
      new THREE.MeshStandardMaterial({ color: SKIN_C, roughness: 0.9 }))
    this.rightWristGroup.add(rightHand)

    // Wristband
    const wristband = new THREE.Mesh(
      new THREE.TorusGeometry(0.075, 0.02, 6, 16),
      new THREE.MeshStandardMaterial({ color: WHITE_C })
    )
    wristband.rotation.x = Math.PI / 2
    this.rightWristGroup.add(wristband)

    // Left arm
    this.leftShoulderGroup = new THREE.Group()
    this.leftShoulderGroup.position.set(-0.27, 0.48, 0)
    this.torsoGroup.add(this.leftShoulderGroup)

    this.leftUpperArm = limb(0.07, 0.065, 0.30, SKIN_C)
    this.leftUpperArm.castShadow = true
    this.leftShoulderGroup.add(this.leftUpperArm)

    this.leftElbowGroup = new THREE.Group()
    this.leftElbowGroup.position.y = -0.30
    this.leftShoulderGroup.add(this.leftElbowGroup)

    this.leftForearm = limb(0.065, 0.055, 0.28, SKIN_C)
    this.leftForearm.castShadow = true
    this.leftElbowGroup.add(this.leftForearm)

    // Hips box mesh
    const hipsMesh = new THREE.Mesh(
      (() => { const g = new THREE.BoxGeometry(0.42, 0.22, 0.22); g.translate(0, -0.11, 0); return g })(),
      new THREE.MeshStandardMaterial({ color: BLUE_C, roughness: 0.8 })
    )
    hipsMesh.castShadow = true
    this.hips.add(hipsMesh)

    // Legs
    this.rightHipGroup = new THREE.Group()
    this.rightHipGroup.position.set(0.13, -0.11, 0)
    this.hips.add(this.rightHipGroup)

    this.rightThigh = limb(0.085, 0.078, 0.35, BLUE_C)
    this.rightThigh.castShadow = true
    this.rightHipGroup.add(this.rightThigh)

    this.rightKneeGroup = new THREE.Group()
    this.rightKneeGroup.position.y = -0.35
    this.rightHipGroup.add(this.rightKneeGroup)

    this.rightShin = limb(0.075, 0.065, 0.33, BLUE_C)
    this.rightShin.castShadow = true
    this.rightKneeGroup.add(this.rightShin)

    this.rightAnkleGroup = new THREE.Group()
    this.rightAnkleGroup.position.y = -0.33
    this.rightKneeGroup.add(this.rightAnkleGroup)

    const rightFoot = new THREE.Mesh(
      (() => { const g = new THREE.BoxGeometry(0.12, 0.07, 0.24); g.translate(0.01, -0.035, 0.05); return g })(),
      new THREE.MeshStandardMaterial({ color: WHITE_C, roughness: 0.7 })
    )
    rightFoot.castShadow = true
    this.rightAnkleGroup.add(rightFoot)

    this.leftHipGroup = new THREE.Group()
    this.leftHipGroup.position.set(-0.13, -0.11, 0)
    this.hips.add(this.leftHipGroup)

    this.leftThigh = limb(0.085, 0.078, 0.35, BLUE_C)
    this.leftThigh.castShadow = true
    this.leftHipGroup.add(this.leftThigh)

    this.leftKneeGroup = new THREE.Group()
    this.leftKneeGroup.position.y = -0.35
    this.leftHipGroup.add(this.leftKneeGroup)

    this.leftShin = limb(0.075, 0.065, 0.33, BLUE_C)
    this.leftShin.castShadow = true
    this.leftKneeGroup.add(this.leftShin)

    this.leftAnkleGroup = new THREE.Group()
    this.leftAnkleGroup.position.y = -0.33
    this.leftKneeGroup.add(this.leftAnkleGroup)

    const leftFoot = new THREE.Mesh(
      (() => { const g = new THREE.BoxGeometry(0.12, 0.07, 0.24); g.translate(-0.01, -0.035, 0.05); return g })(),
      new THREE.MeshStandardMaterial({ color: WHITE_C, roughness: 0.7 })
    )
    leftFoot.castShadow = true
    this.leftAnkleGroup.add(leftFoot)

    // Jersey number hint - small box on front of torso
    const numMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.18, 0.01),
      new THREE.MeshStandardMaterial({ color: BLUE_C })
    )
    numMesh.position.set(0, 0.25, 0.125)
    this.torsoGroup.add(numMesh)

    // Place hips at character height
    this.hips.position.y = 0.90
  }

  setAnim(state) {
    if (this.animState === state) return
    this.animState = state
    this._stateTime = 0
    this._celebCount = 0
  }

  moveTo(pos) {
    this.targetPos.set(pos.x, 0, pos.z)
  }

  get position() { return this.root.position }
  get isStationary() { return this._stationaryTime > 1.5 }

  update(dt) {
    this._animTime += dt
    this._stateTime += dt
    const t = this._animTime

    const velLen = this.velocity.length()
    let animSpeed = 0

    if (velLen > 0.01) {
      // Velocity-based free movement (WASD)
      this.root.position.x += this.velocity.x * dt
      this.root.position.z += this.velocity.z * dt
      // Keep targetPos in sync so lerp doesn't fight velocity
      this.targetPos.copy(this.root.position)
      this._stationaryTime = 0
      // Face direction of velocity
      this.root.rotation.y = Math.atan2(this.velocity.x, this.velocity.z)
      if (this.animState !== 'move' && this.animState !== 'windUp' && this.animState !== 'release') {
        this.setAnim('move')
      }
      animSpeed = velLen
    } else {
      this._stationaryTime += dt

      // Lerp toward target (spot selection / step-back)
      const dx = this.targetPos.x - this.root.position.x
      const dz = this.targetPos.z - this.root.position.z
      const dist = Math.sqrt(dx * dx + dz * dz)

      if (dist > 0.05) {
        const speed = Math.min(dist * 6, 5) * dt
        this.root.position.x += (dx / dist) * speed
        this.root.position.z += (dz / dist) * speed
        this.root.rotation.y = Math.atan2(dx, dz)
        if (this.animState !== 'move' && this.animState !== 'windUp' && this.animState !== 'release') {
          this.setAnim('move')
        }
        animSpeed = dist
      } else if (this.animState === 'move') {
        this.setAnim('idle')
      }
    }

    // Clamp to court bounds
    this.root.position.x = clamp(this.root.position.x, -9, 9)
    this.root.position.z = clamp(this.root.position.z, 0, 12)

    this.movementSpeed = velLen

    // Always face the hoop when idle/dribbling
    if (this.animState === 'idle' || this.animState === 'dribble') {
      const targetYaw = Math.atan2(0 - this.root.position.x, 13 - this.root.position.z)
      this.root.rotation.y = lerp(this.root.rotation.y, targetYaw, 0.08)
    }

    // Reset arms/legs to neutral each frame before applying animation
    this._resetPose()

    switch (this.animState) {
      case 'idle': this._animIdle(t); break
      case 'dribble': this._animDribble(t); break
      case 'move': this._animMove(t, animSpeed); break
      case 'windUp': this._animWindUp(this._stateTime); break
      case 'release': this._animRelease(this._stateTime); break
      case 'followThrough': this._animFollowThrough(t); break
      case 'shimmy': this._animShimmy(t); break
      case 'nightNight': this._animNightNight(t); break
      case 'celebrate': this._animCelebrate(t); break
      case 'dejected': this._animDejected(t); break
      case 'stepBack': this._animStepBack(this._stateTime); break
    }

    // Breathing bob (always)
    this.root.position.y = 0 + Math.sin(t * 1.5) * 0.008
  }

  _resetPose() {
    this.rightShoulderGroup.rotation.set(0, 0, 0)
    this.rightElbowGroup.rotation.set(0, 0, 0)
    this.leftShoulderGroup.rotation.set(0, 0, 0)
    this.leftElbowGroup.rotation.set(0, 0, 0)
    this.rightHipGroup.rotation.set(0, 0, 0)
    this.rightKneeGroup.rotation.set(0, 0, 0)
    this.leftHipGroup.rotation.set(0, 0, 0)
    this.leftKneeGroup.rotation.set(0, 0, 0)
    this.hips.position.y = 0.90
    this.torsoGroup.rotation.set(0, 0, 0)
  }

  _animIdle(t) {
    // Slight arm hang
    this.rightShoulderGroup.rotation.z = -0.15
    this.leftShoulderGroup.rotation.z = 0.15
    this.rightElbowGroup.rotation.z = -0.08
    this.leftElbowGroup.rotation.z = 0.08
  }

  _animDribble(t) {
    this._dribblePhase += 0.08
    const d = Math.sin(this._dribblePhase)
    this.rightShoulderGroup.rotation.x = 0.3 + d * 0.4
    this.rightElbowGroup.rotation.x = 0.5 + d * 0.3
    this.leftShoulderGroup.rotation.z = 0.15
  }

  _animMove(t, dist) {
    const speed = Math.min(dist * 3, 8)
    const legSwing = Math.sin(t * speed) * 0.5
    this.rightHipGroup.rotation.x = legSwing
    this.leftHipGroup.rotation.x = -legSwing
    this.rightKneeGroup.rotation.x = Math.max(0, -legSwing) * 0.6
    this.leftKneeGroup.rotation.x = Math.max(0, legSwing) * 0.6
    // Arm swing (opposite to legs)
    this.rightShoulderGroup.rotation.x = -legSwing * 0.4
    this.leftShoulderGroup.rotation.x = legSwing * 0.4
  }

  _animWindUp(st) {
    const p = Math.min(st / 0.4, 1)
    // Raise shooting arm
    this.rightShoulderGroup.rotation.x = lerp(0, -1.7, p)
    this.rightElbowGroup.rotation.x = lerp(0, -0.6, p)
    // Slightly bend knees
    this.rightHipGroup.rotation.x = lerp(0, 0.18, p)
    this.leftHipGroup.rotation.x = lerp(0, 0.18, p)
    this.rightKneeGroup.rotation.x = lerp(0, 0.22, p)
    this.leftKneeGroup.rotation.x = lerp(0, 0.22, p)
    this.hips.position.y = 0.90 - p * 0.08
    // Left arm out for balance
    this.leftShoulderGroup.rotation.z = lerp(0, 0.5, p)
    this.leftElbowGroup.rotation.x = lerp(0, 0.3, p)
  }

  _animRelease(st) {
    const p = Math.min(st / 0.25, 1)
    // Snap arm to full extension
    this.rightShoulderGroup.rotation.x = lerp(-1.7, -2.1, p)
    this.rightElbowGroup.rotation.x = lerp(-0.6, 0.2, p)
    // Legs straighten and rise
    this.rightHipGroup.rotation.x = lerp(0.18, -0.1, p)
    this.leftHipGroup.rotation.x = lerp(0.18, -0.1, p)
    this.rightKneeGroup.rotation.x = lerp(0.22, 0, p)
    this.leftKneeGroup.rotation.x = lerp(0.22, 0, p)
    this.hips.position.y = 0.90 - 0.08 + p * 0.12
    if (st > 0.25) this.setAnim('followThrough')
  }

  _animFollowThrough(t) {
    this.rightShoulderGroup.rotation.x = -2.0
    this.rightElbowGroup.rotation.x = 0.25
    this.leftShoulderGroup.rotation.z = 0.3
  }

  _animShimmy(t) {
    const shake = Math.sin(t * 14) * 0.18
    this.hips.rotation.y = shake
    this.torsoGroup.rotation.y = -shake * 0.7
    this.rightShoulderGroup.rotation.z = -0.2 + shake
    this.leftShoulderGroup.rotation.z = 0.2 - shake
  }

  _animNightNight(t) {
    // Both hands to side of head
    this.rightShoulderGroup.rotation.x = -0.8
    this.rightShoulderGroup.rotation.z = -0.6
    this.rightElbowGroup.rotation.z = -0.8
    this.leftShoulderGroup.rotation.x = -0.8
    this.leftShoulderGroup.rotation.z = 0.6
    this.leftElbowGroup.rotation.z = 0.8
    // Head tilt
    this.headGroup.rotation.z = Math.sin(t * 2) * 0.1 - 0.15
  }

  _animCelebrate(t) {
    // Fist pump
    const pump = Math.sin(t * 12) * 0.5
    this.rightShoulderGroup.rotation.x = -1.5 + pump
    this.rightElbowGroup.rotation.x = -0.4
    this.leftShoulderGroup.rotation.z = 0.2
  }

  _animDejected(t) {
    // Head down, hands on knees
    this.headGroup.rotation.x = 0.4
    this.rightShoulderGroup.rotation.x = 0.6
    this.leftShoulderGroup.rotation.x = 0.6
    this.rightHipGroup.rotation.x = 0.25
    this.leftHipGroup.rotation.x = 0.25
    this.rightKneeGroup.rotation.x = 0.4
    this.leftKneeGroup.rotation.x = 0.4
    this.hips.position.y = 0.85
  }

  _animStepBack(st) {
    const p = Math.min(st / 0.35, 1)
    this.rightHipGroup.rotation.x = -0.3 * p
    this.leftHipGroup.rotation.x = 0.3 * p
    this.rightShoulderGroup.rotation.x = -0.5 * p
    this.leftShoulderGroup.rotation.x = -0.3 * p
    this.hips.position.y = 0.90 - p * 0.06
  }
}
