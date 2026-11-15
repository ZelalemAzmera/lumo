import { LumoMediaEngine } from './LumoMediaEngine';

/**
 * VideoJsMediaEngine
 * Adapter wrapping the open-source Video.js media engine for Lumo accessibility platform.
 */
export class VideoJsMediaEngine implements LumoMediaEngine {
  private player: any;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  constructor(playerInstance: any) {
    this.player = playerInstance;
    this.bindEvents();
  }

  private bindEvents(): void {
    const events = [
      'play', 'pause', 'timeupdate', 'ended',
      'seeking', 'seeked', 'ratechange', 'volumechange',
      'loadedmetadata', 'error'
    ];

    for (const evt of events) {
      if (this.player && typeof this.player.on === 'function') {
        this.player.on(evt, (...args: any[]) => {
          this.emit(evt, ...args);
        });
      }
    }
  }

  public async load(source: string): Promise<void> {
    if (this.player) {
      if (typeof this.player.src === 'function') {
        this.player.src({ src: source, type: 'video/mp4' });
      }
      if (typeof this.player.load === 'function') {
        this.player.load();
      }
    }
  }

  public async play(): Promise<void> {
    if (this.player && typeof this.player.play === 'function') {
      try {
        await this.player.play();
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          this.emit('playback-blocked', err);
        }
      }
    }
  }

  public pause(): void {
    if (this.player && typeof this.player.pause === 'function') {
      this.player.pause();
    }
  }

  public seek(seconds: number): void {
    if (this.player && typeof this.player.currentTime === 'function') {
      this.player.currentTime(seconds);
    }
  }

  public getCurrentTime(): number {
    return this.player && typeof this.player.currentTime === 'function'
      ? this.player.currentTime()
      : 0;
  }

  public getDuration(): number {
    return this.player && typeof this.player.duration === 'function'
      ? this.player.duration()
      : 0;
  }

  public setPlaybackRate(rate: number): void {
    if (this.player && typeof this.player.playbackRate === 'function') {
      this.player.playbackRate(rate);
    }
  }

  public getPlaybackRate(): number {
    return this.player && typeof this.player.playbackRate === 'function'
      ? this.player.playbackRate()
      : 1.0;
  }

  public setVolume(volume: number): void {
    if (this.player && typeof this.player.volume === 'function') {
      this.player.volume(volume);
    }
  }

  public setMuted(muted: boolean): void {
    if (this.player && typeof this.player.muted === 'function') {
      this.player.muted(muted);
    }
  }

  public isPaused(): boolean {
    return this.player && typeof this.player.paused === 'function'
      ? this.player.paused()
      : true;
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
          console.error(`[Lumo VideoJsMediaEngine] Error in handler for "${event}":`, e);
        }
      }
    }
  }

  public getRawPlayer(): any {
    return this.player;
  }

  public destroy(): void {
    if (this.player && typeof this.player.dispose === 'function') {
      this.player.dispose();
    }
    this.listeners.clear();
  }
}
