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
}

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

export const BookService = {
  async searchBooks(query: string, lang: string = 'vi', startIndex: number = 0): Promise<Book[]> {
    try {
      const response = await axios.get(GOOGLE_BOOKS_API, {
        params: {
          q: query || 'sách hay',
          langRestrict: lang,
          maxResults: 20,
          startIndex: startIndex,
          orderBy: 'relevance',
        },
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
      }));
    } catch (error) {
      console.error('Error fetching books:', error);
      return [];
    }
  },

  async getFeaturedBooks(): Promise<Book[]> {
    // Fetch some popular Vietnamese books
    return this.searchBooks('văn học Việt Nam');
  }
};
