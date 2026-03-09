export class HeadToHead {
  constructor(game) {
    this.game = game
    this.name = 'HEAD TO HEAD'
    this.rounds = 5
    this.currentRound = 0
    this.p1Score = 0
    this.p2Score = 0
    this._phase = 'p1'  // 'p1' | 'pass' | 'p2' | 'result'
    this._p1Made = false
    this._currentSpot = 0
  }

  start() {
    this.currentRound = 0
    this.p1Score = 0
    this.p2Score = 0
    this._phase = 'p1'
    this.game.hud.setMode(`H2H — ROUND 1/5 — P1 SHOOT`)
    this.game.hud.setTimer(null)
    this.game.defender.setVisible(false)
    this._pickSpotForRound()
  }

  _pickSpotForRound() {
    this._currentSpot = Math.floor(Math.random() * 8)
    this.game.selectSpot(this._currentSpot)
  }

  update(dt) {}

  onShotResult(made, points, spot) {
    if (this._phase === 'p1') {
      this._p1Made = made
      this._phase = 'pass'
      this._showPassBanner()
    } else if (this._phase === 'p2') {
      const p2Made = made
      // Scoring: P1 make + P2 miss = P1 point, P2 make + P1 miss = P2 point
      if (this._p1Made && !p2Made) this.p1Score++
      else if (!this._p1Made && p2Made) this.p2Score++
      // Both same = tie, no point
      this.currentRound++
      this._phase = 'result'
      if (this.currentRound >= this.rounds) {
        setTimeout(() => this.end(), 1500)
      } else {
        this._phase = 'p1'
        this.game.hud.setMode(`H2H — ROUND ${this.currentRound + 1}/5 — P1 SHOOT`)
        setTimeout(() => this._pickSpotForRound(), 1200)
      }
    }
  }

  _showPassBanner() {
    const banner = document.getElementById('pass-banner')
    if (banner) {
      banner.style.display = 'flex'
      banner.innerHTML = `
        <div style="text-align:center">
          <div>PASS THE DEVICE</div>
          <div style="font-size:0.5em;color:#aaa;margin-top:8px">P2 — SHOOT FROM THE SAME SPOT</div>
          <button class="menu-btn" id="p2-ready" style="margin-top:20px;font-size:0.45em">P2 READY →</button>
        </div>
      `
      document.getElementById('p2-ready')?.addEventListener('click', () => {
        banner.style.display = 'none'
        this._phase = 'p2'
        this.game.hud.setMode(`H2H — ROUND ${this.currentRound + 1}/5 — P2 SHOOT`)
        this.game.selectSpot(this._currentSpot)
      })
    }
  }

  end() {
    const winner = this.p1Score > this.p2Score ? 'PLAYER 1' : this.p2Score > this.p1Score ? 'PLAYER 2' : null
    const loserQuotes = [
      '"That\'s tough, man." — Steph Curry',
      '"We\'ll get \'em next time." — SC',
      '"Keep shooting." — Steph',
    ]
    const quote = loserQuotes[Math.floor(Math.random() * loserQuotes.length)]

    const overlay = document.createElement('div')
    overlay.style.cssText = `position:fixed;inset:0;background:rgba(10,10,30,0.97);z-index:200;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white`
    overlay.innerHTML = `
      <div style="font-size:3em;margin-bottom:12px">${winner ? '👑' : '🤝'}</div>
      <div style="font-size:2.2em;color:#FFC72C;font-weight:bold">${winner ? winner + ' WINS!' : 'TIE GAME!'}</div>
      <div style="font-size:1.4em;margin:16px 0">${this.p1Score} — ${this.p2Score}</div>
      ${!winner ? '' : `<div style="color:#aaa;font-style:italic;margin-bottom:20px">${quote}</div>`}
      <button class="menu-btn" id="h2h-done">← MAIN MENU</button>
    `
    document.body.appendChild(overlay)
    document.getElementById('h2h-done')?.addEventListener('click', () => {
      document.body.removeChild(overlay)
      this.game.showMenu()
    })
  }
}
