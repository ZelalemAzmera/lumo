import { Cue } from '../types/captions';
import { formatTimeDisplay } from '../utils/formatTime';

export class TranscriptSync {
  private panelElement: HTMLElement;
  private cues: Cue[] = [];
  private cueElements: HTMLElement[] = [];
  private onSeekCallback?: (time: number) => void;
  private currentActiveIndex: number = -1;

  constructor(container: HTMLElement | ShadowRoot, onSeek?: (time: number) => void) {
    this.panelElement = document.createElement('div');
    this.panelElement.className = 'lumo-transcript-panel';
    this.panelElement.setAttribute('role', 'region');
    this.panelElement.setAttribute('aria-label', 'Synchronized lesson transcript');
    this.panelElement.tabIndex = 0; // Reachable by keyboard
    this.onSeekCallback = onSeek;

    container.appendChild(this.panelElement);
  }

  public setCues(cues: Cue[], lang: string = 'en'): void {
    this.cues = cues;
    this.panelElement.setAttribute('lang', lang);
    this.render();
  }

  private render(): void {
    this.panelElement.innerHTML = '';
    this.cueElements = [];
    this.currentActiveIndex = -1;

    if (this.cues.length === 0) {
      const emptyNote = document.createElement('p');
      emptyNote.textContent = 'No transcript available for this lesson.';
      this.panelElement.appendChild(emptyNote);
      return;
    }

    for (let i = 0; i < this.cues.length; i++) {
      const cue = this.cues[i];
      const div = document.createElement('div');
      div.className = 'lumo-transcript-cue';
      div.tabIndex = 0;
      div.setAttribute('role', 'button');
      div.setAttribute('aria-label', `Seek to ${formatTimeDisplay(cue.startTime)}: ${cue.text}`);

      const timeSpan = document.createElement('span');
      timeSpan.className = 'lumo-transcript-time';
      timeSpan.textContent = formatTimeDisplay(cue.startTime);
      timeSpan.setAttribute('aria-hidden', 'true');

      const textSpan = document.createElement('span');
      textSpan.textContent = cue.text;

      div.appendChild(timeSpan);
      div.appendChild(textSpan);

      div.addEventListener('click', () => {
        if (this.onSeekCallback) {
          this.onSeekCallback(cue.startTime);
        }
      });

      div.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (this.onSeekCallback) {
            this.onSeekCallback(cue.startTime);
          }
        }
      });

      this.panelElement.appendChild(div);
      this.cueElements.push(div);
    }
  }

  public updateTime(currentTime: number): void {
    if (this.cues.length === 0) return;

    let activeIdx = -1;
    for (let i = 0; i < this.cues.length; i++) {
      if (currentTime >= this.cues[i].startTime && currentTime <= this.cues[i].endTime) {
        activeIdx = i;
        break;
      }
    }

    if (activeIdx !== this.currentActiveIndex) {
      if (this.currentActiveIndex !== -1 && this.cueElements[this.currentActiveIndex]) {
        this.cueElements[this.currentActiveIndex].classList.remove('active');
      }

      this.currentActiveIndex = activeIdx;

      if (activeIdx !== -1 && this.cueElements[activeIdx]) {
        const activeElem = this.cueElements[activeIdx];
        activeElem.classList.add('active');

        // Scroll active item smoothly into view if not user-scrolling
        activeElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  public hide(): void {
    this.panelElement.style.display = 'none';
  }

  public show(): void {
    this.panelElement.style.display = 'block';
  }
}
