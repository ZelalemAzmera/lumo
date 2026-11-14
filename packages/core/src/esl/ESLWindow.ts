import { VideoSync } from './VideoSync';
import { Announcer } from '../player/Announcer';

export class ESLWindow {
  private dialogElement: HTMLElement;
  private headerElement: HTMLElement;
  private videoElement: HTMLVideoElement;
  private resizeHandle: HTMLElement;
  private videoSync: VideoSync | null = null;
  private announcer: Announcer;
  private container: HTMLElement;
  private onCloseCallback?: () => void;

  private isDragging = false;
  private isResizing = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private initialX = 0;
  private initialY = 0;
  private initialWidth = 220;
  private initialHeight = 280;

  constructor(
    container: HTMLElement,
    mainVideo: HTMLVideoElement,
    announcer: Announcer,
    onClose?: () => void
  ) {
    this.container = container;
    this.announcer = announcer;
    this.onCloseCallback = onClose;

    // Create dialog
    this.dialogElement = document.createElement('div');
    this.dialogElement.className = 'lumo-esl-dialog';
    this.dialogElement.setAttribute('role', 'dialog');
    this.dialogElement.setAttribute('aria-label', 'Ethiopian Sign Language interpreter');
    this.dialogElement.tabIndex = 0;

    // Create header
    this.headerElement = document.createElement('div');
    this.headerElement.className = 'lumo-esl-header';
    this.headerElement.id = 'esl-drag-handle';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'lumo-esl-title';
    titleSpan.textContent = 'EthSL Interpreter';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'lumo-esl-close-btn';
    closeBtn.setAttribute('aria-label', 'Close sign language window');
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => this.close());

    this.headerElement.appendChild(titleSpan);
    this.headerElement.appendChild(closeBtn);

    // Create body & video
    const bodyElement = document.createElement('div');
    bodyElement.className = 'lumo-esl-body';

    this.videoElement = document.createElement('video');
    this.videoElement.className = 'lumo-esl-video';
    this.videoElement.muted = true;
    this.videoElement.playsInline = true;

    bodyElement.appendChild(this.videoElement);

    // Create resize handle
    this.resizeHandle = document.createElement('div');
    this.resizeHandle.className = 'lumo-esl-resize-handle';
    this.resizeHandle.setAttribute('aria-hidden', 'true');

    // Instructions for screen readers
    const srInstructions = document.createElement('div');
    srInstructions.className = 'lumo-sr-only';
    srInstructions.textContent = 'Use arrow keys to move window, Shift plus arrow keys to resize, Escape to close.';

    this.dialogElement.appendChild(this.headerElement);
    this.dialogElement.appendChild(bodyElement);
    this.dialogElement.appendChild(this.resizeHandle);
    this.dialogElement.appendChild(srInstructions);

    this.dialogElement.style.display = 'none';
    this.container.appendChild(this.dialogElement);

    // Attach video sync
    this.videoSync = new VideoSync(mainVideo, this.videoElement);

