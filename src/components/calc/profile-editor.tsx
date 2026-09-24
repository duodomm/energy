"use client"

// Профиль нагрузки по часам (ТЗ 4.1 шаг 2): пресеты + ручная корректировка 24 значений

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { LOAD_PRESETS, isNightHour } from "@/lib/calc/constants"
import type { ObjectType } from "@/lib/calc/types"
import { cn } from "@/lib/utils"

const PRESET_LABELS: { key: string; label: string }[] = [
  { key: "dacha", label: "Дача" }, { key: "house", label: "Дом" },
  { key: "snt", label: "СНТ" }, { key: "warehouse", label: "Склад" },
  { key: "farm", label: "Ферма" }, { key: "industry", label: "Цех" },
  { key: "commercial", label: "Офис/торговля" },
]

export function ProfileEditor({
  profile, onChange, objectType,
}: {
  profile: number[]
  onChange: (p: number[]) => void
  objectType: ObjectType
}) {
  const [open, setOpen] = useState(false)
  const max = Math.max(...profile, 0.001)
  const nightHours = profile.reduce((s, v, h) => s + (isNightHour(h) ? v : 0), 0)
  const total = profile.reduce((a, b) => a + b, 0) || 1
  const nightShare = Math.round((nightHours / total) * 100)

  const bump = (h: number, delta: number) => {
    const next = [...profile]
    next[h] = Math.min(10, Math.max(0, Math.round((next[h] + delta) * 10) / 10))
    onChange(next)
  }

  return (
    <div className="card-premium overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div>
          <p className="text-sm font-medium">Профиль нагрузки по часам</p>
          <p className="text-xs text-muted-foreground">
            Пресет «{PRESET_LABELS.find((p) => p.key === objectType)?.label ?? "Дом"}» ·
            ночь {nightShare}% · нажмите для корректировки
          </p>
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="border-t border-border/60 p-4">
          <div className="mb-4 flex flex-wrap gap-1.5">
            {PRESET_LABELS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => onChange([...LOAD_PRESETS[p.key as ObjectType]])}
                className={cn(
                  "rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground",
                  p.key === objectType && "border-primary/40 bg-primary/10 text-primary",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-12 gap-1 max-sm:grid-cols-8" role="group" aria-label="Часы суток">
            {profile.map((v, h) => (
              <div key={h} className="flex flex-col items-center gap-0.5">
                <div
                  className={cn(
                    "flex h-3 w-full rounded-sm bg-secondary transition-colors",
                    isNightHour(h) && "ring-1 ring-inset ring-chart-2/40",
                  )}
                  style={{ opacity: 0.35 + 0.65 * (v / max) }}
                  title={`${h}:00 — вес ${v.toFixed(2)}`}
                />
                <button
                  type="button"
                  className="text-[10px] text-muted-foreground hover:text-foreground"
                  onClick={() => bump(h, 0.2)}
                  onContextMenu={(e) => { e.preventDefault(); bump(h, -0.2) }}
                  aria-label={`Час ${h}: увеличить (правый клик — уменьшить)`}
                >
                  {h}
                </button>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            ЛКМ по часу — увеличить вес, ПКМ — уменьшить. Голубая полоска — ночная зона 23:00–07:00
            (двухтарифный учёт). Профиль влияет на средневзвешенный тариф и ночную нагрузку АКБ.
          </p>
        </div>
      )}
    </div>
  )
}
