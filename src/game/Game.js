import * as THREE from 'three'
import { GameState } from './GameState.js'
import { InputManager } from './InputManager.js'
import { SceneManager } from '../scene/SceneManager.js'
import { Lighting } from '../scene/Lighting.js'
import { Court } from '../scene/Court.js'
import { ParticleSystem } from '../scene/Particles.js'
import { PhysicsWorld } from '../physics/PhysicsWorld.js'
import { BallPhysics } from '../physics/BallPhysics.js'
import { CollisionHandler } from '../physics/CollisionHandler.js'
import { Hoop } from '../entities/Hoop.js'
import { Ball } from '../entities/Ball.js'
import { CurryCharacter } from '../entities/CurryCharacter.js'
import { Defender } from '../entities/Defender.js'
import { CameraController } from '../camera/CameraController.js'
import { Toast } from '../ui/Toast.js'
import { TimingBar } from '../ui/TimingBar.js'
import { HUD } from '../ui/HUD.js'
import { Menu } from '../ui/Menu.js'
import { Leaderboard } from '../ui/Leaderboard.js'
import { ScoreService } from '../services/ScoreService.js'
import { FreePractice } from '../modes/FreePractice.js'
import { ShotChallenge } from '../modes/ShotChallenge.js'
import { GameClock } from '../modes/GameClock.js'
import { SuddenDeathStreak } from '../modes/SuddenDeathStreak.js'
import { HeadToHead } from '../modes/HeadToHead.js'
import { SHOT_SPOTS } from '../data/shotSpots.js'
import { RIM_Y, RIM_Z, RIM_RADIUS } from '../data/constants.js'
import { clamp } from '../utils/math.js'

export class Game {
  constructor() {
    // Core systems
    this.sceneManager = new SceneManager()
    this.scene = this.sceneManager.scene
    this.physicsWorld = new PhysicsWorld()
    this.ballPhysics = new BallPhysics()
    this.collisionHandler = new CollisionHandler()

    // Scene objects
    this.lighting = new Lighting(this.scene)
    this.court = new Court(this.scene)
    this.hoop = new Hoop(this.scene, this.physicsWorld)
    this.particles = new ParticleSystem(this.scene)

    // Entities
    this.curry = new CurryCharacter(this.scene)
    this.defender = new Defender(this.scene)
    this.ball = new Ball(this.scene, this.physicsWorld)

    // Camera
    this.cameraController = new CameraController()
    this.camera = this.cameraController.camera

    // UI
    this.toast = new Toast()
    this.timingBar = new TimingBar()
    this.hud = new HUD()
    this.scoreService = new ScoreService()
    this.leaderboard = new Leaderboard(this.scoreService, () => this.showMenu())
    this.menu = new Menu((mode) => this.onModeSelect(mode))

    // Input
    this.input = new InputManager()

    // Wire pointer lock to the renderer canvas
    this.input.requestPointerLock(this.sceneManager.renderer.domElement)

    // Click-to-play overlay
    this._clickToPlay = document.getElementById('click-to-play')
    if (!this._clickToPlay) {
      this._clickToPlay = document.createElement('div')
      this._clickToPlay.id = 'click-to-play'
      this._clickToPlay.textContent = 'CLICK TO PLAY'
      document.body.appendChild(this._clickToPlay)
    }

    // Game state
    this.state = GameState.MENU
    this.currentMode = null
    this.currentSpotIdx = 0
    this.isStepBack = false
    this._shotPoints = 2
    this._shotIsThree = false

    // Stats
    this.stats = this._freshStats()

    // Timing
    this._clock = new THREE.Clock()
    this._animTime = 0

    // Ball flight tracking
    this._ballPrevY = 0
    this._ballPassedPeak = false
    this._resultPending = false
    this._resultTimer = 0

    // Sweet spot params for current shot
    this._sweetStart = 0.35
    this._sweetWidth = 0.25
  }

  _freshStats() {
    return { points: 0, shots: 0, makes: 0, threes: 0, threeMakes: 0, streak: 0, coldStreak: 0, bestStreak: 0 }
  }

  start() {
    this.hud.setVisible(false)
    this.menu.show()
    this._animate()
  }

  showMenu() {
    this.state = GameState.MENU
    this.currentMode = null
    this.hud.setVisible(false)
    this.timingBar.hide()
    this.menu.show()
    this.defender.setVisible(false)
    this.stats = this._freshStats()
    this.isStepBack = false
    this.curry.setAnim('idle')
  }

