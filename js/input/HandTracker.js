// Opens the webcam and runs MediaPipe Hands on every frame.
// The MediaPipe library itself is loaded in index.html (window.Hands).

let sharedHands = null;
let sharedHandsPromise = null;

export class HandTracker {
  /**
   * Preload and warm up the MediaPipe models in the background.
   * Can be called as soon as the page loads so starting the game is fast.
   */
  static preload(modelComplexity = 0) {
    if (sharedHands) return Promise.resolve(sharedHands);
    if (sharedHandsPromise) return sharedHandsPromise;
    if (typeof window === 'undefined' || !window.Hands) return Promise.resolve(null);

    const hands = new window.Hands({ locateFile: (file) => `vendor/mediapipe/hands/${file}` });
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5,
    });

    sharedHandsPromise = hands.initialize().then(() => {
      sharedHands = hands;
      return hands;
    }).catch((err) => {
      console.warn('MediaPipe preloading deferred or failed:', err);
      sharedHands = null;
      sharedHandsPromise = null;
      return null;
    });

    return sharedHandsPromise;
  }

  /** @param {(results: object) => void} onResults called for each processed frame */
  constructor(onResults, modelComplexity = 0) {
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

  async start(onStatus) {
    if (typeof window === 'undefined' || !window.Hands) {
      throw new Error('MediaPipe Hands library failed to load.');
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Camera access needs http://localhost or https. Open the game through the start script.');
    }

    onStatus?.('Starting camera… allow access if your browser asks.');

    // 1. Concurrently start the webcam and obtain the MediaPipe model
    let localStream = null;
    const cameraPromise = (async () => {
      const video = document.createElement('video');
      video.playsInline = true;
      video.muted = true;

      localStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      video.srcObject = localStream;
      await video.play();
      return { video, stream: localStream };
    })();

    const handsPromise = (async () => {
      let hands = sharedHands;
      if (!hands) {
        if (sharedHandsPromise) {
          hands = await sharedHandsPromise;
        }
        if (!hands) {
          onStatus?.('Loading hand tracking models…');
          hands = await HandTracker.preload(this.modelComplexity);
        }
      }
      if (!hands) {
        hands = new window.Hands({ locateFile: (file) => `vendor/mediapipe/hands/${file}` });
        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: this.modelComplexity,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.5,
        });
        await hands.initialize();
        sharedHands = hands;
      }
      return hands;
    })();

    try {
      const [{ video, stream }, hands] = await Promise.all([cameraPromise, handsPromise]);
      this.video = video;
      this.stream = stream;
      this.hands = hands;
      this.hands.onResults((r) => this.onResults(r, this.video));

      this.running = true;
      requestAnimationFrame(this._loop);
    } catch (err) {
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
      throw err;
    }
  }

  async _loop() {
    if (!this.running) return;
    const v = this.video;
    if (!this._busy && v && v.readyState >= 2 && v.currentTime !== this._lastVideoTime) {
      this._lastVideoTime = v.currentTime;
      this._busy = true;
      try {
        await this.hands.send({ image: v });
      } catch (err) {
        console.error('Hand tracking error:', err);
      }
      this._busy = false;
    }
    if (this.running) {
      requestAnimationFrame(this._loop);
    }
  }

  stop() {
    this.running = false;
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }
    // Do not destroy this.hands so future rounds start instantly without re-compiling WASM.
  }
}
