import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Loader2, Languages, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Book } from '@/src/services/bookService';
import { TranslationService } from '@/src/services/translationService';
import { ExtractedPage, TextExtractionService } from '@/src/services/textExtractionService';

type BookModalProps = {
  book: Book | null;
  onClose: () => void;
};

type Language = 'vi' | 'en';
type ExtractionStatus = 'idle' | 'checking' | 'checked' | 'ocring' | 'done' | 'error';

export default function BookModal({ book, onClose }: BookModalProps) {
  const [isReading, setIsReading] = useState(false);
  const [language, setLanguage] = useState<Language>('vi');
  const [translatedDescription, setTranslatedDescription] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<ExtractionStatus>('idle');
  const [hasTextLayer, setHasTextLayer] = useState<boolean | null>(null);
  const [extractedPages, setExtractedPages] = useState<ExtractedPage[]>([]);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ currentPage: 0, totalPages: 0 });

  useEffect(() => {
    if (!book) return;
    setExtractionStatus('idle');
    setHasTextLayer(null);
    setExtractedPages([]);
    setExtractionError(null);
    setProgress({ currentPage: 0, totalPages: 0 });
  }, [book?.id]);

  const toggleLanguage = async () => {
    const newLang = language === 'vi' ? 'en' : 'vi';
    setLanguage(newLang);
    
    setIsTranslating(true);
    const translated = await TranslationService.translate(book.description, newLang);
    setTranslatedDescription(translated);
    setIsTranslating(false);
  };

  const handleCheckTextLayer = async () => {
    if (!book) return;
    try {
      setExtractionStatus('checking');
      setExtractionError(null);
      setExtractedPages([]);
      setProgress({ currentPage: 0, totalPages: 0 });

      const result = await TextExtractionService.checkTextLayer(book, (nextProgress) => {
        setProgress(nextProgress);
      });

      setHasTextLayer(result.hasTextLayer);
      setExtractedPages(result.pages);
      setExtractionStatus('checked');
    } catch (error) {
      setExtractionStatus('error');
      setExtractionError(error instanceof Error ? error.message : 'Không thể kiểm tra text layer.');
    }
  };

  const handleRunOcr = async () => {
    if (!book) return;
    try {
      setExtractionStatus('ocring');
      setExtractionError(null);
      setProgress({ currentPage: 0, totalPages: 0 });

      const result = await TextExtractionService.extractWithOcr(book, (nextProgress) => {
        setProgress(nextProgress);
      });

      setHasTextLayer(false);
      setExtractedPages(result.pages);
      setExtractionStatus('done');
    } catch (error) {
      setExtractionStatus('error');
      setExtractionError(error instanceof Error ? error.message : 'Không thể OCR văn bản.');
    }
  };

  if (!book) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={`relative z-10 grid w-full overflow-hidden rounded-2xl bg-card shadow-2xl transition-all duration-300 ${
            isReading ? 'max-w-6xl h-[90vh]' : 'max-w-4xl h-[85vh] max-h-[800px] md:grid-cols-[300px_1fr]'
          }`}
        >
          {!isReading && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 z-20 rounded-full bg-background/50 backdrop-blur-md"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          {isReading ? (
            <div className="relative h-full bg-muted/30">
              <Button
                variant="secondary"
                size="sm"
                className="absolute left-4 top-4 z-20 shadow-md"
                onClick={() => setIsReading(false)}
              >
                ← Quay lại
              </Button>
              <iframe
                src={`https://books.google.com/books?id=${book.id}&lpg=PP1&pg=PP1&output=embed`}
                className="h-full w-full border-none"
                title={book.title}
                allowFullScreen
              />
            </div>
          ) : (
            <>
              <div className="relative hidden bg-secondary/30 md:block">
                <img
                  src={book.thumbnail}
                  alt={book.title}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              </div>

              <div className="flex flex-col p-6 md:p-8 h-full overflow-hidden">
                <div className="flex-1 min-h-0">
                  <ScrollArea className="h-full pr-4">
                    <div className="space-y-4 pb-4">
                      <div className="flex flex-wrap gap-2">
                        {book.categories.map((cat) => (
                          <Badge key={cat} variant="secondary" className="font-normal">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                      <h2 className="font-serif text-2xl font-bold leading-tight md:text-3xl">
                        {book.title}
                      </h2>
                      <p className="text-base text-muted-foreground">
                        Bởi <span className="font-medium text-foreground">{book.authors.join(', ')}</span>
                      </p>
                      
                      <div className="flex items-center gap-4 border-y py-4">
                        <div className="text-center">
                          <p className="text-xs uppercase tracking-widest text-muted-foreground">Năm xuất bản</p>
                          <p className="font-medium">{book.publishedDate}</p>
                        </div>
                        <div className="h-8 w-px bg-border" />
                        <div className="text-center">
                          <p className="text-xs uppercase tracking-widest text-muted-foreground">Ngôn ngữ</p>
                          <p className="font-medium uppercase">{book.language}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-serif text-xl font-bold">Mô tả</h3>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={toggleLanguage}
                            disabled={isTranslating}
                            className="gap-2"
                          >
                            {isTranslating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                            {language === 'vi' ? 'Dịch sang EN' : 'Dịch sang VI'}
                          </Button>
                        </div>
                        <div className="text-foreground leading-relaxed bg-secondary/20 p-4 rounded-xl border border-border/50">
                          {isTranslating ? (
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-2/3" />
                            </div>
                          ) : (
                            <p className="text-sm md:text-base">
                              {translatedDescription || book.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3 rounded-xl border border-border/50 bg-background/60 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-serif text-xl font-bold">Trích xuất văn bản</h3>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCheckTextLayer}
                              disabled={extractionStatus === 'checking' || extractionStatus === 'ocring' || !book.pdfDownloadLink}
                            >
                              {extractionStatus === 'checking' ? (
                                <><Loader2 className="h-3 w-3 animate-spin" /> Đang kiểm tra...</>
                              ) : (
                                'Kiểm tra text layer'
                              )}
                            </Button>
                            {hasTextLayer === false && (
                              <Button
                                size="sm"
                                onClick={handleRunOcr}
                                disabled={extractionStatus === 'checking' || extractionStatus === 'ocring'}
                              >
                                {extractionStatus === 'ocring' ? (
                                  <><Loader2 className="h-3 w-3 animate-spin" /> Đang OCR...</>
                                ) : (
                                  'Trích xuất văn bản (OCR)'
                                )}
                              </Button>
                            )}
                          </div>
                        </div>

                        {!book.pdfDownloadLink && (
                          <p className="text-sm text-muted-foreground">
                            Sách này không có file PDF tải về, nên chưa thể kiểm tra text layer/OCR theo từng trang.
                          </p>
                        )}

                        {(extractionStatus === 'checking' || extractionStatus === 'ocring') && progress.totalPages > 0 && (
                          <p className="text-sm text-muted-foreground">
                            Đang xử lý trang {progress.currentPage}/{progress.totalPages}
                          </p>
                        )}

                        {hasTextLayer === true && (
                          <p className="text-sm text-emerald-600">
                            Phát hiện text layer. Đã trả về văn bản theo từng trang với độ tin cậy 100%.
                          </p>
                        )}

                        {hasTextLayer === false && extractionStatus === 'checked' && (
                          <p className="text-sm text-amber-600">
                            Không có text layer. Bạn có thể dùng OCR để trích xuất văn bản theo từng trang.
                          </p>
                        )}

                        {extractionError && (
                          <p className="text-sm text-destructive">{extractionError}</p>
                        )}

                        {extractedPages.length > 0 && (
                          <div className="max-h-72 space-y-3 overflow-y-auto rounded-md border border-border/60 bg-card p-3">
                            {extractedPages.map((page) => (
                              <div key={page.page} className="space-y-2 rounded-md border border-border/60 p-3">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-semibold">Trang {page.page}</span>
                                  <span className="text-muted-foreground">
                                    {page.source === 'text-layer' ? 'Text layer' : 'OCR'} • Tin cậy: {page.confidence.toFixed(2)}%
                                  </span>
                                </div>
                                <p className="text-sm leading-relaxed">
                                  {page.text || '(Trang này không nhận diện được nội dung)'}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                </div>

                <div className="mt-6 flex gap-4 pt-4 border-t bg-card shrink-0">
                  <Button className="flex-1 gap-2" onClick={() => setIsReading(true)}>
                    Đọc thử <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    Đóng
                  </Button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}