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
