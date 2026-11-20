// Turns raw MediaPipe hand landmarks into game input:
//   x, y     – hand position, 0…1 across the play area (already mirrored)
//   closed   – true when the hand is a fist
//
// Landmark indices: 0 = wrist, 9 = middle-finger knuckle,
// 8/12/16/20 = index/middle/ring/pinky fingertips, 5/9/13/17 = knuckles.

import { OneEuroFilter } from '../utils/OneEuroFilter.js';
import { clamp } from '../utils/math.js';

const TIPS = [8, 12, 16, 20];
const PALM = [0, 5, 9, 13, 17];
const VIDEO_ASPECT = 4 / 3;

export class GestureMapper {
  constructor(handCfg) {
    this.cfg = handCfg;
    this.fx = new OneEuroFilter(handCfg.smoothing);
    this.fy = new OneEuroFilter(handCfg.smoothing);
    this.reset();
  }

  reset() {
    this.fx.reset();
    this.fy.reset();
    this.ratio = 2;       // smoothed finger-spread ratio (open ≈ 1.9, fist ≈ 1.0)
    this.state = { visible: false, x: 0.5, y: 0.35, closed: false, ratio: 2 };
    this.lastTime = null;
  }

  /**
   * @param {Array|null} landmarks 21 normalized landmarks, or null if no hand
   * @param {number} nowMs timestamp in milliseconds
   */
  update(landmarks, nowMs) {
    const dt = this.lastTime === null ? 1 / 30 : Math.min(0.2, (nowMs - this.lastTime) / 1000);
    this.lastTime = nowMs;

    if (!landmarks) {
      this.state = { ...this.state, visible: false };
      return this.state;
    }

    // ── position: centre of the palm, mirrored like a mirror ──
    let px = 0, py = 0;
    for (const i of PALM) { px += landmarks[i].x; py += landmarks[i].y; }
    px /= PALM.length;
    py /= PALM.length;

    const r = this.cfg.region;
    const nx = clamp((1 - px - r.x0) / (r.x1 - r.x0), 0, 1);
    const ny = clamp((py - r.y0) / (r.y1 - r.y0), 0, 1);
    const x = clamp(this.fx.filter(nx, dt), 0, 1);
    const y = clamp(this.fy.filter(ny, dt), 0, 1);

    // ── open / closed: how far the fingertips are from the wrist,
    //    relative to the size of the palm (so distance to camera doesn't matter)
    const palmSize = this._dist(landmarks[0], landmarks[9]);
    let sum = 0;
    for (const t of TIPS) sum += this._dist(landmarks[0], landmarks[t]);
    const rawRatio = sum / TIPS.length / Math.max(palmSize, 1e-4);
    this.ratio += (rawRatio - this.ratio) * Math.min(1, dt * 18);

    let closed = this.state.closed;
    if (!closed && this.ratio < this.cfg.closeBelow) closed = true;
    else if (closed && this.ratio > this.cfg.openAbove) closed = false;

    this.state = { visible: true, x, y, closed, ratio: this.ratio };
    return this.state;
  }

  _dist(a, b) {
    const dx = (a.x - b.x) * VIDEO_ASPECT;
    const dy = a.y - b.y;
    const dz = ((a.z ?? 0) - (b.z ?? 0)) * VIDEO_ASPECT;
    return Math.hypot(dx, dy, dz);
  }
}
