export const LUMO_CORE_STYLES = `
:host {
  display: block;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  position: relative;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --lumo-primary: #1a3c6e;
  --lumo-on-primary: #ffffff;
  --lumo-surface: #12131c;
  --lumo-controls-bg: rgba(18, 19, 28, 0.94);
  --lumo-on-surface: #f5f5f5;
  --lumo-focus-ring: #0066cc;
  --lumo-accent: #38bdf8;
  --lumo-border-radius: 6px;
  background-color: #000000;
  color: var(--lumo-on-surface);
  outline: none;
}

*, *::before, *::after {
  box-sizing: inherit;
}

.lumo-container {
  position: relative;
  width: 100%;
  overflow: hidden;
  background-color: #000000;
  border-radius: var(--lumo-border-radius);
  aspect-ratio: 16 / 9;
}

.lumo-video {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
}

.lumo-sr-only {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

.lumo-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.6) 80%, transparent);
  color: var(--lumo-on-surface);
  z-index: 20;
  transition: opacity 150ms ease-out;
}

.lumo-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding: 6px 10px;
  background: transparent;
  color: var(--lumo-on-surface);
  border: 1px solid transparent;
  border-radius: var(--lumo-border-radius);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background-color 150ms ease-out, border-color 150ms ease-out;
  user-select: none;
}

.lumo-btn:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.lumo-btn:focus-visible {
  outline: 3px solid var(--lumo-focus-ring) !important;
  outline-offset: 2px !important;
  background-color: rgba(255, 255, 255, 0.2);
}

.lumo-btn[aria-pressed="true"] {
  background-color: var(--lumo-primary);
  color: var(--lumo-on-primary);
  border-color: rgba(255, 255, 255, 0.3);
}

.lumo-btn svg {
  width: 20px;
  height: 20px;
  fill: currentColor;
  pointer-events: none;
}

.lumo-seek-group {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 140px;
  gap: 8px;
}

.lumo-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.3);
  outline: none;
  cursor: pointer;
  margin: 0;
}

.lumo-slider:focus-visible {
  outline: 3px solid var(--lumo-focus-ring);
  outline-offset: 2px;
}

.lumo-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--lumo-accent);
  cursor: pointer;
  border: 2px solid #ffffff;
  transition: transform 100ms ease;
}

.lumo-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.lumo-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--lumo-accent);
  cursor: pointer;
  border: 2px solid #ffffff;
}

.lumo-time-display {
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: #e2e8f0;
}

.lumo-volume-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.lumo-volume-group .lumo-slider {
  width: 70px;
}

/* Captions Overlay */
.lumo-caption-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding: 0 5% 65px;
  z-index: 15;
}

.lumo-cue-box {
  max-width: 90%;
  text-align: center;
  margin-bottom: 8px;
}

.lumo-cue-text {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 4px;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  word-wrap: break-word;
  transition: font-size 150ms ease-out;
}

.lumo-cue-text.size-100 { font-size: 16px; }
.lumo-cue-text.size-150 { font-size: 24px; }
.lumo-cue-text.size-200 { font-size: 32px; }

.theme-white-black {
  color: #ffffff;
  background-color: rgba(0, 0, 0, 0.88);
}

.theme-yellow-black {
  color: #ffd700;
  background-color: rgba(0, 0, 0, 0.95);
}

.theme-black-white {
  color: #000000;
  background-color: #ffffff;
  border: 2px solid #000000;
}

.lumo-cue-text[lang="am"],
.lumo-cue-text:lang(am) {
  font-family: 'Noto Sans Ethiopic', system-ui, -apple-system, sans-serif;
  line-height: 1.65 !important;
  letter-spacing: 0 !important;
  direction: ltr !important;
  word-break: normal;
}

/* ESL Dialog */
.lumo-esl-dialog {
  position: absolute;
  bottom: 70px;
  right: 16px;
  width: 220px;
  height: 280px;
  min-width: 180px;
  min-height: 240px;
  max-width: 50%;
  max-height: 70%;
  background-color: #12131c;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--lumo-border-radius);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 30;
  touch-action: none;
  outline: none;
}

.lumo-esl-dialog:focus-visible {
  border-color: var(--lumo-focus-ring);
  outline: 3px solid var(--lumo-focus-ring);
  outline-offset: 2px;
}

.lumo-esl-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background-color: rgba(26, 60, 110, 0.9);
  color: #ffffff;
  cursor: grab;
  user-select: none;
  font-size: 12px;
  font-weight: 600;
}

.lumo-esl-header:active {
  cursor: grabbing;
}

.lumo-esl-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lumo-esl-close-btn {
  background: transparent;
  border: none;
  color: #ffffff;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.lumo-esl-close-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.lumo-esl-close-btn:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 1px;
}

.lumo-esl-body {
  flex: 1;
  position: relative;
  background-color: #000000;
  overflow: hidden;
}

.lumo-esl-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.lumo-esl-resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, transparent 50%, rgba(255, 255, 255, 0.6) 50%);
  z-index: 5;
}

@media (prefers-reduced-motion: reduce) {
  .lumo-btn,
  .lumo-slider,
  .lumo-controls,
  .lumo-cue-text {
    transition: none !important;
    animation: none !important;
  }
}

@media (max-width: 767px) {
  .lumo-controls {
    padding: 6px 8px;
    gap: 4px;
  }
  .lumo-seek-group {
    order: -1;
    width: 100%;
    flex-basis: 100%;
  }
  .lumo-volume-group .lumo-slider {
    display: none;
  }
  .lumo-btn {
    min-width: 48px;
    min-height: 48px;
  }
  .lumo-esl-dialog {
    width: 150px;
    height: 200px;
    min-width: 130px;
    min-height: 170px;
    bottom: 80px;
    right: 8px;
  }
}
`;
