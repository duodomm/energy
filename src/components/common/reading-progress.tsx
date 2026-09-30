"use client"

// R9: янтарная полоса прочтения под шапкой. Активна там, где на странице
// есть трек чтения (.reading-track): статьи блога и РАЗВЁРНУТАЯ статья
// главной (в свёрнутом виде полосу не показываем — читать ещё нечего).
// Прогресс = доля статьи, прошедшая над нижней границей вьюпорта.
// Трек ищется по данным маршрута (data-route сбрасывается при смене страницы),
// высота пересчитывается на каждый скролл — статья главной раскрывается
// плавно, и полоса едет синхронно с ростом контента.

import { useEffect, useState } from "react"

export function ReadingProgress({ routeKey }: { routeKey: string }) {
  const [progress, setProgress] = useState(0)
  const [hasTrack, setHasTrack] = useState(false)

  useEffect(() => {
    let raf = 0

    const measure = () => {
      const el = document.querySelector<HTMLElement>(".reading-track")
      setHasTrack(Boolean(el))
      if (!el) {
        setProgress(0)
        return
      }
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      // 0 — статья ниже вьюпорта; 1 — дочитана до конца
      const read = (vh - rect.top) / Math.max(rect.height, 1)
      setProgress(Math.min(1, Math.max(0, read)))
    }

    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        measure()
      })
    }

    // Дом может отставать от смены маршрута (анимация раскрытия, картинки)
    const settle = window.setTimeout(measure, 350)
    measure()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.clearTimeout(settle)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [routeKey])

  if (!hasTrack) return null

  return (
    <div
      aria-hidden="true"
      className="no-print pointer-events-none fixed left-0 right-0 top-16 z-40 h-[3px] bg-transparent"
    >
      <div
        className="h-full origin-left bg-gradient-solar transition-[width] duration-150 ease-out"
        style={{ width: `${Math.round(progress * 100)}%` }}
      />
    </div>
  )
}
