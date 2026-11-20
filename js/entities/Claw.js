// The claw machine: ceiling rail, trolley, cable and a 3-finger gripper.
// Fingers are driven by a single number `grip` (0 = closed, 1 = open).
import * as THREE from 'three';
import { damp, clamp } from '../utils/math.js';

// Finger geometry / poses (angles in radians, positive = tip swings inward).
const FINGER = {
  pivotRadius: 0.3,
  pivotDrop: 0.12,
  upperLen: 0.6,
  lowerLen: 0.5,
  open:   { a: -0.75, b: 0.95 },
  closed: { a: 0.0,   b: 0.75 },
};

export class Claw {
  constructor(scene, cfg, bucket) {
    this.cfg = cfg.claw;
    this.colors = cfg.colors;
    this.bucket = bucket;
    this.room = cfg.room;

    this.position = new THREE.Vector3(0, 6, 0);   // claw head centre
    this.target = new THREE.Vector2(0, 6);
    this.velocity = new THREE.Vector2();
    this.holdPoint = new THREE.Vector3();         // where a held ball sits
    this.grip = 1;
    this.gripTarget = 1;
    this.heldBall = null;
    this.tilt = 0;

    this.group = new THREE.Group();
    scene.add(this.group);

    this._buildRail(cfg.room.halfWidth);
    this._buildTrolley();
    this._buildCable();
    this._buildHead();
    this._buildGuides();
    this._apply();
  }

