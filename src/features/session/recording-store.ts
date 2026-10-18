const DB_NAME = "mock-iv-recordings";
const STORE = "videos";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "sessionId" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

export async function saveSessionRecording(options: {
  sessionId: string;
  blob: Blob;
  fileName: string;
}) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({
      sessionId: options.sessionId,
      blob: options.blob,
      fileName: options.fileName,
      mimeType: options.blob.type || "video/webm",
      savedAt: new Date().toISOString(),
      size: options.blob.size,
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB write failed"));
  });
  db.close();
}

export async function loadSessionRecording(sessionId: string): Promise<{
  blob: Blob;
  fileName: string;
  mimeType: string;
} | null> {
  const db = await openDb();
  const row = await new Promise<{
    blob: Blob;
    fileName: string;
    mimeType: string;
  } | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(sessionId);
    req.onsuccess = () => {
      const value = req.result as
        | {
            blob: Blob;
            fileName: string;
            mimeType: string;
          }
        | undefined;
      resolve(value ?? null);
    };
    req.onerror = () => reject(req.error ?? new Error("IndexedDB read failed"));
  });
  db.close();
  return row;
}
