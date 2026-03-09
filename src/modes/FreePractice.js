export class FreePractice {
  constructor(game) {
    this.game = game
    this.name = 'FREE PRACTICE'
  }

  start() {
    this.game.hud.setMode('FREE PRACTICE')
    this.game.hud.setTimer(null)
    this.game.defender.setVisible(false)
  }

  update(dt) {}

  onShotResult(made, points, spot) {
    // Stats are updated in Game.js — nothing extra needed for free practice
  }

  end() {}
}
