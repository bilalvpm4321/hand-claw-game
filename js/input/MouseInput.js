// Fallback input: move the mouse to move the claw, hold the button (or Space) to close it.
// Handy for testing or when no webcam is available.

import { damp } from '../utils/math.js';

export class MouseInput {
  constructor(mouseCfg) {
    this.cfg = mouseCfg;
    this.raw = { x: 0.5, y: 0.35 };
    this.state = { visible: true, x: 0.5, y: 0.35, closed: false, ratio: 2 };
    this._pressed = false;
    this._space = false;
    this._attached = false;

    this._onMove = (e) => {
      this.raw.x = e.clientX / window.innerWidth;
      this.raw.y = e.clientY / window.innerHeight;
    };
    this._onDown = (e) => { if (e.button === 0) this._pressed = true; };
    this._onUp = (e) => { if (e.button === 0) this._pressed = false; };
    this._onKeyDown = (e) => { if (e.code === 'Space') this._space = true; };
    this._onKeyUp = (e) => { if (e.code === 'Space') this._space = false; };
  }

  attach() {
    if (this._attached) return;
    this._attached = true;
    window.addEventListener('mousemove', this._onMove);
    window.addEventListener('mousedown', this._onDown);
    window.addEventListener('mouseup', this._onUp);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  detach() {
    this._attached = false;
    window.removeEventListener('mousemove', this._onMove);
    window.removeEventListener('mousedown', this._onDown);
    window.removeEventListener('mouseup', this._onUp);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }

  update(dt) {
    const s = this.state;
    s.x = damp(s.x, this.raw.x, this.cfg.smoothing, dt);
    s.y = damp(s.y, this.raw.y, this.cfg.smoothing, dt);
    s.closed = this._pressed || this._space;
    s.visible = true;
    return s;
  }
}
