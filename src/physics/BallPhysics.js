import * as CANNON from 'cannon-es'
import { RIM_Y, RIM_Z } from '../data/constants.js'
import { randomRange, randomSign } from '../utils/math.js'

export class BallPhysics {
  /**
   * Calculate launch velocity for ball to reach rim area.
   * @param {THREE.Vector3} startPos - ball start position (Curry's hands)
   * @param {THREE.Vector3} rimPos - target rim position
   * @param {number} releaseQuality - 0 to 1 (1 = perfect)
   * @param {boolean} isStepBack
   * @returns {{ velocity: CANNON.Vec3, angularVelocity: CANNON.Vec3 }}
   */
  calcLaunchVelocity(startPos, rimPos, releaseQuality, isStepBack = false) {
    // Determine accuracy: how close to perfect center we aim
    let targetX = rimPos.x
    let targetZ = rimPos.z

    if (releaseQuality > 0.85) {
      // Near-perfect: tiny variance
      targetX += randomRange(-0.06, 0.06)
      targetZ += randomRange(-0.06, 0.06)
    } else if (releaseQuality > 0.6) {
      // Good: small offset
      const spread = (0.85 - releaseQuality) * 0.8
      targetX += randomRange(-spread, spread)
      targetZ += randomRange(-spread * 0.5, spread * 0.5)
    } else if (releaseQuality > 0.4) {
      // Off: medium offset
      const spread = 0.3 + (0.6 - releaseQuality) * 1.0
      targetX += randomRange(-spread, spread)
      targetZ += randomRange(-spread * 0.5, spread * 0.5)
    } else {
      // Poor: large offset, may miss entirely
      const spread = 0.5 + (0.4 - releaseQuality) * 1.5
      targetX += randomRange(-spread, spread) * randomSign()
      targetZ += randomRange(0.1, spread) * (Math.random() < 0.5 ? 1 : -1)
    }

    const dx = targetX - startPos.x
    const dy = (rimPos.y + 0.1) - startPos.y  // aim slightly above rim center
    const dz = targetZ - startPos.z
    const horizontalDist = Math.sqrt(dx * dx + dz * dz)

    // Arc height: taller arc for longer shots
    const arcExtra = Math.max(1.8, horizontalDist * 0.22)
    const peakY = startPos.y + arcExtra

    // Time of flight using parabola peak
    // At peak: vy = 0 → vy0 = sqrt(2 * g * (peak - start))
    // Then from peak to target: dy_from_peak = -0.5*g*t2^2 → t2 = sqrt(2*(peak-target)/g)
    const g = 9.8
    const vyUp = Math.sqrt(2 * g * (peakY - startPos.y))
    const fallDist = peakY - (startPos.y + dy)
    const t2 = Math.sqrt(2 * Math.abs(fallDist) / g)
    const t1 = vyUp / g
    const totalTime = t1 + t2

    const vx = dx / totalTime
    const vy = vyUp
    const vz = dz / totalTime

    // Backspin
    const spin = isStepBack ? -12 : -9
    const spinX = spin * (releaseQuality * 0.8 + 0.2)

    return {
      velocity: new CANNON.Vec3(vx, vy, vz),
      angularVelocity: new CANNON.Vec3(spinX, 0, 0),
    }
  }

  /**
   * Determine make probability from release quality and streak state.
   */
  getMakeProbability(releaseQuality, streak, coldStreak, basePercent) {
    let prob
    if (releaseQuality > 0.85) {
      prob = 0.90 + releaseQuality * 0.05
    } else if (releaseQuality > 0.6) {
      prob = 0.55 + (releaseQuality - 0.6) * 1.4
    } else if (releaseQuality > 0.4) {
      prob = 0.15 + (releaseQuality - 0.4) * 2.0
    } else {
      prob = releaseQuality * 0.35
    }

    // Scale by base percent of spot (a 28% spot is harder even with good timing)
    prob *= (0.5 + basePercent)

    // Streak modifiers
    if (streak >= 5) prob = Math.min(prob + 0.10, 0.97)
    else if (streak >= 3) prob = Math.min(prob + 0.05, 0.95)
    if (coldStreak >= 3) prob = Math.max(prob - 0.10, 0.03)

    return Math.min(Math.max(prob, 0), 1)
  }
}
