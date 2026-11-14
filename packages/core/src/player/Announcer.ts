/**
 * ARIA Live Region Announcer
 * Ensures polite, reliable screen reader announcements across NVDA, TalkBack, and JAWS
 */
export class Announcer {
  private element: HTMLElement;
  private timeoutId: number | null = null;

  constructor(container: HTMLElement | ShadowRoot) {
    let existing = container.querySelector('#lumo-sr-announcer') as HTMLElement;
    if (!existing) {
      existing = document.createElement('div');
      existing.id = 'lumo-sr-announcer';
      existing.setAttribute('aria-live', 'polite');
      existing.setAttribute('aria-atomic', 'true');
      existing.className = 'lumo-sr-only';
      container.appendChild(existing);
    }
    this.element = existing;
  }

  public announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!message || message.trim() === '') return;

    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    // Set priority if different
    if (this.element.getAttribute('aria-live') !== priority) {
      this.element.setAttribute('aria-live', priority);
    }

    // Clear content first to guarantee announcement on identical consecutive texts
    this.element.textContent = '';

    // Schedule update so screen readers perceive DOM text mutation
    this.timeoutId = window.setTimeout(() => {
      this.element.textContent = message;
    }, 50);
  }

  public clear(): void {
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.element.textContent = '';
  }
}