    this.attachDragListeners();
    this.attachResizeListeners();
    this.attachKeyboardListeners();
    this.restorePosition();
  }

  public setSource(src: string): void {
    if (src) {
      this.videoElement.src = src;
      this.videoElement.load();
    }
  }

  public open(): void {
    this.dialogElement.style.display = 'flex';
    this.videoSync?.syncTime();
    this.videoElement.play().catch(() => {});
    this.announcer.announce('Ethiopian Sign Language window opened');
    this.dialogElement.focus();
  }

  public close(): void {
    this.dialogElement.style.display = 'none';
    this.videoElement.pause();
    this.announcer.announce('Ethiopian Sign Language window closed');
    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }

  public isOpen(): boolean {
    return this.dialogElement.style.display !== 'none';
  }

  private attachDragListeners(): void {
    const onStart = (clientX: number, clientY: number) => {
      this.isDragging = true;
      this.dragStartX = clientX;
      this.dragStartY = clientY;
      const rect = this.dialogElement.getBoundingClientRect();
      const parentRect = this.container.getBoundingClientRect();
      this.initialX = rect.left - parentRect.left;
      this.initialY = rect.top - parentRect.top;
    };

    const onMove = (clientX: number, clientY: number) => {
      if (!this.isDragging) return;
      const dx = clientX - this.dragStartX;
      const dy = clientY - this.dragStartY;

      const parentRect = this.container.getBoundingClientRect();
      const maxLeft = parentRect.width - this.dialogElement.offsetWidth;
      const maxTop = parentRect.height - this.dialogElement.offsetHeight;

      const newLeft = Math.max(0, Math.min(maxLeft, this.initialX + dx));
      const newTop = Math.max(0, Math.min(maxTop, this.initialY + dy));

      this.dialogElement.style.left = `${newLeft}px`;
      this.dialogElement.style.top = `${newTop}px`;
      this.dialogElement.style.bottom = 'auto';
      this.dialogElement.style.right = 'auto';
    };

    const onEnd = () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.savePosition();
      }
    };

    // Mouse events
    this.headerElement.addEventListener('mousedown', (e: MouseEvent) => {
      if ((e.target as HTMLElement).classList.contains('lumo-esl-close-btn')) return;
      onStart(e.clientX, e.clientY);
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e: MouseEvent) => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onEnd);

    // Touch events for mobile/tablets
    this.headerElement.addEventListener('touchstart', (e: TouchEvent) => {
      if ((e.target as HTMLElement).classList.contains('lumo-esl-close-btn')) return;
      const touch = e.touches[0];
      onStart(touch.clientX, touch.clientY);
    }, { passive: true });

    window.addEventListener('touchmove', (e: TouchEvent) => {
      if (!this.isDragging) return;
      const touch = e.touches[0];
      onMove(touch.clientX, touch.clientY);
    }, { passive: true });

    window.addEventListener('touchend', onEnd);
  }

  private attachResizeListeners(): void {
    const onStartResize = (clientX: number, clientY: number) => {
      this.isResizing = true;
      this.dragStartX = clientX;
      this.dragStartY = clientY;
      this.initialWidth = this.dialogElement.offsetWidth;
      this.initialHeight = this.dialogElement.offsetHeight;
    };

    const onMoveResize = (clientX: number, clientY: number) => {
      if (!this.isResizing) return;
      const dx = clientX - this.dragStartX;
      const dy = clientY - this.dragStartY;

      const parentWidth = this.container.offsetWidth;
      const maxWidth = parentWidth * 0.5;

      const newWidth = Math.max(180, Math.min(maxWidth, this.initialWidth + dx));
      const newHeight = Math.max(240, this.initialHeight + dy);

      this.dialogElement.style.width = `${newWidth}px`;
      this.dialogElement.style.height = `${newHeight}px`;
    };

    const onEndResize = () => {
      if (this.isResizing) {
        this.isResizing = false;
        this.savePosition();
      }
    };

    this.resizeHandle.addEventListener('mousedown', (e: MouseEvent) => {
      onStartResize(e.clientX, e.clientY);
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e: MouseEvent) => onMoveResize(e.clientX, e.clientY));
    window.addEventListener('mouseup', onEndResize);
  }

  private attachKeyboardListeners(): void {
    this.dialogElement.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
        return;
      }

      const step = 20;
      const parentRect = this.container.getBoundingClientRect();
      const currentRect = this.dialogElement.getBoundingClientRect();
      let left = currentRect.left - parentRect.left;
      let top = currentRect.top - parentRect.top;
      let width = this.dialogElement.offsetWidth;
      let height = this.dialogElement.offsetHeight;

      if (e.shiftKey) {
        // Shift + Arrow Keys = Resize
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.dialogElement.style.width = `${Math.min(parentRect.width * 0.5, width + step)}px`;
          this.announcer.announce('Sign language window widened');
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.dialogElement.style.width = `${Math.max(180, width - step)}px`;
          this.announcer.announce('Sign language window narrowed');
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.dialogElement.style.height = `${height + step}px`;
          this.announcer.announce('Sign language window lengthened');
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.dialogElement.style.height = `${Math.max(240, height - step)}px`;
          this.announcer.announce('Sign language window shortened');
        }
      } else {
        // Arrow Keys = Move
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.dialogElement.style.left = `${Math.max(0, left - step)}px`;
          this.dialogElement.style.right = 'auto';
          this.announcer.announce('Sign language window moved left');
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.dialogElement.style.left = `${Math.min(parentRect.width - width, left + step)}px`;
          this.dialogElement.style.right = 'auto';
          this.announcer.announce('Sign language window moved right');
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.dialogElement.style.top = `${Math.max(0, top - step)}px`;
          this.dialogElement.style.bottom = 'auto';
          this.announcer.announce('Sign language window moved up');
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.dialogElement.style.top = `${Math.min(parentRect.height - height, top + step)}px`;
          this.dialogElement.style.bottom = 'auto';
          this.announcer.announce('Sign language window moved down');
        }
      }
    });
  }

  private savePosition(): void {
    try {
      const pos = {
        left: this.dialogElement.style.left,
        top: this.dialogElement.style.top,
        width: this.dialogElement.style.width,
        height: this.dialogElement.style.height
      };
      localStorage.setItem('lumo_esl_pos', JSON.stringify(pos));
    } catch {}
  }

  private restorePosition(): void {
    try {
      const saved = localStorage.getItem('lumo_esl_pos');
      if (saved) {
        const pos = JSON.parse(saved);
        if (pos.left) this.dialogElement.style.left = pos.left;
        if (pos.top) this.dialogElement.style.top = pos.top;
        if (pos.width) this.dialogElement.style.width = pos.width;
        if (pos.height) this.dialogElement.style.height = pos.height;
        if (pos.left || pos.top) {
          this.dialogElement.style.bottom = 'auto';
          this.dialogElement.style.right = 'auto';
        }
      }
    } catch {}
  }

  public destroy(): void {
    this.videoSync?.destroy();
  }
}
