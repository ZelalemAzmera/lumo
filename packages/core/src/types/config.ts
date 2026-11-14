export interface LumoPlayerConfig {
  src: string;
  poster?: string;
  title?: string;
  captionsEn?: string;
  captionsAm?: string;
  eslSrc?: string;
  audioDescriptionSrc?: string;
  offlineEnabled?: boolean;
  aiEducatorEnabled?: boolean;
  lessonId?: string;
}

export type PlaybackState = 'IDLE' | 'LOADING' | 'PLAYING' | 'PAUSED' | 'ENDED' | 'ERROR';
