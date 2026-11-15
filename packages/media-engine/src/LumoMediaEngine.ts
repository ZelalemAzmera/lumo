/**
 * LumoMediaEngine
 * Standardized media engine abstraction interface for Lumo accessible player.
 * Wraps HTML5 Media Elements, Video.js adapters, and audio descriptions.
 */
export interface LumoMediaEngine {
  /**
   * Load a media source URL
   */
  load(source: string): Promise<void>;

  /**
   * Start playback
   */
  play(): Promise<void>;

  /**
   * Pause playback
   */
  pause(): void;

  /**
   * Seek to specific position in seconds
   */
  seek(seconds: number): void;

  /**
   * Get current playback position in seconds
   */
  getCurrentTime(): number;

  /**
   * Get total duration in seconds (0 if unknown/loading)
   */
  getDuration(): number;

  /**
   * Set playback speed (e.g. 0.75, 1.0, 1.25, 1.5, 2.0)
   */
  setPlaybackRate(rate: number): void;

  /**
   * Get current playback speed
   */
  getPlaybackRate?(): number;

  /**
   * Set volume [0.0 - 1.0]
   */
  setVolume?(volume: number): void;

  /**
   * Set muted state
   */
  setMuted?(muted: boolean): void;

  /**
   * Check if media is paused
   */
  isPaused?(): boolean;

  /**
   * Register event listener ('play', 'pause', 'timeupdate', 'ended', 'ratechange', 'volumechange', 'error', 'loadedmetadata')
   */
  on(event: string, callback: (...args: any[]) => void): void;

  /**
   * Unregister event listener
   */
  off?(event: string, callback: (...args: any[]) => void): void;

  /**
   * Clean up resources and detach listeners
   */
  destroy?(): void;
}
