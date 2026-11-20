# Claw Catch – a hand-controlled claw game

Steer a claw machine with your **bare hand** in front of the webcam.
Floating balls drift slowly around a room. Grab one, carry it over the bucket, let go, score.

| Your hand | The claw |
|-----------|----------|
| Move left / right | Claw moves left / right |
| Move up / down | Claw goes up / down |
| **Close** your fist | Fingers close – grabs a ball if one is between them |
| **Open** your hand | Fingers open – releases the ball (over the bucket = points) |

Scoring: 10 points per ball, +5 for every ball in a row (up to +20). A miss resets the streak.
A round lasts 60 seconds. Your best score is saved in the browser.

## Run it

You need **Python 3** (only to serve the files – camera access is not allowed from `file://`).

- **Windows:** double-click `start.bat`
- **Mac / Linux:** run `./start.sh`
- or manually: `python3 -m http.server 8000` and open <http://localhost:8000> in **Chrome or Edge**

Click **Play with my hand** and allow the camera. No camera? Click **Play with mouse**
(move = steer, hold left button or Space = close).

Everything (Three.js, MediaPipe hand tracking, font) is bundled in `vendor/`, so the game works offline.

Tips: sit about an arm's length from the camera, face a light source, keep one hand in view.
Press **M** to mute, **R** to restart after a round.

## Project structure

```
index.html              page layout (HUD, menu, overlays)
css/main.css            all styling
js/
  main.js               entry point: creates everything, wires the buttons
  config.js             ★ every tunable number (speeds, sizes, thresholds, colors)
  core/
    Game.js             game rules: input → claw, grab/release, scoring, timer, states
    World.js            renderer, camera, lights, resize
  entities/
    Room.js             floor, walls, window, pictures, rug
    Claw.js             rail, cable, trolley and the 3-finger gripper animation
    Ball.js             one ball: roam → held → falling → scored → respawn
    BallManager.js      creates all balls, finds the one the claw can grab
    Bucket.js           bucket model, glow, colliders, "is the ball inside?"
  effects/
    Particles.js        spark bursts when you score
  input/
    InputManager.js     chooses hand or mouse, exposes one simple state
    HandTracker.js      webcam + MediaPipe Hands loop
    GestureMapper.js    landmarks → position + open/closed (with smoothing)
    MouseInput.js       mouse fallback
  ui/
    Hud.js              score, time, best, streak, hand status chip
    Screens.js          menu, countdown, game over
    Popups.js           floating "+10" text
    WebcamPreview.js    mirrored camera with the hand skeleton
  audio/
    Sound.js            synthesized sound effects
  utils/
    math.js             clamp, lerp, damp, easing, random
    OneEuroFilter.js    jitter-free hand smoothing
    textures.js         procedural floor, wall and ball textures
tests/
  simulate.mjs          headless test: grab → carry → drop → score
  gesture.mjs           headless test: open vs closed hand detection
vendor/                 three.js, MediaPipe Hands (models + wasm), Fredoka font
```

## Tuning (all in `js/config.js`)

| I want… | Change |
|---------|--------|
| a longer / shorter round | `round.duration` |
| more / fewer balls | `balls.count` |
| slower / faster balls | `balls.minSpeed`, `balls.maxSpeed` |
| a smoother (laggier) or snappier claw | `claw.followLambda` (lower = smoother) |
| easier grabbing | `claw.grabRadius` |
| less arm movement needed | shrink `hand.region` |
| fist detected too easily / not enough | `hand.closeBelow` and `hand.openAbove` |
| bucket in another place | `bucket.x` (balls roam only in `balls.roamMinX … roamMaxX`) |

## How it works (short)

1. **HandTracker** gives 21 landmarks per frame.
2. **GestureMapper** takes the palm centre as position and compares fingertip distance to palm size:
   a ratio near 2 is an open hand, near 1 is a fist (two thresholds avoid flickering).
   A One-Euro filter removes jitter.
3. **Game** maps the position to the claw target; **Claw** glides there with exponential damping.
4. On the *open → closed* moment, the nearest roaming ball inside the grab zone becomes **held**.
   On *closed → open* it becomes **falling** and real physics takes over; entering the bucket scores.

## Testing without a browser

```
npm test                      # gameplay simulation (needs Node 18+)
node tests/gesture.mjs
```

## Troubleshooting

- *Camera button does nothing / blocked:* open via `http://localhost:8000`, not by double-clicking `index.html`.
- *Claw jumps around:* improve lighting, or lower `hand.smoothing.minCutoff` in the config.
- *Fist not detected:* curl the fingers fully; raise `hand.closeBelow` a little (e.g. 1.5).
- *Slow on an old laptop:* set `hand.modelComplexity` to `0`.

Libraries: three.js (MIT), MediaPipe Hands (Apache-2.0), Fredoka font (OFL).
