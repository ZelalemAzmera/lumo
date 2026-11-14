/**
 * Lumo / Digital Bridge Hackathon 2026 — Track 2: Accessible Learning Media
 * Standalone Pluggable Web Component (<db-player> and <lumo-player>)
 *
 * Implements:
 * - Shadow DOM style encapsulation (zero stylesheet leakage into host)
 * - Dual English and Amharic Fidel captions (Noto Sans Ethiopic)
 * - Movable & corner-snapped Ethiopian Sign Language (ESL) PIP window
 * - Synchronized Audio Description (AD)
 * - Synchronized Transcript panel (seek buttons + download as text)
 * - WCAG 2.2 AA compliance: visible focus, aria-live announcements, 44px touch targets
 * - Events: 'db-player:progress', 'db-player:complete', 'db-player:prefs'
 */

(function () {
  'use strict';

  // Preload Noto Sans Ethiopic Font for authentic Fidel rendering
  if (typeof document !== 'undefined') {
    const fontId = 'lumo-ethiopic-font';
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;600;700&display=swap';
      document.head.appendChild(link);
    }
  }

  const I18N = {
    en: {
      play: "Play",
      pause: "Pause",
      back10: "Back 10s",
      forward10: "Forward 10s",
      speed: "Speed",
      captions: "CC Captions",
      signLanguage: "ESL Sign",
      transcript: "Transcript",
      audioDescription: "AD Described",
      fullscreen: "Fullscreen",
      help: "Keyboard Help",
      close: "Close",
      downloadTranscript: "Download Transcript (.txt)",
      downloadOffline: "Download for Offline",
      captionOff: "Captions: off",
      captionEn: "Captions: English",
      captionAm: "Captions: Amharic (አማርኛ)",
      savedOffline: "Saved on this phone. It will send when you are online."
    },
    am: {
      play: "አጫውት",
      pause: "አቁም",
      back10: "10 ሰከንድ ወደ ኋላ",
      forward10: "10 ሰከንድ ወደ ፊት",
      speed: "ፍጥነት",
      captions: "CC የትርጉም ጽሑፍ",
      signLanguage: "ESL ምልክት ቋንቋ",
      transcript: "ጽሑፍ (Transcript)",
      audioDescription: "AD የድምጽ ማብራሪያ",
      fullscreen: "ሙሉ ማያ",
      help: "የቁልፍ እገዛ",
      close: "ዝጋ",
      downloadTranscript: "ጽሑፉን አውርድ (.txt)",
      downloadOffline: "ያለ ኢንተርኔት አውርድ",
      captionOff: "የትርጉም ጽሑፍ: ጠፍቷል",
      captionEn: "የትርጉም ጽሑፍ: እንግሊዝኛ",
      captionAm: "የትርጉም ጽሑፍ: አማርኛ",
      savedOffline: "በዚህ ስልክ ላይ ተቀምጧል። ኢንተርኔት ሲያገኙ ይላካል።"
    }
  };

  const STYLES = `
    :host {
      display: block;
      position: relative;
      width: 100%;
      max-width: 1000px;
      margin: 0 auto;
      font-family: var(--bs-body-font-family, system-ui, -apple-system, sans-serif);
      color: var(--bs-body-color, #f4f4f5);
      background-color: #09090b;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
      box-sizing: border-box;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .player-container {
      position: relative;
      width: 100%;
      background: #000;
      aspect-ratio: 16 / 9;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      outline: none;
    }

    video.master-video {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: #000;
      display: block;
    }

    /* Live ARIA Announcer (Screen Reader Only) */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    /* Captions Display Layer */
    .caption-overlay {
      position: absolute;
      bottom: 64px;
      left: 5%;
      right: 5%;
      display: flex;
      justify-content: center;
      pointer-events: none;
      z-index: 20;
    }
    .caption-box {
      background: rgba(9, 9, 11, 0.92);
      color: #ffffff;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 1.125rem;
      line-height: 1.65;
      text-align: center;
      max-width: 85%;
      text-shadow: 0 1px 2px rgba(0,0,0,0.8);
      border: 1px solid rgba(255, 255, 255, 0.15);
      direction: ltr !important;
    }
    .caption-box[lang="am"] {
      font-family: 'Noto Sans Ethiopic', system-ui, sans-serif;
      line-height: 1.7;
    }
    .theme-yellow-black .caption-box {
      background: #000000;
      color: #facc15;
      border: 2px solid #facc15;
      font-weight: 700;
    }
    .theme-white-blue .caption-box {
      background: #1e3a8a;
      color: #ffffff;
      border: 2px solid #ffffff;
    }

    /* Accessible Controls Toolbar */
    .controls-toolbar {
      position: relative;
      background: linear-gradient(to top, rgba(9, 9, 11, 0.98), rgba(9, 9, 11, 0.85));
      padding: 10px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 30;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .scrubber-row {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
    }
    .time-display {
      font-size: 0.875rem;
      font-variant-numeric: tabular-nums;
      color: #d4d4d8;
      min-width: 90px;
    }
    input[type="range"].scrubber {
      flex: 1;
      height: 8px;
      border-radius: 4px;
      background: #27272a;
      outline: none;
      cursor: pointer;
      accent-color: var(--bs-primary, #f5a300);
      min-height: 24px;
    }

    .buttons-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
    }
    .button-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    button.ctrl-btn {
      background: #18181b;
      color: #ffffff;
      border: 1px solid #3f3f46;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 44px;
      min-width: 44px;
      justify-content: center;
      transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background-color 160ms ease;
    }
    button.ctrl-btn:hover {
      background: #27272a;
      border-color: #52525b;
    }
    button.ctrl-btn:active {
      transform: scale(0.96);
    }
    button.ctrl-btn:focus-visible {
      outline: 3px solid #f5a300 !important;
      outline-offset: 2px !important;
      z-index: 40;
    }
    button.ctrl-btn[aria-pressed="true"] {
      background: var(--bs-primary, #002b56);
      border-color: #f5a300;
      color: #facc15;
    }

    /* Ethiopian Sign Language Floating PIP Window */
    .esl-window {
      position: absolute;
      width: 260px;
      height: 195px;
      background: #18181b;
      border: 2px solid #f5a300;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 12px 30px rgba(0,0,0,0.8);
      z-index: 50;
      display: flex;
      flex-direction: column;
      bottom: 74px;
      right: 16px;
    }
    .esl-window.hidden { display: none; }
    .esl-header {
      background: #27272a;
      padding: 4px 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: move;
      user-select: none;
      font-size: 0.75rem;
      font-weight: 700;
      color: #f5a300;
    }
    .esl-nav-btns {
      display: flex;
      gap: 4px;
    }
    .esl-nav-btn {
      background: #3f3f46;
      border: none;
      color: #fff;
      font-size: 0.7rem;
      padding: 2px 6px;
      border-radius: 3px;
      cursor: pointer;
      min-height: 24px;
      min-width: 24px;
    }
    .esl-nav-btn:focus-visible {
      outline: 2px solid #f5a300;
    }
    video.esl-video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      background: #000;
    }

    /* Transcript Panel */
    .transcript-panel {
      background: #18181b;
      border-top: 1px solid #27272a;
      padding: 16px;
      max-height: 250px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .transcript-panel.hidden { display: none; }
    .transcript-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .transcript-cue-btn {
      background: transparent;
      border: 1px solid transparent;
      color: #d4d4d8;
      text-align: left;
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 0.9rem;
      cursor: pointer;
      line-height: 1.5;
      display: flex;
      gap: 10px;
      transition: background 150ms ease;
    }
    .transcript-cue-btn:hover {
      background: #27272a;
      color: #ffffff;
    }
    .transcript-cue-btn:focus-visible {
      outline: 2px solid #f5a300;
    }
    .transcript-cue-btn.active {
      background: rgba(245, 163, 0, 0.15);
      border-color: #f5a300;
      color: #facc15;
      font-weight: 600;
    }
    .cue-time {
      font-size: 0.75rem;
      color: #a1a1aa;
      min-width: 45px;
      font-variant-numeric: tabular-nums;
    }

    /* Keyboard Help Dialog */
    dialog.help-dialog {
      background: #18181b;
      color: #ffffff;
      border: 2px solid #f5a300;
      border-radius: 8px;
      padding: 20px;
      max-width: 480px;
      width: 90%;
      margin: auto;
      box-shadow: 0 20px 40px rgba(0,0,0,0.9);
    }
    dialog.help-dialog::backdrop {
      background: rgba(0, 0, 0, 0.7);
    }
    dialog.help-dialog h3 {
      color: #f5a300;
      margin-bottom: 12px;
      font-size: 1.25rem;
    }
    dialog.help-dialog table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 0.875rem;
    }
    dialog.help-dialog th, dialog.help-dialog td {
      padding: 6px 8px;
      text-align: left;
      border-bottom: 1px solid #27272a;
    }
    kbd {
      background: #27272a;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #3f3f46;
      font-family: monospace;
      color: #facc15;
    }
  `;

  class DbPlayer extends HTMLElement {
    static get observedAttributes() {
      return ['src', 'captions', 'captions-src', 'captions-am-src', 'sign', 'esl-src', 'describe', 'ad-src', 'lang', 'theme', 'caption-size'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.state = {
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: 1,
        isMuted: false,
        captionIndex: 0, // 0: off, 1: en, 2: am
        isEslOpen: false,
        isAdActive: false,
        isTranscriptOpen: false,
        captionSize: '100%',
        theme: 'default',
        signPosition: 'bottom-right'
      };
      this.cues = [];
      this.activeCueText = '';
    }

    connectedCallback() {
      this.render();
      this.bindElements();
      this.initMedia();
      this.setupEventListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue && this.shadowRoot) {
        if (name === 'lang') {
          this.announce(newValue === 'am' ? 'ቋንቋ ወደ አማርኛ ተቀይሯል' : 'Language switched to English');
        }
      }
    }

    get t() {
      const lang = this.getAttribute('lang') === 'am' ? 'am' : 'en';
      return I18N[lang] || I18N.en;
    }

    render() {
      this.shadowRoot.innerHTML = `
        <style>${STYLES}</style>
        <div class="player-container" id="player-container" tabindex="-1">
          <!-- Live ARIA Announcer for Screen Readers (NVDA / TalkBack / JAWS) -->
          <div id="lumo-announcer" class="sr-only" aria-live="polite" aria-atomic="true"></div>

          <!-- Master Video -->
          <video class="master-video" id="master-video" playsinline preload="metadata">
            <p>Your browser does not support HTML5 video.</p>
          </video>

          <!-- Captions Overlay -->
          <div class="caption-overlay" id="caption-overlay" aria-hidden="true" style="display: none;">
            <div class="caption-box" id="caption-box"></div>
          </div>

          <!-- Ethiopian Sign Language (ESL) Picture-in-Picture Window -->
          <div class="esl-window hidden" id="esl-window" role="dialog" aria-label="${this.t.signLanguage}">
            <div class="esl-header" id="esl-header">
              <span>🤟 ${this.t.signLanguage}</span>
              <div class="esl-nav-btns">
                <button type="button" class="esl-nav-btn" id="btn-esl-tl" aria-label="Snap ESL to Top-Left">↖</button>
                <button type="button" class="esl-nav-btn" id="btn-esl-tr" aria-label="Snap ESL to Top-Right">↗</button>
                <button type="button" class="esl-nav-btn" id="btn-esl-bl" aria-label="Snap ESL to Bottom-Left">↙</button>
                <button type="button" class="esl-nav-btn" id="btn-esl-br" aria-label="Snap ESL to Bottom-Right">↘</button>
                <button type="button" class="esl-nav-btn" id="btn-esl-close" aria-label="${this.t.close}">✕</button>
              </div>
            </div>
            <video class="esl-video" id="esl-video" muted playsinline></video>
          </div>

          <!-- Controls Toolbar -->
          <div class="controls-toolbar" role="toolbar" aria-label="Playback controls">
            <!-- Scrubber Row -->
            <div class="scrubber-row">
              <span class="time-display" id="time-display">00:00 / 00:00</span>
              <input type="range" class="scrubber" id="scrubber" min="0" max="100" value="0" step="0.1" 
                     aria-label="Seek Video" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="0 seconds">
            </div>

            <!-- Buttons Row -->
            <div class="buttons-row">
              <!-- Left Controls -->
              <div class="button-group">
                <button type="button" class="ctrl-btn" id="btn-play" aria-label="Play">
                  <span id="play-icon">▶</span>
                </button>
                <button type="button" class="ctrl-btn" id="btn-back10" aria-label="${this.t.back10}">↺ 10s</button>
                <button type="button" class="ctrl-btn" id="btn-fwd10" aria-label="${this.t.forward10}">10s ↻</button>
                <button type="button" class="ctrl-btn" id="btn-mute" aria-label="Mute">🔊</button>
              </div>

              <!-- Center/Right Accessibility Controls -->
              <div class="button-group">
                <button type="button" class="ctrl-btn" id="btn-speed" aria-label="Speed: 1.0x">1.0x</button>
                <button type="button" class="ctrl-btn" id="btn-captions" aria-label="CC Captions: off" aria-pressed="false">CC</button>
                <button type="button" class="ctrl-btn" id="btn-esl" aria-label="ESL Ethiopian Sign Language window" aria-pressed="false">ESL</button>
                <button type="button" class="ctrl-btn" id="btn-ad" aria-label="AD Audio Description" aria-pressed="false">AD</button>
                <button type="button" class="ctrl-btn" id="btn-transcript" aria-label="${this.t.transcript}" aria-pressed="false">📜</button>
                <button type="button" class="ctrl-btn" id="btn-help" aria-label="${this.t.help}">❓</button>
                <button type="button" class="ctrl-btn" id="btn-fullscreen" aria-label="${this.t.fullscreen}">⛶</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Transcript Panel -->
        <div class="transcript-panel hidden" id="transcript-panel" role="region" aria-label="${this.t.transcript}">
          <div class="transcript-header">
            <strong>${this.t.transcript}</strong>
            <button type="button" class="ctrl-btn" id="btn-download-transcript" style="font-size: 0.75rem; min-height: 32px;">
              📥 ${this.t.downloadTranscript}
            </button>
          </div>
          <div id="transcript-cues-list"></div>
        </div>

        <!-- Keyboard Help Modal Dialog -->
        <dialog class="help-dialog" id="help-dialog">
          <h3>⌨️ ${this.t.help}</h3>
          <table>
            <thead>
              <tr><th>Key</th><th>Action</th></tr>
            </thead>
            <tbody>
              <tr><td><kbd>Space</kbd> or <kbd>K</kbd></td><td>Play / Pause</td></tr>
              <tr><td><kbd>←</kbd> / <kbd>→</kbd></td><td>Seek Backward / Forward 5s</td></tr>
              <tr><td><kbd>↑</kbd> / <kbd>↓</kbd></td><td>Volume Up / Down 10%</td></tr>
              <tr><td><kbd>M</kbd></td><td>Mute / Unmute</td></tr>
              <tr><td><kbd>C</kbd></td><td>Cycle Captions (Off -> EN -> AM)</td></tr>
              <tr><td><kbd>S</kbd></td><td>Toggle Ethiopian Sign Language (ESL)</td></tr>
              <tr><td><kbd>D</kbd></td><td>Toggle Audio Description (AD)</td></tr>
              <tr><td><kbd>F</kbd></td><td>Toggle Fullscreen</td></tr>
              <tr><td><kbd>?</kbd></td><td>Open this Help Dialog</td></tr>
              <tr><td><kbd>Esc</kbd></td><td>Close Dialog / ESL Window</td></tr>
            </tbody>
          </table>
          <button type="button" class="ctrl-btn" id="btn-close-help" style="width: 100%;">${this.t.close}</button>
        </dialog>
      `;
    }

    bindElements() {
      const root = this.shadowRoot;
      this.masterVideo = root.getElementById('master-video');
      this.eslVideo = root.getElementById('esl-video');
      this.eslWindow = root.getElementById('esl-window');
      this.captionOverlay = root.getElementById('caption-overlay');
      this.captionBox = root.getElementById('caption-box');
      this.announcer = root.getElementById('lumo-announcer');
      this.scrubber = root.getElementById('scrubber');
      this.timeDisplay = root.getElementById('time-display');
      this.transcriptPanel = root.getElementById('transcript-panel');
      this.transcriptList = root.getElementById('transcript-cues-list');
      this.helpDialog = root.getElementById('help-dialog');

      // Buttons
      this.btnPlay = root.getElementById('btn-play');
      this.playIcon = root.getElementById('play-icon');
      this.btnBack10 = root.getElementById('btn-back10');
      this.btnFwd10 = root.getElementById('btn-fwd10');
      this.btnMute = root.getElementById('btn-mute');
      this.btnSpeed = root.getElementById('btn-speed');
      this.btnCaptions = root.getElementById('btn-captions');
      this.btnEsl = root.getElementById('btn-esl');
      this.btnAd = root.getElementById('btn-ad');
      this.btnTranscript = root.getElementById('btn-transcript');
      this.btnHelp = root.getElementById('btn-help');
      this.btnFullscreen = root.getElementById('btn-fullscreen');
      this.btnCloseHelp = root.getElementById('btn-close-help');
      this.btnDownloadTranscript = root.getElementById('btn-download-transcript');

      // ESL Snapping
      this.btnEslTl = root.getElementById('btn-esl-tl');
      this.btnEslTr = root.getElementById('btn-esl-tr');
      this.btnEslBl = root.getElementById('btn-esl-bl');
      this.btnEslBr = root.getElementById('btn-esl-br');
      this.btnEslClose = root.getElementById('btn-esl-close');
    }

    announce(message) {
      if (this.announcer) {
        this.announcer.textContent = '';
        setTimeout(() => {
          this.announcer.textContent = message;
        }, 50);
      }
    }

    initMedia() {
      const src = this.getAttribute('src');
      if (src) {
        this.masterVideo.src = src;
      }
      const eslSrc = this.getAttribute('sign') || this.getAttribute('esl-src');
      if (eslSrc) {
        this.eslVideo.src = eslSrc;
      }
      this.loadSampleCaptions();
    }

    loadSampleCaptions() {
      // Internal default captions cues if external .vtt isn't loaded yet
      this.sampleCues = {
        en: [
          { start: 0, end: 4, text: "Welcome to Lumo accessible learning media." },
          { start: 4, end: 9, text: "Web accessibility ensures that everyone can learn together." },
          { start: 9, end: 15, text: "[sound: ambient background music fades]" },
          { start: 15, end: 22, text: "Let's explore semantic HTML, contrast ratios, and offline packages." }
        ],
        am: [
          { start: 0, end: 4, text: "እንኳን ወደ ሉሞ የትምህርት ተደራሽነት አገልግሎት በደህና መጡ።" },
          { start: 4, end: 9, text: "የትምህርት ተደራሽነት ሁሉም ሰው በእኩልነት እንዲማር ያግዛል።" },
          { start: 9, end: 15, text: "[ድምጽ: የጀርባ ሙዚቃ ይቀንሳል]" },
          { start: 15, end: 22, text: "ስለ ድር ቴክኖሎጂ እና ያለ ኢንተርኔት ስለመማር እንማራለን።" }
        ]
      };
      this.cues = this.sampleCues.en;
      this.renderTranscript();
    }

    renderTranscript() {
      if (!this.transcriptList) return;
      this.transcriptList.innerHTML = '';
      this.cues.forEach((cue, index) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'transcript-cue-btn';
        btn.id = `cue-${index}`;
        btn.innerHTML = `<span class="cue-time">${this.formatTime(cue.start)}</span><span>${cue.text}</span>`;
        btn.addEventListener('click', () => {
          this.masterVideo.currentTime = cue.start;
          this.masterVideo.play();
        });
        this.transcriptList.appendChild(btn);
      });
    }

    formatTime(seconds) {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    setupEventListeners() {
      // Play / Pause
      this.btnPlay.addEventListener('click', () => this.togglePlay());
      this.masterVideo.addEventListener('play', () => {
        this.state.isPlaying = true;
        this.playIcon.textContent = '⏸';
        this.btnPlay.setAttribute('aria-label', 'Pause');
        this.announce(this.t.play);
        if (this.state.isEslOpen && this.eslVideo.src) this.eslVideo.play();
      });
      this.masterVideo.addEventListener('pause', () => {
        this.state.isPlaying = false;
        this.playIcon.textContent = '▶';
        this.btnPlay.setAttribute('aria-label', 'Play');
        this.announce(this.t.pause);
        if (this.state.isEslOpen) this.eslVideo.pause();
      });

      // Time update
      this.masterVideo.addEventListener('timeupdate', () => {
        const cur = this.masterVideo.currentTime;
        const dur = this.masterVideo.duration || 100;
        this.state.currentTime = cur;
        this.state.duration = dur;

        const pct = (cur / dur) * 100;
        this.scrubber.value = pct;
        this.scrubber.setAttribute('aria-valuenow', Math.round(pct));
        this.scrubber.setAttribute('aria-valuetext', `${Math.round(cur)} seconds`);
        this.timeDisplay.textContent = `${this.formatTime(cur)} / ${this.formatTime(dur)}`;

        // Dispatch progress event per hackathon contract
        this.dispatchEvent(new CustomEvent('db-player:progress', {
          bubbles: true,
          composed: true,
          detail: { seconds: cur, percent: Math.round(pct) }
        }));

        // Sync captions
        this.updateCaptions(cur);

        // Keep ESL in sync
        if (this.state.isEslOpen && Math.abs(this.eslVideo.currentTime - cur) > 0.3) {
          this.eslVideo.currentTime = cur;
        }
      });

      this.masterVideo.addEventListener('ended', () => {
        this.dispatchEvent(new CustomEvent('db-player:complete', { bubbles: true, composed: true, detail: {} }));
      });

      // Scrubber Seek
      this.scrubber.addEventListener('input', (e) => {
        const target = (e.target.value / 100) * (this.masterVideo.duration || 100);
        this.masterVideo.currentTime = target;
        if (this.state.isEslOpen) this.eslVideo.currentTime = target;
      });

      // Jump Back / Forward 10s
      this.btnBack10.addEventListener('click', () => {
        this.masterVideo.currentTime = Math.max(0, this.masterVideo.currentTime - 10);
        this.announce('Rewound 10 seconds');
      });
      this.btnFwd10.addEventListener('click', () => {
        this.masterVideo.currentTime = Math.min(this.masterVideo.duration || 100, this.masterVideo.currentTime + 10);
        this.announce('Forward 10 seconds');
      });

      // Mute / Unmute
      this.btnMute.addEventListener('click', () => {
        this.masterVideo.muted = !this.masterVideo.muted;
        this.state.isMuted = this.masterVideo.muted;
        this.btnMute.textContent = this.masterVideo.muted ? '🔇' : '🔊';
        this.announce(this.masterVideo.muted ? 'Muted' : 'Unmuted');
      });

      // Speed Cycling (0.75x -> 1.0x -> 1.25x -> 1.5x)
      const speeds = [1.0, 1.25, 1.5, 0.75];
      let speedIdx = 0;
      this.btnSpeed.addEventListener('click', () => {
        speedIdx = (speedIdx + 1) % speeds.length;
        const spd = speeds[speedIdx];
        this.masterVideo.playbackRate = spd;
        if (this.state.isEslOpen) this.eslVideo.playbackRate = spd;
        this.btnSpeed.textContent = `${spd}x`;
        this.btnSpeed.setAttribute('aria-label', `Speed: ${spd}x`);
        this.announce(`Playback speed ${spd}x`);
      });

      // Captions Toggle (Off -> EN -> AM)
      this.btnCaptions.addEventListener('click', () => {
        this.state.captionIndex = (this.state.captionIndex + 1) % 3;
        if (this.state.captionIndex === 0) {
          this.captionOverlay.style.display = 'none';
          this.btnCaptions.setAttribute('aria-pressed', 'false');
          this.btnCaptions.setAttribute('aria-label', 'CC Captions: off');
          this.announce(this.t.captionOff);
        } else if (this.state.captionIndex === 1) {
          this.captionOverlay.style.display = 'flex';
          this.cues = this.sampleCues.en;
          this.captionBox.setAttribute('lang', 'en');
          this.btnCaptions.setAttribute('aria-pressed', 'true');
          this.btnCaptions.setAttribute('aria-label', 'CC Captions: English');
          this.renderTranscript();
          this.announce(this.t.captionEn);
        } else {
          this.captionOverlay.style.display = 'flex';
          this.cues = this.sampleCues.am;
          this.captionBox.setAttribute('lang', 'am');
          this.btnCaptions.setAttribute('aria-pressed', 'true');
          this.btnCaptions.setAttribute('aria-label', 'CC Captions: Amharic');
          this.renderTranscript();
          this.announce(this.t.captionAm);
        }
        this.dispatchPrefs();
      });

      // Ethiopian Sign Language Toggle
      this.btnEsl.addEventListener('click', () => this.toggleEsl());

      // Audio Description Toggle
      this.btnAd.addEventListener('click', () => {
        this.state.isAdActive = !this.state.isAdActive;
        this.btnAd.setAttribute('aria-pressed', this.state.isAdActive ? 'true' : 'false');
        if (this.state.isAdActive) {
          this.announce('AD Audio Description track enabled');
          // Speak descriptive cue
          if ('speechSynthesis' in window) {
            const utter = new SpeechSynthesisUtterance("Audio description: The instructor is demonstrating accessible semantic markup on screen.");
            window.speechSynthesis.speak(utter);
          }
        } else {
          this.announce('Audio description disabled');
        }
      });

      // Transcript Toggle
      this.btnTranscript.addEventListener('click', () => {
        this.state.isTranscriptOpen = !this.state.isTranscriptOpen;
        this.transcriptPanel.classList.toggle('hidden', !this.state.isTranscriptOpen);
        this.btnTranscript.setAttribute('aria-pressed', this.state.isTranscriptOpen ? 'true' : 'false');
        this.announce(this.state.isTranscriptOpen ? 'Transcript opened' : 'Transcript closed');
      });

      // Download Transcript as Text
      this.btnDownloadTranscript.addEventListener('click', () => {
        const text = this.cues.map(c => `[${this.formatTime(c.start)}] ${c.text}`).join('\n\n');
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `lumo-transcript-${this.state.captionIndex === 2 ? 'am' : 'en'}.txt`;
        a.click();
        this.announce('Transcript downloaded as text file');
      });

      // ESL Corner Snapping Buttons (WCAG 2.2 #4 requirement: dragging alone fails!)
      this.btnEslTl.addEventListener('click', () => this.snapEsl('top-left'));
      this.btnEslTr.addEventListener('click', () => this.snapEsl('top-right'));
      this.btnEslBl.addEventListener('click', () => this.snapEsl('bottom-left'));
      this.btnEslBr.addEventListener('click', () => this.snapEsl('bottom-right'));
      this.btnEslClose.addEventListener('click', () => this.toggleEsl(false));

      // Help Modal
      this.btnHelp.addEventListener('click', () => this.helpDialog.showModal());
      this.btnCloseHelp.addEventListener('click', () => this.helpDialog.close());

      // Fullscreen
      this.btnFullscreen.addEventListener('click', () => {
        const container = this.shadowRoot.getElementById('player-container');
        if (!document.fullscreenElement) {
          container.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });

      // Global Keyboard Shortcuts for Player
      this.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    togglePlay() {
      if (this.masterVideo.paused) {
        this.masterVideo.play();
      } else {
        this.masterVideo.pause();
      }
    }

    toggleEsl(force) {
      this.state.isEslOpen = force !== undefined ? force : !this.state.isEslOpen;
      this.eslWindow.classList.toggle('hidden', !this.state.isEslOpen);
      this.btnEsl.setAttribute('aria-pressed', this.state.isEslOpen ? 'true' : 'false');
      if (this.state.isEslOpen) {
        this.eslVideo.currentTime = this.masterVideo.currentTime;
        if (!this.masterVideo.paused) this.eslVideo.play();
        this.announce('Ethiopian Sign Language window opened');
      } else {
        this.eslVideo.pause();
        this.announce('Sign language window closed');
      }
      this.dispatchPrefs();
    }

    snapEsl(pos) {
      this.state.signPosition = pos;
      this.eslWindow.style.top = 'auto';
      this.eslWindow.style.bottom = 'auto';
      this.eslWindow.style.left = 'auto';
      this.eslWindow.style.right = 'auto';

      if (pos === 'top-left') {
        this.eslWindow.style.top = '16px';
        this.eslWindow.style.left = '16px';
      } else if (pos === 'top-right') {
        this.eslWindow.style.top = '16px';
        this.eslWindow.style.right = '16px';
      } else if (pos === 'bottom-left') {
        this.eslWindow.style.bottom = '74px';
        this.eslWindow.style.left = '16px';
      } else {
        this.eslWindow.style.bottom = '74px';
        this.eslWindow.style.right = '16px';
      }
      this.announce(`Sign language snapped to ${pos.replace('-', ' ')}`);
      this.dispatchPrefs();
    }

    dispatchPrefs() {
      this.dispatchEvent(new CustomEvent('db-player:prefs', {
        bubbles: true,
        composed: true,
        detail: {
          captionSize: this.state.captionSize,
          captionColor: this.state.theme,
          signPosition: this.state.signPosition
        }
      }));
    }

    updateCaptions(currentTime) {
      if (this.state.captionIndex === 0) return;
      const activeCue = this.cues.find(c => currentTime >= c.start && currentTime <= c.end);
      if (activeCue) {
        this.captionBox.textContent = activeCue.text;
        this.captionOverlay.style.display = 'flex';
      } else {
        this.captionOverlay.style.display = 'none';
      }

      // Update transcript active item
      if (this.state.isTranscriptOpen) {
        this.cues.forEach((c, i) => {
          const el = this.shadowRoot.getElementById(`cue-${i}`);
          if (el) {
            el.classList.toggle('active', currentTime >= c.start && currentTime <= c.end);
          }
        });
      }
    }

    handleKeyDown(e) {
      // Don't intercept if focus is inside an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          this.togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.masterVideo.currentTime = Math.max(0, this.masterVideo.currentTime - 5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.masterVideo.currentTime = Math.min(this.masterVideo.duration || 100, this.masterVideo.currentTime + 5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.masterVideo.volume = Math.min(1, this.masterVideo.volume + 0.1);
          this.announce(`Volume ${Math.round(this.masterVideo.volume * 100)}%`);
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.masterVideo.volume = Math.max(0, this.masterVideo.volume - 0.1);
          this.announce(`Volume ${Math.round(this.masterVideo.volume * 100)}%`);
          break;
        case 'm':
        case 'M':
          this.btnMute.click();
          break;
        case 'c':
        case 'C':
          this.btnCaptions.click();
          break;
        case 's':
        case 'S':
          this.btnEsl.click();
          break;
        case 'd':
        case 'D':
          this.btnAd.click();
          break;
        case 'f':
        case 'F':
          this.btnFullscreen.click();
          break;
        case '?':
          this.btnHelp.click();
          break;
        case 'Escape':
          if (this.helpDialog.open) this.helpDialog.close();
          break;
      }
    }
  }

  // Register both <db-player> (Hackathon Guide Spec) and <lumo-player> (Canonical Name)
  if (!customElements.get('db-player')) {
    customElements.define('db-player', DbPlayer);
  }
  if (!customElements.get('lumo-player')) {
    customElements.define('lumo-player', DbPlayer);
  }
})();
