// Small mirrored camera view with the detected hand skeleton drawn on top.
// Helps the player see what the computer sees.

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

export class WebcamPreview {
  constructor(canvasId = 'cam') {
    this.wrap = document.getElementById('cam-wrap');
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
  }

  show() { this.wrap.classList.add('visible'); }
  hide() { this.wrap.classList.remove('visible'); }

  draw(video, landmarks, state) {
    const { width: w, height: h } = this.canvas;
    const g = this.ctx;
    g.save();
    g.clearRect(0, 0, w, h);
    g.translate(w, 0);
    g.scale(-1, 1);                       // mirror, like a mirror
    g.drawImage(video, 0, 0, w, h);
    g.restore();

    // dim the picture slightly so the skeleton stands out
    g.fillStyle = 'rgba(20,24,52,0.25)';
    g.fillRect(0, 0, w, h);

    if (!landmarks) return;

    const color = state.closed ? '#ff5a4d' : '#3ee6b0';
    const px = (p) => (1 - p.x) * w;
    const py = (p) => p.y * h;

    g.lineWidth = 3;
    g.lineCap = 'round';
    g.strokeStyle = color;
    g.beginPath();
    for (const [a, b] of CONNECTIONS) {
      g.moveTo(px(landmarks[a]), py(landmarks[a]));
      g.lineTo(px(landmarks[b]), py(landmarks[b]));
    }
    g.stroke();

    g.fillStyle = '#fff';
    for (const p of landmarks) {
      g.beginPath();
      g.arc(px(p), py(p), 3, 0, Math.PI * 2);
      g.fill();
    }
  }
}
