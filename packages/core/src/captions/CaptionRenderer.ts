import { Cue, CaptionTheme, CaptionSize } from '../types/captions';
import { VTTParser } from './VTTParser';

export class CaptionRenderer {
  private overlayElement: HTMLElement;
  private cueBoxElement: HTMLElement;
  private currentCues: Cue[] = [];
  private activeLanguage: 'en' | 'am' | 'off' = 'off';
  private currentSize: CaptionSize = 100;
  private currentTheme: CaptionTheme = 'white-black';
  private trackCache: Map<string, Cue[]> = new Map();

  constructor(container: HTMLElement | ShadowRoot) {
    this.overlayElement = document.createElement('div');
    this.overlayElement.className = 'lumo-caption-overlay';
    this.overlayElement.setAttribute('aria-hidden', 'true');

    this.cueBoxElement = document.createElement('div');
    this.cueBoxElement.className = 'lumo-cue-box';
    this.overlayElement.appendChild(this.cueBoxElement);

    container.appendChild(this.overlayElement);
  }

  public async loadTrack(language: 'en' | 'am', url: string): Promise<void> {
    if (!url) return;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load caption file: HTTP ${response.status}`);
      }
      const vttText = await response.text();
      const parsed = VTTParser.parse(vttText);
      this.trackCache.set(language, parsed.cues);

      if (this.activeLanguage === language) {
        this.currentCues = parsed.cues;
      }
    } catch (err) {
      console.error(`[Lumo CaptionRenderer] Error loading ${language} captions:`, err);
    }
  }

  public setTrackCues(language: 'en' | 'am', cues: Cue[]): void {
    this.trackCache.set(language, cues);
    if (this.activeLanguage === language) {
      this.currentCues = cues;
    }
  }

  public setLanguage(lang: 'en' | 'am' | 'off'): void {
    this.activeLanguage = lang;
    if (lang === 'off') {
      this.currentCues = [];
      this.clear();
    } else {
      this.currentCues = this.trackCache.get(lang) || [];
    }
  }

  public getLanguage(): 'en' | 'am' | 'off' {
    return this.activeLanguage;
  }

  public setSize(size: CaptionSize): void {
    this.currentSize = size;
    this.updateAppearance();
  }

  public getSize(): CaptionSize {
    return this.currentSize;
  }

  public setTheme(theme: CaptionTheme): void {
    this.currentTheme = theme;
    this.updateAppearance();
  }

  public getTheme(): CaptionTheme {
    return this.currentTheme;
  }

  public updateTime(currentTime: number): void {
    if (this.activeLanguage === 'off' || this.currentCues.length === 0) {
      if (this.cueBoxElement.childElementCount > 0) {
        this.clear();
      }
      return;
    }

    const matchingCues = this.currentCues.filter(
      cue => currentTime >= cue.startTime && currentTime <= cue.endTime
    );

    if (matchingCues.length === 0) {
      this.clear();
      return;
    }

    // Render active cues
    this.cueBoxElement.innerHTML = '';
    for (const cue of matchingCues) {
      const span = document.createElement('span');
      span.className = `lumo-cue-text size-${this.currentSize} theme-${this.currentTheme}`;
      
      const cueLang = cue.lang || (this.activeLanguage === 'am' ? 'am' : 'en');
      span.setAttribute('lang', cueLang);
      span.textContent = cue.text;
      
      this.cueBoxElement.appendChild(span);
    }
  }

  private updateAppearance(): void {
    const spans = this.cueBoxElement.querySelectorAll('.lumo-cue-text');
    spans.forEach(span => {
      span.className = `lumo-cue-text size-${this.currentSize} theme-${this.currentTheme}`;
    });
  }

  public clear(): void {
    this.cueBoxElement.innerHTML = '';
  }

  public getCuesFor(language: 'en' | 'am'): Cue[] {
    return this.trackCache.get(language) || [];
  }
}
