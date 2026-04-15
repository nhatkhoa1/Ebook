import React from 'react';
import { motion } from 'motion/react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Book } from '@/src/services/bookService';

type BookCardProps = {
  book: Book;
  index: number;
  onClick: () => void;
  isLast: boolean;
  onLoadMore: () => void;
};

export default function BookCard({ book, index, onClick, isLast, onLoadMore }: BookCardProps) {
  return (
    <motion.div
      ref={isLast ? (node) => { if (node) onLoadMore(); } : null}  // simple infinite trigger
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: (index % 20) * 0.05 }}
    >
      <Card 
        className="group h-full cursor-pointer overflow-hidden border-none bg-transparent shadow-none transition-all hover:translate-y-[-4px]"
        onClick={onClick}
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-lg shadow-md transition-shadow group-hover:shadow-xl">
          <img
            src={book.thumbnail}
            alt={book.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <CardHeader className="p-2 pt-3">
          <CardTitle className="line-clamp-2 font-serif text-sm font-bold leading-tight group-hover:text-primary transition-colors">
            {book.title}
          </CardTitle>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {book.authors.join(', ')}
          </p>
        </CardHeader>
      </Card>
    </motion.div>
  );
}