// Entry point: creates the pieces and connects the buttons.
import { CONFIG } from './config.js';
import { World } from './core/World.js';
import { Game } from './core/Game.js';
import { InputManager } from './input/InputManager.js';
import { WebcamPreview } from './ui/WebcamPreview.js';
import { Hud } from './ui/Hud.js';
import { Screens } from './ui/Screens.js';
import { Sound } from './audio/Sound.js';

const canvas = document.getElementById('scene');

const sound = new Sound();
const hud = new Hud();
const screens = new Screens();
const preview = new WebcamPreview();
const input = new InputManager(CONFIG, preview);
const world = new World(canvas, CONFIG);
const game = new Game({ world, input, hud, screens, sound, cfg: CONFIG });

// ── Menu buttons ───────────────────────────────────────────
screens.onPlayHand = async () => {
  sound.unlock();
  screens.setMenuBusy(true, 'Starting camera… allow access if your browser asks.');
  try {
    await input.useHand();
    game.start();
  } catch (err) {
    console.error(err);
    const denied = err?.name === 'NotAllowedError';
    const missing = err?.name === 'NotFoundError';
    screens.setMenuError(
      denied ? 'Camera access was blocked. Allow it in the address bar, or play with the mouse.'
      : missing ? 'No camera found. You can still play with the mouse.'
      : `Could not start hand tracking: ${err.message}`
    );
  }
};

screens.onPlayMouse = () => {
  sound.unlock();
  input.useMouse();
  game.start();
};

screens.onPlayAgain = () => { sound.unlock(); game.start(); };
screens.onBackToMenu = () => {
  input.stop();
  game.goToMenu();
};

// ── Keyboard shortcuts ─────────────────────────────────────
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyM') {
    sound.unlock();
    const muted = sound.toggleMute();
    document.getElementById('mute-hint').textContent = muted ? 'Sound off (M)' : 'Sound on (M)';
  }
  if (e.code === 'KeyR' && game.state === 'over') game.start();
});

screens.showMenu();
game.run();

// Handy for debugging in the browser console.
window.__game = game;
