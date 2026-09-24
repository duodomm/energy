"use client"

// Мини-калькулятор LCOE (ТЗ 3.1: /kalkulyator-lcoe — SEO-трафиковый)

import { useMemo, useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Zap, Info, TrendingUp } from "lucide-react"
import { PageHero } from "@/components/common/page-hero"
import { AdSlot } from "@/components/common/ad-slot"
import { navigate } from "@/lib/router"
import { trackGoal } from "@/lib/analytics"
import { useEffect } from "react"

function calcLcoe(capex: number, genKwh: number, opexRate: number, discount: number, years: number) {
  // LCOE = Σ дисконт. затрат / Σ дисконт. генерации (замена инвертора на 13-й год ~ 25% CAPEX)
  let costs = capex
  let energy = 0
  const opex = capex * opexRate
  for (let y = 1; y <= years; y++) {
    const d = Math.pow(1 + discount, y)
    costs += opex / d
    if (y === 13) costs += capex * 0.25 / d
    energy += genKwh * Math.pow(0.996, y - 1) / d
  }
  return costs / Math.max(1, energy)
}

export function LcoePage() {
  const [capex, setCapex] = useState(1_600_000)
  const [gen, setGen] = useState(10_000)
  const [opexPct, setOpexPct] = useState(0.75)
  const [discount, setDiscount] = useState(10)
  const [years, setYears] = useState(25)

  useEffect(() => { trackGoal("lcoe_calc_start") }, [])

  const lcoe = useMemo(() => calcLcoe(capex, gen, opexPct / 100, discount / 100, years), [capex, gen, opexPct, discount, years])
  const nominal = useMemo(() => {
    let costs = capex * (1 + opexPct / 100 * years) + capex * 0.25
    let energy = 0
    for (let y = 1; y <= years; y++) energy += gen * Math.pow(0.996, y - 1)
    return costs / Math.max(1, energy)
  }, [capex, gen, opexPct, years])

  return (
    <div>
      <PageHero
        eyebrow="SEO-калькулятор"
        title="Сколько стоит ваш кВт·ч? Считаем LCOE"
        description="LCOE — удельная стоимость энергии за весь срок жизни станции. Один честный показатель вместо «окупится за N лет»: сравните с тарифом сети, дизелем и газом."
      />
      <div className="mx-auto max-w-2xl px-4 pb-10 sm:px-6">
        <div className="card-premium space-y-6 p-5 md:p-7">
          <SliderRow
            label="Инвестиции (CAPEX), ₽" value={capex} min={200_000} max={30_000_000} step={100_000}
            onChange={setCapex} format={(v) => `${(v / 1_000_000).toFixed(1)} млн ₽`}
          />
          <SliderRow
            label="Генерация, кВт·ч/год" value={gen} min={800} max={500_000} step={200}
            onChange={setGen} format={(v) => v.toLocaleString("ru-RU")}
          />
          <div className="grid gap-6 sm:grid-cols-3">
            <SliderRow label="Обслуживание, %/год" value={opexPct} min={0.25} max={2} step={0.25}
              onChange={setOpexPct} format={(v) => `${v}%`} compact />
            <SliderRow label="Ставка дисконта" value={discount} min={2} max={18} step={1}
              onChange={setDiscount} format={(v) => `${v}%`} compact />
            <SliderRow label="Срок, лет" value={years} min={10} max={30} step={1}
              onChange={setYears} format={(v) => `${v}`} compact />
          </div>

          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
            <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-primary" /> LCOE вашей станции
            </p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-2">
              <p className="text-3xl font-bold tabular-nums">
                <span className="text-gradient-solar">{lcoe.toFixed(1)} ₽/кВт·ч</span>
              </p>
              <p className="text-sm text-muted-foreground">
                без дисконта: <b className="text-foreground">{nominal.toFixed(1)} ₽</b>
              </p>
            </div>
            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              С дисконтом {discount}% каждый будущий рубль дешевле сегодняшнего — поэтому LCOE выше
              «простого» деления. Замена инвертора на 13-й год (~25% CAPEX) и деградация панелей 0,4%/год учтены.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm leading-relaxed">
            <p className="flex items-center gap-2 font-medium">
              <TrendingUp className="h-4 w-4 text-stable" /> Как читать результат
            </p>
            <ul className="mt-2 space-y-1.5 text-muted-foreground">
              <li>• Ваш сетевой тариф (население) 4,9–7,1 ₽/кВт·ч — сравните с LCOE</li>
              <li>• Тариф юрлица 9–13 ₽ — солнце обычно дешевле уже сейчас</li>
              <li>• Дизель-генерация 18–27 ₽ — своя станция выигрывает всухую</li>
              <li>• Выкуп излишков микрогенерации ~1,5–3,5 ₽ — не ждите розницы</li>
            </ul>
          </div>

          <Button className="w-full bg-gradient-solar text-primary-foreground" onClick={() => { trackGoal("lcoe_calc_complete"); navigate("#/kalkulyator") }}>
            Перейти к полной смете станции →
          </Button>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <AdSlot variant="rect" />
      </div>
    </div>
  )
}

function SliderRow({
  label, value, min, max, step, onChange, format, compact,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format: (v: number) => string
  compact?: boolean
}) {
  return (
    <div className={compact ? "space-y-2" : "card-premium space-y-2.5 px-4 py-3.5"}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{format(value)}</span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} aria-label={label} />
    </div>
  )
}
