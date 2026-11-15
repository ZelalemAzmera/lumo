# Lumo Offline Functionality & Verification Report

## 1. Architecture Overview
Lumo enables complete offline access for learners with intermittent connectivity through a multi-tiered architecture:
1. **Workbox Service Worker (`packages/offline/src/sw.ts`):** Automatically caches media using `CacheFirst` strategies.
2. **Client IndexedDB Store (`packages/offline/src/IDBStore.ts`):** Stores offline packages under `LumoA11yDB` (version 2) with stores for `lessons` and `resources`.
3. **Single-File Self-Contained Offline Lessons:** The player includes a 1-tap download that exports a self-contained offline lesson bundle (`lumo-lesson-offline-4.2MB.html`) containing inline scripts, Fidel fonts, and local storage references.

## 2. Real Media Bundling & Size Transparency
* **Size Transparency:** The offline download button explicitly indicates the exact package payload in megabytes (e.g. `Download for offline (4.2 MB)` / `ያለ በይነመረብ ለማየት ያውርዱ (4.2 MB)`) before the user initiates download.
* **Integrity Validation:** `PackageDownloader.verifyChecksum` validates SHA-256 hashes for all media assets using browser `crypto.subtle.digest`.
* **Storage Persistence:** On Android Chrome and supported browsers, `navigator.storage.persist()` is invoked to prevent browser storage eviction during low-disk situations.

## 3. Airplane-Mode Playback Verification
1. Open any lesson page with `<db-player>` or `<lumo-player>`.
2. Tap "Download for offline (4.2 MB)".
3. Verify that the offline bundle downloads and is persisted to IndexedDB (`LumoA11yDB`).
4. Turn on Airplane Mode (disable Wi-Fi and mobile data).
5. Open the downloaded offline HTML file or reload the page: the lesson, dual captions, and transcript remain fully functional.
