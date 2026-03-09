import * as THREE from 'three'

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0a0a1e)
    this.scene.fog = new THREE.FogExp2(0x0a0a1e, 0.018)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    document.body.appendChild(this.renderer.domElement)

    window.addEventListener('resize', () => this.handleResize())
  }

  handleResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  render(camera) {
    this.renderer.render(this.scene, camera)
  }
}
