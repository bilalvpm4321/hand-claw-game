// The target bucket. Also provides simple box colliders for dropped balls.
import * as THREE from 'three';

export class Bucket {
  constructor(scene, cfg) {
    this.cfg = cfg.bucket;
    const { x, outerWidth, wall, height } = this.cfg;
    const radius = outerWidth / 2;
    this.x = x;
    this.rimY = height;
    this.innerHalf = radius - wall;

    this.group = new THREE.Group();
    this.group.position.set(x, 0, 0);
    scene.add(this.group);

    // Shell – slightly tapered, open on top.
    const shellMat = new THREE.MeshStandardMaterial({
      color: cfg.colors.bucket, roughness: 0.45, metalness: 0.15, side: THREE.DoubleSide,
    });
    const shell = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius * 0.92, height, 48, 1, true), shellMat
    );
    shell.position.y = height / 2;
    shell.castShadow = true;
    shell.receiveShadow = true;
    this.group.add(shell);

    // Inner floor
    const bottom = new THREE.Mesh(
      new THREE.CircleGeometry(radius * 0.92, 48),
      new THREE.MeshStandardMaterial({ color: 0x7a2a22, roughness: 0.9 })
    );
    bottom.rotation.x = -Math.PI / 2;
    bottom.position.y = 0.2;
    bottom.receiveShadow = true;
    this.group.add(bottom);

    // Rim
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.08, 16, 64),
      new THREE.MeshStandardMaterial({ color: cfg.colors.bucketRim, roughness: 0.35, metalness: 0.3 })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = height;
    rim.castShadow = true;
    this.group.add(rim);

    // White band
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.975, radius * 0.955, 0.3, 48, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xfff4dc, roughness: 0.6, side: THREE.DoubleSide })
    );
    band.position.y = height * 0.5;
    this.group.add(band);

    // Pulsing target glow above the opening.
    this.glowMat = new THREE.MeshBasicMaterial({
      color: cfg.colors.glow, transparent: true, opacity: 0.12,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.85, radius * 0.95, 3.2, 40, 1, true), this.glowMat
    );
    beam.position.y = height + 1.6;
    this.group.add(beam);

    this.ringMat = new THREE.MeshBasicMaterial({
      color: cfg.colors.glow, transparent: true, opacity: 0.8,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.ring = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.88, 0.035, 8, 64), this.ringMat);
    this.ring.rotation.x = Math.PI / 2;
    this.ring.position.y = height + 0.02;
    this.group.add(this.ring);

    // Colliders (axis-aligned boxes in world X/Y) used by dropped balls.
    const thin = 0.07;
    this.colliders = [
      { minX: x - radius, maxX: x - radius + thin, minY: 0, maxY: height },   // left wall
      { minX: x + radius - thin, maxX: x + radius, minY: 0, maxY: height },   // right wall
      { minX: x - radius, maxX: x + radius, minY: 0, maxY: 0.2 },             // bottom
    ];
    this.radius = radius;
    this._pulse = 0;
    this._flash = 0;
  }

  /** True while a ball centre is inside the bucket opening. */
  contains(pos) {
    return Math.abs(pos.x - this.x) < this.innerHalf && pos.y < this.rimY - 0.05 && pos.y > 0.2;
  }

  /** Is x within the bucket's horizontal footprint (plus margin)? */
  overlapsX(x, margin = 0) {
    return Math.abs(x - this.x) < this.radius + margin;
  }

  flash() { this._flash = 1; }

  update(dt, time) {
    this._flash = Math.max(0, this._flash - dt * 2.5);
    const pulse = 0.5 + 0.5 * Math.sin(time * 2.4);
    this.glowMat.opacity = 0.08 + pulse * 0.07 + this._flash * 0.35;
    this.ringMat.opacity = 0.45 + pulse * 0.35 + this._flash * 0.2;
    const s = 1 + this._flash * 0.08;
    this.group.scale.set(s, 1 - this._flash * 0.04, s);
  }
}
