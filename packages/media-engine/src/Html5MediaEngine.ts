import { LumoMediaEngine } from './LumoMediaEngine';

export class Html5MediaEngine implements LumoMediaEngine {
  private element: HTMLMediaElement;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private boundDomHandlers: Map<string, EventListener> = new Map();

  constructor(mediaElement: HTMLMediaElement) {
    this.element = mediaElement;
    this.setupCoreEvents();
  }

  private setupCoreEvents(): void {
    const events = [
      'play', 'pause', 'timeupdate', 'ended',
      'seeking', 'seeked', 'ratechange', 'volumechange',
      'loadedmetadata', 'canplay', 'error', 'waiting'
    ];

    for (const evtName of events) {
      const handler: EventListener = (evt: Event) => {
        this.emit(evtName, evt);
      };
      this.boundDomHandlers.set(evtName, handler);
      this.element.addEventListener(evtName, handler);
    }
  }

  public async load(source: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!source) {
        resolve();
        return;
      }

      const onCanPlay = () => {
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        // Resolve anyway to prevent unhandled rejection during mock or missing media
        resolve();
      };

      const cleanup = () => {
        this.element.removeEventListener('canplay', onCanPlay);
        this.element.removeEventListener('error', onError);
      };

      this.element.addEventListener('canplay', onCanPlay);
      this.element.addEventListener('error', onError);

      this.element.src = source;
      this.element.load();
    });
  }

  public async play(): Promise<void> {
    try {
      await this.element.play();
    } catch (err: any) {
      // Browsers often reject play() without direct user gesture; emit event
      if (err.name !== 'AbortError') {
        this.emit('playback-blocked', err);
      }
    }
  }

  public pause(): void {
    this.element.pause();
  }

  public seek(seconds: number): void {
    if (Number.isFinite(seconds)) {
      this.element.currentTime = Math.max(0, Math.min(seconds, this.getDuration() || seconds));
    }
  }

  public getCurrentTime(): number {
    return this.element.currentTime || 0;
  }

  public getDuration(): number {
    return Number.isFinite(this.element.duration) ? this.element.duration : 0;
  }

  public setPlaybackRate(rate: number): void {
    if (Number.isFinite(rate) && rate > 0) {
      this.element.playbackRate = rate;
    }
  }

  public getPlaybackRate(): number {
    return this.element.playbackRate || 1.0;
  }

  public setVolume(volume: number): void {
    if (Number.isFinite(volume)) {
      this.element.volume = Math.max(0, Math.min(1, volume));
    }
  }

  public setMuted(muted: boolean): void {
    this.element.muted = muted;
  }

  public isPaused(): boolean {
    return this.element.paused;
  }

  public on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  public off(event: string, callback: (...args: any[]) => void): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(callback);
    }
  }

  private emit(event: string, ...args: any[]): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const cb of handlers) {
        try {
          cb(...args);
        } catch (e) {
          console.error(`[Lumo Html5MediaEngine] Handler error for "${event}":`, e);
        }
      }
    }
  }

  public getElement(): HTMLMediaElement {
    return this.element;
  }

  public destroy(): void {
    for (const [evtName, handler] of this.boundDomHandlers.entries()) {
      this.element.removeEventListener(evtName, handler);
    }
    this.boundDomHandlers.clear();
    this.listeners.clear();
  }
}
