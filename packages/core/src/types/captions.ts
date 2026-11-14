export interface Cue {
  id?: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  text: string;
  lang?: string;     // 'en' | 'am' etc.
}

export interface WebVTTData {
  header: string;
  cues: Cue[];
}

export type CaptionTheme = 'white-black' | 'yellow-black' | 'black-white';
export type CaptionSize = 100 | 150 | 200;
