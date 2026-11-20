// Heads-up display: score, timer, best score, streak and hand status.

export class Hud {
  constructor() {
    this.scoreEl = document.getElementById('score');
    this.timeEl = document.getElementById('time');
    this.bestEl = document.getElementById('best');
    this.streakEl = document.getElementById('streak');
    this.gestureEl = document.getElementById('gesture');
    this.timeBox = document.getElementById('time-box');
    this.hudEl = document.getElementById('hud');
  }

  show() { this.hudEl.classList.add('visible'); }

  setScore(value) {
    this.scoreEl.textContent = value;
    this.scoreEl.classList.remove('bump');
    void this.scoreEl.offsetWidth;          // restart CSS animation
    this.scoreEl.classList.add('bump');
  }

  setTime(seconds) {
    this.timeEl.textContent = seconds;
    this.timeBox.classList.toggle('urgent', seconds <= 10);
  }

  setBest(value) { this.bestEl.textContent = value; }

  setStreak(n) {
    if (n >= 2) {
      this.streakEl.textContent = `${n} in a row`;
      this.streakEl.classList.add('visible');
    } else {
      this.streakEl.classList.remove('visible');
    }
  }

  /** Shows what the game currently sees: open hand, fist, no hand, mouse. */
  setGesture(mode, state) {
    let text = '';
    let cls = '';
    if (mode === 'none') {
      this.gestureEl.className = '';
      return;
    }
    if (mode === 'mouse') {
      text = state.closed ? 'Mouse: closed' : 'Mouse: open';
      cls = state.closed ? 'closed' : 'open';
    } else if (!state.visible) {
      text = 'Show your hand to the camera';
      cls = 'lost';
    } else {
      text = state.closed ? 'Hand closed' : 'Hand open';
      cls = state.closed ? 'closed' : 'open';
    }
    if (this.gestureEl.textContent !== text) this.gestureEl.textContent = text;
    this.gestureEl.className = `visible ${cls}`;
  }
}
