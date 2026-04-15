import { useState, useEffect, useCallback, useRef } from 'react';
import { Book, BookService } from '../services/bookService';

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [startIndex, setStartIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);

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

    const results = await BookService.searchBooks(query, 'vi', start);
    
    if (append) {
      setBooks(prev => [...prev, ...results]);
    } else {
      setBooks(results);
    }

    setHasMore(results.length === 20);
    setLoading(false);
    setLoadingMore(false);
  }, []);

  // Trigger search when debounced query changes
  useEffect(() => {
    fetchBooks(debouncedSearchQuery, 0, false);
  }, [debouncedSearchQuery, fetchBooks]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    const nextIndex = startIndex + 20;
    setStartIndex(nextIndex);
    fetchBooks(searchQuery, nextIndex, true);
  }, [startIndex, searchQuery, loading, loadingMore, hasMore, fetchBooks]);

  return {
    books,
    loading,
    loadingMore,
    searchQuery,
    setSearchQuery,
    loadMore,
  };
}