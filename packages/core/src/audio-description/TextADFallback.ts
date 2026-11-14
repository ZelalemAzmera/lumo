import { Cue } from '../types/captions';
import { Announcer } from '../player/Announcer';

export class TextADFallback {
  private announcer: Announcer;
  private descriptionCues: Cue[] = [];
  private lastAnnouncedCueId?: string;

  constructor(announcer: Announcer) {
    this.announcer = announcer;
  }

  public setCues(cues: Cue[]): void {
    this.descriptionCues = cues;
  }

  public updateTime(currentTime: number): void {
    if (this.descriptionCues.length === 0) return;

    const activeCue = this.descriptionCues.find(
      c => currentTime >= c.startTime && currentTime <= c.endTime
    );

    if (activeCue) {
      const cueKey = activeCue.id || `${activeCue.startTime}-${activeCue.text}`;
      if (this.lastAnnouncedCueId !== cueKey) {
        this.lastAnnouncedCueId = cueKey;
        this.announcer.announce(`Visual description: ${activeCue.text}`, 'polite');
      }
    } else {
      this.lastAnnouncedCueId = undefined;
    }
  }
}
