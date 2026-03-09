export class Toast {
  constructor() {
    this.el = document.createElement('div')
    this.el.id = 'toast'
    document.body.appendChild(this.el)
    this._timeout = null
  }

  show(message, duration = 2000) {
    if (this._timeout) clearTimeout(this._timeout)
    this.el.textContent = message
    this.el.style.opacity = '1'
    this._timeout = setTimeout(() => {
      this.el.style.opacity = '0'
    }, duration)
  }

  showRandomMake(isThree, isStreak, streakCount) {
    const threeQuips = ['SPLASH! 💦', 'FROM DOWNTOWN!', 'NIGHT NIGHT! 😴', 'NOTHING BUT NET!', 'CURRY RANGE!', 'WAY DOWNTOWN... BANG!', 'OH WHAT A SHOT!']
    const twoQuips = ['AND IT\'S GOOD!', 'SPLASH!', 'MONEY!', 'BUCKETS!', 'EASY TWO!']
    const streakQuips = ['HE\'S ON FIRE! 🔥', 'CAN\'T STOP HIM!', 'UNCONSCIOUS! 🔥', 'THE SPLASH ZONE IS OPEN!']

    let pool = isThree ? threeQuips : twoQuips
    if (streakCount >= 5) pool = streakQuips

    const msg = pool[Math.floor(Math.random() * pool.length)]
    this.show(msg, 1800)
  }

  showRandomMiss(quality) {
    const hardMiss = ['OFF THE BACK IRON', 'CLANG!', 'SHORT!', 'LONG!', 'RIMMED OUT']
    const badMiss = ['AIRBALL! 😬', 'NOT EVEN CLOSE', 'WAY OFF!', 'BRICK! 🧱']
    const pool = quality < 0.3 ? badMiss : hardMiss
    const msg = pool[Math.floor(Math.random() * pool.length)]
    this.show(msg, 1600)
  }
}
