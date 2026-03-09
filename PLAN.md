# Steph Curry Simulator — v2 Implementation Plan

## Vision

A polished 3D third-person basketball game. The player controls Steph Curry directly — visible on screen as a detailed character — on a full-scale NBA half-court. Move Curry with the keyboard, aim manually with the mouse/analog, time your release, and watch realistic ball physics carry the ball to the rim. Signature Curry animations, a persistent high score system, and multiple deep game modes.

---

## Tech Stack

- **Vite** — dev server + fast ES module bundling (no CDN latency)
- **Three.js r160** (npm) — 3D rendering
- **Cannon-es** (npm) — rigid-body physics for real ball bouncing, rim collisions, backboard deflections
- **GSAP** (npm) — smooth character/camera animations
- **Vanilla JS (ES modules)** — no framework
- **localStorage + optional Supabase** — persistent high scores (localStorage always works offline; Supabase for cross-device leaderboard)
- GSW palette: Royal Blue `#1D428A`, Gold `#FFC72C`, White `#FFFFFF`

---

## File & Module Structure

```
src/
├── main.js                  ← entry point, bootstraps everything
├── game/
│   ├── Game.js              ← top-level game loop, state machine
│   ├── GameState.js         ← state enum & transitions
│   └── InputManager.js      ← keyboard/mouse unified input
├── scene/
│   ├── SceneManager.js      ← Three.js renderer, camera, scene graph
│   ├── Court.js             ← floor, markings, arena walls, crowd
│   ├── Lighting.js          ← arena spotlights, ambient, shadow config
│   └── Particles.js         ← celebration burst, net ripple effects
├── entities/
│   ├── CurryCharacter.js    ← Steph model, skeleton, animations (idle/run/shoot/celebrate)
│   ├── Defender.js          ← AI opponent entity
│   ├── Ball.js              ← physics body + mesh, spin, trail
│   └── Hoop.js              ← backboard, rim, net with physics colliders
├── physics/
│   ├── PhysicsWorld.js      ← Cannon-es world setup, substeps, gravity
│   ├── BallPhysics.js       ← launch force calculation, spin, bounce damping
│   └── CollisionHandler.js  ← rim hit events → rattle / swish / miss logic
├── camera/
│   └── CameraController.js  ← third-person follow, shot-follow, rimcam, lerp
├── ui/
│   ├── HUD.js               ← live stats overlay (pts, FG%, streak, timer)
│   ├── TimingBar.js         ← shot release mechanic UI
│   ├── Menu.js              ← main menu, mode selection
│   ├── Leaderboard.js       ← score entry, top-10 display
│   └── Toast.js             ← on-screen quips and callouts
├── modes/
│   ├── FreePractice.js
│   ├── ShotChallenge.js     ← 30 shots, cycle all spots
│   ├── GameClock.js         ← 2-minute mode with aggressive defender
│   └── HeadToHead.js        ← pass-and-play, 5 rounds
├── data/
│   ├── shotSpots.js         ← 8 spot definitions (position, type, base %)
│   └── constants.js         ← physics constants, colors, timing values
├── services/
│   └── ScoreService.js      ← localStorage read/write + optional Supabase sync
├── utils/
│   ├── math.js              ← lerp, clamp, randomRange helpers
│   └── textures.js          ← procedural Canvas 2D texture generators
index.html                   ← single HTML shell, mounts #app canvas
vite.config.js
package.json
```

---

## 3D Scene Architecture

### Camera — Third Person

Curry is always visible. Camera orbits behind him, elevated ~25° above, looking over his left shoulder toward the hoop. Player can pan left/right with mouse drag or right stick.

```
Camera offset (world space): Curry.position + (-sin(yaw) * 5, 3.5, -cos(yaw) * 5)
LookAt: Curry.position + (0, 1.5, 0)   ← head height
```

**Camera modes (all lerp at 8 fps factor):**

| Mode | Trigger | Behaviour |
|------|---------|-----------|
| `FOLLOW_CURRY` | Default | Orbits behind Curry, mouse/stick pans |
| `AIM` | Hold aim button | Zooms tighter, crosshair appears, slight FOV reduce |
| `SHOT_FOLLOW` | Ball in air | Camera detaches, tracks ball arc |
| `RIMCAM` | Made basket | Cuts below rim looking up through net (1.5 s) |
| `REPLAY` | Optional, post-score | 3-second orbit replay of last made shot |

### Scene Graph

