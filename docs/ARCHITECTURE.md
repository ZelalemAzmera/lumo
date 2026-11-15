# Lumo Technical Architecture

## 1. System Overview
**Lumo (ሉሞ)** is an embeddable accessibility layer for digital learning platforms. It enables existing educational platforms (such as ALX Savanna) to deliver WCAG 2.2 AA accessible video lessons without restructuring host HTML or rewriting backends.

```
Host Page (e.g. Savanna / Custom Platform)
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│                   <db-player> / <lumo-player>               │
│                      (Web Component)                        │
├─────────────────────────────────────────────────────────────┤
│  Shadow DOM Encapsulation                                   │
│  ├── LumoMediaEngine (HTML5 / Video.js adapter)             │
│  ├── Caption Engine (Dual English & Amharic WebVTT)         │
│  ├── Audio Description (Synchronized secondary audio track)  │
│  ├── Ethiopian Sign Language Window (< 35ms drift sync)     │
│  ├── Interactive Accessible Transcript (Fidel font support) │
│  ├── Keyboard Navigation & Shortcuts Dialog                 │
│  └── Offline Pack Manager (Workbox + IndexedDB)             │
└─────────────────────────────────────────────────────────────┘
```

## 2. Canonical Player Unification
To eliminate duplication across separate legacy implementations, Lumo defines a single canonical implementation:
* **Canonical Web Component:** Registered under both `<db-player>` and `<lumo-player>` tag names using distinct inherited constructor classes to satisfy W3C CustomElementRegistry standards.
* **Unified Data Contract:**
  * Primary attributes: `src`, `captions="en.vtt,am.vtt"`, `sign="lesson.ethsl.mp4"`, `describe="lesson.ad.mp3"`, `lang="am"`.
  * Backward compatibility aliases: `captions-en`, `captions-am`, `esl-src`, `audio-description-src`, `ad-src`.
* **Single Distribution Target:** Single bundled artifact `packages/embed-sdk/dist/lumo.min.js` (and `module/db-player.js`) built from the canonical source.

## 3. Media Engine Abstraction (`LumoMediaEngine`)
Located at `packages/media-engine/src/LumoMediaEngine.ts`:
```ts
export interface LumoMediaEngine {
  load(source: string): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  seek(seconds: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  setPlaybackRate(rate: number): void;
  on(event: string, callback: (...args: any[]) => void): void;
  off?(event: string, callback: (...args: any[]) => void): void;
  destroy?(): void;
}
```
All media coordination, secondary audio description sync, and Ethiopian Sign Language synchronization are driven through this contract.

## 4. Website Resource Discovery (`@lumo/resource-discovery`)
Safely scans host documents without modifying unrelated DOM elements:
1. **DOM Inspection:** Safely queries non-Lumo `<video>`, `<audio>`, and document `<a>` elements.
2. **Gap Analysis:** Flags missing captions (`GAP_NO_CAPTIONS`), absent Ethiopian Fidel localization (`GAP_MISSING_AMHARIC_CAPTIONS`), absent sign language (`GAP_NO_SIGN_LANGUAGE`), and unannotated visual content (`GAP_NO_AUDIO_DESCRIPTION`).
3. **Explicit Override:** Respects host-provided configuration, giving authoritatively configured accessibility tracks precedence over heuristic detection.

## 5. Offline Resiliency Architecture (`@lumo/offline`)
* **Workbox Service Worker (`sw.ts`):** Employs `CacheFirst` strategy with CacheableResponse validation for media files (`.mp4`, `.mp3`, `.vtt`) and `StaleWhileRevalidate` for application assets.
* **IndexedDB Store (`IDBStore.ts`):** Stores complete lesson packages containing raw media blobs, cue arrays, and transcripts.
* **Package Downloader (`PackageDownloader.ts`):** Displays file size before download, validates cryptographic SHA-256 checksums, and requests browser persistent storage (`navigator.storage.persist()`).
