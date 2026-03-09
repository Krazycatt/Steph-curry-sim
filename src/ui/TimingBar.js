import { HEATING_UP, ON_FIRE, ICE_COLD } from '../data/constants.js'

export class TimingBar {
  constructor() {
    this._wrap = document.getElementById('timing-wrap')
    this._needle = document.getElementById('timing-needle')
    this._sweet = document.getElementById('timing-sweet')
    this._label = document.getElementById('timing-label')

    this._needlePos = 0   // 0 to 1
    this._speed = 0
    this._running = false
    this._sweetStart = 0.35
    this._sweetWidth = 0.25
    this._direction = 1
  }

  getSweetSpotWidth(basePercent, streak, coldStreak, isStepBack, isCatchAndShoot) {
    let w = 0.12 + basePercent * 0.22   // base: 0.12 to 0.24
    if (streak >= ON_FIRE) w += 0.07
    else if (streak >= HEATING_UP) w += 0.04
    if (coldStreak >= ICE_COLD) w -= 0.05
    if (isStepBack) w += 0.06
    if (isCatchAndShoot) w += 0.04
    return Math.max(0.09, Math.min(0.38, w))
  }

  show(sweetStart, sweetWidth) {
    this._sweetStart = sweetStart
    this._sweetWidth = sweetWidth
    this._wrap.style.display = 'block'

    const pct = (v) => (v * 100).toFixed(1) + '%'
    this._sweet.style.left = pct(sweetStart)
    this._sweet.style.width = pct(sweetWidth)
    this._needle.style.left = '0%'
    this._needlePos = 0
    this._direction = 1
    this._speed = 0.55
    this._running = true

    this._label.textContent = 'HOLD [SPACE] — RELEASE AT SWEET SPOT'
  }

  hide() {
    this._wrap.style.display = 'none'
    this._running = false
  }

  startNeedle() {
    this._running = true
  }

  update(dt) {
    if (!this._running) return
    this._speed += 0.012 * dt  // very slight acceleration
    this._needlePos += this._speed * this._direction * dt

    if (this._needlePos >= 1) { this._needlePos = 1; this._direction = -1 }
    if (this._needlePos <= 0) { this._needlePos = 0; this._direction = 1 }

    this._needle.style.left = (this._needlePos * 100).toFixed(1) + '%'

    // Color feedback
    const inSweet = this._needlePos >= this._sweetStart &&
      this._needlePos <= this._sweetStart + this._sweetWidth
    this._needle.style.background = inSweet ? '#00ff66' : (
      Math.abs(this._needlePos - (this._sweetStart + this._sweetWidth / 2)) < this._sweetWidth
        ? '#ffaa00' : '#ff3300'
    )
    this._needle.style.boxShadow = `0 0 8px ${inSweet ? '#00ff66' : '#ff3300'}`
  }

  getReleaseQuality() {
    const center = this._sweetStart + this._sweetWidth / 2
    const distFromCenter = Math.abs(this._needlePos - center)
    const halfSweet = this._sweetWidth / 2

    if (distFromCenter <= halfSweet) {
      // In sweet spot — quality based on how close to center
      return 0.6 + (1 - distFromCenter / halfSweet) * 0.4
    } else {
      // Outside — quality drops off
      const overflow = distFromCenter - halfSweet
      return Math.max(0, 0.6 - overflow * 3.5)
    }
  }

  getNeedlePosition() { return this._needlePos }
}
