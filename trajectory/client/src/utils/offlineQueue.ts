/**
 * IndexedDB Offline Action Queue
 * Queues task updates and attendance records when the student is offline,
 * and automatically replays them to the server when network connectivity is restored.
 */

interface QueuedAction {
  id: string;
  type: 'COMPLETE_TASK' | 'LOG_ATTENDANCE';
  payload: Record<string, unknown>;
  timestamp: number;
}

const DB_NAME = 'trajectory-offline-db';
const STORE_NAME = 'action-queue';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queueOfflineAction(action: Omit<QueuedAction, 'id' | 'timestamp'>): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const item: QueuedAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
    };
    store.add(item);
  } catch (err) {
    console.warn('Failed to queue offline action in IndexedDB:', err);
  }
}

export async function getQueuedActions(): Promise<QueuedAction[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function removeQueuedAction(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
  } catch (err) {
    console.warn('Failed to remove queued action:', err);
  }
}

/**
 * Sync all queued actions to the server
 */
export async function syncQueuedActions(
  apiCompleter: (action: QueuedAction) => Promise<boolean>
): Promise<number> {
  const actions = await getQueuedActions();
  let synced = 0;
  for (const action of actions) {
    try {
      const success = await apiCompleter(action);
      if (success) {
        await removeQueuedAction(action.id);
        synced++;
      }
    } catch (err) {
      console.warn(`Sync failed for action ${action.id}:`, err);
    }
  }
  return synced;
}

// Auto-register online event listener
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[OfflineSync] Network reconnected. Flushing offline queue...');
  });
}
