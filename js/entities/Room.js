// The room: floor, walls, ceiling rail mount, window and decorations.
import * as THREE from 'three';
import { makeFloorTexture, makeWallTexture } from '../utils/textures.js';

export class Room {
  constructor(scene, cfg) {
    const { halfWidth: hw, height: h, halfDepth: hd } = cfg.room;
    const colors = cfg.colors;
    this.group = new THREE.Group();
    scene.add(this.group);

    // ── Floor ────────────────────────────────────────────
    const floorTex = makeFloorTexture(colors.floor);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(hw * 2, hd * 2),
      new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.7 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    // ── Back wall ────────────────────────────────────────
    const wallTex = makeWallTexture(colors.wall, colors.wallDark);
    wallTex.repeat.set(2, 1);
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95 });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2, h), wallMat);
    back.position.set(0, h / 2, -hd);
    back.receiveShadow = true;
    this.group.add(back);

    // ── Side walls ───────────────────────────────────────
    const sideTex = wallTex.clone();
    sideTex.repeat.set(1, 1);
    sideTex.needsUpdate = true;
    const sideMat = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.95 });
    for (const dir of [-1, 1]) {
      const side = new THREE.Mesh(new THREE.PlaneGeometry(hd * 2, h), sideMat);
      side.position.set(dir * hw, h / 2, 0);
      side.rotation.y = -dir * Math.PI / 2;
      side.receiveShadow = true;
      this.group.add(side);
    }

    // ── Ceiling ──────────────────────────────────────────
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(hw * 2, hd * 2),
      new THREE.MeshStandardMaterial({ color: 0x1b2347, roughness: 1 })
    );
    ceiling.position.y = h;
    ceiling.rotation.x = Math.PI / 2;
    this.group.add(ceiling);

    // ── Baseboard along the back wall ────────────────────
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(hw * 2, 0.25, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xf2ead8, roughness: 0.6 })
    );
    board.position.set(0, 0.125, -hd + 0.06);
    board.receiveShadow = true;
    this.group.add(board);

    this._addWindow(-4.6, 5.3, -hd);
    this._addFrame(1.6, 5.6, -hd, 2.2, 1.5, 0xff8fb8, 0xffc93c);
    this._addFrame(4.2, 6.1, -hd, 1.3, 1.7, 0x4aa8ff, 0x3ee6b0);
    this._addRug();
  }

  _addWindow(x, y, z) {
    const w = 3.2, hgt = 2.8;
    const sky = new THREE.Mesh(
      new THREE.PlaneGeometry(w, hgt),
      new THREE.MeshBasicMaterial({ color: 0x9fd8ff })
    );
    sky.position.set(x, y, z + 0.02);
    this.group.add(sky);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0xf6f0e2, roughness: 0.5 });
    const t = 0.14;
    const parts = [
      [w + t * 2, t, 0, hgt / 2 + t / 2],
      [w + t * 2, t, 0, -hgt / 2 - t / 2],
      [t, hgt, -w / 2 - t / 2, 0],
      [t, hgt, w / 2 + t / 2, 0],
      [t, hgt, 0, 0],
      [w, t, 0, 0],
    ];
    for (const [pw, ph, px, py] of parts) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, 0.12), frameMat);
      m.position.set(x + px, y + py, z + 0.08);
      m.castShadow = true;
      this.group.add(m);
    }
  }

  _addFrame(x, y, z, w, h, color, inner) {
    const outer = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.2, h + 0.2, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xf6f0e2, roughness: 0.5 })
    );
    outer.position.set(x, y, z + 0.06);
    outer.castShadow = true;
    this.group.add(outer);
    const art = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ color, roughness: 0.9 })
    );
    art.position.set(x, y, z + 0.11);
    this.group.add(art);
    const dot = new THREE.Mesh(
      new THREE.CircleGeometry(Math.min(w, h) * 0.28, 32),
      new THREE.MeshStandardMaterial({ color: inner, roughness: 0.9 })
    );
    dot.position.set(x, y, z + 0.12);
    this.group.add(dot);
  }

  _addRug() {
    const rug = new THREE.Mesh(
      new THREE.CircleGeometry(1, 64),
      new THREE.MeshStandardMaterial({ color: 0x3a4a8c, roughness: 1 })
    );
    rug.scale.set(5.2, 2, 1);
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(-1.8, 0.01, 0.4);
    rug.receiveShadow = true;
    this.group.add(rug);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.88, 0.94, 64),
      new THREE.MeshStandardMaterial({ color: 0xffc93c, roughness: 1 })
    );
    ring.scale.set(5.2, 2, 1);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(-1.8, 0.015, 0.4);
    this.group.add(ring);
  }
}
