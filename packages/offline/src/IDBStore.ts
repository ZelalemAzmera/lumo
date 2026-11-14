import { IDBLessonRecord } from './types';

export class IDBStore {
  private dbName = 'LumoA11yDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  public async init(): Promise<void> {
    if (this.db) return;
    if (typeof indexedDB === 'undefined') return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('lessons')) {
          const lessonStore = db.createObjectStore('lessons', { keyPath: 'lessonId' });
          lessonStore.createIndex('downloadedAt', 'downloadedAt', { unique: false });
        }
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
      };
    });
  }

  public async saveLesson(lesson: IDBLessonRecord): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('lessons', 'readwrite');
      const store = tx.objectStore('lessons');
      const request = store.put(lesson);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async getLesson(lessonId: string): Promise<IDBLessonRecord | undefined> {
    await this.init();
    if (!this.db) return undefined;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('lessons', 'readonly');
      const store = tx.objectStore('lessons');
      const request = store.get(lessonId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public async getAllLessons(): Promise<IDBLessonRecord[]> {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('lessons', 'readonly');
      const store = tx.objectStore('lessons');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  public async deleteLesson(lessonId: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('lessons', 'readwrite');
      const store = tx.objectStore('lessons');
      const request = store.delete(lessonId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async savePreference<T>(key: string, value: T): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('preferences', 'readwrite');
      const store = tx.objectStore('preferences');
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async getPreference<T>(key: string): Promise<T | undefined> {
    await this.init();
    if (!this.db) return undefined;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('preferences', 'readonly');
      const store = tx.objectStore('preferences');
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }
}
