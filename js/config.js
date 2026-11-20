// ─────────────────────────────────────────────────────────────
//  config.js  –  every tunable number of the game lives here.
//  Change values here instead of hunting through the code.
// ─────────────────────────────────────────────────────────────

export const CONFIG = {
  // ── Round ──────────────────────────────────────────────────
  round: {
    duration: 60,        // seconds per game
    countdown: 3,        // 3-2-1 before the round starts
  },

  // ── Room (units are roughly "metres") ──────────────────────
  room: {
    halfWidth: 8,        // room spans x = -8 … +8
    height: 9,           // floor y = 0, ceiling y = 9
    halfDepth: 3,        // room spans z = -3 … +3
  },

  // ── Claw ───────────────────────────────────────────────────
  claw: {
    minX: -7.0,
    maxX: 7.0,
    minY: 1.25,          // lowest the claw head can go (ball on floor is reachable)
    maxY: 7.6,           // highest the claw head can go
    railY: 8.55,         // height of the ceiling rail
    followLambda: 8,     // higher = claw follows the hand faster (smoothness)
    gripLambda: 14,      // how fast the fingers open / close
    holdGrip: 0.53,      // finger opening (0 closed … 1 open) while squeezing a ball
    holdDepth: 0.85,     // ball centre sits this far below the claw head
    grabRadius: 0.55,    // how close a ball must be to the grab point to be caught
    bucketClearY: 3.1,   // claw head cannot go lower than this above the bucket
  },

  // ── Bucket ─────────────────────────────────────────────────
  bucket: {
    x: 5.3,
    outerWidth: 2.6,
    wall: 0.08,
    height: 1.7,
  },

  // ── Balls ──────────────────────────────────────────────────
  balls: {
    count: 6,
    radius: 0.42,
    roamMinX: -6.6,      // balls drift between these x positions
    roamMaxX: 2.9,
    minSpeed: 0.7,       // horizontal drift speed (units / second)
    maxSpeed: 1.35,
    minY: 1.3,           // lowest / highest hover height
    maxY: 6.4,
    dropMissDelay: 1.0,  // seconds a dropped ball may lie on the floor before respawning
    respawnDelay: 0.5,
    colors: [0xff5a4d, 0xffc93c, 0x3ee6b0, 0x4aa8ff, 0xb77cff, 0xff8fb8],
  },

  // ── Physics for dropped balls ──────────────────────────────
  physics: {
    gravity: 15,
    restitution: 0.5,
    floorFriction: 5,
  },

  // ── Score ──────────────────────────────────────────────────
  score: {
    perBall: 10,
    streakBonus: 5,      // extra points per ball in a row ...
    maxStreakBonus: 4,   // ... up to this many steps
  },

  // ── Hand tracking ──────────────────────────────────────────
  hand: {
    modelComplexity: 1,  // 0 = faster, 1 = more accurate
    // Part of the camera image that maps to the whole play area.
    // Smaller box = you need to move your hand less.
    region: { x0: 0.18, x1: 0.82, y0: 0.15, y1: 0.80 },
    closeBelow: 1.35,    // finger-spread ratio under which the hand counts as CLOSED
    openAbove: 1.65,     // ratio over which the hand counts as OPEN (hysteresis)
    smoothing: { minCutoff: 1.2, beta: 6 },
  },

  // ── Mouse fallback ─────────────────────────────────────────
  mouse: {
    smoothing: 18,
  },

  // ── Look & feel ────────────────────────────────────────────
  colors: {
    wall: 0x2d3a6b,
    wallDark: 0x232d57,
    floor: 0xb9794a,
    metal: 0xc9d1e6,
    clawBody: 0xffc93c,
    clawPad: 0xff5a4d,
    bucket: 0xff5a4d,
    bucketRim: 0xffd25a,
    glow: 0x3ee6b0,
  },
};
