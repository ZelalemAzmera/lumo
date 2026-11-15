/**
 * VideoSync — High-Precision Synchronization Controller
 * Ensures Ethiopian Sign Language (EthSL) PIP video remains tightly synchronized
 * with the primary lesson video with sub-35ms AV delta tolerance.
 */
export class VideoSync {
  private mainVideo: HTMLVideoElement;
  private eslVideo: HTMLVideoElement;
  
  // Strict sub-35ms synchronization threshold (0.035s)
  private readonly syncThreshold: number = 0.035; 
  private rafId: number | null = null;
  private isDestroyed = false;

  constructor(mainVideo: HTMLVideoElement, eslVideo: HTMLVideoElement) {
    this.mainVideo = mainVideo;
    this.eslVideo = eslVideo;
    this.eslVideo.muted = true; // Always muted to avoid audio doubling
    this.attachListeners();
  }

  private attachListeners(): void {
    this.mainVideo.addEventListener('play', () => {
      this.syncTime();
      this.eslVideo.play().catch(() => {});
      this.startContinuousSync();
    });

    this.mainVideo.addEventListener('pause', () => {
      this.stopContinuousSync();
      this.eslVideo.pause();
      this.syncTime();
    });

    this.mainVideo.addEventListener('seeking', () => {
      this.syncTime();
    });

    this.mainVideo.addEventListener('seeked', () => {
      this.syncTime();
    });

    this.mainVideo.addEventListener('timeupdate', () => {
      this.checkAndCorrectDrift();
    });

    this.mainVideo.addEventListener('ratechange', () => {
      this.eslVideo.playbackRate = this.mainVideo.playbackRate;
    });

    this.mainVideo.addEventListener('waiting', () => {
      this.eslVideo.pause();
    });

    this.mainVideo.addEventListener('playing', () => {
      this.syncTime();
      if (this.eslVideo.paused) {
        this.eslVideo.play().catch(() => {});
      }
      this.startContinuousSync();
    });
  }

  private startContinuousSync(): void {
    if (this.rafId !== null || this.isDestroyed) return;

    const tick = () => {
      if (this.isDestroyed || this.mainVideo.paused) {
        this.rafId = null;
        return;
      }
      this.checkAndCorrectDrift();
      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  private stopContinuousSync(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Returns current measured drift between master and sign video in milliseconds
   */
  public getDriftMs(): number {
    return Math.abs(this.mainVideo.currentTime - this.eslVideo.currentTime) * 1000;
  }

  /**
   * Checks current drift against the strict 35ms threshold and snaps if exceeded
   */
  public checkAndCorrectDrift(): void {
    const delta = Math.abs(this.mainVideo.currentTime - this.eslVideo.currentTime);
    if (delta > this.syncThreshold) {
      this.eslVideo.currentTime = this.mainVideo.currentTime;
    }
  }

  public syncTime(): void {
    if (Math.abs(this.mainVideo.currentTime - this.eslVideo.currentTime) > 0.005) {
      this.eslVideo.currentTime = this.mainVideo.currentTime;
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.stopContinuousSync();
    this.eslVideo.pause();
  }
}
