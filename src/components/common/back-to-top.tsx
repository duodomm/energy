"use client"

// R9: плавающая кнопка «наверх». Появляется после 700px прокрутки,
// скрывается ближе к шапке. Плавный подъём (smooth), не instant.
// Мобайл: поднята над стикбаром CTA (bottom-24), десктоп — в углу.
// rAF-троттлинг: слушатель passive, состояние меняется не чаще кадра.

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowUp } from "lucide-react"

export function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        setVisible(window.scrollY > 700)
      })
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          aria-label="Наверх"
          title="Наверх"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="no-print fixed bottom-24 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-[0_10px_24px_-12px_rgba(34,39,46,0.4)] backdrop-blur-md transition-colors hover:border-primary/40 hover:text-primary active:scale-95 md:bottom-6 md:right-6"
        >
          <ArrowUp className="h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
