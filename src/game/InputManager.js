export class InputManager {
  constructor() {
    this._down = new Set()
    this._justPressed = new Set()
    this._justReleased = new Set()
    this.mouseDelta = { dx: 0, dy: 0 }
    this.pointerLocked = false

    window.addEventListener('keydown', (e) => {
      if (!this._down.has(e.code)) {
        this._down.add(e.code)
        this._justPressed.add(e.code)
      }
    })
    window.addEventListener('keyup', (e) => {
      this._down.delete(e.code)
      this._justReleased.add(e.code)
    })
    window.addEventListener('mousemove', (e) => {
      if (this.pointerLocked) {
        this.mouseDelta.dx += e.movementX
        this.mouseDelta.dy += e.movementY
      }
    })
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = !!document.pointerLockElement
    })
  }

  requestPointerLock(canvas) {
    canvas.addEventListener('click', () => {
      if (!this.pointerLocked) canvas.requestPointerLock()
    })
  }

  isKeyDown(code) { return this._down.has(code) }
  isKeyJustPressed(code) { return this._justPressed.has(code) }
  isKeyJustReleased(code) { return this._justReleased.has(code) }

  flush() {
    this._justPressed.clear()
    this._justReleased.clear()
    this.mouseDelta.dx = 0
    this.mouseDelta.dy = 0
  }
}
