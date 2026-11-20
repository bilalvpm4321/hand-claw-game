// Headless gameplay test (no browser needed):  node tests/simulate.mjs
// It fakes the DOM + renderer, then plays a scripted round:
// grab a ball → carry it to the bucket → release → expect a score.

import * as THREE from 'three';

// ── Minimal fake browser environment ─────────────────────
const fakeCtx = new Proxy({}, {
  get: (_, k) => (k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => {}),
  set: () => true,
});
const fakeEl = () => ({
  getContext: () => fakeCtx, style: {}, classList: { add() {}, remove() {}, toggle() {} },
  appendChild() {}, addEventListener() {}, remove() {}, width: 0, height: 0, textContent: '',
});
globalThis.document = { createElement: fakeEl, getElementById: fakeEl };
globalThis.window = { innerWidth: 1280, innerHeight: 720, addEventListener() {} };
globalThis.localStorage = { getItem: () => null, setItem() {} };

const { CONFIG } = await import('../js/config.js');
const { Game } = await import('../js/core/Game.js');
const { lerp } = await import('../js/utils/math.js');

// ── Fakes for everything that touches the screen/hardware ─
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 100);
camera.position.set(0, 4.3, 14); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
const world = { scene, camera, update() {}, render() {} };
const inputState = { visible: true, x: 0.5, y: 0.3, closed: false, ratio: 2 };
const input = { mode: 'mouse', state: inputState, update: () => inputState };
const noop = () => {};
const hud = { setScore: noop, setTime: noop, setBest: noop, setStreak: noop, setGesture: noop, show: noop };
const screens = { hideMenu: noop, hideGameOver: noop, hideCountdown: noop, showCountdown: noop, showMenu: noop, showGameOver: noop };
const sound = new Proxy({}, { get: () => noop });

const game = new Game({ world, input, hud, screens, sound, cfg: CONFIG });
const C = CONFIG.claw;
const dt = 1 / 60;
const step = (n) => { for (let i = 0; i < n; i++) game.update(dt); };
const aimClaw = (x, y) => {
  inputState.x = (x - C.minX) / (C.maxX - C.minX);
  inputState.y = (C.maxY - y) / (C.maxY - C.minY);
};
let failures = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} ${extra}`);
  if (!ok) failures++;
};

// ── Scenario ─────────────────────────────────────────────
game.start();
step(60 * 3.2);
check('countdown finished → playing', game.state === 'playing');

// Park one ball where we want it so the test is deterministic.
const ball = game.balls.balls[0];
ball.vx = 0; ball.path = { baseY: 3, amp: 0, freq: 1, phase: 0 };
ball.position.set(-2, 3, 0);

aimClaw(-2, 3 + C.holdDepth);
step(120);
inputState.closed = true;
step(5);
check('ball grabbed', ball.state === 'held', `(state=${ball.state})`);

aimClaw(game.bucket.x, 5.5);
step(240);
const hold = game.claw.holdPoint;
check('ball follows claw', Math.hypot(ball.position.x - hold.x, ball.position.y - hold.y) < 0.15);
check('claw stays above bucket rim', game.claw.position.y >= C.bucketClearY - 0.05);

inputState.closed = false;
step(150);
check('score awarded', game.score === CONFIG.score.perBall, `(score=${game.score})`);
check('streak = 1', game.streak === 1);

// Second ball: released over empty floor → miss.
const ball2 = game.balls.balls[1];
ball2.vx = 0; ball2.path = { baseY: 3, amp: 0, freq: 1, phase: 0 };
ball2.position.set(-4, 3, 0);
aimClaw(-4, 3 + C.holdDepth); step(150);
inputState.closed = true; step(5);
check('second ball grabbed', ball2.state === 'held');
aimClaw(-4, 5); step(100);
inputState.closed = false; step(240);
check('miss resets streak', game.streak === 0, `(streak=${game.streak})`);
check('score unchanged after miss', game.score === CONFIG.score.perBall);

// Empty close does nothing bad.
aimClaw(0, 6); step(60);
for (const b of game.balls.balls) if (b.state === 'roam') { b.state = 'gone'; b.timer = 0; } // clear the area
inputState.closed = true; step(30);
check('closing on nothing holds nothing', game.claw.heldBall === null);
inputState.closed = false; step(10);

// Round ends.
step(60 * 62);
check('round over after timer', game.state === 'over');

console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
