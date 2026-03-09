export class InputManager {
  constructor() {
    this._down = new Set()
    this._justPressed = new Set()
    this._justReleased = new Set()
    this.mouseDelta = { dx: 0, dy: 0 }
    this._mouseDown = false
    this._lastMouseX = 0

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
    window.addEventListener('mousedown', (e) => {
      this._mouseDown = true
      this._lastMouseX = e.clientX
    })
    window.addEventListener('mouseup', () => { this._mouseDown = false })
    window.addEventListener('mousemove', (e) => {
      if (this._mouseDown) {
        this.mouseDelta.dx += e.clientX - this._lastMouseX
        this._lastMouseX = e.clientX
      }
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
