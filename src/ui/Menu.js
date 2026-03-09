export class Menu {
  constructor(onModeSelect) {
    this._onSelect = onModeSelect
    this._el = document.getElementById('menu')
    if (!this._el) {
      this._el = document.createElement('div')
      this._el.id = 'menu'
      document.body.appendChild(this._el)
    }
    this._build()
  }

  _build() {
    this._el.innerHTML = `
      <div class="menu-title">🏀 STEPH CURRY</div>
      <div class="menu-title" style="font-size:1.8em;margin-top:-0.3em">SIMULATOR</div>
      <div class="menu-subtitle">GOLDEN STATE WARRIORS · #30</div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;margin-top:12px">
        <button class="menu-btn" data-mode="free">🏀 FREE PRACTICE</button>
        <button class="menu-btn" data-mode="challenge">🎯 SHOT CHALLENGE <span style="color:#aaa;font-size:0.8em">(30 SHOTS)</span></button>
        <button class="menu-btn" data-mode="clock">⏱ GAME CLOCK <span style="color:#aaa;font-size:0.8em">(2 MIN)</span></button>
        <button class="menu-btn" data-mode="streak">⚡ SUDDEN DEATH STREAK</button>
        <button class="menu-btn" data-mode="h2h">👥 HEAD TO HEAD</button>
        <button class="menu-btn" data-mode="leaderboard" style="background:transparent;border-color:#666;color:#aaa;font-size:0.9em">🏆 LEADERBOARD</button>
      </div>
      <div style="color:#555;font-size:0.72em;margin-top:28px;text-align:center">
        KEYS: 1-8 SELECT SPOT · SPACE SHOOT · S STEP-BACK · ESC MENU<br>
        MOUSE DRAG to orbit camera
      </div>
    `
    this._el.querySelectorAll('.menu-btn').forEach(btn => {
      btn.addEventListener('click', () => this._onSelect(btn.dataset.mode))
    })
  }

  show() { this._el.style.display = 'flex' }
  hide() { this._el.style.display = 'none' }
}