```
Scene
├── AmbientLight
├── SpotLight × 4 (arena ceiling, cast shadows)
├── HemisphereLight (sky/floor color bounce)
├── Court (group)
│   ├── FloorPlane (CanvasTexture — wood grain + all markings)
│   ├── ArenaWalls (4 planes, crowd texture)
│   ├── JumboTron (billboard, animates on big shots)
│   └── ShotSpotMarkers[8] (pulsing ring + label)
├── Hoop (group)
│   ├── Backboard (glass material + physics body)
│   ├── RimArm
│   ├── Rim (TorusGeometry + physics torus collider)
│   └── Net (dynamic LineSegments, vertex animation)
├── CurryCharacter (group, see character section)
├── Defender (group, active in GameClock mode)
├── Ball (SphereGeometry + Cannon body)
├── BallShadow (circle, scales with height)
└── ParticleSystem
```

---

## Steph Curry Character

### Visual Detail
- **Body**: Layered box/cylinder geometry mimicking limb proportions — not a skeleton rig, but segment-animated
- **Head**: Sphere with canvas face texture (Warriors branded headband)
- **Jersey**: #30 Warriors gold home jersey, blue shorts (canvas textures)
- **Shoes**: White/blue low-top detail (box geometry with texture)
- **Wristband**: Small torus on right wrist

### Animations (procedural / keyframe via GSAP)

| Animation | Trigger |
|-----------|---------|
| Idle | Standing at spot, slight breathing bob |
| Dribble | Looping arm/hand bob while waiting to shoot |
| Move | Legs cycle when lerping to new spot |
| Wind-up | SPACE held down — right arm raises, knees flex |
| Release | SPACE released — full shooting motion, wrist flick |
| Follow-through | Arm stays raised 0.8 s post-release |
| Shimmy | 3-shot streak — hip/shoulder shimmy |
| Night Night | 5-shot streak — hands-under-head pose |
| Step-back | S key — backward shuffle, arms raised |
| Celebrate | Made basket — fist pump, optional shimmy |
| Dejected | Cold streak — head drop, hands on knees |

---

## Ball Physics (Cannon-es)

Replace the old parabolic lerp with real rigid-body physics:

```js
// PhysicsWorld: gravity = -9.8 m/s²
// Ball: mass 0.62 kg, radius 0.12 m, linearDamping 0.01, restitution 0.7
// On shoot:
const force = calcLaunchVector(curryPos, rimPos, releaseQuality, spinAmount)
ballBody.velocity.set(force.x, force.y, force.z)
ballBody.angularVelocity.set(0, 0, -8)  // backspin
```

### Collision Objects
- **Rim**: Torus physics body (two cylinder approximation) — ball can rattle around the rim, bank in, or clang out
- **Backboard**: Box physics body — enables backboard shots
- **Floor**: Static plane
- **Net**: Soft constraint simulation (visual only, not full cloth)

### Shot Outcomes (from physics, not RNG)
- **Swish**: Ball passes through rim center without touching (detect via rim proximity)
- **Bank in**: Ball hits backboard face, deflects into rim
- **Rattle in**: Ball hits rim 1–2 times, still falls through
- **Rattle out**: Ball hits rim, bounces away
- **Airball**: Ball misses rim entirely

### Launch Force Calculation
```
releaseQuality ∈ [0.0, 1.0] from timing bar
Perfect (0.85–1.0): launch vector aims dead-center, backspin maximized
Good (0.6–0.84): small random angle offset
Poor (< 0.6): larger offset, possible short/long miss
```

---

## Shot Spots (8)

| # | Name | x | z | Type | Base % |
|---|------|---|---|------|--------|
| 1 | Right Corner | 6.5 | -2.0 | 3PT | 44% |
| 2 | Right Wing | 5.0 | -5.0 | 3PT | 43% |
| 3 | Top of Key | 0.0 | -7.0 | 3PT | 42% |
| 4 | Left Wing | -5.0 | -5.0 | 3PT | 43% |
| 5 | Left Corner | -6.5 | -2.0 | 3PT | 44% |
| 6 | Logo 3 (Deep) | 0.0 | -10.5 | 3PT | 28% |
| 7 | Right Elbow | 3.0 | -3.5 | 2PT | 52% |
| 8 | Left Elbow | -3.0 | -3.5 | 2PT | 52% |

Curry walks/runs to selected spot with leg animation active. Shot spot rings pulse gold while selected.

---

## Shot Mechanic (Timing Bar)

```
[────────|  SWEET SPOT  |─────────]
              ↑ release here
```

- Hold SPACE (or click/hold) to begin wind-up animation
- Needle sweeps. Speed increases slightly over time
- **Release quality** = how centered needle is within sweet spot (0–1 float)
- Sweet spot width = f(base %, streak, step-back, catch-and-shoot bonus)
- Release quality directly maps to launch force accuracy in physics engine
- Visual: needle goes green → yellow → red as it exits sweet spot

