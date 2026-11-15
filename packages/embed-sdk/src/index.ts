import { LumoPlayer } from '@lumo/core';
import { ensureNotoSansEthiopic } from './loader';

// Auto-register canonical custom element in browser environments under both contracts
if (typeof window !== 'undefined' && typeof customElements !== 'undefined') {
  ensureNotoSansEthiopic();
  class DbPlayerElement extends LumoPlayer {}
  class LumoPlayerElement extends LumoPlayer {}

  if (!customElements.get('db-player')) {
    customElements.define('db-player', DbPlayerElement);
  }
  if (!customElements.get('lumo-player')) {
    customElements.define('lumo-player', LumoPlayerElement);
  }
}

export * from '@lumo/core';
export { ensureNotoSansEthiopic };
