export interface OfflineFileEntry {
  path: string;
  sizeBytes: number;
  sha256: string;
}

export interface OfflinePackageManifest {
  schemaVersion: string;
  lessonId: string;
  title: string;
  version: string;
  createdAt: string;
  files: OfflineFileEntry[];
  totalSizeBytes: number;
}

export interface IDBLessonRecord {
  lessonId: string;
  title: string;
  audioBlob?: Blob;
  captionsEnVtt?: string;
  captionsAmVtt?: string;
  transcriptHtml?: string;
  manifest: OfflinePackageManifest;
  downloadedAt: number;
}

export interface UserPreferences {
  captionSize: 100 | 150 | 200;
  captionColor: 'white-black' | 'yellow-black' | 'black-white';
  captionLanguage: 'en' | 'am' | 'off';
  eslCoordinates?: { x: number; y: number; width: number; height: number };
}
