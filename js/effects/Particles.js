// A pool of glowing sparks (one draw call). Used for score bursts and poofs.
import * as THREE from 'three';
import { makeGlowTexture } from '../utils/textures.js';

export class Particles {
  constructor(scene, capacity = 500) {
    this.capacity = capacity;
    this.positions = new Float32Array(capacity * 3);
    this.colors = new Float32Array(capacity * 3);
    this.velocities = new Float32Array(capacity * 3);
    this.base = new Float32Array(capacity * 3);
    this.life = new Float32Array(capacity);
    this.maxLife = new Float32Array(capacity).fill(1);
    this.cursor = 0;
    this.positions.fill(-999);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry = geo;

    this.points = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.38, map: makeGlowTexture(), vertexColors: true, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    }));
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  /** Spray `count` sparks from `pos` in `color` (hex number). */
  burst(pos, color, count = 36, speed = 4.5) {
    const c = new THREE.Color(color);
    for (let n = 0; n < count; n++) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % this.capacity;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const s = speed * (0.35 + Math.random() * 0.65);
      this.positions[i * 3] = pos.x;
      this.positions[i * 3 + 1] = pos.y;
      this.positions[i * 3 + 2] = pos.z;
      this.velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * s;
      this.velocities[i * 3 + 1] = Math.abs(Math.cos(phi)) * s + 1.5;
      this.velocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * s;
      this.base[i * 3] = c.r; this.base[i * 3 + 1] = c.g; this.base[i * 3 + 2] = c.b;
      this.life[i] = this.maxLife[i] = 0.7 + Math.random() * 0.6;
    }
  }

  update(dt) {
    for (let i = 0; i < this.capacity; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      const k = Math.max(0, this.life[i] / this.maxLife[i]);
      this.velocities[i * 3 + 1] -= 7 * dt;
      for (let a = 0; a < 3; a++) {
        this.positions[i * 3 + a] += this.velocities[i * 3 + a] * dt;
        this.colors[i * 3 + a] = this.base[i * 3 + a] * k;
      }
      if (this.life[i] <= 0) this.positions[i * 3 + 1] = -999;
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }
}
