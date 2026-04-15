import React, { useState } from 'react'
import Navbar from './Navbar'
import HeroSection from './HeroSection'
import BookCard from './BookCard'
import BookModal from './BookModal'
import Footer from './Footer'
import { Button } from '@/components/ui/button'
import { useBooks } from '@/hooks/useBooks'
import { Book } from '@/services/bookService'

export default function BookLibrary() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)

  const {
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
  } = useBooks()

  const openBookDetails = (book: Book) => {
    setSelectedBook(book)
  }

  const closeModal = () => {
    setSelectedBook(null)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <main className="container mx-auto px-4 py-8">
        {!searchQuery && <HeroSection />}
        <div className="mb-5 flex justify-end">
          <Button
            variant={freeOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFreeOnly((prev) => !prev)}
          >
            {freeOnly ? 'Miễn Phí' : 'Trả Phí'}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {loading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[2/3] bg-muted rounded-lg animate-pulse" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))
          ) : books.length > 0 ? (
            books.map((book, index) => (
              <BookCard
                key={`${book.id}-${index}`}
                book={book}
                index={index}
                onClick={() => openBookDetails(book)}
                isLast={index === books.length - 1}
                onLoadMore={loadMore}
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-muted-foreground">
              <p>
                {error || 'Không tìm thấy sách nào. Thử từ khóa khác xem sao!'}
              </p>
              <button
                type="button"
                onClick={retry}
                className="mt-4 inline-flex rounded-md border border-primary/30 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
              >
                Thử lại
              </button>
            </div>
          )}
        </div>

        {loadingMore && (
          <div className="mt-8 flex justify-center">
            <div className="h-8 w-8 animate-spin border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}
      </main>

      <Footer />

      <BookModal book={selectedBook} onClose={closeModal} />
    </div>
  )
}
