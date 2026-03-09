export class HUD {
  constructor() {
    this._hud = document.getElementById('hud')
    this._modeDisplay = document.getElementById('mode-display')
    this._timer = document.getElementById('timer')
    this._streak = document.getElementById('streak-badge')
    this._multiplier = document.getElementById('multiplier-display')

    // Create stat elements
    this._ptsVal = document.getElementById('hud-pts')
    this._fgVal = document.getElementById('hud-fg')
    this._threeVal = document.getElementById('hud-three')

    if (!this._ptsVal) this._buildHUDElements()
  }

  _buildHUDElements() {
    const hud = document.getElementById('hud')
    if (!hud) return
    hud.innerHTML = `
      <div class="hud-stat"><div class="hud-label">PTS</div><div class="hud-value" id="hud-pts">0</div></div>
      <div class="hud-stat"><div class="hud-label">FG%</div><div class="hud-value" id="hud-fg">-</div></div>
      <div class="hud-stat"><div class="hud-label">3PT%</div><div class="hud-value" id="hud-three">-</div></div>
      <div id="streak-badge" style="display:none"></div>
      <div id="timer" style="margin-left:auto;display:none"></div>
    `
    this._ptsVal = document.getElementById('hud-pts')
    this._fgVal = document.getElementById('hud-fg')
    this._threeVal = document.getElementById('hud-three')
    this._streak = document.getElementById('streak-badge')
    this._timer = document.getElementById('timer')
  }

  update({ points, shots, makes, threes, threeMakes, streak, coldStreak, timeLeft, multiplier }) {
    if (this._ptsVal) this._ptsVal.textContent = points
    if (this._fgVal) this._fgVal.textContent = shots > 0 ? ((makes / shots) * 100).toFixed(0) + '%' : '-'
    if (this._threeVal) this._threeVal.textContent = threes > 0 ? ((threeMakes / threes) * 100).toFixed(0) + '%' : '-'

    this.showStreak(streak, coldStreak)

    if (multiplier !== undefined && multiplier > 1 && this._multiplier) {
      this._multiplier.style.display = 'block'
      this._multiplier.textContent = `${multiplier.toFixed(1)}×`
    } else if (this._multiplier) {
      this._multiplier.style.display = 'none'
    }
  }

  showStreak(streak, coldStreak) {
    const el = this._streak
    if (!el) return
    if (streak >= 5) {
      el.style.display = 'inline-block'
      el.className = 'on-fire'
      el.textContent = '🔥 ON FIRE'
    } else if (streak >= 3) {
      el.style.display = 'inline-block'
      el.className = 'heating-up'
      el.textContent = '🔥 HEATING UP'
    } else if (coldStreak >= 3) {
      el.style.display = 'inline-block'
      el.className = 'ice-cold'
      el.textContent = '❄️ ICE COLD'
    } else {
      el.style.display = 'none'
    }
  }

  setTimer(seconds) {
    if (!this._timer) return
    if (seconds === null || seconds === undefined) {
      this._timer.style.display = 'none'
      return
    }
    this._timer.style.display = 'block'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    this._timer.textContent = `${m}:${s.toString().padStart(2, '0')}`
    this._timer.style.color = seconds < 15 ? '#ff4444' : '#FFC72C'
  }

  setMode(name) {
    const el = document.getElementById('mode-display')
    if (el) el.textContent = name
  }

  setVisible(v) {
    if (this._hud) this._hud.style.display = v ? 'flex' : 'none'
  }
}
