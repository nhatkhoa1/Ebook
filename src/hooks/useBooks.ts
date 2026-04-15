import { useState, useEffect, useCallback } from 'react';
import { Book, BookService } from '../services/bookService';

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [startIndex, setStartIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [freeOnly, setFreeOnly] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchBooks = useCallback(async (query: string = '', start: number = 0, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setStartIndex(0);
    }

    setError(null);

    const normalizedQuery = query.trim();
    let results: Book[] = [];

    try {
      if (normalizedQuery) {
        results = await BookService.searchBooks(normalizedQuery, 'vi', start, freeOnly);
        if (results.length === 0) {
          // Fallback search without language restriction to avoid false empty state.
          results = await BookService.searchBooks(normalizedQuery, '', start, freeOnly);
        }
      } else {
        results = await BookService.getFeaturedBooks(start, freeOnly);
        if (results.length === 0) {
          results = await BookService.searchBooks('sách hay', '', start, freeOnly);
        }
      }

      if (append) {
        setBooks(prev => {
          const merged = [...prev, ...results];
          return merged.filter((book, index, array) => index === array.findIndex(item => item.id === book.id));
        });
      } else {
        setBooks(results);
      }

      setHasMore(results.length === 20);
      if (!append && results.length === 0) {
        setError('Chưa tìm thấy kết quả phù hợp. Bạn thử từ khóa khác hoặc bấm thử lại nhé.');
      }
    } catch (fetchError) {
      if (!append) {
        setBooks([]);
      }
      setHasMore(false);
      setError('Không thể tải danh sách sách lúc này. Vui lòng thử lại sau ít phút.');
      console.error('Error fetching books list:', fetchError);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [freeOnly]);

  // Trigger search when debounced query changes
  useEffect(() => {
    fetchBooks(debouncedSearchQuery, 0, false);
  }, [debouncedSearchQuery, fetchBooks, freeOnly]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    const nextIndex = startIndex + 20;
    setStartIndex(nextIndex);
    fetchBooks(debouncedSearchQuery, nextIndex, true);
  }, [startIndex, debouncedSearchQuery, loading, loadingMore, hasMore, fetchBooks]);

  const retry = useCallback(() => {
    fetchBooks(debouncedSearchQuery, 0, false);
  }, [debouncedSearchQuery, fetchBooks]);

  return {
    books,
    loading,
    loadingMore,
    error,
    freeOnly,
    setFreeOnly,
    searchQuery,
    setSearchQuery,
    loadMore,
    retry,
  };
}