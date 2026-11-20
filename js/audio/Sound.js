// Tiny synthesized sound effects (Web Audio) – no audio files needed.

export class Sound {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  /** Must be called from a user gesture (click / key) once. */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  _tone(freq, duration, { type = 'sine', volume = 0.15, slideTo = null, delay = 0 } = {}) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  grab()    { this._tone(380, 0.12, { type: 'triangle', slideTo: 640, volume: 0.18 }); }
  close()   { this._tone(300, 0.08, { type: 'triangle', slideTo: 220, volume: 0.1 }); }
  release() { this._tone(520, 0.14, { type: 'triangle', slideTo: 300, volume: 0.14 }); }
  miss()    { this._tone(190, 0.3, { type: 'sawtooth', slideTo: 90, volume: 0.08 }); }
  tick()    { this._tone(880, 0.06, { type: 'square', volume: 0.05 }); }
  go()      { this._tone(1180, 0.25, { type: 'square', volume: 0.07 }); }

  score(streak = 0) {
    const base = 523 * Math.pow(1.122, Math.min(streak, 4));
    [1, 1.26, 1.5, 2].forEach((m, i) =>
      this._tone(base * m, 0.18, { type: 'sine', volume: 0.17, delay: i * 0.07 })
    );
  }

  end() {
    [784, 659, 523, 392].forEach((f, i) =>
      this._tone(f, 0.3, { type: 'triangle', volume: 0.15, delay: i * 0.14 })
    );
  }
}
