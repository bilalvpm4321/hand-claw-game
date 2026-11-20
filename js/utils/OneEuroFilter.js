// One-Euro filter: removes jitter when the hand is still but stays
// responsive when the hand moves fast. Perfect for hand tracking.
// Reference: Casiez et al., "1€ Filter" (CHI 2012).

class LowPass {
  constructor() { this.y = null; }
  filter(x, alpha) {
    this.y = this.y === null ? x : alpha * x + (1 - alpha) * this.y;
    return this.y;
  }
  reset() { this.y = null; }
}

export class OneEuroFilter {
  constructor({ minCutoff = 1.0, beta = 0.0, dCutoff = 1.0 } = {}) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.x = new LowPass();
    this.dx = new LowPass();
    this.prev = null;
  }

  _alpha(cutoff, dt) {
    const tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / dt);
  }

  /** @param {number} value new sample  @param {number} dt seconds since last sample */
  filter(value, dt) {
    dt = Math.max(dt, 1e-3);
    const rate = this.prev === null ? 0 : (value - this.prev) / dt;
    this.prev = value;
    const smoothRate = this.dx.filter(rate, this._alpha(this.dCutoff, dt));
    const cutoff = this.minCutoff + this.beta * Math.abs(smoothRate);
    return this.x.filter(value, this._alpha(cutoff, dt));
  }

  reset() {
    this.x.reset();
    this.dx.reset();
    this.prev = null;
  }
}
