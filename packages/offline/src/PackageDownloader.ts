import { IDBStore } from './IDBStore';
import { OfflinePackageManifest, IDBLessonRecord } from './types';

export type DownloadProgressCallback = (percent: number, currentFile: string) => void;

export class PackageDownloader {
  private idbStore: IDBStore;

  constructor(idbStore: IDBStore = new IDBStore()) {
    this.idbStore = idbStore;
  }

  /**
   * Request persistent storage to prevent Android browser eviction
   */
  public async requestPersistentStorage(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      try {
        return await navigator.storage.persist();
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Verify SHA-256 checksum of an ArrayBuffer
   */
  public static async verifyChecksum(buffer: ArrayBuffer, expectedHash: string): Promise<boolean> {
    if (!expectedHash) return true;
    if (typeof crypto === 'undefined' || !crypto.subtle) return true;

    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex.toLowerCase() === expectedHash.toLowerCase();
    } catch {
      return false;
    }
  }

  /**
   * Download package and cache inside IndexedDB with progress reporting
   */
  public async downloadPackage(
    manifestUrl: string,
    onProgress?: DownloadProgressCallback
  ): Promise<IDBLessonRecord> {
    await this.requestPersistentStorage();

    // 1. Fetch Manifest
    onProgress?.(5, 'manifest.json');
    const manifestRes = await fetch(manifestUrl);
    if (!manifestRes.ok) {
      throw new Error(`Failed to fetch package manifest: HTTP ${manifestRes.status}`);
    }
    const manifest: OfflinePackageManifest = await manifestRes.json();

    const baseUrl = manifestUrl.substring(0, manifestUrl.lastIndexOf('/') + 1);

    let audioBlob: Blob | undefined;
    let captionsEnVtt = '';
    let captionsAmVtt = '';
    let transcriptHtml = '';

    const totalFiles = manifest.files.length;
    let completedFiles = 0;

    // 2. Fetch all package files
    for (const fileEntry of manifest.files) {
      const fileUrl = `${baseUrl}${fileEntry.path}`;
      const progressPercent = Math.round(10 + (completedFiles / totalFiles) * 85);
      onProgress?.(progressPercent, fileEntry.path);

      const fileRes = await fetch(fileUrl);
      if (!fileRes.ok) {
        throw new Error(`Failed to download ${fileEntry.path}: HTTP ${fileRes.status}`);
      }

      const buffer = await fileRes.arrayBuffer();

      // Checksum verification
      if (fileEntry.sha256) {
        const isValid = await PackageDownloader.verifyChecksum(buffer, fileEntry.sha256);
        if (!isValid) {
          throw new Error(`Checksum mismatch for file ${fileEntry.path}`);
        }
      }

      const textDecoder = new TextDecoder();
      if (fileEntry.path.endsWith('.mp3') || fileEntry.path.endsWith('.m4a')) {
        audioBlob = new Blob([buffer], { type: 'audio/mp3' });
      } else if (fileEntry.path.includes('captions-en') || fileEntry.path.endsWith('-en.vtt')) {
        captionsEnVtt = textDecoder.decode(buffer);
      } else if (fileEntry.path.includes('captions-am') || fileEntry.path.endsWith('-am.vtt')) {
        captionsAmVtt = textDecoder.decode(buffer);
      } else if (fileEntry.path.endsWith('.html') || fileEntry.path.endsWith('.txt')) {
        transcriptHtml = textDecoder.decode(buffer);
      }

      completedFiles++;
    }

    const record: IDBLessonRecord = {
      lessonId: manifest.lessonId,
      title: manifest.title,
      audioBlob,
      captionsEnVtt,
      captionsAmVtt,
      transcriptHtml,
      manifest,
      downloadedAt: Date.now()
    };

    // 3. Store record in IndexedDB
    await this.idbStore.saveLesson(record);
    onProgress?.(100, 'Complete');

    return record;
  }
}
