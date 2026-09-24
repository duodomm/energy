"use client"

// Справочник регионов (ТЗ 3.1: /regiony — PSH, тарифы, климат,
// снеговой/ветровой район СП 20.13330, особенности монтажа)

import { useEffect, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { MountainSnow, Wind, Sun, Zap, Fuel, Search, TrendingUp } from "lucide-react"
import { PageHero } from "@/components/common/page-hero"
import { AdSlot } from "@/components/common/ad-slot"
import { PshHeatmap } from "@/components/common/psh-heatmap"
import { loadRefBundle } from "@/lib/calc/ref-bundle"
import type { RefBundle, RefRegion } from "@/lib/calc/types"
import { navigate } from "@/lib/router"

const OKRUGS = ["Все", "ЦФО", "СЗФО", "ЮФО", "СКФО", "ПФО", "УФО", "СФО", "ДФО"]

export function RegionsPage() {
  const [bundle, setBundle] = useState<RefBundle | null>(null)
  const [query, setQuery] = useState("")
  const [okrug, setOkrug] = useState("Все")
  const [sort, setSort] = useState<"psh" | "tariff" | "name">("psh")

  useEffect(() => {
    loadRefBundle().then(setBundle).catch(() => undefined)
  }, [])

  const regions = useMemo(() => {
    const list = (bundle?.regions ?? [])
      .filter((r) => (okrug === "Все" || r.federalOkrug === okrug) && r.name.toLowerCase().includes(query.toLowerCase()))
    const pshAvg = (r: RefRegion) => r.psh.reduce((a, b) => a + b, 0) / 12
    return [...list].sort((a, b) =>
      sort === "psh" ? pshAvg(b) - pshAvg(a) : sort === "tariff" ? b.tariffFlat - a.tariffFlat : a.name.localeCompare(b.name, "ru"),
    )
  }, [bundle, query, okrug, sort])

  return (
    <div>
      <PageHero
        eyebrow="Справочник регионов"
        title="PSH, тарифы и нагрузки по субъектам РФ"
        description="Пик-солнце-часы по месяцам (NASA POWER + атласы, пересмотр раз в квартал), тарифы с зонами день/ночь, снеговые и ветровые районы СП 20.13330, цены топлива. Данные подставляются в калькулятор автоматически."
      />
      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        {/* Управление */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск региона…"
              className="h-11 pl-9"
              aria-label="Поиск региона"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {OKRUGS.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setOkrug(o)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                  okrug === o ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {o}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {([["psh", "По солнцу"], ["tariff", "По тарифу"], ["name", "По алфавиту"]] as const).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setSort(k)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                  sort === k ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {!bundle ? (
          <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : (
          <div className="space-y-3">
            {regions.map((r) => {
              const pshAvg = (r.psh.reduce((a, b) => a + b, 0) / 12).toFixed(1)
              const pshMin = Math.min(...r.psh).toFixed(1)
              const pshMax = Math.max(...r.psh).toFixed(1)
              return (
                <div key={r.code} className="card-premium card-premium-hover p-4 md:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-56 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold">{r.name}</h3>
                        <Badge variant="secondary" className="text-[10px]">{r.federalOkrug}</Badge>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{r.climateNote}</p>
                      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MountainSnow className="h-3.5 w-3.5 text-chart-5" /> снег {r.snowRegion}</span>
                        <span className="flex items-center gap-1"><Wind className="h-3.5 w-3.5 text-chart-4" /> ветер {r.windRegion}</span>
                        <span className="flex items-center gap-1"><Fuel className="h-3.5 w-3.5" /> ДТ {r.dieselPrice} ₽/л · газ {r.gasPrice} ₽/м³</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm md:min-w-64">
                      <div className="rounded-xl bg-secondary/40 p-3">
                        <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><Sun className="h-3 w-3" /> PSH</p>
                        <p className="mt-0.5 font-semibold tabular-nums">{pshAvg} <span className="text-xs font-normal text-muted-foreground">ч/сут сред.</span></p>
                        <p className="text-[11px] text-muted-foreground">{pshMin} … {pshMax} (дек–июнь)</p>
                      </div>
                      <div className="rounded-xl bg-secondary/40 p-3">
                        <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><Zap className="h-3 w-3" /> Тариф</p>
                        <p className="mt-0.5 font-semibold tabular-nums">{r.tariffFlat} ₽</p>
                        <p className="text-[11px] text-muted-foreground">д {r.tariffDay} / н {r.tariffNight}</p>
                      </div>
                      <div className="rounded-xl bg-secondary/40 p-3">
                        <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><TrendingUp className="h-3 w-3" /> 1 кВт панелей</p>
                        <p className="mt-0.5 font-semibold tabular-nums">{Math.round((r.psh.reduce((a, b) => a + b, 0)) * 0.78 * 365)}</p>
                        <p className="text-[11px] text-muted-foreground">кВт·ч/год</p>
                      </div>
                    </div>
                  </div>

                  {/* №6: сезонность PSH — heatmap по месяцам на общей шкале */}
                  <div className="mt-3 border-t border-border/60 pt-3">
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">PSH по месяцам, ч/сут</p>
                    <PshHeatmap psh={r.psh} />
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("#/kalkulyator")}
                    className="mt-3 text-sm font-medium text-primary hover:underline"
                  >
                    Рассчитать станцию для этого региона →
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          Снеговые/ветровые районы — по картам СП 20.13330.2016 (ориентировочно по субъекту;
          точный район определяется по адресу объекта). Тарифы — население, городские условия;
          сельские и юрлица отличаются. PSH — среднемесячные значения для оптимального наклона.
        </p>
        <div className="mt-8"><AdSlot variant="rect" /></div>
      </div>
    </div>
  )
}
