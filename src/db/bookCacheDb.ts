import Dexie, { type Table } from 'dexie'
import type { Book } from '../types/book'

/** Thời gian sống của cache (7 ngày) */
export const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export type BookCacheKeyParts = {
  q: string
  lang: string
  startIndex: number
  freeOnly: boolean
}

interface BookCacheRow {
  key: string
  books: Book[]
  expiresAt: number
}

class BookCacheDb extends Dexie {
  bookEntries!: Table<BookCacheRow, string>

  constructor() {
    super('ebook-book-cache')
    this.version(1).stores({
      bookEntries: 'key, expiresAt',
    })
  }
}

export const bookCacheDb = new BookCacheDb()

/** * Tạo Key ổn định (Stable Key)
 * Đảm bảo các thuộc tính luôn theo thứ tự để JSON.stringify không tạo ra key khác nhau
 */
export function makeBookCacheKey(parts: BookCacheKeyParts): string {
  const sorted = Object.keys(parts)
    .sort()
    .reduce((acc, key) => {
      acc[key] = (parts as any)[key]
      return acc
    }, {} as any)
  return JSON.stringify(sorted)
}

/** * Đọc Cache
 * Lưu ý: Không tự động xóa khi hết hạn ở đây để hỗ trợ Fallback khi API lỗi 429.
 */
export async function readBookCache(key: string): Promise<Book[] | null> {
  try {
    const row = await bookCacheDb.bookEntries.get(key)
    if (!row) return null

    // Lưu ý: Chúng ta trả về books kể cả khi hết hạn.
    // Logic của BookService sẽ chỉ gọi hàm này khi API đã thất bại.
    return row.books
  } catch (error) {
    console.error('IndexedDB Read Error:', error)
    return null
  }
}

/** * Ghi Cache
 */
export async function writeBookCache(
  key: string,
  books: Book[],
  ttlMs: number,
): Promise<void> {
  if (!books || books.length === 0) return
  try {
    await bookCacheDb.bookEntries.put({
      key,
      books,
      expiresAt: Date.now() + ttlMs,
    })
  } catch (error) {
    // Thường gặp ở chế độ ẩn danh hoặc hết dung lượng ổ cứng
    console.warn('IndexedDB Write Error (Quota/Private Mode):', error)
  }
}

/**
 * Hàm dọn dẹp (Cleanup)
 * Nên gọi hàm này 1 lần khi ứng dụng khởi tạo (ví dụ trong App.tsx)
 * để xóa các cache đã quá cũ (ví dụ cũ hơn 30 ngày) giúp trình duyệt nhẹ hơn.
 */
export async function vacuumOldCache(): Promise<void> {
  const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000
  const threshold = Date.now() - ONE_MONTH_MS
  await bookCacheDb.bookEntries.where('expiresAt').below(threshold).delete()
}
