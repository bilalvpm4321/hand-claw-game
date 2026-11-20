// A single ball. It is a tiny state machine:
//
//   roam    – drifts slowly through the room, bobbing up and down
//   held    – squeezed by the claw
//   falling – released; real physics (gravity, bounces, bucket walls)
//   scored  – landed inside the bucket (still physical, then fades away)
//   gone    – shrinking / waiting to respawn
//
import * as THREE from 'three';
import { makeBallTexture } from '../utils/textures.js';
import { damp, rand, randSign, easeOutBack, clamp } from '../utils/math.js';

const SHARED_GEOMETRY = new THREE.SphereGeometry(1, 40, 28);

export class Ball {
  constructor(scene, cfg, color) {
    this.cfg = cfg;
    this.radius = cfg.balls.radius;
    this.color = color;

    this.mesh = new THREE.Mesh(
      SHARED_GEOMETRY,
      new THREE.MeshStandardMaterial({
        map: makeBallTexture(color), roughness: 0.28, metalness: 0.05,
      })
    );
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    scene.add(this.mesh);

    this.vel = new THREE.Vector2();
    this.state = 'roam';
    this.timer = 0;          // generic per-state timer
    this.spawnT = 0;         // 0 → 1 pop-in animation
    this.path = { baseY: 3, amp: 0.5, freq: 0.6, phase: 0 };
    this.lane = 0;           // z offset so balls can pass each other
    this.vx = 1;
    this.spawn(true);
  }

  get position() { return this.mesh.position; }

  /** (Re)place the ball somewhere in the room and play a pop-in animation. */
  spawn(initial = false) {
    const b = this.cfg.balls;
    this.state = 'roam';
    this.timer = 0;
    this.spawnT = initial ? 1 : 0;
    this.vx = randSign() * rand(b.minSpeed, b.maxSpeed);
    this.lane = rand(-0.5, 0.5);
    this.vel.set(0, 0);

    const baseY = rand(b.minY + 0.6, b.maxY - 0.6);
    this.path = {
      baseY,
      amp: Math.min(rand(0.3, 0.9), baseY - b.minY, b.maxY - baseY),
      freq: rand(0.4, 0.8),
      phase: rand(0, Math.PI * 2),
    };
    this.mesh.position.set(rand(b.roamMinX, b.roamMaxX), baseY, this.lane);
    this.mesh.scale.setScalar(initial ? this.radius : 0.001);
  }

  // ── Claw interaction ───────────────────────────────────
  grab() {
    this.state = 'held';
    this.vel.set(0, 0);
  }

  release(inheritVel) {
    this.state = 'falling';
    this.timer = 0;
    this.vel.set(inheritVel.x * 0.4, inheritVel.y * 0.4);
  }

  // ── Update ─────────────────────────────────────────────
  /**
   * @param {number} dt
   * @param {number} time total game time (seconds)
   * @param {object} ctx { claw, bucket, onScore(ball), onMiss(ball) }
   */
  update(dt, time, ctx) {
    // pop-in animation
    if (this.spawnT < 1) {
      this.spawnT = Math.min(1, this.spawnT + dt / 0.5);
      this.mesh.scale.setScalar(Math.max(0.001, this.radius * easeOutBack(this.spawnT)));
    }

    switch (this.state) {
      case 'roam':    this._roam(dt, time); break;
      case 'held':    this._held(dt, ctx.claw); break;
      case 'falling':
      case 'scored':  this._physics(dt, ctx); break;
      case 'gone':    this._gone(dt); break;
    }
  }

  _roam(dt, time) {
    const b = this.cfg.balls;
    const p = this.mesh.position;
    p.x += this.vx * dt;
    if (p.x > b.roamMaxX) { p.x = b.roamMaxX; this.vx = -Math.abs(this.vx); }
    if (p.x < b.roamMinX) { p.x = b.roamMinX; this.vx = Math.abs(this.vx); }
    const { baseY, amp, freq, phase } = this.path;
    p.y = baseY + amp * Math.sin(freq * time + phase);
    p.z = this.lane;
    this.mesh.rotation.z -= (this.vx * dt) / this.radius;
    this.mesh.rotation.x += 0.4 * dt;
  }

  _held(dt, claw) {
    const target = claw.holdPoint;
    const p = this.mesh.position;
    p.x = damp(p.x, target.x, 22, dt);
    p.y = damp(p.y, target.y, 22, dt);
    p.z = damp(p.z, 0, 12, dt);
    this.mesh.rotation.z += (claw.velocity.x * dt) * -0.4;
  }

  _physics(dt, ctx) {
    const phys = this.cfg.physics;
    const room = this.cfg.room;
    const p = this.mesh.position;
    const r = this.radius;

    this.vel.y -= phys.gravity * dt;
    p.x += this.vel.x * dt;
    p.y += this.vel.y * dt;
    p.z = damp(p.z, 0, 4, dt);

    // Side walls
    const maxX = room.halfWidth - r;
    if (p.x > maxX) { p.x = maxX; this.vel.x = -Math.abs(this.vel.x) * 0.5; }
    if (p.x < -maxX) { p.x = -maxX; this.vel.x = Math.abs(this.vel.x) * 0.5; }

    // Bucket
    for (const box of ctx.bucket.colliders) this._collideBox(box);

    // Floor
    let onFloor = false;
    if (p.y < r) {
      p.y = r;
      if (Math.abs(this.vel.y) > 1.2) this.vel.y = -this.vel.y * phys.restitution;
      else this.vel.y = 0;
      this.vel.x -= this.vel.x * Math.min(1, phys.floorFriction * dt);
      onFloor = true;
    }

    this.mesh.rotation.z -= (this.vel.x * dt) / r;
    this.timer += dt;

    if (this.state === 'falling') {
      if (ctx.bucket.contains(p)) {
        this.state = 'scored';
        this.timer = 0;
        ctx.onScore(this);
      } else if ((onFloor && this.timer > this.cfg.balls.dropMissDelay) || this.timer > 6) {
        ctx.onMiss(this);
        this._startGone();
      }
    } else if (this.state === 'scored' && this.timer > 0.9) {
      this._startGone();
    }
  }

  /** Circle (ball) vs axis-aligned box collision. */
  _collideBox(box) {
    const p = this.mesh.position;
    const cx = clamp(p.x, box.minX, box.maxX);
    const cy = clamp(p.y, box.minY, box.maxY);
    let dx = p.x - cx;
    let dy = p.y - cy;
    const dist = Math.hypot(dx, dy);
    if (dist >= this.radius) return;

    if (dist < 1e-6) { dx = 0; dy = 1; } else { dx /= dist; dy /= dist; }
    p.x = cx + dx * this.radius;
    p.y = cy + dy * this.radius;
    const vn = this.vel.x * dx + this.vel.y * dy;
    if (vn < 0) {
      const e = this.cfg.physics.restitution;
      this.vel.x -= (1 + e) * vn * dx;
      this.vel.y -= (1 + e) * vn * dy;
    }
  }

  _startGone() {
    this.state = 'gone';
    this.timer = 0;
  }

  _gone(dt) {
    this.timer += dt;
    const shrink = clamp(1 - this.timer / 0.3, 0, 1);
    this.mesh.scale.setScalar(Math.max(0.001, this.radius * shrink));
    if (this.timer > 0.3 + this.cfg.balls.respawnDelay) this.spawn(false);
  }
}
