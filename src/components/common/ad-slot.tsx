"use client"

// Рекламный контейнер РСЯ фиксированной высоты (ТЗ 8.2, 9.1):
// до загрузки объявлений зарезервированное место — CLS ≤ 0.1.
// В продакшене: <div id="yandex_rtb_R-A-XXXXXX"> + script РСЯ.

import { cn } from "@/lib/utils"

export function AdSlot({ variant = "rect", label = "Реклама" }: { variant?: "rect" | "square" | "banner"; label?: string }) {
  return (
    <div
      className={cn("ad-container no-print flex items-center justify-center", variant === "square" && "ad-container--square", variant === "banner" && "ad-container--banner")}
      role="complementary"
      aria-label="Рекламный блок"
    >
      <div className="flex flex-col items-center gap-1.5 text-center">
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/60">{label}</span>
        <span className="text-xs text-muted-foreground/50">
          {variant === "banner" ? "728×90" : variant === "square" ? "336×280" : "300×250"} · контейнер РСЯ, место зарезервировано
        </span>
      </div>
    </div>
  )
}
