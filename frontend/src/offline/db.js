/**
 * Offline-First IndexedDB and Sync Engine for Kadianga Electricals
 * Handles caching catalog products, cart persistence, and offline quotation queueing.
 */

const DB_NAME = 'kadianga_offline_db';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      console.warn('IndexedDB not supported, falling back to memory/localStorage');
      resolve(null);
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cart')) {
        db.createObjectStore('cart', { keyPath: 'productId' });
      }
      if (!db.objectStoreNames.contains('pending_quotes')) {
        db.createObjectStore('pending_quotes', { keyPath: 'client_uuid' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function cacheProductsOffline(products) {
  try {
    const db = await openDB();
    if (!db) {
      localStorage.setItem('cached_products', JSON.stringify(products));
      return;
    }
    const tx = db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');
    for (const p of products) {
      store.put(p);
    }
  } catch (err) {
    console.error('Failed to cache products offline:', err);
  }
}

export async function getCachedProductsOffline() {
  try {
    const db = await openDB();
    if (!db) {
      const saved = localStorage.getItem('cached_products');
      return saved ? JSON.parse(saved) : [];
    }
    return new Promise((resolve) => {
      const tx = db.transaction('products', 'readonly');
      const store = tx.objectStore('products');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function saveCartOffline(items) {
  try {
    localStorage.setItem('kadianga_cart', JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save cart:', err);
  }
}

export function getCartOffline() {
  try {
    const data = localStorage.getItem('kadianga_cart') || localStorage.getItem('voltcraft_cart');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function queueOfflineQuote(quotePayload) {
  try {
    const db = await openDB();
    const clientUuid = quotePayload.client_uuid || `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const record = {
      ...quotePayload,
      client_uuid: clientUuid,
      queued_at: new Date().toISOString(),
      offline_created: true
    };

    if (!db) {
      const queue = JSON.parse(localStorage.getItem('pending_quotes') || '[]');
      queue.push(record);
      localStorage.setItem('pending_quotes', JSON.stringify(queue));
      return record;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction('pending_quotes', 'readwrite');
      const store = tx.objectStore('pending_quotes');
      const req = store.put(record);
      req.onsuccess = () => resolve(record);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to queue offline quote:', err);
    throw err;
  }
}

export async function getPendingQuotes() {
  try {
    const db = await openDB();
    if (!db) {
      return JSON.parse(localStorage.getItem('pending_quotes') || '[]');
    }
    return new Promise((resolve) => {
      const tx = db.transaction('pending_quotes', 'readonly');
      const store = tx.objectStore('pending_quotes');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function removePendingQuote(clientUuid) {
  try {
    const db = await openDB();
    if (!db) {
      let queue = JSON.parse(localStorage.getItem('pending_quotes') || '[]');
      queue = queue.filter(q => q.client_uuid !== clientUuid);
      localStorage.setItem('pending_quotes', JSON.stringify(queue));
      return;
    }
    const tx = db.transaction('pending_quotes', 'readwrite');
    const store = tx.objectStore('pending_quotes');
    store.delete(clientUuid);
  } catch (err) {
    console.error('Failed to remove pending quote:', err);
  }
}

export async function syncPendingQuotes(apiBase = '/api') {
  const pending = await getPendingQuotes();
  if (!pending || pending.length === 0) return { synced: 0 };

  console.log(`[Offline Sync] Attempting to sync ${pending.length} pending quotations...`);
  try {
    const res = await fetch(`${apiBase}/quotes/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quotes: pending })
    });

    if (res.ok) {
      const data = await res.json();
      for (const item of pending) {
        await removePendingQuote(item.client_uuid);
      }
      window.dispatchEvent(new CustomEvent('offline-sync-success', { detail: data }));
      return { synced: pending.length, results: data };
    }
  } catch (err) {
    console.warn('[Offline Sync] Sync failed, will retry next time online:', err);
  }
  return { synced: 0 };
}
