export class GameClock {
  constructor(game) {
    this.game = game
    this.name = 'GAME CLOCK'
    this.timeLeft = 120
    this._running = false
  }

  start() {
    this.timeLeft = 120
    this._running = true
    this.game.hud.setMode('GAME CLOCK')
    this.game.hud.setTimer(this.timeLeft)
    this.game.defender.setVisible(true)
    this._lastShotTime = 0
    this._spotArrivalTime = 0
  }

  onSpotSelected() {
    this._spotArrivalTime = this.timeLeft
  }

  update(dt) {
    if (!this._running) return
    this.timeLeft -= dt
    this.game.hud.setTimer(Math.max(0, this.timeLeft))

    if (this.timeLeft <= 0) {
      this._running = false
      setTimeout(() => this.end(), 1800)
    }
  }

  onShotResult(made, points, spot) {
    // Quick release bonus: if shot taken within 3s of arriving at spot
    const shotDelay = this._spotArrivalTime - this.timeLeft
    if (made && shotDelay <= 3.0 && shotDelay > 0) {
      this.game.stats.points += 1
      this.game.toast.show('+1 QUICK RELEASE!', 1200)
    }
  }

  get aggressiveDefender() {
    return this.timeLeft < 60
  }

  end() {
    this._running = false
    const stats = this.game.stats
    // Compare to Curry career averages
    const careerFG = 47.3
    const career3PT = 42.6
    const userFG = stats.shots > 0 ? (stats.makes / stats.shots * 100) : 0
    const user3PT = stats.threes > 0 ? (stats.threeMakes / stats.threes * 100) : 0

    this.game.leaderboard.showScoreEntry(
      stats.points,
      { ...stats },
      'clock',
      (name) => {
        if (name) this.game.scoreService.saveScore('clock', name, stats.points, stats)
        this.game.showMenu()
      }
    )
  }
}
