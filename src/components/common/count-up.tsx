"use client"

// Плакатные цифры (концепт №8 «Швейцарский плакат», сочетание С10):
// count-up при появлении в viewport; rAF-бюджет; prefers-reduced-motion —
// без анимации (мгновенное значение). Мгновенный SSR-кадр = 0 сдвигов CLS.

import { useEffect, useRef, useState } from "react"

export function CountUp({
  to,
  duration = 1100,
  suffix = "",
  prefix = "",
  decimals = 0,
  className,
}: {
  to: number
  duration?: number
  suffix?: string
  prefix?: string
  /** знаков после запятой (12,5 → decimals: 1); локаль ru-RU — запятая */
  decimals?: number
  className?: string
}) {
  const [value, setValue] = useState(to)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const run = () => {
      if (started.current) return
      started.current = true
      const t0 = performance.now()
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration)
        const eased = 1 - Math.pow(1 - p, 3)
        setValue(to * eased)
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          run()
          io.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [to, duration])

  const rounded = value.toFixed(decimals)
  return (
    <span ref={ref} className={className}>
      {prefix}
      {Number(rounded).toLocaleString("ru-RU", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  )
}
