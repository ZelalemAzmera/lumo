import { Announcer } from '../player/Announcer';

export class ADController {
  private videoElement: HTMLVideoElement;
  private standardSrc: string;
  private describedSrc?: string;
  private announcer: Announcer;
  private isADActive = false;
  private onToggleCallback?: (active: boolean) => void;

  constructor(
    videoElement: HTMLVideoElement,
    standardSrc: string,
    describedSrc: string | undefined,
    announcer: Announcer,
    onToggle?: (active: boolean) => void
  ) {
    this.videoElement = videoElement;
    this.standardSrc = standardSrc;
    this.describedSrc = describedSrc;
    this.announcer = announcer;
    this.onToggleCallback = onToggle;
  }

  public setSources(standardSrc: string, describedSrc?: string): void {
    this.standardSrc = standardSrc;
    this.describedSrc = describedSrc;
  }

  public hasDescribedTrack(): boolean {
    return Boolean(this.describedSrc && this.describedSrc.trim() !== '');
  }

  public isActive(): boolean {
    return this.isADActive;
  }

  public toggle(): boolean {
    if (!this.hasDescribedTrack() || !this.describedSrc) {
      this.announcer.announce('No audio description track available for this lesson');
      return false;
    }

    const currentTime = this.videoElement.currentTime;
    const isPaused = this.videoElement.paused;
    this.isADActive = !this.isADActive;

    const targetSrc = this.isADActive ? this.describedSrc : this.standardSrc;

    this.videoElement.src = targetSrc;
    this.videoElement.currentTime = currentTime;

    if (!isPaused) {
      this.videoElement.play().catch(console.error);
    }

    this.announcer.announce(
      this.isADActive ? 'Audio description enabled' : 'Audio description disabled'
    );

    if (this.onToggleCallback) {
      this.onToggleCallback(this.isADActive);
    }

    return this.isADActive;
  }
}
