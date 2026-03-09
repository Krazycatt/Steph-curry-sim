export class CollisionHandler {
  constructor() {
    this.rimContactCount = 0
    this.backboardHit = false
    this._listeners = []
  }

  attach(ballBody, rimBodies, backboardBody, onRimHit, onBackboardHit) {
    this.rimContactCount = 0
    this.backboardHit = false

    const rimHandler = (e) => {
      const other = e.body
      if (rimBodies.includes(other)) {
        this.rimContactCount++
        onRimHit && onRimHit()
      }
    }
    const bbHandler = (e) => {
      const other = e.body
      if (other === backboardBody) {
        this.backboardHit = true
        onBackboardHit && onBackboardHit()
      }
    }

    ballBody.addEventListener('collide', rimHandler)
    ballBody.addEventListener('collide', bbHandler)
    this._listeners.push({ body: ballBody, rimHandler, bbHandler })
  }

  detach() {
    for (const { body, rimHandler, bbHandler } of this._listeners) {
      body.removeEventListener('collide', rimHandler)
      body.removeEventListener('collide', bbHandler)
    }
    this._listeners = []
  }

  reset() {
    this.rimContactCount = 0
    this.backboardHit = false
  }
}
