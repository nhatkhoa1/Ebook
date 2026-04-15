import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

import type { Book } from './bookService';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export type ExtractedPage = {
  page: number;
  text: string;
  confidence: number;
  source: 'text-layer' | 'ocr';
};

export type TextLayerCheckResult = {
  hasTextLayer: boolean;
  totalPages: number;
  pages: ExtractedPage[];
};

type ProgressInfo = {
  currentPage: number;
  totalPages: number;
};

async function fetchPdfBytes(book: Book): Promise<Uint8Array> {
  if (!book.pdfDownloadLink) {
    throw new Error('Sách này không có liên kết PDF để trích xuất văn bản.');
  }

  const response = await fetch(book.pdfDownloadLink);
  if (!response.ok) {
    throw new Error('Không thể tải file PDF từ nguồn sách.');
  }

  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

async function loadPdf(book: Book) {
  const data = await fetchPdfBytes(book);
  const loadingTask = pdfjsLib.getDocument({ data });
  return loadingTask.promise;
}

function normalizeText(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

export const TextExtractionService = {
  async checkTextLayer(
    book: Book,
    onProgress?: (progress: ProgressInfo) => void
  ): Promise<TextLayerCheckResult> {
    const pdf = await loadPdf(book);
    const pages: ExtractedPage[] = [];

    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
      const page = await pdf.getPage(pageNo);
      const textContent = await page.getTextContent();
      const text = normalizeText(
        textContent.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ')
      );

      onProgress?.({ currentPage: pageNo, totalPages: pdf.numPages });

      if (text.length > 0) {
        pages.push({
          page: pageNo,
          text,
          confidence: 100,
          source: 'text-layer',
        });
      }
    }

    return {
      hasTextLayer: pages.length > 0,
      totalPages: pdf.numPages,
      pages,
    };
  },

  async extractWithOcr(
    book: Book,
    onProgress?: (progress: ProgressInfo) => void
  ): Promise<{ totalPages: number; pages: ExtractedPage[] }> {
    const pdf = await loadPdf(book);
    const worker = await createWorker('vie+eng');
    const pages: ExtractedPage[] = [];

    try {
      for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
        const page = await pdf.getPage(pageNo);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Không thể tạo canvas để xử lý OCR.');
        }

        await page.render({ canvasContext: context, viewport, canvas }).promise;
        const result = await worker.recognize(canvas);

        pages.push({
          page: pageNo,
          text: normalizeText(result.data.text || ''),
          confidence: Number(result.data.confidence.toFixed(2)),
          source: 'ocr',
        });

        onProgress?.({ currentPage: pageNo, totalPages: pdf.numPages });
      }
    } finally {
      await worker.terminate();
    }

    return {
      totalPages: pdf.numPages,
      pages,
    };
  },
};
