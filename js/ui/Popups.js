// Floating "+10" texts that rise from a point in the 3D world.

export class Popups {
  constructor(containerId = 'popups') {
    this.container = document.getElementById(containerId);
  }

  /**
   * @param {THREE.Vector3} worldPos where to show it
   * @param {string} text
   * @param {THREE.PerspectiveCamera} camera
   */
  show(worldPos, text, camera, kind = 'score') {
    const v = worldPos.clone().project(camera);
    const x = (v.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-v.y * 0.5 + 0.5) * window.innerHeight;

    const el = document.createElement('div');
    el.className = `popup ${kind}`;
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    this.container.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}
