import axios from 'axios';

export interface Book {
  id: string;
  title: string;
  authors: string[];
  description: string;
  thumbnail: string;
  categories: string[];
  publishedDate: string;
  previewLink: string;
  language: string;
  pdfAvailable: boolean;
  pdfDownloadLink: string | null;
  saleability: string;
  isFree: boolean;
}

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

export const BookService = {
  async searchBooks(
    query: string,
    lang: string = 'vi',
    startIndex: number = 0,
    freeOnly: boolean = false
  ): Promise<Book[]> {
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

      const response = await axios.get(GOOGLE_BOOKS_API, {
        params,
      });

      return (response.data.items || []).map((item: any) => ({
        id: item.id,
        title: item.volumeInfo.title,
        authors: item.volumeInfo.authors || ['Ẩn danh'],
        description: item.volumeInfo.description || 'Không có mô tả.',
        thumbnail: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://picsum.photos/seed/book/200/300',
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
    } catch (error) {
      console.error('Error fetching books:', error);
      return [];
    }
  },

  async getFeaturedBooks(startIndex: number = 0, freeOnly: boolean = false): Promise<Book[]> {
    // Fetch some popular Vietnamese books
    return this.searchBooks('văn học Việt Nam', 'vi', startIndex, freeOnly);
  }
};
