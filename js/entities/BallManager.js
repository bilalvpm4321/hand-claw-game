// Owns all balls: creates them, updates them, finds the one a claw can grab.
import { Ball } from './Ball.js';

export class BallManager {
  constructor(scene, cfg) {
    this.cfg = cfg;
    this.balls = [];
    const colors = cfg.balls.colors;
    for (let i = 0; i < cfg.balls.count; i++) {
      this.balls.push(new Ball(scene, cfg, colors[i % colors.length]));
    }
  }

  update(dt, time, ctx) {
    for (const ball of this.balls) ball.update(dt, time, ctx);
  }

  /** Closest roaming ball within `radius` of `point`, or null. */
  findGrabbable(point, radius) {
    let best = null;
    let bestDist = radius;
    for (const ball of this.balls) {
      if (ball.state !== 'roam' || ball.spawnT < 1) continue;
      const d = Math.hypot(ball.position.x - point.x, ball.position.y - point.y);
      if (d < bestDist) { best = ball; bestDist = d; }
    }
    return best;
  }

  /** Put every ball back into the room (new round). */
  resetAll() {
    for (const ball of this.balls) ball.spawn(false);
  }
}
