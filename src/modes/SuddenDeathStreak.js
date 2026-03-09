import { SHOT_SPOTS } from '../data/shotSpots.js'

export class SuddenDeathStreak {
  constructor(game) {
    this.game = game
    this.name = 'SUDDEN DEATH'
    this.multiplier = 1.0
    this.consecutiveMakes = 0
    this._lastSpotIdx = -1
  }

  start() {
    this.multiplier = 1.0
    this.consecutiveMakes = 0
    this.game.hud.setMode('SUDDEN DEATH STREAK')
    this.game.hud.setTimer(null)
    this.game.defender.setVisible(false)
    this._pickRandomSpot()
  }

  _pickRandomSpot() {
    let idx
    do {
      idx = Math.floor(Math.random() * SHOT_SPOTS.length)
    } while (idx === this._lastSpotIdx && SHOT_SPOTS.length > 1)
    this._lastSpotIdx = idx
    this.game.selectSpot(idx)
  }

  update(dt) {}

  onShotResult(made, points, spot) {
    if (!made) {
      setTimeout(() => this.end(), 2000)
      return
    }

    this.consecutiveMakes++
    // Every 3 consecutive makes, increase multiplier by 0.5
    if (this.consecutiveMakes % 3 === 0) {
      this.multiplier += 0.5
      this.game.toast.show(`${this.multiplier.toFixed(1)}× MULTIPLIER!`, 1500)
    }

    // Apply multiplier to points (already added base points in Game.js — add the bonus here)
    const bonus = Math.floor(points * (this.multiplier - 1))
    if (bonus > 0) {
      this.game.stats.points += bonus
    }

    // Update HUD multiplier display
    this.game.hud.update({ ...this.game.stats, multiplier: this.multiplier })

    setTimeout(() => this._pickRandomSpot(), 200)
  }

  end() {
    const stats = this.game.stats
    this.game.leaderboard.showScoreEntry(
      stats.points,
      { ...stats, bestStreak: this.consecutiveMakes },
      'streak',
      (name) => {
        if (name) this.game.scoreService.saveScore('streak', name, stats.points, {
          ...stats, bestStreak: this.consecutiveMakes
        })
        this.game.showMenu()
      }
    )
  }
}
