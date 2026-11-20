// Opens the webcam and runs MediaPipe Hands on every frame.
// The MediaPipe library itself is loaded in index.html (window.Hands).

export class HandTracker {
  /** @param {(results: object) => void} onResults called for each processed frame */
  constructor(onResults, modelComplexity = 1) {
    this.onResults = onResults;
    this.modelComplexity = modelComplexity;
    this.video = null;
    this.stream = null;
    this.hands = null;
    this.running = false;
    this._busy = false;
    this._lastVideoTime = -1;
    this._loop = this._loop.bind(this);
  }

  async start() {
    if (!window.Hands) throw new Error('MediaPipe Hands library failed to load.');
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Camera access needs http://localhost or https. Open the game through the start script.');
    }

    this.video = document.createElement('video');
    this.video.playsInline = true;
    this.video.muted = true;

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      audio: false,
    });
    this.video.srcObject = this.stream;
    await this.video.play();

    this.hands = new window.Hands({ locateFile: (file) => `vendor/mediapipe/hands/${file}` });
    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: this.modelComplexity,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5,
    });
    this.hands.onResults((r) => this.onResults(r, this.video));
    await this.hands.initialize();

    this.running = true;
    requestAnimationFrame(this._loop);
  }

  async _loop() {
    if (!this.running) return;
    const v = this.video;
    if (!this._busy && v.readyState >= 2 && v.currentTime !== this._lastVideoTime) {
      this._lastVideoTime = v.currentTime;
      this._busy = true;
      try {
        await this.hands.send({ image: v });
      } catch (err) {
        console.error('Hand tracking error:', err);
      }
      this._busy = false;
    }
    requestAnimationFrame(this._loop);
  }

  stop() {
    this.running = false;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.hands?.close?.();
  }
}
