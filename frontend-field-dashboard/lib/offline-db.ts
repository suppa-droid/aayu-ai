import { apiClient } from './api-client';

const DB_NAME = 'vayosetu_field_db';
const DB_VERSION = 1;

export interface DraftCitizen {
  _id?: number;
  name: string;
  age: number;
  gender: string;
  monthly_income: number;
  is_bpl: boolean;
  caste_category: string;
  disability_percentage: number;
  state: string;
  district: string;
  mobile_number: string;
  has_aadhaar: boolean;
  has_bank_account: boolean;
  created_at: string;
  sync_attempts?: number;
}

export interface CachedScheme {
  id: string;
  name: string;
  category: string;
  benefits: string;
  eligibility_criteria: any;
  cached_at: string;
}

export interface SyncLog {
  id?: number;
  timestamp: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  synced_count: number;
  total_attempted: number;
  details?: string;
}

class IndexedDBStorageEngine {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('IndexedDB is not available server-side'));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // 1. Draft Citizens Store
          if (!db.objectStoreNames.contains('draft_citizens')) {
            const store = db.createObjectStore('draft_citizens', { keyPath: '_id', autoIncrement: true });
            store.createIndex('created_at', 'created_at', { unique: false });
          }

          // 2. Cached Schemes Store
          if (!db.objectStoreNames.contains('cached_schemes')) {
            db.createObjectStore('cached_schemes', { keyPath: 'id' });
          }

          // 3. Sync Logs Store
          if (!db.objectStoreNames.contains('sync_logs')) {
            db.createObjectStore('sync_logs', { keyPath: 'id', autoIncrement: true });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          // Reset so callers can retry after a transient error (e.g. storage blocked)
          this.dbPromise = null;
          reject(request.error);
        };
      });
    }
    return this.dbPromise;
  }


  // -------------------------------------------------------------
  // Draft Citizens Management
  // -------------------------------------------------------------

  async saveDraftCitizen(citizen: Omit<DraftCitizen, '_id' | 'created_at'>): Promise<number> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('draft_citizens', 'readwrite');
      const store = tx.objectStore('draft_citizens');
      const entry: DraftCitizen = {
        ...citizen,
        created_at: new Date().toISOString(),
        sync_attempts: 0
      };
      const req = store.add(entry);

      req.onsuccess = () => resolve(req.result as number);
      req.onerror = () => reject(req.error);
    });
  }

  async getDraftCitizens(): Promise<DraftCitizen[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('draft_citizens', 'readonly');
      const store = tx.objectStore('draft_citizens');
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteDraftCitizen(id: number): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('draft_citizens', 'readwrite');
      const store = tx.objectStore('draft_citizens');
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clearDraftCitizens(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('draft_citizens', 'readwrite');
      const store = tx.objectStore('draft_citizens');
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // -------------------------------------------------------------
  // Offline Schemes Cache
  // -------------------------------------------------------------

  async cacheSchemes(schemes: CachedScheme[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cached_schemes', 'readwrite');
      const store = tx.objectStore('cached_schemes');
      store.clear();
      schemes.forEach((s) => {
        store.put({ ...s, cached_at: new Date().toISOString() });
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getCachedSchemes(): Promise<CachedScheme[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cached_schemes', 'readonly');
      const store = tx.objectStore('cached_schemes');
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  // -------------------------------------------------------------
  // Sync Logs
  // -------------------------------------------------------------

  async addSyncLog(log: Omit<SyncLog, 'id'>): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_logs', 'readwrite');
      const store = tx.objectStore('sync_logs');
      const req = store.add(log);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getSyncLogs(): Promise<SyncLog[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_logs', 'readonly');
      const store = tx.objectStore('sync_logs');
      const req = store.getAll();

      req.onsuccess = () => resolve((req.result || []).reverse().slice(0, 10));
      req.onerror = () => reject(req.error);
    });
  }

  // -------------------------------------------------------------
  // Automatic Batch Synchronization
  // -------------------------------------------------------------

  async syncAllDrafts(): Promise<{ syncedCount: number; failedCount: number; errors: any[] }> {
    if (typeof window === 'undefined' || !navigator.onLine) {
      return { syncedCount: 0, failedCount: 0, errors: ['Offline'] };
    }

    const drafts = await this.getDraftCitizens();
    if (drafts.length === 0) {
      return { syncedCount: 0, failedCount: 0, errors: [] };
    }

    let syncedCount = 0;
    let failedCount = 0;
    const errors: any[] = [];

    for (const draft of drafts) {
      try {
        const { _id, created_at, sync_attempts, ...payload } = draft;
        await apiClient.post('/citizens/', payload);
        if (_id) {
          await this.deleteDraftCitizen(_id);
        }
        syncedCount++;
      } catch (err: any) {
        failedCount++;
        errors.push({ id: draft._id, error: err.message });
      }
    }

    await this.addSyncLog({
      timestamp: new Date().toISOString(),
      status: failedCount === 0 ? 'SUCCESS' : syncedCount > 0 ? 'PARTIAL' : 'FAILED',
      synced_count: syncedCount,
      total_attempted: drafts.length,
      details: failedCount === 0 ? 'Full batch sync completed' : `Synced ${syncedCount}/${drafts.length}`
    });

    return { syncedCount, failedCount, errors };
  }
}

export const OfflineDB = new IndexedDBStorageEngine();
