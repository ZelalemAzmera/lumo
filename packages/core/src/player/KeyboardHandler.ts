export interface KeyboardActions {
  togglePlay: () => void;
  seekRelative: (deltaSeconds: number) => void;
  adjustVolume: (deltaPercent: number) => void;
  toggleMute: () => void;
  toggleCaptions: () => void;
  toggleESL: () => void;
  toggleAD: () => void;
  toggleFullscreen: () => void;
}

export class KeyboardHandler {
  private container: HTMLElement;
  private actions: KeyboardActions;

  constructor(container: HTMLElement, actions: KeyboardActions) {
    this.container = container;
    this.actions = actions;
    this.attach();
  }

  private attach(): void {
    this.container.addEventListener('keydown', (e: KeyboardEvent) => {
      // Don't intercept if user is typing in a text input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' && 
        (target as HTMLInputElement).type !== 'range' && 
        (target as HTMLInputElement).type !== 'button'
      ) {
        return;
      }

      // Check key
      switch (e.code) {
        case 'Space':
        case 'KeyK':
          // If a button is focused, let native button click handle it unless it's slider
          if (target.tagName !== 'BUTTON') {
            e.preventDefault();
            this.actions.togglePlay();
          }
          break;

        case 'ArrowLeft':
        case 'KeyJ':
          if (target.tagName !== 'INPUT' || (target as HTMLInputElement).id !== 'seek-bar') {
            e.preventDefault();
            this.actions.seekRelative(-5);
          }
          break;

        case 'ArrowRight':
        case 'KeyL':
          if (target.tagName !== 'INPUT' || (target as HTMLInputElement).id !== 'seek-bar') {
            e.preventDefault();
            this.actions.seekRelative(5);
          }
          break;

        case 'ArrowUp':
          if (target.tagName !== 'INPUT') {
            e.preventDefault();
            this.actions.adjustVolume(10);
          }
          break;

        case 'ArrowDown':
          if (target.tagName !== 'INPUT') {
            e.preventDefault();
            this.actions.adjustVolume(-10);
          }
          break;

        case 'KeyM':
          e.preventDefault();
          this.actions.toggleMute();
          break;

        case 'KeyC':
          e.preventDefault();
          this.actions.toggleCaptions();
          break;

        case 'KeyS':
          e.preventDefault();
          this.actions.toggleESL();
          break;

        case 'KeyD':
          e.preventDefault();
          this.actions.toggleAD();
          break;

        case 'KeyF':
          e.preventDefault();
          this.actions.toggleFullscreen();
          break;
      }
    });
  }
}
