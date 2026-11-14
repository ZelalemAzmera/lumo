/**
 * Dynamically ensures Noto Sans Ethiopic font is loaded for Fidel script rendering
 */
export function ensureNotoSansEthiopic(): void {
  if (typeof document === 'undefined') return;

  const fontId = 'lumo-font-noto-ethiopic';
  if (document.getElementById(fontId)) return;

  // Add preconnect for Google Fonts
  const preconnect1 = document.createElement('link');
  preconnect1.rel = 'preconnect';
  preconnect1.href = 'https://fonts.googleapis.com';
  document.head.appendChild(preconnect1);

  const preconnect2 = document.createElement('link');
  preconnect2.rel = 'preconnect';
  preconnect2.href = 'https://fonts.gstatic.com';
  preconnect2.crossOrigin = 'anonymous';
  document.head.appendChild(preconnect2);

  // Add stylesheet with font-display: swap to prevent render blocking
  const link = document.createElement('link');
  link.id = fontId;
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;600&display=swap';
  document.head.appendChild(link);
}
