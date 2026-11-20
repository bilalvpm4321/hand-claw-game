// Procedurally drawn textures – no image files needed.
import * as THREE from 'three';

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

function toTexture(canvas, { repeatX = 1, repeatY = 1 } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 4;
  return tex;
}

const hex = (n) => '#' + n.toString(16).padStart(6, '0');

/** Wooden plank floor. */
export function makeFloorTexture(baseColor) {
  const c = makeCanvas(1024, 512);
  const g = c.getContext('2d');
  g.fillStyle = hex(baseColor);
  g.fillRect(0, 0, c.width, c.height);
  const plankH = 64;
  for (let row = 0; row < c.height / plankH; row++) {
    const y = row * plankH;
    let x = -((row * 173) % 300);
    while (x < c.width) {
      const w = 260 + ((row * 37 + x) % 120);
      const shade = (Math.sin(row * 12.9 + x * 0.07) * 0.5 + 0.5) * 0.22 - 0.11;
      g.fillStyle = shade > 0 ? `rgba(255,235,200,${shade})` : `rgba(40,20,5,${-shade})`;
      g.fillRect(x, y, w, plankH);
      g.fillStyle = 'rgba(40,20,5,0.35)';
      g.fillRect(x, y, 2, plankH);
      for (let i = 0; i < 6; i++) {
        g.strokeStyle = 'rgba(60,30,10,0.12)';
        g.beginPath();
        const gy = y + 8 + i * 9;
        g.moveTo(x, gy);
        g.bezierCurveTo(x + w * 0.3, gy + 3, x + w * 0.6, gy - 3, x + w, gy + 1);
        g.stroke();
      }
      x += w;
    }
    g.fillStyle = 'rgba(40,20,5,0.45)';
    g.fillRect(0, y, c.width, 2);
  }
  return toTexture(c, { repeatX: 2, repeatY: 1 });
}

/** Soft vertical-stripe wallpaper with a darker wainscot band at the bottom. */
export function makeWallTexture(base, dark) {
  const c = makeCanvas(1024, 1024);
  const g = c.getContext('2d');
  g.fillStyle = hex(base);
  g.fillRect(0, 0, c.width, c.height);
  for (let x = 0; x < c.width; x += 64) {
    g.fillStyle = 'rgba(255,255,255,0.045)';
    g.fillRect(x, 0, 32, c.height);
  }
  // dots
  g.fillStyle = 'rgba(255,255,255,0.05)';
  for (let y = 40; y < 700; y += 80) {
    for (let x = 32; x < c.width; x += 64) {
      g.beginPath();
      g.arc(x, y + ((x / 64) % 2) * 40, 4, 0, Math.PI * 2);
      g.fill();
    }
  }
  // wainscot
  g.fillStyle = hex(dark);
  g.fillRect(0, 720, c.width, 304);
  g.fillStyle = 'rgba(255,255,255,0.12)';
  g.fillRect(0, 716, c.width, 6);
  g.strokeStyle = 'rgba(0,0,0,0.25)';
  g.lineWidth = 3;
  for (let x = 0; x < c.width; x += 128) g.strokeRect(x + 12, 750, 104, 240);
  return toTexture(c);
}

/** Striped ball texture so you can see it rolling. */
export function makeBallTexture(color) {
  const c = makeCanvas(256, 128);
  const g = c.getContext('2d');
  g.fillStyle = hex(color);
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = 'rgba(255,255,255,0.92)';
  g.fillRect(0, 46, c.width, 36);
  g.fillStyle = 'rgba(0,0,0,0.18)';
  g.fillRect(0, 42, c.width, 4);
  g.fillRect(0, 82, c.width, 4);
  g.fillStyle = hex(color);
  for (let i = 0; i < 4; i++) {
    g.beginPath();
    g.arc(32 + i * 64, 64, 9, 0, Math.PI * 2);
    g.fill();
  }
  return toTexture(c);
}

/** Round soft sprite for particles. */
export function makeGlowTexture() {
  const c = makeCanvas(64, 64);
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.5)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
