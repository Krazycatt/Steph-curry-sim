import { SHOT_SPOTS } from '../data/shotSpots.js'

export class ShotChallenge {
  constructor(game) {
    this.game = game
    this.name = 'SHOT CHALLENGE'
    this.totalShots = 30
    this.shotsTaken = 0
  }

  start() {
    this.shotsTaken = 0
    this.game.hud.setMode('SHOT CHALLENGE — 30 SHOTS')
    this.game.hud.setTimer(null)
    this.game.defender.setVisible(false)
    // Force spot 0 to start
    this.game.selectSpot(0)
  }

  update(dt) {}

  onShotResult(made, points, spot) {
    this.shotsTaken++
    // Advance to next spot in cycle
    if (this.shotsTaken < this.totalShots) {
      const nextIdx = this.shotsTaken % SHOT_SPOTS.length
      // Small delay before moving to next spot (handled by game's result delay)
      setTimeout(() => this.game.selectSpot(nextIdx), 100)
    } else {
      setTimeout(() => this.end(), 2200)
    }
  }

  end() {
    const stats = this.game.stats
    this.game.leaderboard.showScoreEntry(
      stats.points,
      { ...stats },
      'challenge',
      (name) => {
        if (name) this.game.scoreService.saveScore('challenge', name, stats.points, stats)
        this.game.showMenu()
      }
    )
  }
}
