"use client"

// Конструктор нагрузок (ТЗ 4.1 шаг 2): приборы с часами работы,
// пусковые токи, авто-расчёт суточного потребления и пиковой мощности

import { useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Trash2, Plus, Zap, Clock, Gauge } from "lucide-react"
import { APPLIANCE_PRESETS } from "@/lib/calc/constants"
import type { Appliance, ObjectType } from "@/lib/calc/types"
import { cn } from "@/lib/utils"

export interface LoadSummary {
  dailyKwh: number
  peakKw: number
}

export function summarize(appliances: Appliance[], startK: number): LoadSummary {
  let daily = 0
  let totalPower = 0
  let startPower = 0
  let maxStartAppliance = 0
  for (const a of appliances) {
    daily += (a.powerW * a.hoursPerDay * a.qty) / 1000
    totalPower += a.powerW * a.qty
    if (a.startCurrent) {
      startPower += a.powerW * a.qty
      maxStartAppliance = Math.max(maxStartAppliance, a.powerW * a.qty)
    }
  }
  // Пик: одновременное включение базы (консервативно 70%) + пусковой бросок
  const concurrent = 0.7 * (totalPower - startPower) + startPower
  const peak = Math.max(concurrent, maxStartAppliance * startK)
  return { dailyKwh: Math.round(daily * 10) / 10, peakKw: Math.round((peak / 1000) * 10) / 10 }
}

export function LoadBuilder({
  objectType, appliances, onChange, startK,
}: {
  objectType: ObjectType
  appliances: Appliance[]
  onChange: (a: Appliance[]) => void
  startK: number
}) {
  const summary = useMemo(() => summarize(appliances, startK), [appliances, startK])

  const update = (idx: number, patch: Partial<Appliance>) => {
    onChange(appliances.map((a, i) => (i === idx ? { ...a, ...patch } : a)))
  }
  const remove = (idx: number) => onChange(appliances.filter((_, i) => i !== idx))
  const add = () => {
    onChange([...appliances, { id: `custom-${Date.now()}`, name: "Новый потребитель", powerW: 500, hoursPerDay: 2, startCurrent: false, qty: 1 }])
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card-premium flex items-center gap-3 p-4">
          <Clock className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Суточное потребление</p>
            <p className="text-lg font-semibold">{summary.dailyKwh} кВт·ч/сут</p>
          </div>
        </div>
        <div className="card-premium flex items-center gap-3 p-4">
          <Gauge className="h-5 w-5 text-stable" />
          <div>
            <p className="text-xs text-muted-foreground">Пиковая мощность (с пусковыми ×{startK})</p>
            <p className="text-lg font-semibold">{summary.peakKw} кВт</p>
          </div>
        </div>
      </div>

      <div className="scrollbox card-premium divide-y divide-border/60 p-0">
        {appliances.map((a, idx) => (
          <div key={a.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 max-md:grid-cols-1 max-md:gap-2">
            <div className="space-y-2">
              <Input
                value={a.name}
                onChange={(e) => update(idx, { name: e.target.value })}
                className="h-8 border-none bg-transparent px-0 text-sm font-medium focus-visible:ring-0"
                aria-label="Название прибора"
              />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">шт</span>
                <Input
                  type="number" min={1} max={99} value={a.qty}
                  onChange={(e) => update(idx, { qty: Math.max(1, Number(e.target.value) || 1) })}
                  className="h-8 w-16" aria-label="Количество"
                />
                <span className="text-xs text-muted-foreground">Вт</span>
                <Input
                  type="number" min={10} max={50000} step={10} value={a.powerW}
                  onChange={(e) => update(idx, { powerW: Math.max(10, Number(e.target.value) || 10) })}
                  className="h-8 w-24" aria-label="Мощность, Вт"
                />
                <span className="text-xs text-muted-foreground">ч/сут</span>
                <Input
                  type="number" min={0.1} max={24} step={0.1} value={a.hoursPerDay}
                  onChange={(e) => update(idx, { hoursPerDay: Math.min(24, Math.max(0.1, Number(e.target.value) || 1)) })}
                  className="h-8 w-16" aria-label="Часов в сутки"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 max-md:justify-between">
              <button
                type="button"
                onClick={() => update(idx, { startCurrent: !a.startCurrent })}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
                  a.startCurrent ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground",
                )}
                title="Пусковые токи: насосы, компрессоры, двигатели — множитель 3–7×"
              >
                <Zap className="h-3.5 w-3.5" />
                пусковые
              </button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => remove(idx)} aria-label="Удалить прибор">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={add}>
          <Plus className="mr-1.5 h-4 w-4" /> Добавить потребитель
        </Button>
        <Button
          variant="outline" size="sm"
          onClick={() => onChange(JSON.parse(JSON.stringify(APPLIANCE_PRESETS[objectType])) as Appliance[])}
        >
          Сбросить по пресету «{objectLabel(objectType)}»
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        «Пусковые» — приборы с пусковыми токами (насосы, компрессоры, станки). Пик считается консервативно:
        70% базы одновременно + самый тяжёлый пуск с коэффициентом {startK}×.
      </p>
    </div>
  )
}

export function objectLabel(t: ObjectType): string {
  const map: Record<ObjectType, string> = {
    dacha: "Дача", house: "Частный дом", snt: "СНТ-быт", warehouse: "Склад",
    farm: "Сельхоз", industry: "Производство", commercial: "Коммерческое здание",
  }
  return map[t]
}

export function loadAppliances(objectType: ObjectType): Appliance[] {
  return JSON.parse(JSON.stringify(APPLIANCE_PRESETS[objectType])) as Appliance[]
}
