import { Announcer } from './Announcer';
import { StateMachine } from './StateMachine';
import { KeyboardHandler } from './KeyboardHandler';
import { CaptionRenderer } from '../captions/CaptionRenderer';
import { ESLWindow } from '../esl/ESLWindow';
import { ADController } from '../audio-description/ADController';
import { formatTimeDisplay, formatTimeSpoken } from '../utils/formatTime';
import { LUMO_CORE_STYLES } from '../styles/index';

// SVG Icons
const ICONS = {
  play: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
  rewind10: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.5 3a9 9 0 0 0-9 9H1l3.5 3.5L8 12H5.5a7 7 0 1 1 2.05 4.95l-1.42 1.42A9 9 0 1 0 12.5 3zm-2.2 12.2h-1.4V11h-1v-.9h2.4v5.1zm4.4 0h-1.3c-.6 0-1.1-.2-1.4-.6-.4-.5-.6-1.1-.6-2v-1c0-.9.2-1.5.6-2 .3-.4.8-.6 1.4-.6h1.3c.6 0 1.1.2 1.4.6.4.5.6 1.1.6 2v1c0 .9-.2 1.5-.6 2-.3.4-.8.6-1.4.6zm-1.8-3.6v1.2c0 .5.1.8.2 1 .1.2.3.3.6.3s.5-.1.6-.3c.1-.2.2-.5.2-1v-1.2c0-.5-.1-.8-.2-1-.1-.2-.3-.3-.6-.3s-.5.1-.6.3c-.1.2-.2.5-.2 1z"/></svg>`,
  forward10: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11.5 3a9 9 0 0 1 9 9H23l-3.5 3.5L16 12h2.5a7 7 0 1 0-2.05 4.95l1.42 1.42A9 9 0 1 1 11.5 3zm-2.2 12.2h-1.4V11h-1v-.9h2.4v5.1zm4.4 0h-1.3c-.6 0-1.1-.2-1.4-.6-.4-.5-.6-1.1-.6-2v-1c0-.9.2-1.5.6-2 .3-.4.8-.6 1.4-.6h1.3c.6 0 1.1.2 1.4.6.4.5.6 1.1.6 2v1c0 .9-.2 1.5-.6 2-.3.4-.8.6-1.4.6zm-1.8-3.6v1.2c0 .5.1.8.2 1 .1.2.3.3.6.3s.5-.1.6-.3c.1-.2.2-.5.2-1v-1.2c0-.5-.1-.8-.2-1-.1-.2-.3-.3-.6-.3s-.5.1-.6.3c-.1.2-.2.5-.2 1z"/></svg>`,
  mute: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`,
  volumeHigh: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`
};

export class LumoPlayer extends HTMLElement {
  public static get observedAttributes(): string[] {
    return [
      'src',
      'poster',
      'title',
      'lang',
      'captions',
      'captions-src',
      'captions-en',
      'captions-am',
      'sign',
      'esl-src',
      'describe',
      'ad-src',
      'audio-description-src',
      'theme',
      'caption-size',
      'offline-enabled'
    ];
  }

  private container!: HTMLElement;
  private video!: HTMLVideoElement;
  private announcer!: Announcer;
  private stateMachine!: StateMachine;
  private captionRenderer!: CaptionRenderer;
  private eslWindow!: ESLWindow;
  private adController!: ADController;
  private keyboardHandler!: KeyboardHandler;

  // Control elements
  private btnPlay!: HTMLButtonElement;
  private btnRewind!: HTMLButtonElement;
  private btnForward!: HTMLButtonElement;
  private seekBar!: HTMLInputElement;
  private timeDisplay!: HTMLElement;
  private btnMute!: HTMLButtonElement;
  private volumeBar!: HTMLInputElement;
  private btnCaptions!: HTMLButtonElement;
  private btnESL!: HTMLButtonElement;
  private btnAD!: HTMLButtonElement;
  private btnSpeed!: HTMLButtonElement;

