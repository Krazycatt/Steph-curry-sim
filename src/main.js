import './style.css'
import { Game } from './game/Game.js'

// Build spot selection buttons into DOM
function buildSpotButtons(game) {
  let container = document.getElementById('spot-buttons')
  if (!container) {
    container = document.createElement('div')
    container.id = 'spot-buttons'
    document.body.appendChild(container)
  }
  const spots = ['RC', 'RW', 'TOK', 'LW', 'LC', 'L3', 'RE', 'LE']
  spots.forEach((name, i) => {
    const btn = document.createElement('button')
    btn.className = 'spot-btn'
    btn.textContent = `${i + 1}:${name}`
    btn.addEventListener('click', () => game.selectSpot(i))
    container.appendChild(btn)
  })
}

// Build HUD shell
function buildHUD() {
  let hud = document.getElementById('hud')
  if (!hud) {
    hud = document.createElement('div')
    hud.id = 'hud'
    document.body.appendChild(hud)
  }

  // mode display
  if (!document.getElementById('mode-display')) {
    const md = document.createElement('div')
    md.id = 'mode-display'
    document.body.appendChild(md)
  }

  // timing wrap
  if (!document.getElementById('timing-wrap')) {
    const tw = document.createElement('div')
    tw.id = 'timing-wrap'
    tw.style.display = 'none'
    tw.innerHTML = `
      <div id="timing-label">HOLD [SPACE] — RELEASE AT SWEET SPOT</div>
      <div id="timing-track">
        <div id="timing-sweet"></div>
        <div id="timing-needle"></div>
      </div>
    `
    document.body.appendChild(tw)
  }

  // pass banner
  if (!document.getElementById('pass-banner')) {
    const pb = document.createElement('div')
    pb.id = 'pass-banner'
    pb.style.display = 'none'
    document.body.appendChild(pb)
  }

  // multiplier display
  if (!document.getElementById('multiplier-display')) {
    const md = document.createElement('div')
    md.id = 'multiplier-display'
    md.style.display = 'none'
    document.body.appendChild(md)
  }

  // leaderboard screen
  if (!document.getElementById('leaderboard-screen')) {
    const ls = document.createElement('div')
    ls.id = 'leaderboard-screen'
    ls.style.display = 'none'
    document.body.appendChild(ls)
  }

  // menu
  if (!document.getElementById('menu')) {
    const m = document.createElement('div')
    m.id = 'menu'
    document.body.appendChild(m)
  }
}

buildHUD()
const game = new Game()
buildSpotButtons(game)
game.start()
