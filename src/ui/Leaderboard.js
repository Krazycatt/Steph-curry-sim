export class Leaderboard {
  constructor(scoreService, onClose) {
    this._svc = scoreService
    this._onClose = onClose
    this._el = document.getElementById('leaderboard-screen')
    if (!this._el) {
      this._el = document.createElement('div')
      this._el.id = 'leaderboard-screen'
      document.body.appendChild(this._el)
    }
    this._activeMode = 'challenge'
  }

  show(mode = 'challenge') {
    this._activeMode = mode
    document.exitPointerLock()
    this._el.style.display = 'flex'
    this._render()
  }

  hide() {
    this._el.style.display = 'none'
  }

  _render() {
    const modes = [
      { key: 'challenge', label: 'SHOT CHALLENGE' },
      { key: 'clock', label: 'GAME CLOCK' },
      { key: 'streak', label: 'STREAK' },
    ]
    const scores = this._svc.getScores(this._activeMode)

    const medals = ['🥇', '🥈', '🥉']

    this._el.innerHTML = `
      <h2 style="color:#FFC72C;font-size:2em;margin-bottom:0.3em">🏆 HALL OF FAME</h2>
      <div style="display:flex;gap:12px;margin-bottom:20px">
        ${modes.map(m => `
          <button onclick="" class="menu-btn lb-tab ${m.key === this._activeMode ? 'active' : ''}"
            data-lbmode="${m.key}" style="padding:6px 16px;font-size:0.8em">${m.label}</button>
        `).join('')}
      </div>
      ${scores.length === 0 ? '<p style="color:#888">No scores yet. Play to add your name!</p>' : `
        <table class="lb-table">
          <thead><tr><th>#</th><th>NAME</th><th>SCORE</th><th>FG%</th><th>DATE</th></tr></thead>
          <tbody>
            ${scores.map((s, i) => `
              <tr style="${i < 3 ? 'color:#FFC72C' : ''}">
                <td>${medals[i] || (i + 1)}</td>
                <td>${s.name || '???'}</td>
                <td>${s.score}</td>
                <td>${s.fgPct ? (s.fgPct * 100).toFixed(0) + '%' : '-'}</td>
                <td style="color:#777;font-size:0.85em">${s.date ? new Date(s.date).toLocaleDateString() : ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}
      <button class="menu-btn" id="lb-close" style="margin-top:24px">← BACK</button>
    `

    this._el.querySelectorAll('.lb-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this._activeMode = btn.dataset.lbmode
        this._render()
      })
    })
    document.getElementById('lb-close')?.addEventListener('click', () => {
      this.hide()
      this._onClose()
    })
  }

  showScoreEntry(score, stats, mode, onSubmit) {
    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position:fixed;inset:0;background:rgba(10,10,30,0.97);z-index:200;
      display:flex;flex-direction:column;align-items:center;justify-content:center;color:white
    `
    const grade = this._getGrade(score, mode)
    overlay.innerHTML = `
      <div style="font-size:5em;color:#FFC72C">${grade}</div>
      <div style="font-size:1.8em;font-weight:bold;margin:8px 0">${score} PTS</div>
      <div style="color:#aaa;margin-bottom:20px">
        FG: ${stats.shots > 0 ? ((stats.makes/stats.shots)*100).toFixed(0) : 0}% &nbsp;|&nbsp;
        3PT: ${stats.threes > 0 ? ((stats.threeMakes/stats.threes)*100).toFixed(0) : 0}% &nbsp;|&nbsp;
        Streak: ${stats.bestStreak || 0}
      </div>
      <div style="margin-bottom:16px;color:#FFC72C">ENTER YOUR NAME (3 chars)</div>
      <input id="name-input" maxlength="3" style="
        font-size:2em;text-align:center;width:120px;padding:8px;
        background:#1a1a3e;border:2px solid #FFC72C;color:#FFC72C;border-radius:8px;
        text-transform:uppercase;letter-spacing:0.3em
      " />
      <div style="display:flex;gap:12px;margin-top:20px">
        <button class="menu-btn" id="save-score-btn">💾 SAVE SCORE</button>
        <button class="menu-btn" id="skip-score-btn" style="border-color:#666;color:#aaa;background:transparent">SKIP</button>
      </div>
    `
    document.body.appendChild(overlay)
    const input = overlay.querySelector('#name-input')
    input.focus()
    input.addEventListener('input', () => { input.value = input.value.toUpperCase() })

    overlay.querySelector('#save-score-btn').addEventListener('click', () => {
      const name = (input.value || 'STW').padEnd(3, '_').substring(0, 3).toUpperCase()
      onSubmit(name)
      document.body.removeChild(overlay)
    })
    overlay.querySelector('#skip-score-btn').addEventListener('click', () => {
      document.body.removeChild(overlay)
      onSubmit(null)
    })
  }

  _getGrade(score, mode) {
    if (mode === 'challenge') {
      if (score >= 81) return 'S'
      if (score >= 66) return 'A'
      if (score >= 51) return 'B'
      if (score >= 36) return 'C'
      return 'D'
    }
    if (mode === 'clock') {
      if (score >= 100) return 'S'
      if (score >= 75) return 'A'
      if (score >= 50) return 'B'
      if (score >= 30) return 'C'
      return 'D'
    }
    // streak
    if (score >= 60) return 'S'
    if (score >= 40) return 'A'
    if (score >= 25) return 'B'
    if (score >= 15) return 'C'
    return 'D'
  }
}