  private isSeeking = false;
  private speedOptions = [0.75, 1.0, 1.25, 1.5];
  private currentSpeedIndex = 1;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  public connectedCallback(): void {
    if (!this.shadowRoot) return;

    // Inject styles
    const styleElement = document.createElement('style');
    styleElement.textContent = LUMO_CORE_STYLES;
    this.shadowRoot.appendChild(styleElement);

    // Build container & video
    this.container = document.createElement('div');
    this.container.className = 'lumo-container';
    this.container.setAttribute('role', 'region');
    this.container.setAttribute('aria-label', this.getAttribute('title') || 'Accessible video lesson');

    this.video = document.createElement('video');
    this.video.className = 'lumo-video';
    this.video.playsInline = true;
    this.video.preload = 'metadata';
    this.video.crossOrigin = 'anonymous';

    if (this.getAttribute('src')) {
      this.video.src = this.getAttribute('src')!;
    }
    if (this.getAttribute('poster')) {
      this.video.poster = this.getAttribute('poster')!;
    }

    this.container.appendChild(this.video);

    // Announcer live region
    this.announcer = new Announcer(this.container);

    // State Machine
    this.stateMachine = new StateMachine('IDLE');

    // Caption Engine
    this.captionRenderer = new CaptionRenderer(this.container);
    if (this.getAttribute('captions-en')) {
      this.captionRenderer.loadTrack('en', this.getAttribute('captions-en')!);
    }
    if (this.getAttribute('captions-am')) {
      this.captionRenderer.loadTrack('am', this.getAttribute('captions-am')!);
    }

    // Audio Description
    this.adController = new ADController(
      this.video,
      this.getAttribute('src') || '',
      this.getAttribute('audio-description-src') || undefined,
      this.announcer,
      (active) => {
        this.btnAD.setAttribute('aria-pressed', active ? 'true' : 'false');
        this.btnAD.setAttribute('aria-label', active ? 'AD Audio Description: enabled' : 'AD Audio Description: disabled');
        this.dispatchEvent(new CustomEvent('lumo:adtoggle', { detail: { active }, bubbles: true, composed: true }));
      }
    );

    // ESL Window
    this.eslWindow = new ESLWindow(
      this.container,
      this.video,
      this.announcer,
      () => {
        this.btnESL.setAttribute('aria-pressed', 'false');
        this.btnESL.focus();
        this.dispatchEvent(new CustomEvent('lumo:eslclose', { bubbles: true, composed: true }));
      }
    );
    if (this.getAttribute('esl-src')) {
      this.eslWindow.setSource(this.getAttribute('esl-src')!);
    }

    // Build Controls Toolbar
    this.buildControls();

    // Keyboard Handler
    this.keyboardHandler = new KeyboardHandler(this.container, {
      togglePlay: () => this.togglePlay(),
      seekRelative: (delta) => this.seekRelative(delta),
      adjustVolume: (delta) => this.adjustVolume(delta),
      toggleMute: () => this.toggleMute(),
      toggleCaptions: () => this.cycleCaptions(),
      toggleESL: () => this.toggleESL(),
      toggleAD: () => this.toggleAD(),
      toggleFullscreen: () => this.toggleFullscreen()
    });

    this.shadowRoot.appendChild(this.container);
    this.attachVideoEvents();

    this.dispatchEvent(new CustomEvent('lumo:ready', {
      detail: { version: '1.0.0' },
      bubbles: true,
      composed: true
    }));
  }