  onModeSelect(mode) {
    if (mode === 'leaderboard') {
      this.leaderboard.show('challenge')
      return
    }
    this.menu.hide()
    this.stats = this._freshStats()
    this.hud.setVisible(true)
    this.hud.update(this.stats)
    this.state = GameState.PLAYING

    switch (mode) {
      case 'free':      this.currentMode = new FreePractice(this); break
      case 'challenge': this.currentMode = new ShotChallenge(this); break
      case 'clock':     this.currentMode = new GameClock(this); break
      case 'streak':    this.currentMode = new SuddenDeathStreak(this); break
      case 'h2h':       this.currentMode = new HeadToHead(this); break
    }
    this.currentMode?.start()

    // Default spot
    if (mode !== 'challenge' && mode !== 'streak' && mode !== 'h2h') {
      this.selectSpot(2) // Top of Key
    }
  }

  selectSpot(idx) {
    this.currentSpotIdx = idx
    const spot = SHOT_SPOTS[idx]
    // Curry moves to spot: note spots have negative z (toward player), scene has positive z toward hoop
    this.curry.moveTo(new THREE.Vector3(spot.x, 0, -spot.z))
    this.court.highlightSpot(idx)
    this.isStepBack = false

    // Update spot buttons
    document.querySelectorAll('.spot-btn').forEach((btn, i) => {
      btn.classList.toggle('active', i === idx)
    })

    this.currentMode?.onSpotSelected?.()
  }

  _beginWindUp() {
    if (this.state !== GameState.PLAYING) return
    this.state = GameState.WIND_UP

    const diff = this._calcDynamicDifficulty()
    const isCatchAndShoot = this.curry.isStationary
    this._sweetWidth = this.timingBar.getSweetSpotWidth(
      diff.basePercent,
      this.stats.streak,
      this.stats.coldStreak,
      this.isStepBack,
      isCatchAndShoot
    )
    this._sweetStart = 0.15 + Math.random() * (0.7 - this._sweetWidth)

    this.timingBar.show(this._sweetStart, this._sweetWidth)
    this.curry.setAnim('windUp')
  }

  _releaseShot() {
    if (this.state !== GameState.WIND_UP) return
    this.state = GameState.BALL_IN_AIR

    const quality = this.timingBar.getReleaseQuality()
    this.timingBar.hide()

    const diff = this._calcDynamicDifficulty()
    this._shotPoints = diff.isThree ? 3 : 2
    this._shotIsThree = diff.isThree
    this._shotSpot = { points: this._shotPoints, type: diff.isThree ? '3PT' : '2PT' }

    const prob = this.ballPhysics.getMakeProbability(
      quality, this.stats.streak, this.stats.coldStreak, diff.basePercent
    )
    const made = Math.random() < prob

    // Curry release animation
    this.curry.setAnim('release')

    // Ball launch: start at Curry's hands position
    const curryPos = this.curry.position
    const startPos = new THREE.Vector3(curryPos.x + 0.3, curryPos.y + 1.8, curryPos.z)
    const rimPos = new THREE.Vector3(0, RIM_Y, RIM_Z)

    // Adjust target based on make/miss
    if (!made) {
      const spread = 0.3 + (1 - quality) * 0.5
      rimPos.x += (Math.random() - 0.5) * spread * 2
      rimPos.z += (Math.random() - 0.5) * spread
    }

    const { velocity, angularVelocity } = this.ballPhysics.calcLaunchVelocity(
      startPos, rimPos, quality, this.isStepBack
    )

    this.ball.launch(startPos, velocity, angularVelocity)
    this.collisionHandler.reset()
    this.collisionHandler.attach(
      this.ball.body,
      this.hoop.rimBodies,
      this.hoop.backboardBody,
      () => {},  // rim hit
      () => {}   // backboard hit
    )

    this._ballPrevY = startPos.y
    this._ballPassedPeak = false
    this._madeShot = made

    // Camera follows ball
    this.cameraController.setMode('SHOT_FOLLOW')
    this.isStepBack = false
  }

