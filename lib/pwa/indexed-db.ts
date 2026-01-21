/**
 * IndexedDB操作ユーティリティ
 * オフライン記録キューの管理
 */

import type { OfflineRecord } from "./types";

const DB_NAME = "mood-harbor-offline";
const DB_VERSION = 1;
const STORE_NAME = "offline-records";

/**
 * IndexedDBを開く
 */
export async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("IndexedDB is not available in server-side"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // オフライン記録キューのオブジェクトストアを作成
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, {
          keyPath: "temp_id",
        });

        // インデックスを作成
        objectStore.createIndex("created_at", "created_at", { unique: false });
      }
    };
  });
}

/**
 * オフライン記録を保存
 */
export async function saveOfflineRecord(record: OfflineRecord): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(record);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * 全てのオフライン記録を取得
 */
export async function getAllOfflineRecords(): Promise<OfflineRecord[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as OfflineRecord[]);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * オフライン記録を削除
 */
export async function deleteOfflineRecord(tempId: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(tempId);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * 全てのオフライン記録をクリア
 */
export async function clearAllOfflineRecords(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}
