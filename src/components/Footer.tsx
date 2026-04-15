import React from 'react'

export default function Footer() {
  return (
    <footer className="border-t py-12 bg-secondary/20">
      <div className="container mx-auto px-4 text-center">
        <div className="flex flex-col items-center justify-center gap-4 mb-6">
          <img
            src="https://rubee.com.vn/wp-content/uploads/2021/05/logo-doan-4.png"
            alt="Logo Đoàn"
            className="h-16 w-16 object-contain"
            referrerPolicy="no-referrer"
          />
          <div className="text-center">
            <span className="font-serif text-xl font-bold text-primary block uppercase">
              Không gian đọc sách thanh niên
            </span>
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Đoàn Phường Phú Xuân
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Đoàn Phường Phú Xuân. Thành Phố Huế.
        </p>
      </div>
    </footer>
  )
}
