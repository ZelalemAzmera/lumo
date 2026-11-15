import { LumoPlayer } from '@lumo/core';
import { ensureNotoSansEthiopic } from './loader';

// Auto-register canonical custom element in browser environments under both contracts
if (typeof window !== 'undefined' && typeof customElements !== 'undefined') {
  ensureNotoSansEthiopic();
  if (!customElements.get('db-player')) {
    customElements.define('db-player', LumoPlayer);
  }
  if (!customElements.get('lumo-player')) {
    customElements.define('lumo-player', LumoPlayer);
  }
}

export * from '@lumo/core';
export { ensureNotoSansEthiopic };
