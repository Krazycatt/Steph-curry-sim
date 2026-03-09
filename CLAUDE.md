# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-file 3D third-person basketball game. Steph Curry is visible on screen. Built with Vite + Three.js + Cannon-es physics. Persistent high scores via localStorage (optional Supabase for cross-device sync).

## Commands

```bash
npm install          # install dependencies
npm run dev          # dev server at localhost:5173
npm run build        # production build → dist/
npm run preview      # preview production build locally
```

## File Structure

```
src/
├── main.js                    ← entry point
├── game/
│   ├── Game.js                ← top-level loop, state machine
│   ├── GameState.js           ← state enum (MENU/PLAYING/SHOOTING/BALL_IN_AIR/RESULT_PENDING)
│   └── InputManager.js        ← unified keyboard + mouse input
├── scene/
│   ├── SceneManager.js        ← renderer, camera, scene graph
│   ├── Court.js               ← floor, markings, arena walls
│   ├── Lighting.js            ← spotlights, shadows, hemisphere light
│   └── Particles.js           ← celebration burst, net ripple
├── entities/
│   ├── CurryCharacter.js      ← Steph model, procedural animations
│   ├── Defender.js            ← AI defender entity
│   ├── Ball.js                ← physics body + mesh + trail
│   └── Hoop.js                ← backboard, rim, net with colliders
├── physics/
│   ├── PhysicsWorld.js        ← Cannon-es world (gravity -9.8, substeps)
│   ├── BallPhysics.js         ← launch force from timing quality, backspin
│   └── CollisionHandler.js    ← rim/backboard hit events → swish/rattle/miss
├── camera/
│   └── CameraController.js    ← FOLLOW_CURRY / AIM / SHOT_FOLLOW / RIMCAM modes
├── ui/
│   ├── HUD.js                 ← live stats (pts, FG%, streak, timer)
│   ├── TimingBar.js           ← shot release UI, needle, sweet spot
│   ├── Menu.js                ← main menu, mode selection
│   ├── Leaderboard.js         ← score entry, top-10 per mode
│   └── Toast.js               ← on-screen quips
├── modes/
│   ├── FreePractice.js
│   ├── ShotChallenge.js
│   ├── GameClock.js
│   ├── SuddenDeathStreak.js
│   └── HeadToHead.js
├── data/
│   ├── shotSpots.js           ← 8 spot definitions
│   └── constants.js           ← colors, physics values, timing params
├── services/
│   └── ScoreService.js        ← localStorage always; Supabase if env vars set
└── utils/
    ├── math.js                ← lerp, clamp, randomRange
    └── textures.js            ← Canvas 2D procedural texture generators
index.html
vite.config.js
```

## Architecture

### State Machine (`Game.js`)
`MENU → PLAYING → SHOOTING → BALL_IN_AIR → RESULT_PENDING → PLAYING`

Each game mode is a class in `src/modes/` that receives the shared `Game` instance. Modes implement `start()`, `update(dt)`, `end()`.

### Physics (`src/physics/`)
Cannon-es runs at fixed substeps (2 per frame at 60 fps). `PhysicsWorld.js` owns the world instance. `Ball.js` holds both the Three.js mesh and the Cannon body — `Ball.sync()` is called each frame to copy physics transform to the mesh. `CollisionHandler.js` listens to rim/backboard collision events and resolves shot outcome (swish / rattle-in / rattle-out / miss) rather than using RNG directly.

### Character (`CurryCharacter.js`)
Curry is assembled from segment geometries (no GLTF rig). Animations are procedural GSAP tweens on individual limb groups. Key animation states: `idle`, `dribble`, `move`, `windUp`, `release`, `followThrough`, `shimmy`, `nightNight`, `stepBack`, `celebrate`, `dejected`.

### Camera (`CameraController.js`)
Third-person orbit behind Curry. Four modes; all transitions use lerp factor per frame:
- `FOLLOW_CURRY` — default, mouse drag pans orbit yaw
- `AIM` — tighter, slight FOV reduce, aim reticle visible
- `SHOT_FOLLOW` — detaches from Curry, tracks ball
- `RIMCAM` — below-rim angle, 1.5 s on made baskets

### Shot Flow
1. Player selects spot (1–8 keys or buttons) → Curry walks there
2. Player holds SPACE → `TimingBar` starts, wind-up animation plays
3. Player releases SPACE → `TimingBar` returns `releaseQuality` ∈ [0, 1]
4. `BallPhysics.calcLaunchVector(spot, releaseQuality, spin)` computes initial velocity
5. Cannon-es simulates flight; `CollisionHandler` fires on rim/backboard contact
6. Outcome resolved → stats updated → animations/particles triggered

### High Scores (`ScoreService.js`)
localStorage is always the primary store (three keys: `curry_sim_challenge`, `curry_sim_clock`, `curry_sim_streak`). Each stores a sorted top-10 array of `{ name, score, date, stats }`. If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are in `.env`, scores also sync to a Supabase `scores` table — absent env vars, this path is silently skipped.

## Key Constants (`src/data/constants.js`)

| Constant | Value | Notes |
|---|---|---|
| `RIM_Y` | 3.05 m | NBA regulation |
| `RIM_RADIUS` | 0.23 m | Inner rim radius |
| `BALL_RADIUS` | 0.12 m | |
| `BALL_MASS` | 0.62 kg | |
| `GRAVITY` | -9.8 | |
| `GOLD` | `#FFC72C` | Warriors gold |
| `BLUE` | `#1D428A` | Warriors blue |

## Controls

| Key | Action |
|---|---|
| `1`–`8` | Select shot spot |
| `SPACE` hold/release | Wind-up / release shot |
| `S` | Step-back |
| `D` | Off-dribble pull-up |
| Mouse drag | Orbit camera |
| `ESC` | Pause / menu |

## Environment Variables (optional)

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Without these, the game works fully offline using localStorage only.

## PLAN.md

Full design spec: shot spot coordinates, physics parameters, game mode rules, Supabase schema, and the full verification checklist.
