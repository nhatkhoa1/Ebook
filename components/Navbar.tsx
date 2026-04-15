import React from 'react';
import { Search, Menu, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

type NavbarProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

export default function Navbar({ searchQuery, setSearchQuery }: NavbarProps) {
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-primary/20 bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground shadow-sm backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
          <img 
            src="https://rubee.com.vn/wp-content/uploads/2021/05/logo-doan-4.png" 
            alt="Logo Đoàn" 
            className="h-10 w-10 object-contain"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col leading-none">
            <span className="font-serif text-lg font-bold tracking-tight uppercase">Không gian đọc sách thanh niên</span>
            <span className="text-[10px] font-bold text-primary-foreground/80 uppercase tracking-wider">Đoàn Phường Phú Xuân</span>
          </div>
        </div>

        <form onSubmit={handleSearch} className="hidden max-w-md flex-1 px-4 md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-foreground/60" />
            <Input
              type="search"
              placeholder="Tìm kiếm sách, tài liệu thanh niên..."
              className="w-full border-none bg-white/90 pl-10 text-foreground focus-visible:ring-1 focus-visible:ring-white/80"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" title="Chuyển ngôn ngữ" className="text-primary-foreground hover:bg-white/15 hover:text-white">
            <Languages className="h-5 w-5" />
          </Button>

          <Sheet>
            <SheetTrigger>
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/15 hover:text-white md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle className="font-serif">Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-4">
                <form onSubmit={handleSearch} className="flex flex-col gap-2">
                  <Input
                    placeholder="Tìm kiếm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button type="submit">Tìm kiếm</Button>
                </form>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}