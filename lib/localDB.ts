// Local Database using IndexedDB for offline-first architecture
const DB_NAME = 'omi_manager';
const DB_VERSION = 3; // Incremented for rename migration

export class LocalDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'uid' });
        }

        if (!db.objectStoreNames.contains('chats')) {
          const chatStore = db.createObjectStore('chats', { keyPath: 'id' });
          chatStore.createIndex('userId', 'userId', { unique: false });
          chatStore.createIndex('folderId', 'folderId', { unique: false });
        }

        if (!db.objectStoreNames.contains('memories')) {
          const memoryStore = db.createObjectStore('memories', { keyPath: 'id' });
          memoryStore.createIndex('userId', 'userId', { unique: false });
          // Migrate old lifelogs if applicable? For now just new store.
        }

        // Use 'lifelogs' as alias for memories if needed by old code, but we will move to 'memories'
        if (db.objectStoreNames.contains('lifelogs')) {
          // We can rename or just leave it. Let's leave it for now to avoid complexity in migration logic.
        }

        if (!db.objectStoreNames.contains('action_items')) {
          const actionStore = db.createObjectStore('action_items', { keyPath: 'id' });
          actionStore.createIndex('userId', 'userId', { unique: false });
          actionStore.createIndex('completed', 'completed', { unique: false });
        }

        if (!db.objectStoreNames.contains('folders')) {
          const folderStore = db.createObjectStore('folders', { keyPath: 'id' });
          folderStore.createIndex('userId', 'userId', { unique: false });
        }

        if (!db.objectStoreNames.contains('syncedDates')) {
          const syncStore = db.createObjectStore('syncedDates', { keyPath: 'id' });
          syncStore.createIndex('userId', 'userId', { unique: false });
        }
      };
    });
  }

  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string, indexName?: string, query?: IDBValidKey): Promise<T[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);

      let request: IDBRequest;
      if (indexName && query) {
        const index = store.index(indexName);
        request = index.getAll(query);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put<T>(storeName: string, value: T): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      // Ensure store exists (simple error handling for dev)
      if (!this.db!.objectStoreNames.contains(storeName)) {
        console.error(`Store ${storeName} does not exist`);
        return resolve();
      }

      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async bulkPut<T>(storeName: string, items: T[]): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db!.objectStoreNames.contains(storeName)) return resolve();

      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      let completed = 0;
      items.forEach(item => {
        const request = store.put(item);
        request.onsuccess = () => {
          completed++;
          if (completed === items.length) {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });

      if (items.length === 0) resolve();
    });
  }

  async bulkDelete(storeName: string, keys: string[]): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      let completed = 0;
      keys.forEach(key => {
        const request = store.delete(key);
        request.onsuccess = () => {
          completed++;
          if (completed === keys.length) {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });

      if (keys.length === 0) resolve();
    });
  }
}

export const localDB = new LocalDB();
