import axios, { AxiosError } from 'axios';
import {
  CACHE_TTL_MS,
  makeBookCacheKey,
  readBookCache,
  writeBookCache,
} from '../db/bookCacheDb';
import type { Book } from '../types/book';

export type { Book };
export type BookSearchOutcome = {
  books: Book[];
  /** True when results came from IndexedDB (API lỗi nhưng đã có bản cache trước đó). */
  fromCache: boolean;
};

/** Thrown when Google Books returns 429 after retries and no cache entry exists. */
export class RateLimitError extends Error {
  constructor(message = 'RATE_LIMIT') {
    super(message);
    this.name = 'RateLimitError';
  }
}

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getGoogleBooksApiKey(): string | undefined {
  const raw = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
  return typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : undefined;
}

function mapVolumeItems(items: unknown[]): Book[] {
  return items.map((item: any) => ({
    id: item.id,
    title: item.volumeInfo.title,
    authors: item.volumeInfo.authors || ['Ẩn danh'],
    description: item.volumeInfo.description || 'Không có mô tả.',
    thumbnail:
      item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') ||
      'https://picsum.photos/seed/book/200/300',
    categories: item.volumeInfo.categories || [],
    publishedDate: item.volumeInfo.publishedDate || 'N/A',
    previewLink: item.volumeInfo.previewLink || '',
    language: item.volumeInfo.language || 'N/A',
    pdfAvailable: Boolean(item.accessInfo?.pdf?.isAvailable),
    pdfDownloadLink: item.accessInfo?.pdf?.downloadLink || null,
    saleability: item.saleInfo?.saleability || 'UNKNOWN',
    isFree:
      item.saleInfo?.saleability === 'FREE' ||
      item.saleInfo?.saleability === 'FOR_FREE' ||
      item.saleInfo?.saleability === 'FREE_SAMPLE' ||
      item.saleInfo?.saleability === 'PUBLIC_DOMAIN',
  }));
}

async function fetchVolumes(params: Record<string, string | number>): Promise<Book[]> {
  const apiKey = getGoogleBooksApiKey();
  const requestParams: Record<string, string | number> = { ...params };
  if (apiKey) {
    requestParams.key = apiKey;
  }

  const maxAttempts = 4;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await axios.get(GOOGLE_BOOKS_API, {
        params: requestParams,
      });
      return mapVolumeItems(response.data.items || []);
    } catch (err) {
      const ax = err as AxiosError;
      if (ax.response?.status === 429 && attempt < maxAttempts - 1) {
        const header = ax.response.headers['retry-after'];
        const retryAfterSec = typeof header === 'string' ? Number(header) : 0;
        const waitMs =
          Number.isFinite(retryAfterSec) && retryAfterSec > 0
            ? retryAfterSec * 1000
            : Math.min(1500 * 2 ** attempt, 10000);
        await sleep(waitMs);
        continue;
      }
      if (ax.response?.status === 429) {
        throw new RateLimitError();
      }
      throw err;
    }
  }
  throw new RateLimitError();
}

export const BookService = {
  async searchBooks(
    query: string,
    lang: string = 'vi',
    startIndex: number = 0,
    freeOnly: boolean = false
  ): Promise<BookSearchOutcome> {
    const cacheKey = makeBookCacheKey({
      q: query || 'sách hay',
      lang: lang || '',
      startIndex,
      freeOnly,
    });

    try {
      const params: Record<string, string | number> = {
        q: query || 'sách hay',
        maxResults: 20,
        startIndex: startIndex,
        orderBy: 'relevance',
      };

      if (lang) {
        params.langRestrict = lang;
      }
      if (freeOnly) {
        params.filter = 'free-ebooks';
      }

      const books = await fetchVolumes(params);
      await writeBookCache(cacheKey, books, CACHE_TTL_MS);
      return { books, fromCache: false };
    } catch (error) {
      // Cùng trình duyệt: IndexedDB vẫn đọc được khi API lỗi (429, mạng, 5xx…)
      const cached = await readBookCache(cacheKey);
      if (cached && cached.length > 0) {
        return { books: cached, fromCache: true };
      }
      if (error instanceof RateLimitError) {
        throw error;
      }
      console.error('Error fetching books:', error);
      return { books: [], fromCache: false };
    }
  },

  async getFeaturedBooks(startIndex: number = 0, freeOnly: boolean = false): Promise<BookSearchOutcome> {
    return this.searchBooks('văn học Việt Nam', 'vi', startIndex, freeOnly);
  },
};
