export interface LumoEventMap {
  'lumo:ready': CustomEvent<{ version: string }>;
  'lumo:play': CustomEvent<{ currentTime: number }>;
  'lumo:pause': CustomEvent<{ currentTime: number }>;
  'lumo:seek': CustomEvent<{ currentTime: number }>;
  'lumo:captionchange': CustomEvent<{ language: 'en' | 'am' | 'off'; size: number; theme: string }>;
  'lumo:eslopen': CustomEvent<{ position: { x: number; y: number } }>;
  'lumo:eslclose': CustomEvent<void>;
  'lumo:adtoggle': CustomEvent<{ active: boolean }>;
  'lumo:offline:ready': CustomEvent<{ packageId: string; sizeBytes: number }>;
  'lumo:error': CustomEvent<{ code: string; message: string }>;
}
