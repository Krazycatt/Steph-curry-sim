import * as THREE from 'three'
import { lerp } from '../utils/math.js'
import { RIM_Y, RIM_Z, CAM_LERP } from '../data/constants.js'

export class CameraController {
  constructor() {
    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200)
    this.camera.position.set(0, 5, -10)

    this.mode = 'FOLLOW_CURRY'
    this._yaw = 0
    this._rimcamTimer = 0
    this._rimcamDuration = 0
    this._prevMode = 'FOLLOW_CURRY'

    this._targetPos = new THREE.Vector3()
    this._targetLookAt = new THREE.Vector3(0, RIM_Y, RIM_Z)
    this._currentLookAt = new THREE.Vector3(0, RIM_Y, RIM_Z)

    window.addEventListener('resize', () => this.handleResize())
  }

  setMode(mode, duration = 0) {
    if (mode === 'RIMCAM') {
      this._prevMode = this.mode
      this._rimcamTimer = duration || 1500
      this._rimcamDuration = this._rimcamTimer
    }
    this.mode = mode
  }

  onMouseDrag(dx) {
    this._yaw += dx * 0.005
    this._yaw = Math.max(-Math.PI * 0.4, Math.min(Math.PI * 0.4, this._yaw))
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
  }

  update(dt, curryPos, ballPos, ballInFlight) {
    // Rimcam countdown
    if (this.mode === 'RIMCAM') {
      this._rimcamTimer -= dt * 1000
      if (this._rimcamTimer <= 0) {
        this.mode = this._prevMode
      }
    }

    let tp = this._targetPos
    let tl = this._targetLookAt

    if (this.mode === 'FOLLOW_CURRY') {
      const offsetX = Math.sin(this._yaw) * 5.5
      const offsetZ = -Math.cos(this._yaw) * 5.5
      tp.set(
        curryPos.x + offsetX,
        curryPos.y + 3.5,
        curryPos.z + offsetZ,
      )
      tl.set(curryPos.x, curryPos.y + 1.5, curryPos.z)
    } else if (this.mode === 'SHOT_FOLLOW') {
      tp.set(ballPos.x, ballPos.y + 1.2, ballPos.z - 3.5)
      tl.set(ballPos.x, ballPos.y, ballPos.z)
    } else if (this.mode === 'RIMCAM') {
      tp.set(0, RIM_Y - 0.5, RIM_Z - 1.2)
      tl.set(0, RIM_Y + 1.5, RIM_Z + 1)
    }

    // Lerp camera position and lookAt
    const lf = Math.min(CAM_LERP * 60 * dt, 1)
    this.camera.position.lerp(tp, lf)
    this._currentLookAt.lerp(tl, lf)
    this.camera.lookAt(this._currentLookAt)
  }
}
