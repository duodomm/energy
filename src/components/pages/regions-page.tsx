"use client"

// Справочник регионов (ТЗ 3.1: /regiony) — интерактивная карта РФ вместо
// «стены регионов»: маркеры 32 субъектов (цвет = PSH), зум по федеральным
// округам, карточка выбранного региона (PSH-heatmap, дуги солнца, тарифы),
// компактный список-указатель. SEO-текст всех регионов остаётся в списке.

import { useEffect, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { MountainSnow, Wind, Sun, Zap, Fuel, Search, TrendingUp, MapPin, MousePointerClick } from "lucide-react"
import { PageHero } from "@/components/common/page-hero"
import { AdSlot } from "@/components/common/ad-slot"
import { PshHeatmap } from "@/components/common/psh-heatmap"
import { SunPathMini } from "@/components/common/sun-path-mini"
import { RfMap, RfMapLegend } from "@/components/common/rf-map"
import { loadRefBundle } from "@/lib/calc/ref-bundle"
import type { RefBundle, RefRegion } from "@/lib/calc/types"
import { navigate } from "@/lib/router"

const OKRUGS = ["Все", "ЦФО", "СЗФО", "ЮФО", "СКФО", "ПФО", "УФО", "СФО", "ДФО"]

export function RegionsPage() {
  const [bundle, setBundle] = useState<RefBundle | null>(null)
  const [query, setQuery] = useState("")
  const [okrug, setOkrug] = useState("Все")
  const [sort, setSort] = useState<"psh" | "tariff" | "name">("psh")
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    loadRefBundle().then(setBundle).catch(() => undefined)
  }, [])

  const all = bundle?.regions ?? []

  const pshAvg = (r: RefRegion) => r.psh.reduce((a, b) => a + b, 0) / 12

  const regions = useMemo(() => {
    const list = all.filter(
      (r) => (okrug === "Все" || r.federalOkrug === okrug) && r.name.toLowerCase().includes(query.toLowerCase()),
    )
    return [...list].sort((a, b) =>
      sort === "psh" ? pshAvg(b) - pshAvg(a) : sort === "tariff" ? b.tariffFlat - a.tariffFlat : a.name.localeCompare(b.name, "ru"),
    )
  }, [all, query, okrug, sort, pshAvg])

  const selectedRegion = selected ? all.find((r) => r.code === selected) ?? null : null

  const topSun = useMemo(() => [...all].sort((a, b) => pshAvg(b) - pshAvg(a)).slice(0, 3), [all])

  return (
    <div>
      <PageHero
        eyebrow="Справочник регионов"
        title="Карта солнечного ресурса России"
        description="32 региона на интерактивной карте: маркеры показывают пик-солнце-часы цветом, клик раскрывает сезонность (PSH-heatmap, дуги солнца), тарифы и нагрузки СП 20.13330. Данные подставляются в калькулятор автоматически."
      />
      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        {/* ===== Карта ===== */}
        {!bundle ? (
          <Skeleton className="h-80 rounded-2xl" />
        ) : (
          <div className="card-premium overflow-hidden p-3 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <MapPin className="h-4 w-4 text-primary" /> Карта регионов справочника
              </p>
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <MousePointerClick className="h-3.5 w-3.5" /> клик по маркеру — карточка региона
              </span>
            </div>
            <div className="blueprint-grid relative rounded-2xl border border-border bg-secondary/30 p-2">
              <RfMap
                regions={all}
                selectedCode={selected}
                onSelect={(code) => setSelected(code === selected ? null : code)}
                okrug={okrug}
              />
            </div>
            <div className="mt-3 px-1">
              <RfMapLegend />
            </div>
          </div>
        )}

        {/* ===== Управление (округ теперь зумит карту) ===== */}
        <div className="mt-5 mb-5 flex flex-wrap items-center gap-3">
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

        {/* ===== Деталь региона + указатель-список ===== */}
        {!bundle ? (
          <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : (
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
            {/* Карточка региона (деталь) */}
            <div className="lg:sticky lg:top-20">
              {selectedRegion ? (
                <RegionCard r={selectedRegion} pshAvg={pshAvg(selectedRegion)} />
              ) : (
                <div className="card-premium p-5">
                  <p className="text-sm font-semibold">Выберите регион на карте</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Карточка региона покажет сезонность выработки (PSH по месяцам), дуги
                    солнца по широте, тарифы с зонами день/ночь и снеговой/ветровой
                    район СП 20.13330 — то, что уходит в калькулятор.
                  </p>
                  <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Самые солнечные в справочнике
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {topSun.map((r) => (
                      <button
                        key={r.code}
                        type="button"
                        onClick={() => setSelected(r.code)}
                        className="chip px-3 py-1.5 text-xs"
                      >
                        {r.name.split(" ")[0]} · {pshAvg(r).toFixed(1)} ч
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Компактный указатель (вместо стены карточек) */}
            <div className="min-w-0">
              <p className="mb-2.5 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {okrug === "Все" ? "Все регионы" : `Округ ${okrug}`} · {regions.length}
                {query && ` · поиск «${query}»`}
              </p>
              {regions.length === 0 ? (
                <div className="rounded-xl border border-border bg-secondary/40 p-5 text-sm text-muted-foreground">
                  Ничего не найдено — измените запрос или выберите другой округ.
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {regions.map((r) => (
                    <RegionRow key={r.code} r={r} pshAvg={pshAvg(r)} selected={selected === r.code} onSelect={() => setSelected(r.code)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          Снеговые/ветровые районы — по картам СП 20.13330.2016 (ориентировочно по субъекту;
          точный район определяется по адресу объекта). Тарифы — население, городские условия;
          сельские и юрлица отличаются. PSH — среднемесячные значения для оптимального наклона.
          Геометрия карты схематична: для расчётов используется PSH, широта и районы нагрузок.
        </p>
        <div className="mt-8"><AdSlot variant="rect" /></div>
      </div>
    </div>
  )
}

// ===== Карточка региона (контент прежней стены — теперь по запросу) =====

function RegionCard({ r, pshAvg: avg }: { r: RefRegion; pshAvg: number }) {
  return (
    <div className="card-premium card-premium-hover p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold">{r.name}</h3>
        <Badge variant="secondary" className="text-[10px]">{r.federalOkrug}</Badge>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{r.climateNote}</p>

      <div className="mt-3 grid grid-cols-2 gap-2.5 text-sm">
        <div className="rounded-xl bg-secondary/40 p-3">
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><Sun className="h-3 w-3" /> PSH</p>
          <p className="mt-0.5 font-semibold tabular-nums">{avg.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">ч/сут сред.</span></p>
          <p className="text-[11px] text-muted-foreground">{Math.min(...r.psh).toFixed(1)} … {Math.max(...r.psh).toFixed(1)}</p>
        </div>
        <div className="rounded-xl bg-secondary/40 p-3">
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><Zap className="h-3 w-3" /> Тариф</p>
          <p className="mt-0.5 font-semibold tabular-nums">{r.tariffFlat} ₽</p>
          <p className="text-[11px] text-muted-foreground">д {r.tariffDay} / н {r.tariffNight}</p>
        </div>
        <div className="rounded-xl bg-secondary/40 p-3">
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><TrendingUp className="h-3 w-3" /> 1 кВт панелей</p>
          <p className="mt-0.5 font-semibold tabular-nums">{Math.round(r.psh.reduce((a, b) => a + b, 0) * 0.78 * 365)}</p>
          <p className="text-[11px] text-muted-foreground">кВт·ч/год</p>
        </div>
        <div className="rounded-xl bg-secondary/40 p-3">
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><MountainSnow className="h-3 w-3" /> Нагрузки</p>
          <p className="mt-0.5 font-semibold tabular-nums">снег {r.snowRegion} · ветер {r.windRegion}</p>
          <p className="text-[11px] text-muted-foreground">СП 20.13330</p>
        </div>
      </div>

      <p className="mt-2.5 flex items-center gap-1 text-xs text-muted-foreground">
        <Fuel className="h-3.5 w-3.5" /> ДТ {r.dieselPrice} ₽/л · газ {r.gasPrice} ₽/м³ · <Wind className="h-3.5 w-3.5" /> ветер {r.windRegion}
      </p>

      <div className="mt-3 border-t border-border/60 pt-3">
        <div className="grid gap-5">
          <div className="min-w-0">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">PSH по месяцам, ч/сут</p>
            <PshHeatmap psh={r.psh} />
          </div>
          <SunPathMini region={r} />
        </div>
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
}

// ===== Компактная строка-указатель =====

function RegionRow({ r, pshAvg: avg, selected, onSelect }: { r: RefRegion; pshAvg: number; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full rounded-xl border p-3 text-left transition-colors ${
        selected ? "border-primary/50 bg-primary/8" : "border-border bg-card hover:border-primary/35 hover:bg-secondary/40"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-sm font-medium">{r.name}</span>
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
          {avg.toFixed(1)} ч · {r.tariffFlat} ₽
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
        <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">{r.federalOkrug}</Badge>
        <span>снег {r.snowRegion} · ветер {r.windRegion} · д {r.tariffDay}/н {r.tariffNight}</span>
      </div>
    </button>
  )
}
