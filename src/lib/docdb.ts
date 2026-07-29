// Хранилище фотографий пакета документов. Только IndexedDB этого браузера:
// ни на сервер, ни в облако файлы не уходят (DOCS-AND-FIXES §1–2).

export interface DocPhoto {
  id: string
  sec: string
  label: string
  blob: Blob
  ts: number
}

export interface PacketMeta {
  n: number
  date: string
}

const DB = 'detnav-docpack'

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const rq = indexedDB.open(DB, 1)
    rq.onupgradeneeded = () => {
      const db = rq.result
      if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'k' })
    }
    rq.onsuccess = () => res(rq.result)
    rq.onerror = () => rej(rq.error)
  })
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((res, rej) => {
        const t = db.transaction(store, mode)
        const rq = fn(t.objectStore(store))
        rq.onsuccess = () => res(rq.result as T)
        rq.onerror = () => rej(rq.error)
        t.oncomplete = () => db.close()
      }),
  )
}

export const listPhotos = () => tx<DocPhoto[]>('photos', 'readonly', (s) => s.getAll())
export const putPhoto = (p: DocPhoto) => tx<IDBValidKey>('photos', 'readwrite', (s) => s.put(p))
export const deletePhoto = (id: string) => tx<undefined>('photos', 'readwrite', (s) => s.delete(id))
export const clearPhotos = () => tx<undefined>('photos', 'readwrite', (s) => s.clear())

export const getLastPacket = () =>
  tx<{ k: string; v: PacketMeta } | undefined>('meta', 'readonly', (s) => s.get('packet')).then(
    (r) => r?.v,
  )
export const setLastPacket = (v: PacketMeta) =>
  tx<IDBValidKey>('meta', 'readwrite', (s) => s.put({ k: 'packet', v }))

// Сжатие в момент добавления, по одному файлу (DOCS-AND-FIXES §1):
// длинная сторона до 1600 px, JPEG 0.7 → 200–400 КБ на страницу.
export async function compressImage(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image()
      i.onload = () => res(i)
      i.onerror = () => rej(new Error('bad image'))
      i.src = url
    })
    const max = 1600
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.round(img.naturalWidth * k)
    const h = Math.round(img.naturalHeight * k)
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const ctx = c.getContext('2d')!
    ctx.drawImage(img, 0, 0, w, h)
    const blob = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/jpeg', 0.7))
    if (!blob) throw new Error('toBlob failed')
    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}
