const KEYS = {
  challenge: 'curry_sim_v2_challenge',
  clock: 'curry_sim_v2_clock',
  streak: 'curry_sim_v2_streak',
}

export class ScoreService {
  getScores(mode) {
    try {
      const raw = localStorage.getItem(KEYS[mode])
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  }

  saveScore(mode, playerName, score, stats) {
    const scores = this.getScores(mode)
    scores.push({
      name: playerName,
      score,
      fgPct: stats.shots > 0 ? stats.makes / stats.shots : 0,
      threePct: stats.threes > 0 ? stats.threeMakes / stats.threes : 0,
      bestStreak: stats.bestStreak || 0,
      date: new Date().toISOString(),
    })
    scores.sort((a, b) => b.score - a.score)
    const top10 = scores.slice(0, 10)
    try {
      localStorage.setItem(KEYS[mode], JSON.stringify(top10))
    } catch (e) {
      console.warn('Score save failed:', e)
    }
    this._syncSupabase(mode, playerName, score, stats)
    return top10
  }

  getPersonalBest(mode) {
    const scores = this.getScores(mode)
    return scores.length > 0 ? scores[0] : null
  }

  isTopTen(mode, score) {
    const scores = this.getScores(mode)
    if (scores.length < 10) return true
    return score > scores[scores.length - 1].score
  }

  async _syncSupabase(mode, name, score, stats) {
    const url = import.meta.env?.VITE_SUPABASE_URL
    const key = import.meta.env?.VITE_SUPABASE_ANON_KEY
    if (!url || !key) return
    try {
      await fetch(`${url}/rest/v1/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          player_name: name,
          mode,
          score,
          fg_pct: stats.shots > 0 ? stats.makes / stats.shots : 0,
          three_pct: stats.threes > 0 ? stats.threeMakes / stats.threes : 0,
        }),
      })
    } catch (e) {
      // Silently skip if Supabase not configured
    }
  }

  clearAll() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k))
  }
}
