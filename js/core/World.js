// Renderer, camera and lights. Knows nothing about game rules.
import * as THREE from 'three';
import { damp } from '../utils/math.js';

export class World {
  constructor(canvas, cfg) {
    this.cfg = cfg;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x141a38);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    this.swayX = 0;
    this.lookY = cfg.room.height / 2 - 0.15;

    this._addLights();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  _addLights() {
    const { room } = this.cfg;
    this.scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x6b4a33, 1.3));

    const sun = new THREE.DirectionalLight(0xfff1d6, 2.6);
    sun.position.set(-6, 11, 9);
    sun.target.position.set(0, 0, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const s = sun.shadow.camera;
    s.left = -room.halfWidth - 2; s.right = room.halfWidth + 2;
    s.top = room.height + 2;      s.bottom = -2;
    s.near = 1;                   s.far = 40;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.03;
    this.scene.add(sun, sun.target);

    const lamp = new THREE.PointLight(0xffd9a0, 40, 0, 2);
    lamp.position.set(0, room.height - 0.6, 2.5);
    this.scene.add(lamp);
  }

  /** Keep the whole room visible on any screen shape. */
  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;

    const { room } = this.cfg;
    const t = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const needH = room.height + 1.0;
    const needW = room.halfWidth * 2 + 1.0;
    const distH = needH / 2 / t;
    const distW = needW / 2 / (t * this.camera.aspect);
    this.camera.position.set(0, this.lookY, Math.max(distH, distW) + 0.5);
    this.camera.updateProjectionMatrix();
  }

  /** Subtle camera drift that follows the claw – adds depth. */
  update(dt, focusX) {
    this.swayX = damp(this.swayX, focusX * 0.1, 3, dt);
    this.camera.position.x = this.swayX;
    this.camera.lookAt(this.swayX * 0.4, this.lookY, 0);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
