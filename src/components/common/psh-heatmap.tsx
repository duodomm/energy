"use client"

// Мини-heatmap PSH по месяцам (концепт №6, волна 2): 12 столбиков-«часов
// солнца» на одной шкале для всех регионов — читается сезонность и
// сравнимость субъектов. Данные — тот же справочник, что в расчёте.

import { MONTH_LABELS } from "@/lib/calc/constants"
import { cn } from "@/lib/utils"

const SCALE_MAX = 6.5 // максимум шкалы PSH — общий для всех регионов

export function PshHeatmap({ psh, className }: { psh: number[]; className?: string }) {
  return (
    <div className={cn("flex items-end gap-[3px]", className)} role="img" aria-label="PSH по месяцам, часов солнца в сутки">
      {psh.map((v, i) => {
        const k = Math.min(1, Math.max(0, v / SCALE_MAX))
        return (
          <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1" title={`${MONTH_LABELS[i]}: ${v.toFixed(1).replace(".", ",")} ч/сут`}>
            <div
              className="w-full rounded-[3px]"
              style={{
                height: `${(6 + k * 34).toFixed(0)}px`,
                background: `rgba(232,148,10,${(0.12 + 0.85 * k).toFixed(2)})`,
              }}
            />
            <span className="text-[9px] leading-none text-muted-foreground">{MONTH_LABELS[i][0]}</span>
          </div>
        )
      })}
    </div>
  )
}