  private buildControls(): void {
    const toolbar = document.createElement('div');
    toolbar.className = 'lumo-controls';
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('aria-label', 'Playback controls');

    // Play/Pause button
    this.btnPlay = document.createElement('button');
    this.btnPlay.className = 'lumo-btn';
    this.btnPlay.id = 'btn-play';
    this.btnPlay.setAttribute('aria-label', 'Play video');
    this.btnPlay.setAttribute('aria-pressed', 'false');
    this.btnPlay.innerHTML = ICONS.play;
    this.btnPlay.addEventListener('click', () => this.togglePlay());
    toolbar.appendChild(this.btnPlay);

    // Rewind 10s
    this.btnRewind = document.createElement('button');
    this.btnRewind.className = 'lumo-btn';
    this.btnRewind.id = 'btn-rewind';
    this.btnRewind.setAttribute('aria-label', 'Rewind 10 seconds');
    this.btnRewind.innerHTML = ICONS.rewind10;
    this.btnRewind.addEventListener('click', () => this.seekRelative(-10));
    toolbar.appendChild(this.btnRewind);

    // Seek Group
    const seekGroup = document.createElement('div');
    seekGroup.className = 'lumo-seek-group';

    this.seekBar = document.createElement('input');
    this.seekBar.type = 'range';
    this.seekBar.id = 'seek-bar';
    this.seekBar.className = 'lumo-slider';
    this.seekBar.min = '0';
    this.seekBar.max = '100';
    this.seekBar.value = '0';
    this.seekBar.setAttribute('aria-label', 'Seek slider');
    this.seekBar.setAttribute('aria-valuemin', '0');
    this.seekBar.setAttribute('aria-valuemax', '100');
    this.seekBar.setAttribute('aria-valuenow', '0');
    this.seekBar.setAttribute('aria-valuetext', '0 seconds');

    this.seekBar.addEventListener('input', () => {
      this.isSeeking = true;
      const targetTime = (parseFloat(this.seekBar.value) / 100) * (this.video.duration || 1);
      this.timeDisplay.textContent = `${formatTimeDisplay(targetTime)} / ${formatTimeDisplay(this.video.duration || 0)}`;
      this.seekBar.setAttribute('aria-valuenow', Math.floor(targetTime).toString());
      this.seekBar.setAttribute('aria-valuetext', formatTimeSpoken(targetTime));
    });

    this.seekBar.addEventListener('change', () => {
      this.isSeeking = false;
      const targetTime = (parseFloat(this.seekBar.value) / 100) * (this.video.duration || 1);
      this.video.currentTime = targetTime;
      this.announcer.announce(`Seek to ${formatTimeSpoken(targetTime)}`);
      this.dispatchEvent(new CustomEvent('lumo:seek', {
        detail: { currentTime: targetTime },
        bubbles: true,
        composed: true
      }));
    });

    this.timeDisplay = document.createElement('span');
    this.timeDisplay.className = 'lumo-time-display';
    this.timeDisplay.setAttribute('aria-hidden', 'true');
    this.timeDisplay.textContent = '00:00 / 00:00';

    seekGroup.appendChild(this.seekBar);
    seekGroup.appendChild(this.timeDisplay);
    toolbar.appendChild(seekGroup);

    // Forward 10s
    this.btnForward = document.createElement('button');
    this.btnForward.className = 'lumo-btn';
    this.btnForward.id = 'btn-forward';
    this.btnForward.setAttribute('aria-label', 'Forward 10 seconds');
    this.btnForward.innerHTML = ICONS.forward10;
    this.btnForward.addEventListener('click', () => this.seekRelative(10));
    toolbar.appendChild(this.btnForward);

    // Volume Group
    const volumeGroup = document.createElement('div');
    volumeGroup.className = 'lumo-volume-group';

    this.btnMute = document.createElement('button');
    this.btnMute.className = 'lumo-btn';
    this.btnMute.id = 'btn-mute';
    this.btnMute.setAttribute('aria-label', 'Mute audio');
    this.btnMute.setAttribute('aria-pressed', 'false');
    this.btnMute.innerHTML = ICONS.volumeHigh;
    this.btnMute.addEventListener('click', () => this.toggleMute());

    this.volumeBar = document.createElement('input');
    this.volumeBar.type = 'range';
    this.volumeBar.className = 'lumo-slider';
    this.volumeBar.id = 'volume-bar';
    this.volumeBar.min = '0';
    this.volumeBar.max = '100';
    this.volumeBar.value = '80';
    this.volumeBar.setAttribute('aria-label', 'Volume control');
    this.volumeBar.setAttribute('aria-valuemin', '0');
    this.volumeBar.setAttribute('aria-valuemax', '100');
    this.volumeBar.setAttribute('aria-valuenow', '80');
    this.volumeBar.setAttribute('aria-valuetext', '80%');

    this.volumeBar.addEventListener('input', () => {
      const vol = parseFloat(this.volumeBar.value) / 100;
      this.video.volume = vol;
      this.video.muted = vol === 0;
      this.updateVolumeUI();
    });

    volumeGroup.appendChild(this.btnMute);
    volumeGroup.appendChild(this.volumeBar);
    toolbar.appendChild(volumeGroup);

    // Feature Toggles: Captions
    this.btnCaptions = document.createElement('button');
    this.btnCaptions.className = 'lumo-btn';
    this.btnCaptions.id = 'btn-captions';
    this.btnCaptions.setAttribute('aria-label', 'CC Captions: off');
    this.btnCaptions.setAttribute('aria-pressed', 'false');
    this.btnCaptions.textContent = 'CC';
    this.btnCaptions.addEventListener('click', () => this.cycleCaptions());
    toolbar.appendChild(this.btnCaptions);

    // Feature Toggles: ESL (Sign Language)
    this.btnESL = document.createElement('button');
    this.btnESL.className = 'lumo-btn';
    this.btnESL.id = 'btn-esl';
    this.btnESL.setAttribute('aria-label', 'ESL Ethiopian Sign Language window');
    this.btnESL.setAttribute('aria-pressed', 'false');
    this.btnESL.textContent = 'ESL';
    this.btnESL.addEventListener('click', () => this.toggleESL());
    if (!this.getAttribute('esl-src')) {
      this.btnESL.style.display = 'none'; // Graceful hiding
    }
    toolbar.appendChild(this.btnESL);

    // Feature Toggles: Audio Description
    this.btnAD = document.createElement('button');
    this.btnAD.className = 'lumo-btn';
    this.btnAD.id = 'btn-ad';
    this.btnAD.setAttribute('aria-label', 'AD Audio Description');
    this.btnAD.setAttribute('aria-pressed', 'false');
    this.btnAD.textContent = 'AD';
    this.btnAD.addEventListener('click', () => this.toggleAD());
    if (!this.getAttribute('audio-description-src')) {
      this.btnAD.style.display = 'none'; // Graceful hiding
    }
    toolbar.appendChild(this.btnAD);

    // Speed Selector
    this.btnSpeed = document.createElement('button');
    this.btnSpeed.className = 'lumo-btn';
    this.btnSpeed.id = 'btn-speed';
    this.btnSpeed.setAttribute('aria-label', 'Playback speed: 1.0x');
    this.btnSpeed.textContent = '1.0x';
    this.btnSpeed.addEventListener('click', () => this.cycleSpeed());
    toolbar.appendChild(this.btnSpeed);

    this.container.appendChild(toolbar);
  }

