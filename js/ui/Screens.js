// Full-screen overlays: start menu, countdown and game over.

export class Screens {
  constructor() {
    this.menu = document.getElementById('screen-menu');
    this.count = document.getElementById('screen-count');
    this.over = document.getElementById('screen-over');
    this.countText = document.getElementById('count-text');
    this.menuMsg = document.getElementById('menu-msg');
    this.btnHand = document.getElementById('btn-hand');
    this.btnMouse = document.getElementById('btn-mouse');
    this.btnAgain = document.getElementById('btn-again');
    this.btnMenu = document.getElementById('btn-menu');

    this.finalScore = document.getElementById('final-score');
    this.finalNote = document.getElementById('final-note');

    // Assigned by main.js
    this.onPlayHand = () => {};
    this.onPlayMouse = () => {};
    this.onPlayAgain = () => {};
    this.onBackToMenu = () => {};

    this.btnHand.addEventListener('click', () => this.onPlayHand());
    this.btnMouse.addEventListener('click', () => this.onPlayMouse());
    this.btnAgain.addEventListener('click', () => this.onPlayAgain());
    this.btnMenu.addEventListener('click', () => this.onBackToMenu());
  }

  // ── Menu ─────────────────────────────────────────────────
  showMenu() {
    this.over.classList.remove('visible');
    this.count.classList.remove('visible');
    this.menu.classList.add('visible');
    this.setMenuBusy(false);
  }
  hideMenu() { this.menu.classList.remove('visible'); }

  setMenuBusy(busy, message = '') {
    this.btnHand.disabled = busy;
    this.btnMouse.disabled = busy;
    this.menuMsg.className = busy ? 'busy' : '';
    this.menuMsg.textContent = busy ? message : '';
  }

  setMenuError(message) {
    this.btnHand.disabled = false;
    this.btnMouse.disabled = false;
    this.menuMsg.className = 'error';
    this.menuMsg.textContent = message;
  }

  // ── Countdown ────────────────────────────────────────────
  showCountdown(text) {
    this.count.classList.add('visible');
    this.countText.textContent = text;
    this.countText.classList.remove('pop');
    void this.countText.offsetWidth;
    this.countText.classList.add('pop');
  }
  hideCountdown() { this.count.classList.remove('visible'); }

  // ── Game over ────────────────────────────────────────────
  showGameOver(score, isNewBest, best) {
    this.finalScore.textContent = score;
    this.finalNote.textContent = isNewBest
      ? 'New best score!'
      : `Best score: ${best}`;
    this.over.classList.add('visible');
  }
  hideGameOver() { this.over.classList.remove('visible'); }
}
