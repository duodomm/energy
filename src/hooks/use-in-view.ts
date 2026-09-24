"use client"

// Хук видимости элемента (IntersectionObserver): управляет паузой анимаций
// вне вьюпорта — бюджет CWV (INP/CPU) концептов №2/№4/№6.
// setState только из асинхронных колбэков (rAF/observer) — без каскадных
// синхронных рендеров (react-hooks/set-state-in-effect).

import { useEffect, useState } from "react"

export function useInView<T extends Element>(
  ref: React.RefObject<T | null>,
  threshold = 0.1,
): boolean {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") {
      // Среда без IO (или элемент не смонтирован) — считаем видимым
      const raf = requestAnimationFrame(() => setInView(true))
      return () => cancelAnimationFrame(raf)
    }
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => setInView(e.isIntersecting)),
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [ref, threshold])

  return inView
}

/** prefers-reduced-motion (SSR-безопасно: читается в эффекте) */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const raf = requestAnimationFrame(() => setReduced(mq.matches))
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener("change", onChange)
    return () => {
      cancelAnimationFrame(raf)
      mq.removeEventListener("change", onChange)
    }
  }, [])

  return reduced
}