  private attachVideoEvents(): void {
    this.video.addEventListener('play', () => {
      this.stateMachine.transitionTo('PLAYING');
      this.btnPlay.innerHTML = ICONS.pause;
      this.btnPlay.setAttribute('aria-label', 'Pause video');
      this.btnPlay.setAttribute('aria-pressed', 'true');
      this.announcer.announce('Video playing');
      this.dispatchEvent(new CustomEvent('lumo:play', {
        detail: { currentTime: this.video.currentTime },
        bubbles: true,
        composed: true
      }));
    });

    this.video.addEventListener('pause', () => {
      this.stateMachine.transitionTo('PAUSED');
      this.btnPlay.innerHTML = ICONS.play;
      this.btnPlay.setAttribute('aria-label', 'Play video');
      this.btnPlay.setAttribute('aria-pressed', 'false');
      this.announcer.announce('Video paused');
      this.dispatchEvent(new CustomEvent('lumo:pause', {
        detail: { currentTime: this.video.currentTime },
        bubbles: true,
        composed: true
      }));
    });

    this.video.addEventListener('timeupdate', () => {
      const cur = this.video.currentTime;
      const dur = this.video.duration || 0;

      if (!this.isSeeking && dur > 0) {
        const percent = (cur / dur) * 100;
        this.seekBar.value = percent.toString();
        this.seekBar.setAttribute('aria-valuenow', Math.floor(cur).toString());
        this.seekBar.setAttribute('aria-valuetext', formatTimeSpoken(cur));
        this.timeDisplay.textContent = `${formatTimeDisplay(cur)} / ${formatTimeDisplay(dur)}`;
      }

      this.captionRenderer.updateTime(cur);
    });

    this.video.addEventListener('loadedmetadata', () => {
      const dur = this.video.duration || 0;
      this.seekBar.max = '100';
      this.seekBar.setAttribute('aria-valuemax', Math.floor(dur).toString());
      this.timeDisplay.textContent = `00:00 / ${formatTimeDisplay(dur)}`;
    });

    this.video.addEventListener('ended', () => {
      this.stateMachine.transitionTo('ENDED');
      this.btnPlay.innerHTML = ICONS.play;
      this.btnPlay.setAttribute('aria-label', 'Replay video');
      this.btnPlay.setAttribute('aria-pressed', 'false');
      this.announcer.announce('Video ended');
    });

    this.video.addEventListener('error', () => {
      this.stateMachine.transitionTo('ERROR');
      const msg = 'Video failed to load: check your connection';
      this.announcer.announce(msg, 'assertive');
      this.dispatchEvent(new CustomEvent('lumo:error', {
        detail: { code: 'MEDIA_ERROR', message: msg },
        bubbles: true,
        composed: true
      }));
    });
  }

  public togglePlay(): void {
    if (this.video.paused || this.video.ended) {
      this.video.play().catch(console.error);
    } else {
      this.video.pause();
    }
  }

  public seekRelative(delta: number): void {
    const target = Math.max(0, Math.min(this.video.duration || 0, this.video.currentTime + delta));
    this.video.currentTime = target;
    this.announcer.announce(`Seek ${delta > 0 ? 'forward' : 'backward'} to ${formatTimeSpoken(target)}`);
  }

  public adjustVolume(delta: number): void {
    let currentPercent = this.video.muted ? 0 : this.video.volume * 100;
    let nextPercent = Math.max(0, Math.min(100, currentPercent + delta));
    this.video.volume = nextPercent / 100;
    this.video.muted = nextPercent === 0;
    this.volumeBar.value = nextPercent.toString();
    this.updateVolumeUI();
    this.announcer.announce(`Volume ${Math.round(nextPercent)}%`);
  }

