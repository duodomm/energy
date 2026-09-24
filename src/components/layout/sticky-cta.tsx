"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Timer, Phone } from "lucide-react"
import { navigate, useHashRoute } from "@/lib/router"
import { trackGoal } from "@/lib/analytics"

// Стикбар «Получить расчёт за 24 часа» — мобильный (ТЗ 6.1, 8.2: sticky CTA)
export function StickyCta() {
  const route = useHashRoute()
  const [dismissed, setDismissed] = useState(false)
  const [visible, setVisible] = useState(false)

  const current = `/${route.path.join("/")}`
  const onResult = current === "/kalkulyator" && route.hash.startsWith("calc=")

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 3500)
    return () => clearTimeout(t)
  }, [])

  if (dismissed || !visible) return null
  // Не показываем на странице результата — там нативный CTA (ТЗ 6.1)
  if (onResult) return null

  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2.5 backdrop-blur-xl md:hidden">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold leading-tight">
            <Timer className="h-4 w-4 text-primary" />
            Точная смета за 24 часа
          </p>
          <p className="truncate text-xs text-muted-foreground">инженер проверит расчёт и цены поставщиков</p>
        </div>
        <Button
          size="sm"
          className="bg-gradient-solar text-primary-foreground"
          onClick={() => {
            trackGoal("stickybar_click")
            navigate("#/kontakty?form=1&from=sticky")
          }}
        >
          Заявка
        </Button>
        <a
          href="tel:+74951234567"
          aria-label="Позвонить"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border"
          onClick={() => trackGoal("phone_click")}
        >
          <Phone className="h-4 w-4 text-stable" />
        </a>
        <button
          aria-label="Скрыть"
          className="shrink-0 text-muted-foreground"
          onClick={() => setDismissed(true)}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
