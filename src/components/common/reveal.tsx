"use client"

// R9: «Reveal» — мягкое появление блоков при входе во вьюпорт (один раз).
// Используется для ниже-скрольных секций: сетки преимуществ, кейсов,
// материалов разделов. Движение — только лёгкий сдвиг вверх + фейд,
// согласован с общей анимацией страниц (0,5 с, easeOut).
// MotionConfig reducedMotion="user" (AppShell) отключит движение при
// системной настройке «уменьшить анимацию» — останется только фейд.

import { motion } from "framer-motion"
import type { ReactNode } from "react"

export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
}: {
  children: ReactNode
  className?: string
  delay?: number
  as?: "div" | "section" | "figure"
}) {
  const Comp = motion[as]
  return (
    <Comp
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </Comp>
  )
}