  public toggleMute(): void {
    this.video.muted = !this.video.muted;
    this.updateVolumeUI();
    this.announcer.announce(this.video.muted ? 'Audio muted' : `Audio unmuted, volume ${Math.round(this.video.volume * 100)}%`);
  }

  private updateVolumeUI(): void {
    const isMuted = this.video.muted || this.video.volume === 0;
    this.btnMute.innerHTML = isMuted ? ICONS.mute : ICONS.volumeHigh;
    this.btnMute.setAttribute('aria-pressed', isMuted ? 'true' : 'false');
    this.btnMute.setAttribute('aria-label', isMuted ? 'Unmute audio' : 'Mute audio');
    this.volumeBar.setAttribute('aria-valuenow', Math.round(isMuted ? 0 : this.video.volume * 100).toString());
    this.volumeBar.setAttribute('aria-valuetext', `${Math.round(isMuted ? 0 : this.video.volume * 100)}%`);
  }

  public cycleCaptions(): void {
    const current = this.captionRenderer.getLanguage();
    let next: 'en' | 'am' | 'off' = 'en';

    if (current === 'off') {
      next = 'en';
    } else if (current === 'en') {
      next = 'am';
    } else {
      next = 'off';
    }

    this.captionRenderer.setLanguage(next);
    let label = 'CC Captions: off';
    if (next === 'en') {
      label = 'CC Captions: English';
    } else if (next === 'am') {
      label = 'CC Captions: Amharic';
    }
    this.btnCaptions.setAttribute('aria-label', label);
    this.btnCaptions.setAttribute('aria-pressed', next !== 'off' ? 'true' : 'false');
    this.btnCaptions.textContent = 'CC';
    this.announcer.announce(label);

    this.dispatchEvent(new CustomEvent('lumo:captionchange', {
      detail: {
        language: next,
        size: this.captionRenderer.getSize(),
        theme: this.captionRenderer.getTheme()
      },
      bubbles: true,
      composed: true
    }));
  }

  public toggleESL(): void {
    if (this.eslWindow.isOpen()) {
      this.eslWindow.close();
      this.btnESL.setAttribute('aria-pressed', 'false');
    } else {
      this.eslWindow.open();
      this.btnESL.setAttribute('aria-pressed', 'true');
      this.dispatchEvent(new CustomEvent('lumo:eslopen', {
        detail: { position: { x: 0, y: 0 } },
        bubbles: true,
        composed: true
      }));
    }
  }

  public toggleAD(): void {
    this.adController.toggle();
  }

  public cycleSpeed(): void {
    this.currentSpeedIndex = (this.currentSpeedIndex + 1) % this.speedOptions.length;
    const speed = this.speedOptions[this.currentSpeedIndex];
    this.video.playbackRate = speed;
    this.btnSpeed.textContent = `${speed}x`;
    this.btnSpeed.setAttribute('aria-label', `Playback speed: ${speed}x`);
    this.announcer.announce(`Playback speed ${speed}x`);
  }

  public toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      this.container.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  public attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue || !this.video) return;

    switch (name) {
      case 'src':
        if (newValue) {
          this.video.src = newValue;
          this.adController?.setSources(newValue, this.getAttribute('audio-description-src') || undefined);
        }
        break;
      case 'poster':
        if (newValue) this.video.poster = newValue;
        break;
      case 'title':
        if (newValue && this.container) this.container.setAttribute('aria-label', newValue);
        break;
      case 'captions':
      case 'captions-src':
        if (newValue) {
          const parts = newValue.split(',').map((s: string) => s.trim());
          if (parts[0]) this.captionRenderer?.loadTrack('en', parts[0]);
          if (parts[1]) this.captionRenderer?.loadTrack('am', parts[1]);
        }
        break;
      case 'captions-en':
        if (newValue) this.captionRenderer?.loadTrack('en', newValue);
        break;
      case 'captions-am':
        if (newValue) this.captionRenderer?.loadTrack('am', newValue);
        break;
      case 'sign':
      case 'esl-src':
        if (newValue) {
          this.eslWindow?.setSource(newValue);
          if (this.btnESL) this.btnESL.style.display = 'inline-flex';
        }
        break;
      case 'describe':
      case 'ad-src':
      case 'audio-description-src':
        if (newValue) {
          this.adController?.setSources(this.getAttribute('src') || '', newValue);
          if (this.btnAD) this.btnAD.style.display = 'inline-flex';
        }
        break;
    }
  }

  public disconnectedCallback(): void {
    this.eslWindow?.destroy();
  }
}
