export class AudioManager {
  constructor() {
    this._ctx = null
    const saved = JSON.parse(localStorage.getItem('curry_sim_settings') || '{}')
    this._enabled = saved.soundEnabled !== false  // default true
  }

  get isEnabled() { return this._enabled }

  setEnabled(v) {
    this._enabled = v
    localStorage.setItem('curry_sim_settings', JSON.stringify({ soundEnabled: v }))
  }

  resume() {
    if (this._ctx && this._ctx.state === 'suspended') this._ctx.resume()
  }

  _getCtx() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (this._ctx.state === 'suspended') this._ctx.resume()
    return this._ctx
  }

  play(sound) {
    if (!this._enabled) return
    try {
      const ctx = this._getCtx()
      switch (sound) {
        case 'dribble':    this._dribble(ctx); break
        case 'shoot':      this._shoot(ctx); break
        case 'swish':      this._swish(ctx); break
        case 'rim':        this._rim(ctx); break
        case 'miss':       this._miss(ctx); break
        case 'cheer':      this._cheer(ctx, 0.3); break
        case 'cheer_big':  this._cheer(ctx, 0.55); break
      }
    } catch (e) { /* silent fail — AudioContext may not be available */ }
  }

  _dribble(ctx) {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(110, now)
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.13)
    gain.gain.setValueAtTime(0.45, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.13)
  }

  _shoot(ctx) {
    const now = ctx.currentTime
    const dur = 0.22
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource()
    src.buffer = buf
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.setValueAtTime(600, now)
    filter.frequency.exponentialRampToValueAtTime(3500, now + dur)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.22, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur)
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination)
    src.start(now)
  }

  _swish(ctx) {
    const now = ctx.currentTime
    const dur = 0.38
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource()
    src.buffer = buf
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 4200
    filter.Q.value = 1.8
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.5, now)
    gain.gain.setValueAtTime(0.5, now + 0.06)
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur)
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination)
    src.start(now)
  }

  _rim(ctx) {
    const now = ctx.currentTime
    ;[920, 1380, 1840, 2500].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const vol = 0.18 / (i + 1)
      gain.gain.setValueAtTime(vol, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
      osc.connect(gain); gain.connect(ctx.destination)
      osc.start(now); osc.stop(now + 0.5)
    })
  }

  _miss(ctx) {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(72, now)
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.2)
    gain.gain.setValueAtTime(0.55, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(now); osc.stop(now + 0.2)
  }

  _cheer(ctx, volume) {
    const now = ctx.currentTime
    const dur = 1.4
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource()
    src.buffer = buf
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 750
    filter.Q.value = 0.4
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(volume, now + 0.18)
    gain.gain.setValueAtTime(volume, now + 0.7)
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur)
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination)
    src.start(now)
  }
}
