// The game: ties input, claw, balls and bucket together and enforces the rules.
//
//   menu ──▶ countdown ──▶ playing ──▶ over ──▶ (countdown again)
//
import * as THREE from 'three';
import { Room } from '../entities/Room.js';
import { Bucket } from '../entities/Bucket.js';
import { Claw } from '../entities/Claw.js';
import { BallManager } from '../entities/BallManager.js';
import { Particles } from '../effects/Particles.js';
import { Popups } from '../ui/Popups.js';
import { lerp } from '../utils/math.js';

const BEST_KEY = 'hand-claw-game-best';

export class Game {
  constructor({ world, input, hud, screens, sound, cfg }) {
    this.cfg = cfg;
    this.world = world;
    this.input = input;
    this.hud = hud;
    this.screens = screens;
    this.sound = sound;

    // World objects
    this.room = new Room(world.scene, cfg);
    this.bucket = new Bucket(world.scene, cfg);
    this.claw = new Claw(world.scene, cfg, this.bucket);
    this.balls = new BallManager(world.scene, cfg);
    this.particles = new Particles(world.scene);
    this.popups = new Popups();

    // State
    this.state = 'menu';
    this.time = 0;
    this.score = 0;
    this.streak = 0;
    this.timeLeft = cfg.round.duration;
    this.countLeft = 0;
    this.lastCountShown = null;
    this.prevClosed = false;
    this.best = this._loadBest();

    this.hud.setBest(this.best);
    this.hud.setScore(0);
    this.hud.setTime(cfg.round.duration);

    // Callbacks handed to balls
    this.ballCtx = {
      claw: this.claw,
      bucket: this.bucket,
      onScore: (ball) => this._onScore(ball),
      onMiss: (ball) => this._onMiss(ball),
    };
  }

  // ── Round control ────────────────────────────────────────
  start() {
    this._releaseHeld();
    this.score = 0;
    this.streak = 0;
    this.timeLeft = this.cfg.round.duration;
    this.countLeft = this.cfg.round.countdown;
    this.lastCountShown = null;
    this.balls.resetAll();

    this.hud.setScore(0);
    this.hud.setStreak(0);
    this.hud.setTime(this.timeLeft);
    this.hud.show();
    this.screens.hideMenu();
    this.screens.hideGameOver();
    this.state = 'countdown';
  }

  goToMenu() {
    this._releaseHeld();
    this.state = 'menu';
    this.screens.hideGameOver();
    this.screens.hideCountdown();
    this.screens.showMenu();
  }

  _endRound() {
    this.state = 'over';
    this._releaseHeld();
    const isNewBest = this.score > this.best;
    if (isNewBest) {
      this.best = this.score;
      this._saveBest(this.best);
      this.hud.setBest(this.best);
    }
    this.sound.end();
    this.screens.showGameOver(this.score, isNewBest, this.best);
  }

  // ── Main loop ────────────────────────────────────────────
  run() {
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      this.update(dt);
      this.world.render();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  update(dt) {
    this.time += dt;

    this._updateInput(dt);
    this._updateRound(dt);

    this.claw.update(dt);
    this.balls.update(dt, this.time, this.ballCtx);
    this.bucket.update(dt, this.time);
    this.particles.update(dt);
    this.world.update(dt, this.claw.position.x);
  }

  // ── Input → claw ─────────────────────────────────────────
  _updateInput(dt) {
    const cfg = this.cfg.claw;
    const mode = this.input.mode;
    const s = this.input.update(dt);
    this.hud.setGesture(mode, s);

    if (mode === 'none') {
      // Attract mode: the claw sweeps around by itself behind the menu.
      this.claw.setTarget(Math.sin(this.time * 0.45) * 5, 4.8 + Math.sin(this.time * 0.9) * 1.6);
      this.claw.gripTarget = 0.5 + 0.5 * Math.sin(this.time * 1.3);
      return;
    }

    // Move only while a hand is visible – otherwise hold position.
    if (s.visible) {
      this.claw.setTarget(
        lerp(cfg.minX, cfg.maxX, s.x),
        lerp(cfg.maxY, cfg.minY, s.y)
      );
      this._handleGrip(s.closed);
    }
  }

  /** Detects the open→closed and closed→open moments of the hand. */
  _handleGrip(closed) {
    const claw = this.claw;
    if (closed !== this.prevClosed) {
      this.prevClosed = closed;
      if (closed) {
        const ball = this.balls.findGrabbable(claw.holdPoint, this.cfg.claw.grabRadius);
        if (ball) {
          ball.grab();
          claw.attach(ball);
          this.sound.grab();
        } else {
          this.sound.close();
        }
      } else {
        this._releaseHeld();
      }
    }
    claw.gripTarget = closed ? (claw.heldBall ? this.cfg.claw.holdGrip : 0) : 1;
  }

  _releaseHeld() {
    const ball = this.claw.detach();
    if (ball) {
      ball.release(this.claw.velocity);
      this.sound.release();
    }
    this.prevClosed = false;
  }

  // ── Round timer ──────────────────────────────────────────
  _updateRound(dt) {
    if (this.state === 'countdown') {
      this.countLeft -= dt;
      const n = Math.ceil(this.countLeft);
      if (n !== this.lastCountShown && n > 0) {
        this.lastCountShown = n;
        this.screens.showCountdown(String(n));
        this.sound.tick();
      }
      if (this.countLeft <= 0) {
        this.state = 'playing';
        this.screens.showCountdown('Go!');
        this.sound.go();
        setTimeout(() => this.screens.hideCountdown(), 650);
      }
    } else if (this.state === 'playing') {
      const before = Math.ceil(this.timeLeft);
      this.timeLeft = Math.max(0, this.timeLeft - dt);
      const after = Math.ceil(this.timeLeft);
      if (after !== before) {
        this.hud.setTime(after);
        if (after <= 5 && after > 0) this.sound.tick();
      }
      if (this.timeLeft <= 0) this._endRound();
    }
  }

  // ── Scoring ──────────────────────────────────────────────
  _onScore(ball) {
    const sc = this.cfg.score;
    const burstPos = new THREE.Vector3(this.bucket.x, this.bucket.rimY + 0.3, 0.2);
    this.particles.burst(burstPos, ball.color, 44, 5);
    this.particles.burst(burstPos, 0xffffff, 14, 3);
    this.bucket.flash();

    if (this.state !== 'playing') return;   // practice catches don't count

    const bonus = Math.min(this.streak, sc.maxStreakBonus) * sc.streakBonus;
    const points = sc.perBall + bonus;
    this.score += points;
    this.streak += 1;
    this.hud.setScore(this.score);
    this.hud.setStreak(this.streak);
    this.sound.score(this.streak - 1);

    const popPos = new THREE.Vector3(this.bucket.x, this.bucket.rimY + 1.0, 0);
    this.popups.show(popPos, `+${points}`, this.world.camera);
  }

  _onMiss(ball) {
    this.particles.burst(ball.position, 0xb8c0dd, 10, 2);
    if (this.state !== 'playing') return;
    this.streak = 0;
    this.hud.setStreak(0);
    this.sound.miss();
  }

  // ── Best score storage ───────────────────────────────────
  _loadBest() {
    try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; }
  }
  _saveBest(v) {
    try { localStorage.setItem(BEST_KEY, String(v)); } catch { /* storage unavailable */ }
  }
}
