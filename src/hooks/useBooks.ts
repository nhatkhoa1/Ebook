import { useState, useEffect, useCallback } from 'react'
import { Book, BookService, RateLimitError } from '../services/bookService'

/** Chờ trước khi gọi lại API sau 429 — tránh bấm «Thử lại» rồi bị chặn ngay lập tức. */
const RATE_LIMIT_RETRY_DELAY_MS = 3000

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [startIndex, setStartIndex] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorKind, setErrorKind] = useState<'rate_limit' | 'other' | null>(
    null,
  )
  const [cacheNotice, setCacheNotice] = useState<string | null>(null)
  const [freeOnly, setFreeOnly] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchBooks = useCallback(
    async (query: string = '', start: number = 0, append: boolean = false) => {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
        setStartIndex(0)
      }

      setError(null)
      setCacheNotice(null)
      setErrorKind(null)

      const normalizedQuery = query.trim()
      let results: Book[] = []
      let usedCache = false

      try {
        if (normalizedQuery) {
          let o = await BookService.searchBooks(
            normalizedQuery,
            'vi',
            start,
            freeOnly,
          )
          usedCache = usedCache || o.fromCache
          results = o.books
          if (results.length === 0) {
            o = await BookService.searchBooks(
              normalizedQuery,
              '',
              start,
              freeOnly,
            )
            usedCache = usedCache || o.fromCache
            results = o.books
          }
        } else {
          let o = await BookService.getFeaturedBooks(start, freeOnly)
          usedCache = usedCache || o.fromCache
          results = o.books
          if (results.length === 0) {
            o = await BookService.searchBooks('sách hay', '', start, freeOnly)
            usedCache = usedCache || o.fromCache
            results = o.books
          }
        }

        if (usedCache) {
          setCacheNotice('Đang hiển thị kết quả đã lưu trên máy (IndexedDB)')
        }

        if (append) {
          setBooks((prev) => {
            const merged = [...prev, ...results]
            return merged.filter(
              (book, index, array) =>
                index === array.findIndex((item) => item.id === book.id),
            )
          })
        } else {
          setBooks(results)
        }

        setHasMore(results.length === 20)
        if (!append && results.length === 0) {
          setError(
            'Chưa tìm thấy kết quả phù hợp. Bạn thử từ khóa khác hoặc bấm thử lại nhé.',
          )
        }
      } catch (fetchError) {
        if (!append) {
          setBooks([])
        }
        setHasMore(false)
        setCacheNotice(null)
        if (fetchError instanceof RateLimitError) {
          setErrorKind('rate_limit')
          setError(
            'Hệ thống quá tải lượng truy cập, vui lòng chờ đợi trong giây lát',
          )
        } else {
          setErrorKind('other')
          setError(
            'Không thể tải danh sách sách lúc này. Vui lòng thử lại sau ít phút.',
          )
        }
        console.error('Error fetching books list:', fetchError)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [freeOnly],
  )

  // Trigger search when debounced query changes
  useEffect(() => {
    fetchBooks(debouncedSearchQuery, 0, false)
  }, [debouncedSearchQuery, fetchBooks, freeOnly])

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return
    const nextIndex = startIndex + 20
    setStartIndex(nextIndex)
    fetchBooks(debouncedSearchQuery, nextIndex, true)
  }, [
    startIndex,
    debouncedSearchQuery,
    loading,
    loadingMore,
    hasMore,
    fetchBooks,
  ])

  const retry = useCallback(async () => {
    if (errorKind === 'rate_limit') {
      setLoading(true)
      setError(null)
      await new Promise((r) => setTimeout(r, RATE_LIMIT_RETRY_DELAY_MS))
    }
    fetchBooks(debouncedSearchQuery, 0, false)
  }, [errorKind, debouncedSearchQuery, fetchBooks])

  return {
    books,
    loading,
    loadingMore,
    error,
    cacheNotice,
    freeOnly,
    setFreeOnly,
    searchQuery,
    setSearchQuery,
    loadMore,
    retry,
  }
}
