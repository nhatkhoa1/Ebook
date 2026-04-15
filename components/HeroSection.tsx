import React from 'react'
import { motion } from 'motion/react'

export default function HeroSection() {
  return (
    <section className="mb-12 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-6 flex justify-center"
      >
        <img
          src="https://rubee.com.vn/wp-content/uploads/2021/05/logo-doan-4.png"
          alt="Logo Đoàn"
          className="h-24 w-24 object-contain"
          referrerPolicy="no-referrer"
        />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-serif text-4xl font-bold tracking-tight md:text-6xl mb-4 text-primary"
      >
        Không gian đọc sách
        <br /> thanh niên
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mx-auto max-w-2xl text-muted-foreground md:text-lg"
      >
        Nơi hội tụ tri thức và khát vọng của tuổi trẻ Đoàn Phường Phú Xuân. Cùng
        nhau đọc sách, cùng nhau trưởng thành.
      </motion.p>
    </section>
  )
}
