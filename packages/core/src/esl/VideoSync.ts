export class VideoSync {
  private mainVideo: HTMLVideoElement;
  private eslVideo: HTMLVideoElement;
  private syncThreshold: number = 0.25; // 250ms threshold

  constructor(mainVideo: HTMLVideoElement, eslVideo: HTMLVideoElement) {
    this.mainVideo = mainVideo;
    this.eslVideo = eslVideo;
    this.eslVideo.muted = true; // Always muted
    this.attachListeners();
  }

  private attachListeners(): void {
    this.mainVideo.addEventListener('play', () => {
      this.syncTime();
      this.eslVideo.play().catch(() => {});
    });

    this.mainVideo.addEventListener('pause', () => {
      this.eslVideo.pause();
      this.syncTime();
    });

    this.mainVideo.addEventListener('seeking', () => {
      this.syncTime();
    });

    this.mainVideo.addEventListener('timeupdate', () => {
      const delta = Math.abs(this.mainVideo.currentTime - this.eslVideo.currentTime);
      if (delta > this.syncThreshold) {
        this.syncTime();
      }
    });

    this.mainVideo.addEventListener('ratechange', () => {
      this.eslVideo.playbackRate = this.mainVideo.playbackRate;
    });
  }

  public syncTime(): void {
    if (Math.abs(this.mainVideo.currentTime - this.eslVideo.currentTime) > 0.05) {
      this.eslVideo.currentTime = this.mainVideo.currentTime;
    }
  }

  public destroy(): void {
    this.eslVideo.pause();
  }
}