  _onBallLanded(made) {
    if (this._resultPending) return
    this._resultPending = true

    this.stats.shots++

    if (this._shotIsThree) this.stats.threes++

    if (made) {
      this.stats.makes++
      if (this._shotIsThree) this.stats.threeMakes++
      this.stats.points += this._shotPoints
      this.stats.streak++
      this.stats.coldStreak = 0
      this.stats.bestStreak = Math.max(this.stats.bestStreak, this.stats.streak)

      // Animations
      if (this.stats.streak >= 5) {
        this.curry.setAnim('nightNight')
      } else if (this.stats.streak >= 3) {
        this.curry.setAnim('shimmy')
      } else {
        this.curry.setAnim('celebrate')
      }

      // Net ripple + particles + rimcam
      this.hoop.triggerNetRipple()
      this.particles.burst(new THREE.Vector3(0, RIM_Y + 0.5, RIM_Z), 80, 0xFFC72C)
      this.cameraController.setMode('RIMCAM', 1500)

      this.toast.showRandomMake(this._shotIsThree, this.stats.streak >= 3, this.stats.streak)
    } else {
      this.stats.coldStreak++
      this.stats.streak = 0
      if (this.stats.coldStreak >= 3) this.curry.setAnim('dejected')
      this.toast.showRandomMiss(0.5)
    }

    this.hud.update(this.stats)
    this.collisionHandler.detach()

    this.currentMode?.onShotResult(made, this._shotPoints, this._shotSpot)

    // Reset ball after delay
    this._resultTimer = made ? 2000 : 1500
    this.state = GameState.RESULT_PENDING
  }

  _calcDynamicDifficulty() {
    const cp = this.curry.position
    const dx = cp.x - 0
    const dz = cp.z - RIM_Z
    const horizDist = Math.sqrt(dx * dx + dz * dz)

    // Angle penalty: harder from sharp corners
    const lateralAngle = Math.abs(Math.atan2(cp.x, RIM_Z - cp.z))
    const anglePenalty = (lateralAngle / (Math.PI / 2)) * 0.08

    const isThree = horizDist > 6.5
    let basePercent
    if (isThree) {
      basePercent = 0.46 - (horizDist - 6.5) * 0.028 - anglePenalty
      basePercent = clamp(basePercent, 0.18, 0.46)
    } else {
      basePercent = 0.60 - horizDist * 0.018 - anglePenalty
      basePercent = clamp(basePercent, 0.36, 0.62)
    }

    // Moving shot penalty (up to -18% at full speed)
    const moveRatio = this.curry.movementSpeed / 4.5
    basePercent -= moveRatio * 0.18

    // Catch-and-shoot bonus (stationary 1.5s+)
    if (this.curry.isStationary) basePercent += 0.06

    return { basePercent: clamp(basePercent, 0.10, 0.68), isThree, horizDist }
  }

  _doStepBack() {
    if (this.state !== GameState.PLAYING) return
    this.isStepBack = true
    const curPos = this.curry.position
    // Move away from hoop
    const awayDir = new THREE.Vector3(curPos.x, 0, curPos.z - RIM_Z).normalize()
    this.curry.moveTo(new THREE.Vector3(
      curPos.x + awayDir.x * 1.5,
      0,
      curPos.z + awayDir.z * 1.5
    ))
    this.curry.setAnim('stepBack')
    this.toast.show('STEP-BACK 3! 🏀', 1200)
  }

  _animate() {
    requestAnimationFrame(() => this._animate())
    const dt = Math.min(this._clock.getDelta(), 0.05)
    this._animTime += dt
    this._update(dt)
    this.sceneManager.render(this.camera)
  }

