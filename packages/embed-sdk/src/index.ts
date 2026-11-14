import { LumoPlayer } from '@lumo/core';
import { ensureNotoSansEthiopic } from './loader';

// Auto-register custom element in browser environments
if (typeof window !== 'undefined' && typeof customElements !== 'undefined') {
  ensureNotoSansEthiopic();
  if (!customElements.get('lumo-player')) {
    customElements.define('lumo-player', LumoPlayer);
  }
}

export * from '@lumo/core';
export { ensureNotoSansEthiopic };