  // ── Construction ─────────────────────────────────────────
  _metal(color = this.colors.metal) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.7 });
  }

  _buildRail(halfWidth) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(halfWidth * 2 - 0.2, 0.22, 0.42), this._metal(0x8e99b8));
    rail.position.set(0, this.cfg.railY + 0.3, 0);
    rail.castShadow = true;
    this.group.add(rail);
    for (const dir of [-1, 1]) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.6), this._metal(0x6c7798));
      cap.position.set(dir * (halfWidth - 0.15), this.cfg.railY + 0.3, 0);
      this.group.add(cap);
    }
  }

  _buildTrolley() {
    this.trolley = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.42, 0.75),
      new THREE.MeshStandardMaterial({ color: this.colors.clawBody, roughness: 0.4, metalness: 0.2 })
    );
    body.castShadow = true;
    this.trolley.add(body);
    for (const dx of [-0.32, 0.32]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 20), this._metal(0x39415f));
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(dx, 0.28, 0);
      this.trolley.add(wheel);
    }
    this.trolley.position.y = this.cfg.railY;
    this.group.add(this.trolley);
  }

  _buildCable() {
    this.cable = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 10), this._metal(0x2a3150));
    this.cable.castShadow = true;
    this.group.add(this.cable);
  }

  _buildHead() {
    this.head = new THREE.Group();
    this.group.add(this.head);

    const bodyMat = new THREE.MeshStandardMaterial({ color: this.colors.clawBody, roughness: 0.35, metalness: 0.25 });
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.3, 32), bodyMat);
    hub.castShadow = true;
    this.head.add(hub);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), this._metal(0x39415f));
    cap.position.y = 0.2;
    this.head.add(cap);
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.12, 32), this._metal(0x39415f));
    skirt.position.y = -0.16;
    this.head.add(skirt);

    // Three fingers, 120° apart.
    this.fingers = [];
    const fingerMat = this._metal(0xe8ecf7);
    const padMat = new THREE.MeshStandardMaterial({ color: this.colors.clawPad, roughness: 0.6 });
    for (let i = 0; i < 3; i++) {
      const finger = this._buildFinger(fingerMat, padMat);
      finger.holder.rotation.y = (i / 3) * Math.PI * 2 + Math.PI / 2;
      this.head.add(finger.holder);
      this.fingers.push(finger);
    }
  }

  _buildFinger(mat, padMat) {
    const { pivotRadius, pivotDrop, upperLen, lowerLen } = FINGER;
    const holder = new THREE.Group();
    const pivot = new THREE.Group();
    pivot.position.set(pivotRadius, -pivotDrop, 0);
    holder.add(pivot);

    const upGeo = new THREE.BoxGeometry(0.12, upperLen, 0.17);
    upGeo.translate(0, -upperLen / 2, 0);
    const upper = new THREE.Mesh(upGeo, mat);
    upper.castShadow = true;
    pivot.add(upper);

    const jointGeo = new THREE.SphereGeometry(0.09, 14, 10);
    pivot.add(new THREE.Mesh(jointGeo, mat));

    const elbow = new THREE.Group();
    elbow.position.y = -upperLen;
    pivot.add(elbow);
    elbow.add(new THREE.Mesh(jointGeo, mat));

    const lowGeo = new THREE.BoxGeometry(0.1, lowerLen, 0.15);
    lowGeo.translate(0, -lowerLen / 2, 0);
    const lower = new THREE.Mesh(lowGeo, mat);
    lower.castShadow = true;
    elbow.add(lower);

    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), padMat);
    tip.position.y = -lowerLen;
    elbow.add(tip);

    return { holder, pivot, elbow };
  }

  _buildGuides() {
    // Thin laser line down to the floor + glowing ring so you can aim.
    this.beamMat = new THREE.MeshBasicMaterial({
      color: this.colors.glow, transparent: true, opacity: 0.16,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.beam = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 6), this.beamMat);
    this.group.add(this.beam);

    this.ringMat = new THREE.MeshBasicMaterial({
      color: this.colors.glow, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    this.floorRing = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.52, 40), this.ringMat);
    this.floorRing.rotation.x = -Math.PI / 2;
    this.floorRing.position.y = 0.03;
    this.group.add(this.floorRing);
  }

  // ── Control API ──────────────────────────────────────────
  setTarget(x, y) {
    this.target.set(x, y);
  }

  attach(ball) { this.heldBall = ball; }

  /** Detach and return the held ball (or null). */
  detach() {
    const ball = this.heldBall;
    this.heldBall = null;
    return ball;
  }

  /** Lowest allowed head height at a given x (stay above the bucket). */
  _minYAt(x) {
    return this.bucket.overlapsX(x, 0.45) ? this.cfg.bucketClearY : this.cfg.minY;
  }

  // ── Per-frame update ─────────────────────────────────────
  update(dt) {
    const c = this.cfg;
    const tx = clamp(this.target.x, c.minX, c.maxX);
    const minY = Math.max(this._minYAt(this.position.x), this._minYAt(tx));
    const ty = clamp(this.target.y, minY, c.maxY);

    const px = this.position.x;
    const py = this.position.y;
    this.position.x = damp(px, tx, c.followLambda, dt);
    this.position.y = damp(py, ty, c.followLambda, dt);
    const inv = 1 / Math.max(dt, 1e-4);
    this.velocity.set((this.position.x - px) * inv, (this.position.y - py) * inv);

    this.grip = damp(this.grip, this.gripTarget, c.gripLambda, dt);

    // gentle pendulum sway when moving sideways
    const swayTarget = clamp(-this.velocity.x * 0.035, -0.28, 0.28);
    this.tilt = damp(this.tilt, swayTarget, 7, dt);

    this._apply();
  }

  _apply() {
    const { x, y } = this.position;
    const railY = this.cfg.railY;

    this.trolley.position.x = x;

    this.head.position.set(x, y, 0);
    this.head.rotation.z = this.tilt;

    // cable between trolley bottom and head top
    const top = railY - 0.22;
    const bottom = y + 0.3;
    const len = Math.max(0.05, top - bottom);
    this.cable.scale.y = len;
    this.cable.position.set(x, bottom + len / 2, 0);

    // fingers
    const g = this.grip;
    const a = FINGER.closed.a + (FINGER.open.a - FINGER.closed.a) * g;
    const b = FINGER.closed.b + (FINGER.open.b - FINGER.closed.b) * g;
    for (const f of this.fingers) {
      f.pivot.rotation.z = -a;
      f.elbow.rotation.z = -b;
    }

    this.holdPoint.set(x, y - this.cfg.holdDepth, 0);

    // aim guides
    this.beam.scale.y = Math.max(0.01, y - 1.1);
    this.beam.position.set(x, 0.03 + (y - 1.1) / 2, 0);
    this.floorRing.position.x = x;
    this.floorRing.scale.setScalar(1 + (1 - g) * -0.25);
    this.ringMat.opacity = 0.35 + g * 0.25;
  }
}