**Aiming (new):** Before shooting, player can move the aim reticle slightly with the mouse to target the center of the rim, left/right side, or the backboard (for bank shots).

---

## Signature Curry Moves

| Move | Trigger | Effect |
|------|---------|--------|
| Step-Back | `S` key | Curry shuffles back 1.5 m, wider sweet spot, unique animation |
| Shimmy | 3-shot streak | Hip shimmy after make |
| Night Night | 5-shot streak | Sleep pose, crowd roar particles |
| Logo 3 | Spot 6 | Gold glow, fanfare SFX, special camera shake on make |
| Catch & Shoot | Corner spots | +8% sweet spot bonus |
| Off-Dribble | `D` key | Short dribble pull-up, tighter sweet spot but mid-range bonus |

---

## Game Modes

### Free Practice
- Unlimited shots, full stat tracking
- No time pressure, best for learning timing

### Shot Challenge (30 Shots)
- Cycles all 8 spots in order (repeat cycles if needed)
- Grade S/A/B/C/D at end, score saved to leaderboard

### Game Clock (2:00 Blitz)
- 2-minute countdown
- Defender AI closes out harder each minute
- Bonus points for quick releases (< 3 seconds at spot)
- Curry's real 2023-24 season stats shown as benchmark

### Sudden Death Streak
- Make shots until you miss
- Spots randomly assigned
- Multiplier increases every 3 consecutive makes
- Score saved to dedicated streak leaderboard

### Head-to-Head (Pass & Play)
- 2 players, same device, 5 rounds
- P1 picks and shoots a spot; P2 must match from the same spot
- Match = both make/both miss → no score. P1 make, P2 miss → P1 wins round
- Crown animation for winner

---

## High Score System

### Local (always available)
```js
// ScoreService.js
const KEYS = {
  challenge: 'curry_sim_challenge',
  clock: 'curry_sim_clock',
  streak: 'curry_sim_streak',
}
// Per-mode sorted top-10 arrays: { name, score, date, stats }
```

### Optional Supabase Sync
- `.env` variable `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- If set: scores POST to `scores` table on save, leaderboard fetches top 10 globally
- If not set: graceful fallback to localStorage only
- Supabase schema:
  ```sql
  CREATE TABLE scores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    player_name text,
    mode text,
    score integer,
    fg_pct numeric,
    three_pct numeric,
    created_at timestamptz DEFAULT now()
  );
  ```

### Leaderboard UI
- Mode tabs: Challenge / Clock / Streak
- Gold/Silver/Bronze medal icons for top 3
- Player's personal best highlighted
- Share button: copies tweet string to clipboard

---

## UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  [Three.js Canvas — full 3D, third-person Curry visible] │
│                                                          │
│  [Mode] [PTS] [FG%] [3PT%] [STREAK 🔥]    [⏱ 1:43]   │ ← HUD top bar
│                                                          │
│                    [AIM RETICLE]                         │ ← center when aiming
│                                                          │
│         [══════════|SWEET SPOT|══════════]               │ ← timing bar (shooting)
│                                                          │
│  [1:RC] [2:RW] [3:TOK] [4:LW] [5:LC] [6:L3] [7:RE] [8:LE]  │ ← spot buttons
└─────────────────────────────────────────────────────────┘
```

All overlays are HTML divs absolutely positioned over the canvas.

---

## Controls

| Input | Action |
|-------|--------|
| `1`–`8` | Select shot spot |
| `SPACE` (hold/release) | Wind-up and release shot |
| `S` | Step-back before shot |
| `D` | Off-dribble move |
| Mouse drag / Right stick | Orbit camera left/right |
| `R` | Toggle rim cam / replay |
| `ESC` | Pause / return to menu |

---

## Performance Targets

- 60 fps on mid-range laptop (GTX 1060 / Intel Iris Xe)
- Physics substeps: 2 per frame at 60 fps
- Max draw calls: ~80 (merge static court geometry)
- Shadow map: 1024 × 1024, only for key spotlight
- Ball trail: 12-segment fade using previous positions

---

## Verification Checklist

1. `npm run dev` opens at `localhost:5173`
2. Steph Curry visible from behind in third-person
3. Click spot → Curry walks there with leg animation
4. Hold SPACE → wind-up animation, timing bar appears
5. Release in sweet spot → physics ball launches, realistic arc
6. Ball can rattle around rim before outcome decided
7. Backboard bank shots work
8. Streak triggers shimmy / Night Night animations
9. Game Clock countdown, defender closes out
10. Score saves to localStorage, appears in leaderboard
11. Supabase sync works when env vars present (gracefully skips if absent)
12. All 4 game modes completeable end-to-end
