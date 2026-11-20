// One place that answers: "where is the player's hand and is it closed?"
// It hides whether the data comes from the webcam or from the mouse.

import { HandTracker } from './HandTracker.js';
import { GestureMapper } from './GestureMapper.js';
import { MouseInput } from './MouseInput.js';

export class InputManager {
  /** @param {object} cfg full CONFIG  @param {object} preview WebcamPreview */
  constructor(cfg, preview) {
    this.cfg = cfg;
    this.preview = preview;
    this.mode = 'none';                 // 'hand' | 'mouse' | 'none'
    this.state = { visible: false, x: 0.5, y: 0.35, closed: false, ratio: 2 };

    this.mapper = new GestureMapper(cfg.hand);
    this.mouse = new MouseInput(cfg.mouse);
    this.tracker = null;
  }

  preload() {
    return HandTracker.preload(this.cfg.hand.modelComplexity);
  }

  async useHand(onStatus) {
    this.mouse.detach();
    this.mapper.reset();
    this.tracker = new HandTracker((results, video) => this._onHandResults(results, video), this.cfg.hand.modelComplexity);
    await this.tracker.start(onStatus);
    this.preview.show();
    this.mode = 'hand';
  }

  useMouse() {
    this.tracker?.stop();
    this.tracker = null;
    this.preview.hide();
    this.mouse.attach();
    this.mode = 'mouse';
  }

  /** Stop everything (camera off, mouse detached). */
  stop() {
    this.tracker?.stop();
    this.tracker = null;
    this.mouse.detach();
    this.preview.hide();
    this.mode = 'none';
  }

  _onHandResults(results, video) {
    const landmarks = results.multiHandLandmarks?.[0] ?? null;
    this.state = this.mapper.update(landmarks, performance.now());
    this.preview.draw(video, landmarks, this.state);
  }

  /** Call once per frame. */
  update(dt) {
    if (this.mode === 'mouse') this.state = this.mouse.update(dt);
    return this.state;
  }
}