  _update(dt) {
    if (this.state === GameState.MENU) return

    // Physics
    this.physicsWorld.step(dt)

    // Ball sync + update
    this.ball.sync()
    this.ball.savePrevY()
    this.ball.update()

    // Detect ball landing
    if (this.state === GameState.BALL_IN_AIR) {
      const ballPos = this.ball.position
      const ballVelY = this.ball.body.velocity.y

      // Track peak
      if (ballVelY < 0) this._ballPassedPeak = true

      // Check if ball passes through rim vertically
      if (this._ballPassedPeak && ballVelY < 0) {
        const dx = ballPos.x - 0
        const dz = ballPos.z - RIM_Z
        const horizDist = Math.sqrt(dx * dx + dz * dz)
        const prevY = this._ballPrevY

        if (prevY > RIM_Y && ballPos.y <= RIM_Y && horizDist < RIM_RADIUS + 0.08) {
          // Ball passed through rim area — confirm as make
          this._onBallLanded(this._madeShot)
        } else if (ballPos.y < 0.15 && this._ballPassedPeak) {
          // Ball hit floor — miss
          this._onBallLanded(false)
        }
      }
      this._ballPrevY = ballPos.y
    }

    // Result pending timer
    if (this.state === GameState.RESULT_PENDING) {
      this._resultTimer -= dt * 1000
      if (this._resultTimer <= 0) {
        this._resultPending = false
        this.state = GameState.PLAYING
        this.ball.reset(new THREE.Vector3(0, 0, 0)) // position updated below by carry logic
        this.cameraController.setMode('FOLLOW_CURRY')
        if (this.curry.animState !== 'shimmy' && this.curry.animState !== 'nightNight') {
          this.curry.setAnim('dribble')
        }
      }
    }

    // Ball follows Curry when not in flight
    if (!this.ball.active) {
      const cp = this.curry.position
      const anim = this.curry.animState
      let bx = cp.x + 0.2
      let bz = cp.z + 0.05
      let by
      if (anim === 'dribble' || anim === 'move') {
        // Bounce between floor and waist
        by = 0.13 + Math.abs(Math.sin(this._animTime * 9)) * 0.75
      } else if (anim === 'windUp' || anim === 'release' || anim === 'followThrough') {
        by = cp.y + 1.5
      } else {
        by = cp.y + 0.95  // resting carry height
      }
      this.ball.carry(new THREE.Vector3(bx, by, bz))
    }

    // Entities
    this.curry.update(dt, this._animTime)
    this.defender.update(
      dt,
      this.curry.position,
      this.currentMode instanceof GameClock,
      this.currentMode?.timeLeft ?? 120,
      this.curry.animState
    )
    this.court.update(dt)
    this.hoop.update(dt)
    this.particles.update(dt)

    // WASD free movement
    if (this.state === GameState.PLAYING) {
      const camYaw = this.cameraController.yaw
      let vx = 0, vz = 0
      if (this.input.isKeyDown('KeyW')) { vx -= Math.sin(camYaw); vz -= Math.cos(camYaw) }
      if (this.input.isKeyDown('KeyS')) { vx += Math.sin(camYaw); vz += Math.cos(camYaw) }
      if (this.input.isKeyDown('KeyA')) { vx -= Math.cos(camYaw); vz += Math.sin(camYaw) }
      if (this.input.isKeyDown('KeyD')) { vx += Math.cos(camYaw); vz -= Math.sin(camYaw) }
      const len = Math.sqrt(vx * vx + vz * vz)
      const spd = 4.5
      this.curry.velocity.set(
        len > 0 ? (vx / len) * spd : 0,
        0,
        len > 0 ? (vz / len) * spd : 0
      )
    } else {
      this.curry.velocity.set(0, 0, 0)
    }

    // Camera
    this.cameraController.update(dt, this.curry.position, this.ball.position, this.state === GameState.BALL_IN_AIR)
    if (this.input.mouseDelta.dx !== 0 || this.input.mouseDelta.dy !== 0) {
      this.cameraController.onMouseMove(this.input.mouseDelta.dx, this.input.mouseDelta.dy)
    }

    // Mode update
    this.currentMode?.update(dt)

    // Input handling
    if (this.state === GameState.PLAYING) {
      // Spot selection 1-8
      for (let i = 0; i < 8; i++) {
        if (this.input.isKeyJustPressed(`Digit${i + 1}`)) this.selectSpot(i)
      }
      if (this.input.isKeyJustPressed('Space')) this._beginWindUp()
      if (this.input.isKeyJustPressed('KeyQ')) this._doStepBack()

      // Live difficulty display
      const diff = this._calcDynamicDifficulty()
      this.hud.setDifficulty(diff.basePercent, this.curry.movementSpeed > 0.5)
    }

    if (this.state === GameState.WIND_UP) {
      this.timingBar.update(dt)
      if (this.input.isKeyJustReleased('Space')) this._releaseShot()
    }

    if (this.input.isKeyJustPressed('Escape')) {
      if (this.state !== GameState.MENU) {
        if (this.input.pointerLocked) {
          document.exitPointerLock()
        } else {
          this.showMenu()
        }
      }
    }

    // Click-to-play overlay visibility
    if (this._clickToPlay) {
      this._clickToPlay.style.display =
        (this.state !== GameState.MENU && !this.input.pointerLocked) ? 'flex' : 'none'
    }

    this.input.flush()
  }
}
