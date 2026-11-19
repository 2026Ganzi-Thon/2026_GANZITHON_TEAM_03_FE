import { createStore, del, get, set } from 'idb-keyval'
import type { UseStore } from 'idb-keyval'

// IndexedDB 에 문자열을 넣고 꺼내는 작은 저장소(idb-keyval). 못 쓰는 환경(사파리 개인정보 보호 모드·저장 공간 거부·
// IndexedDB 가 없는 브라우저)에서는 오류를 던지지 않고 아무것도 저장하지 않은 것처럼 동작한다 — 읽으면 null, 쓰기·지우기는 무시.

const DB_NAME = 'polly'
const STORE_NAME = 'kv'

let store: UseStore | null | undefined

/** 저장소를 처음 쓸 때 연다. 열 수 없으면 null — 이후로는 다시 시도하지 않는다 */
function getStore(): UseStore | null {
  if (store !== undefined) return store
  try {
    store = typeof indexedDB === 'undefined' ? null : createStore(DB_NAME, STORE_NAME)
  } catch {
    store = null
  }
  return store
}

export const idbStorage = {
  async getItem(key: string): Promise<string | null> {
    const db = getStore()
    if (!db) return null
    try {
      const value = await get<unknown>(key, db)
      return typeof value === 'string' ? value : null
    } catch {
      return null
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    const db = getStore()
    if (!db) return
    try {
      await set(key, value, db)
    } catch {
      // 저장 공간이 없거나 거부됨 — 저장하지 않고 넘어간다(다음에 다시 열면 서버에서 받는다)
    }
  },
  async removeItem(key: string): Promise<void> {
    const db = getStore()
    if (!db) return
    try {
      await del(key, db)
    } catch {
      // 지우지 못해도 주인·버전이 다르면 되살리지 않는다(app/queryPersist.ts)
    }
  },
}
