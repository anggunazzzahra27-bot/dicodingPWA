import StoryAPI from '../data/api.js';

const DB_NAME = 'StoryAppDB';
const STORE = 'stories';

class StoryIndexDB {
  constructor() {
    this.db = null;
    this.initPromise = null;
  }

  async init() {
    if (this.initPromise) {
      return this.initPromise;
    }

    if (this.db) {
      return Promise.resolve();
    }

    this.initPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);

      req.onsuccess = () => {
        this.db = req.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('description', 'description', { unique: false });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          console.log('IndexedDB object store created');
        }
      };

      req.onerror = () => {
        console.error('IndexedDB initialization error:', req.error);
        reject(req.error);
      };

      req.onblocked = () => {
        console.warn('IndexedDB blocked. Please close other tabs.');
      };
    });

    return this.initPromise;
  }

  async _ensureDB() {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }
  }

  async createStory(data) {
    await this._ensureDB();

    if (navigator.onLine) {
      try {
        const result = await StoryAPI.addStory(data);
        const story = {
          id: result.data?.id || Date.now().toString(),
          description: data.description,
          photoUrl: result.data?.photoUrl || '',
          lat: data.lat,
          lon: data.lon,
          createdAt: new Date().toISOString(),
          syncStatus: 'synced',
        };
        await this.saveToIDB(story);
        return { success: true, online: true, data: story };
      } catch (error) {
        console.error('Error creating story online:', error);
        throw error;
      }
    } else {
      const story = {
        id: `offline_${Date.now()}`,
        description: data.description,
        photoFile: data.photo,
        lat: data.lat,
        lon: data.lon,
        createdAt: new Date().toISOString(),
        syncStatus: 'pending',
      };
      await this.saveToIDB(story);
      return { success: true, online: false, data: story };
    }
  }

  async saveToIDB(story) {
    await this._ensureDB();

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction([STORE], 'readwrite');
        const store = tx.objectStore(STORE);
        const req = store.put(story);

        req.onsuccess = () => {
          console.log('Story saved to IndexedDB:', story.id);
          resolve();
        };

        req.onerror = () => {
          console.error('Error saving to IndexedDB:', req.error);
          reject(req.error);
        };

        tx.onerror = () => {
          console.error('Transaction error:', tx.error);
          reject(tx.error);
        };
      } catch (error) {
        console.error('Error in saveToIDB:', error);
        reject(error);
      }
    });
  }

  async getAllStories(refresh = false) {
    await this._ensureDB();

    if (navigator.onLine && refresh) {
      try {
        const result = await StoryAPI.getAllStories();
        for (const story of result.listStory || []) {
          await this.saveToIDB({
            ...story,
            syncStatus: 'synced',
            createdAt: story.createdAt || new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error refreshing stories from API:', error);
      }
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction([STORE], 'readonly');
        const store = tx.objectStore(STORE);
        const req = store.getAll();

        req.onsuccess = () => {
          const stories = req.result || [];
          console.log(`Retrieved ${stories.length} stories from IndexedDB`);
          resolve(stories);
        };

        req.onerror = () => {
          console.error('Error getting stories:', req.error);
          resolve([]);
        };
      } catch (error) {
        console.error('Error in getAllStories:', error);
        resolve([]);
      }
    });
  }

  async getStoryById(id) {
    await this._ensureDB();

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction([STORE], 'readonly');
        const store = tx.objectStore(STORE);
        const req = store.get(id);

        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  async deleteStory(id) {
    await this._ensureDB();

    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction([STORE], 'readwrite');
        const store = tx.objectStore(STORE);
        const req = store.delete(id);

        req.onsuccess = () => {
          console.log('Story deleted from IndexedDB:', id);
          resolve(true);
        };

        req.onerror = () => {
          console.error('Error deleting story:', req.error);
          resolve(false);
        };
      } catch (error) {
        console.error('Error in deleteStory:', error);
        resolve(false);
      }
    });
  }

  async searchStories(keyword) {
    const stories = await this.getAllStories();
    if (!keyword || keyword.trim() === '') {
      return stories;
    }

    const searchTerm = keyword.toLowerCase();
    return stories.filter(
      (s) =>
        s.description?.toLowerCase().includes(searchTerm) ||
        s.name?.toLowerCase().includes(searchTerm)
    );
  }

  async sortStories(by = 'createdAt', order = 'desc') {
    const stories = await this.getAllStories();
    return stories.sort((a, b) => {
      const aVal = a[by];
      const bVal = b[by];

      if (order === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  }

  async filterStories(type = 'all') {
    const stories = await this.getAllStories();
    if (type === 'all') return stories;
    return stories.filter((s) => s.syncStatus === type);
  }

  async syncPending() {
    await this._ensureDB();

    if (!navigator.onLine) {
      return { synced: 0, message: 'No internet connection' };
    }

    const pending = await this.filterStories('pending');
    console.log(`Found ${pending.length} pending stories to sync`);

    if (pending.length === 0) {
      return { synced: 0, message: 'No pending stories' };
    }

    let synced = 0;
    const errors = [];

    for (const story of pending) {
      try {
        console.log('Syncing story:', story.id);

        await StoryAPI.addStory({
          description: story.description,
          photo: story.photoFile,
          lat: story.lat,
          lon: story.lon,
        });

        await this.deleteStory(story.id);
        synced++;

        console.log('Story synced successfully:', story.id);
      } catch (error) {
        console.error('Error syncing story:', story.id, error);
        errors.push({ id: story.id, error: error.message });
      }
    }

    return {
      synced,
      total: pending.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Synced ${synced} of ${pending.length} stories`,
    };
  }

  async clearAllStories() {
    await this._ensureDB();

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction([STORE], 'readwrite');
        const store = tx.objectStore(STORE);
        const req = store.clear();

        req.onsuccess = () => {
          console.log('All stories cleared from IndexedDB');
          resolve(true);
        };

        req.onerror = () => {
          console.error('Error clearing stories:', req.error);
          reject(req.error);
        };
      } catch (error) {
        console.error('Error in clearAllStories:', error);
        reject(error);
      }
    });
  }
}

const storyIndexDB = new StoryIndexDB();

storyIndexDB.init().catch((error) => {
  console.error('Failed to auto-initialize IndexedDB:', error);
});

export default storyIndexDB;
